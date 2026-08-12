import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente ANTES de qualquer import que use process.env
dotenv.config();

// Validar variáveis de ambiente obrigatórias na inicialização
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`❌ Variáveis de ambiente faltando: ${missingEnv.join(', ')}`);
  process.exit(1);
}

// Import routes
import authRoutes      from './routes/auth.js';
import questionRoutes  from './routes/questions.js';
import attemptRoutes   from './routes/attempts.js';
import notebookRoutes  from './routes/notebooks.js';
import commentRoutes   from './routes/comments.js';
import userRoutes      from './routes/users.js';
import tutorRoutes     from './routes/tutor.js';
import webhookRoutes   from './routes/webhook.js';
import rankingRoutes   from './routes/ranking.js';
import reportRoutes    from './routes/reports.js';
import flashcardRoutes   from './routes/flashcards.js';
import cronogramaRoutes  from './routes/cronogramas.js';

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// ─── TRUST PROXY ──────────────────────────────────────────────────────────────
// Necessário no Render (e qualquer plataforma com reverse proxy como Heroku,
// Railway, etc.). Sem isso, express-rate-limit lança ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// pois recebe o header X-Forwarded-For sem que o Express esteja configurado para confiá-lo.
app.set('trust proxy', 1);

// ─── CORS (antes do Helmet — preflight OPTIONS precisa passar) ───────────────
const extraOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://e-questoes-frontend.onrender.com',
  'https://gconcursos-frontend.onrender.com',
  'https://www.app.equestoes.com.br',
  'https://app.equestoes.com.br',
  'https://app.elevacursos.com.br',
  'https://www.app.elevacursos.com.br',
  'https://elevacursos.com.br',
  'https://www.elevacursos.com.br',
  ...extraOrigins,
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalized = origin.replace(/\/+$/, '');
  if (allowedOrigins.includes(normalized)) return true;
  if (/^https?:\/\/([\w-]+\.)*equestoes\.com\.br$/.test(normalized)) return true;
  if (/^https?:\/\/([\w-]+\.)*elevacursos\.com\.br$/.test(normalized)) return true;
  if (/^https:\/\/e-questoes[\w-]*\.onrender\.com$/.test(normalized)) return true;
  // Coolify / sslip.io — qualquer subdomínio temporário
  if (/^https?:\/\/.+\.sslip\.io$/.test(normalized)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = isAllowedOrigin(origin);
      if (!allowed) {
        console.warn(`[CORS] bloqueado origin="${origin ?? '(sem origin)'}" FRONTEND_URL="${process.env.FRONTEND_URL ?? '(não definido)'}"`);
      }
      if (allowed) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── SEGURANÇA: Helmet ────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: isProduction
      ? undefined
      : false,
  })
);

// ─── BODY PARSING ─────────────────────────────────────────────────────────────
// Usa o callback `verify` do express.json() para capturar o raw body
// nas rotas de webhook — sem consumir o stream duas vezes (evita o erro
// "stream is not readable" que ocorria com o middleware manual anterior).
//
// O rawBody é necessário para verificar a assinatura HMAC-SHA256 do WooCommerce.
app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf, encoding) => {
      // Salva o buffer bruto apenas para rotas de webhook (economiza memória)
      if (req.originalUrl?.startsWith('/api/webhook')) {
        req.rawBody = buf.toString(encoding || 'utf8');
      }
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── DEBUG: Logger raw para webhooks ─────────────────────────────────────────
// Captura TODA requisição para /api/webhook antes de qualquer middleware,
// incluindo rate limiter e body parser. Essencial para diagnóstico.
app.use('/api/webhook', (req, res, next) => {
  console.log(`\n🌐 [WEBHOOK-ENTRY] ${new Date().toISOString()}`);
  console.log(`   Method : ${req.method}`);
  console.log(`   URL    : ${req.originalUrl}`);
  console.log(`   IP     : ${req.ip}`);
  console.log(`   Topic  : ${req.headers['x-wc-webhook-topic'] ?? '(sem topic)'}`);
  console.log(`   Source : ${req.headers['x-wc-webhook-source'] ?? '(sem source)'}`);
  console.log(`   CT     : ${req.headers['content-type'] ?? '(sem content-type)'}`);
  next();
});

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
// SPA autentica + lista questões/cronogramas gera dezenas de req por sessão.
// 100/15min por IP derruba escolas/escritórios (NAT) e parece "servidor fora".
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Muitas requisições. Aguarde alguns minutos e tente novamente.',
  },
  skip: (req) => {
    if (req.method === 'OPTIONS') return true;
    const path = req.originalUrl || req.url || '';
    if (path === '/' || path.startsWith('/health')) return true;
    if (path.startsWith('/api/webhook')) return true;
    return false;
  },
});

// Rate limit agressivo para autenticação: 20 tentativas/15min por IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  skipSuccessfulRequests: true,
  skip: (req) => req.method === 'OPTIONS',
});

app.use(globalLimiter);

// ─── ROOT / HEALTH ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'E-Questões API',
    version: '2.0.0',
    status: 'online',
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────
// Rotas de autenticação com rate limit reforçado
app.use('/api/auth', authLimiter, authRoutes);

// Demais rotas
app.use('/api/questions', questionRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/notebooks', notebookRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/flashcards',  flashcardRoutes);
app.use('/api/cronogramas', cronogramaRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
// Nunca expõe stack trace em produção
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = isProduction
    ? (status < 500 ? err.message : 'Erro interno do servidor')
    : err.message;

  if (status >= 500) {
    console.error('💥 Server error:', err);
  }

  res.status(status).json({ error: message });
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 E-Questões API rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
