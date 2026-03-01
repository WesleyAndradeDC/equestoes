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
import authRoutes     from './routes/auth.js';
import questionRoutes from './routes/questions.js';
import attemptRoutes  from './routes/attempts.js';
import notebookRoutes from './routes/notebooks.js';
import commentRoutes  from './routes/comments.js';
import userRoutes     from './routes/users.js';
import tutorRoutes    from './routes/tutor.js';
import webhookRoutes  from './routes/webhook.js';
import rankingRoutes  from './routes/ranking.js';
import reportRoutes   from './routes/reports.js';

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// ─── TRUST PROXY ──────────────────────────────────────────────────────────────
// Necessário no Render (e qualquer plataforma com reverse proxy como Heroku,
// Railway, etc.). Sem isso, express-rate-limit lança ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// pois recebe o header X-Forwarded-For sem que o Express esteja configurado para confiá-lo.
app.set('trust proxy', 1);

// ─── SEGURANÇA: Helmet ────────────────────────────────────────────────────────
// Define cabeçalhos HTTP de segurança (XSS, Clickjacking, MIME sniffing, etc.)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: isProduction
      ? undefined // Helmet padrão em produção
      : false,    // Desabilitado em dev para facilitar debug
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://gconcursos-frontend.onrender.com',
  'https://www.app.gramatiquecursos.com',
  'https://app.gramatiquecursos.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir sem origin (apps mobile, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
// Rate limit global: 100 req/15min por IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
});

// Rate limit agressivo para autenticação: 10 tentativas/15min por IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  skipSuccessfulRequests: true, // Não conta requisições bem-sucedidas
});

app.use(globalLimiter);

// ─── ROOT / HEALTH ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'G-Concursos API',
    version: '1.0.0',
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
app.listen(PORT, () => {
  console.log(`🚀 G-Concursos API rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
