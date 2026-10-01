import { Queue } from 'bullmq';
import { getRedisClient } from '../../config/redis';
import { logger } from '../../utils/logger';
import { DocumentModel } from '../documents/document.model';
import { ExtractedField } from './extractedField.model';
import { storage } from '../../config/storage';
import { ImagePreprocessor } from './imagePreprocessor';
import { ocrService } from './ocr.service';

export interface OcrJobData {
  documentId: string;
  userId: string;
  docType: any;
  storageKey: string;
  originalName: string;
}

const OCR_QUEUE_NAME = 'zasas_ocr_queue';
let bullQueue: Queue | null = null;

try {
  const redis = getRedisClient();
  if (redis) {
    bullQueue = new Queue(OCR_QUEUE_NAME, {
      connection: redis as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      },
    });
    logger.info('🚀 BullMQ OCR queue initialized');
  }
} catch (err: any) {
  logger.warn(`BullMQ initialization skipped: ${err.message}. Using fallback in-process worker.`);
}

/**
 * Core processing logic shared by BullMQ worker & in-process fallback
 */
export async function executeOcrTask(data: OcrJobData): Promise<void> {
  const { documentId, userId, docType, storageKey, originalName } = data;
  logger.info(`Starting OCR task for document: ${documentId} (${docType})`);

  try {
    // 1. Update Document status to processing
    await DocumentModel.findByIdAndUpdate(documentId, { status: 'processing' });

    // 2. Retrieve file from storage
    const rawBuffer = await storage.getFile(storageKey);

    // 3. Image preprocessing via sharp
    const processedBuffer = await ImagePreprocessor.preprocess(rawBuffer);

    // 4. Run OCR extraction & rules validation
    const result = await ocrService.processDocument(docType, processedBuffer, originalName);

    // 5. Store extracted fields in database
    // Clear any previous attempts for this doc
    await ExtractedField.deleteMany({ documentId });

    const fieldDocs = result.fields.map((f) => ({
      documentId,
      userId,
      fieldName: f.fieldName,
      fieldLabel: f.fieldLabel,
      extractedValue: f.extractedValue,
      confidence: f.confidence,
      isLowConfidence: f.isLowConfidence,
      category: f.category,
      userVerified: false,
    }));

    if (fieldDocs.length > 0) {
      await ExtractedField.insertMany(fieldDocs);
    }

    // 6. Update Document status to completed
    await DocumentModel.findByIdAndUpdate(documentId, {
      status: 'completed',
      validationWarnings: result.warnings,
      errorMessage: undefined,
    });

    logger.info(`✅ OCR completed for document: ${documentId}. Extracted ${fieldDocs.length} fields.`);
  } catch (error: any) {
    logger.error(`❌ OCR failed for document ${documentId}: ${error.message}`);
    await DocumentModel.findByIdAndUpdate(documentId, {
      status: 'failed',
      errorMessage: error.message,
    });
  }
}

/**
 * Enqueues an OCR processing task
 */
export async function enqueueOcrJob(data: OcrJobData): Promise<void> {
  if (bullQueue) {
    try {
      await bullQueue.add('process_document', data);
      logger.info(`Enqueued OCR job in BullMQ for document: ${data.documentId}`);
      return;
    } catch (err: any) {
      logger.warn(`Could not dispatch to BullMQ (${err.message}). Running via in-process async scheduler.`);
    }
  }

  // Fallback: asynchronous in-process queue execution
  setImmediate(() => {
    executeOcrTask(data).catch((err) => {
      logger.error(`In-process OCR task failed: ${err.message}`);
    });
  });
}
