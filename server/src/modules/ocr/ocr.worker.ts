import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../../config/redis';
import { logger } from '../../utils/logger';
import { executeOcrTask, OcrJobData } from './ocr.queue';

export function startOcrWorker(): Worker | null {
  const redis = getRedisClient();
  if (!redis) {
    logger.info('Skipping BullMQ worker creation (Redis not configured or offline). Using in-process worker.');
    return null;
  }

  try {
    const worker = new Worker(
      'zasas_ocr_queue',
      async (job: Job<OcrJobData>) => {
        logger.info(`BullMQ Worker processing job ID: ${job.id}`);
        await executeOcrTask(job.data);
      },
      {
        connection: redis as any,
        concurrency: 5,
      }
    );

    worker.on('completed', (job) => {
      logger.info(`BullMQ Job ${job.id} has completed successfully`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`BullMQ Job ${job?.id} failed with error: ${err.message}`);
    });

    logger.info('👷 BullMQ OCR Worker initialized and listening for jobs');
    return worker;
  } catch (err: any) {
    logger.warn(`Failed to initialize BullMQ worker: ${err.message}`);
    return null;
  }
}
