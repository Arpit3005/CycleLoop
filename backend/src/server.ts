import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ensurePostgresRunning, stopEmbeddedPostgres } from './embeddedDb.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Basic CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow local development and mobile network IPs
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Rate Limiting (relaxed for development and standard campus traffic)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api', limiter);

// Mount API routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'CycleLoop API',
    description: 'Smart Campus Bicycle Rental System Backend',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// Central Error Handler
app.use(errorHandler);

async function startServer() {
  try {
    console.log('[CycleLoop] Initializing database layer...');
    await ensurePostgresRunning(5432);

    const server = app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚴 CycleLoop API Server running on port ${PORT}`);
      console.log(`🌐 Base URL: http://localhost:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`=========================================`);
    });

    const shutdown = async () => {
      console.log('\n[CycleLoop] Shutting down gracefully...');
      server.close(async () => {
        await stopEmbeddedPostgres();
        console.log('[CycleLoop] Server and database stopped.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('[CycleLoop] Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
