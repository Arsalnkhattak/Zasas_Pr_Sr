import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/db';
import { logger } from './utils/logger';
import { startOcrWorker } from './modules/ocr/ocr.worker';

async function bootstrap() {
  try {
    // 1. Connect Database
    await connectDatabase();

    // 2. Start Background Workers (BullMQ)
    startOcrWorker();

    // 3. Start HTTP Server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 ZASAS Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      logger.info(`📡 Health check available at: http://localhost:${env.PORT}/health`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Gracefully shutting down...`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error: any) {
    logger.error(`Fatal bootstrap error: ${error.message}`, { stack: error.stack });
    process.exit(1);
  }
}

bootstrap();
