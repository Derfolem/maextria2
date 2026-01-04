import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { initDatabase } from './database/schema';
import routes from './routes';

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar banco de dados
initDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de segurança
app.use(helmet());
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas da API
app.use('/api', routes);

// Tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║              🎓 MAEXTRIA API Server 🎓                ║
║                                                       ║
║  Server running on: http://localhost:${PORT}         ║
║  Environment: ${process.env.NODE_ENV || 'development'}                            ║
║                                                       ║
║  API Endpoints:                                       ║
║  • /api/auth         - Authentication                 ║
║  • /api/users        - User management                ║
║  • /api/courses      - Course management              ║
║  • /api/enrollments  - Student enrollments            ║
║  • /api/certificates - Certificates                   ║
║  • /api/dashboard    - Analytics dashboards           ║
║  • /api/ai           - AI-powered features            ║
║                                                       ║
║  Ready to accept connections! ✅                      ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export default app;
