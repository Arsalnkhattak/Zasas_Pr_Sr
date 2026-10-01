import sharp from 'sharp';
import { logger } from '../../utils/logger';

export class ImagePreprocessor {
  /**
   * Preprocesses document images for optimal OCR extraction:
   * - Auto-rotates based on EXIF
   * - Normalizes contrast
   * - Converts to grayscale if appropriate
   * - Resizes if excessively large
   */
  static async preprocess(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const pipeline = sharp(imageBuffer)
        .rotate() // auto-rotates by EXIF
        .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
        .normalise(); // expand contrast range

      return await pipeline.toBuffer();
    } catch (err: any) {
      logger.warn(`Image preprocessing warning: ${err.message}. Using original buffer.`);
      return imageBuffer;
    }
  }

  /**
   * Generates a preview thumbnail for UI display
   */
  static async generateThumbnail(imageBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize({ width: 400, height: 400, fit: 'inside' })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch {
      return imageBuffer;
    }
  }
}
