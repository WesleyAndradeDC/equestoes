import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import questionRoutes from './routes/questions.js';
import attemptRoutes from './routes/attempts.js';
import notebookRoutes from './routes/notebooks.js';
import commentRoutes from './routes/comments.js';
import userRoutes from './routes/users.js';
import tutorRoutes from './routes/tutor.js';
import webhookRoutes from './routes/webhook.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS to accept multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://gconcursos-frontend.onrender.com',
  'https://www.app.gramatiquecursos.com',
  'https://app.gramatiquecursos.com',
  process.env.FRONTEND_URL
].filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    name: 'G-Concursos API',
    version: '1.0.0',
    status: 'online',
    message: 'API REST para plataforma G-Concursos - Gramatique',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      questions: '/api/questions',
      attempts: '/api/attempts',
      notebooks: '/api/notebooks',
      comments: '/api/comments',
      users: '/api/users',
      tutor: '/api/tutor',
      webhook: '/api/webhook/woocommerce'
    },
    documentation: 'https://github.com/WesleyAndradeDC/gconcursos'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'G-Concursos API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/notebooks', notebookRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/webhook', webhookRoutes); // Nova rota para webhooks

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

