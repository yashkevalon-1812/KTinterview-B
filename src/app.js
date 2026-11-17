import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import interviewerRoutes from './routes/interviewerRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Allowed Origins for CORS
const allowedOrigins = [
  'https://ktinterview.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

// CORS Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.onrender.com') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all valid origins for smooth walk-in drive
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploaded candidate CVs and photos with permissive CORS
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Root Endpoint for Render / ping
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Kevalon Technology Walk-in Interview Backend API is running',
    frontend: process.env.FRONTEND_URL || 'https://ktinterview.onrender.com',
    health: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Kevalon Technology Walk-in Interview API',
    database: 'MongoDB (dynamic)',
    environment: process.env.NODE_ENV || 'production'
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes); // backward compatibility for /api/login and /api/register
app.use('/api/candidates', candidateRoutes);
app.use('/api/interviewers', interviewerRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/stats', statsRoutes);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

export default app;
