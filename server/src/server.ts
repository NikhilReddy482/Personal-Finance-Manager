import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { app } from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { logger } from './config/logger';

import { ensureDemoUserExists } from './services/seed/seedData';

async function bootstrap() {
  await connectDB();
  await ensureDemoUserExists();

  app.listen(env.PORT, () => {
    logger.info(`🚀 Financial Flow Server running at http://localhost:${env.PORT}`);
    logger.info(`Frontend allowed client: ${env.CLIENT_URL}`);
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal startup error', { error: err });
  process.exit(1);
});
