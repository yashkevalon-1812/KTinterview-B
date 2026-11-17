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

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploaded candidate CVs and photos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes); // backward compatibility for /api/login and /api/register
app.use('/api/candidates', candidateRoutes);
app.use('/api/interviewers', interviewerRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Kevalon Technology Walk-in Interview API',
    database: 'MongoDB (dynamic)'
  });
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

export default app;
