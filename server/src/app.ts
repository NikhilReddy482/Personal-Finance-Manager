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

// Resolve and serve React Client in fullstack mode
const possibleDistPaths = [
  path.join(__dirname, 'public'),
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(process.cwd(), 'dist/public'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
];

const clientDist = possibleDistPaths.find((p) => fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html')));

if (clientDist) {
  console.log(`✅ Serving fullstack static React client from: ${clientDist}`);
  app.use(
    express.static(clientDist, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );

  // SPA fallback for all non-API routes
  app.get('*', (req: Request, res: Response, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  console.warn('⚠️ No client build directory detected, falling back to API welcome response.');
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
