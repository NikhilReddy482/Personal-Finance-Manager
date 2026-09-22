import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/error.middleware';

export const app = express();

// Trust reverse proxy for HTTPS cookie security on cloud providers (Render, Heroku, AWS)
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: env.CLIENT_URL || true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Financial Flow API',
  });
});

// Main API V1 routes
app.use('/api/v1', apiRouter);

// Resolve and serve React Client in fullstack production mode
const possibleDistPaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(__dirname, '../public'),
];

const clientDist = possibleDistPaths.find((p) => fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html')));

if (clientDist) {
  console.log(`Serving static client assets from: ${clientDist}`);
  app.use(express.static(clientDist));

  app.get('*', (req: Request, res: Response, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  // Fallback API welcome route on root
  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      service: 'Financial Flow API & Intelligence Engine',
      status: 'online',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        apiV1: '/api/v1',
      },
    });
  });
}

// Global Error Handler
app.use(errorHandler);
