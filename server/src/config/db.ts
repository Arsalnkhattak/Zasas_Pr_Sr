import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

let isConnected = false;

export const connectDatabase = async (): Promise<boolean> => {
  if (isConnected) return true;

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    logger.info(`📦 MongoDB connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error: any) {
    logger.warn(`⚠️ Could not connect to MongoDB (${error.message}). Running in mock/memory-ready mode.`);
    return false;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info('📦 MongoDB disconnected');
};
