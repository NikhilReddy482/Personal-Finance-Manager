import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';
import { env } from './env';
import { logger } from './logger';

let mongoServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<void> {
  let uri = env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('Connecting to primary MongoDB database...');
      await mongoose.connect(uri, {
        autoIndex: true,
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 4000,
      });
      console.log('MongoDB connected successfully to primary instance');
      return;
    } catch (atlasError: any) {
      console.warn(`Primary MongoDB connection unavailable (${atlasError.message}). Starting local persistent database...`);
      try {
        await mongoose.disconnect();
      } catch (_) {}
    }
  }

  try {
    const dbDir = path.resolve(process.cwd(), 'data/db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    } else {
      // Remove stale lock files if left from previous session
      const lockFile = path.join(dbDir, 'mongod.lock');
      if (fs.existsSync(lockFile)) {
        try { fs.unlinkSync(lockFile); } catch (_) {}
      }
      const wtLockFile = path.join(dbDir, 'WiredTiger.lock');
      if (fs.existsSync(wtLockFile)) {
        try { fs.unlinkSync(wtLockFile); } catch (_) {}
      }
    }
    console.log(`Starting local persistent MongoDB database at: ${dbDir}...`);
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbPath: dbDir,
        storageEngine: 'wiredTiger',
      },
    });
    uri = mongoServer.getUri();
    await mongoose.connect(uri, {
      autoIndex: true,
    });
    console.log(`Local persistent MongoDB connected successfully at: ${uri}`);
  } catch (error) {
    console.error('Failed to start local persistent database', error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
      logger.info('MongoDB stopped');
    }
  } catch (error) {
    logger.error('Error disconnecting MongoDB', { error });
  }
}
