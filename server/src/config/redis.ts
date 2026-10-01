import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let isRedisReady = false;

export const getRedisClient = (): Redis | null => {
  if (redisClient) return redisClient;

  try {
    redisClient = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('⚠️ Redis unreachable, fallback will be used');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on('connect', () => {
      isRedisReady = true;
      logger.info('⚡ Redis connection established');
    });

    redisClient.on('error', (err) => {
      isRedisReady = false;
      logger.warn(`⚡ Redis error: ${err.message}`);
    });

    return redisClient;
  } catch (err: any) {
    logger.warn(`⚡ Could not initialize Redis client: ${err.message}`);
    return null;
  }
};

export const checkRedisHealth = async (): Promise<boolean> => {
  const client = getRedisClient();
  if (!client) return false;
  try {
    await client.connect();
    const pong = await client.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
};
