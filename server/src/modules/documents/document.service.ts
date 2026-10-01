import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { DocumentModel, DocumentType, IDocument } from './document.model';
import { ExtractedField, IExtractedField } from '../ocr/extractedField.model';
import { storage } from '../../config/storage';
import { ApiError } from '../../utils/errors';
import { enqueueOcrJob } from '../ocr/ocr.queue';

export class DocumentService {
  async uploadDocument(
    userId: string,
    docType: DocumentType,
    file: Express.Multer.File
  ): Promise<IDocument> {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw ApiError.badRequest('Invalid file type. Allowed: JPEG, PNG, WEBP, PDF');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw ApiError.badRequest('File size exceeds the 10MB limit');
    }

    // Generate isolated key: users/<userId>/documents/<docType>_<timestamp>_<random><ext>
    const ext = path.extname(file.originalname) || '.jpg';
    const randomHex = crypto.randomBytes(8).toString('hex');
    const storageKey = `users/${userId}/documents/${docType}_${Date.now()}_${randomHex}${ext}`;

    // Upload to storage provider
    await storage.uploadFile(storageKey, file.buffer, file.mimetype);

    // Create Document record
    const doc = await DocumentModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      docType,
      originalName: file.originalname,
      storageKey,
      mimeType: file.mimetype,
      fileSize: file.size,
      status: 'uploaded',
      verified: false,
    });

    // Enqueue OCR extraction job
    await enqueueOcrJob({
      documentId: doc._id.toString(),
      userId,
      docType,
      storageKey,
      originalName: file.originalname,
    });

    return doc;
  }

  async getUserDocuments(userId: string): Promise<IDocument[]> {
    return DocumentModel.find({ userId }).sort({ createdAt: -1 });
  }

  async getDocumentById(documentId: string, userId: string, userRole: string) {
    const doc = await DocumentModel.findById(documentId);
    if (!doc) {
      throw ApiError.notFound('Document not found');
    }

    // RBAC: Standard user can strictly view only their own documents
    if (userRole !== 'admin' && userRole !== 'staff' && doc.userId.toString() !== userId) {
      throw ApiError.forbidden('You do not have permission to view this document');
    }

    const fields = await ExtractedField.find({ documentId: doc._id });

    return {
      document: doc,
      extractedFields: fields,
    };
  }

  async getSecureViewUrl(documentId: string, userId: string, userRole: string): Promise<string> {
    const doc = await DocumentModel.findById(documentId);
    if (!doc) {
      throw ApiError.notFound('Document not found');
    }

    if (userRole !== 'admin' && userRole !== 'staff' && doc.userId.toString() !== userId) {
      throw ApiError.forbidden('You do not have permission to access this document');
    }

    return storage.getPresignedViewUrl(doc.storageKey);
  }

  async getFileBuffer(storageKey: string, userId: string, userRole: string): Promise<Buffer> {
    const doc = await DocumentModel.findOne({ storageKey });
    if (!doc) {
      throw ApiError.notFound('Document not found');
    }

    if (userRole !== 'admin' && userRole !== 'staff' && doc.userId.toString() !== userId) {
      throw ApiError.forbidden('Access denied');
    }

    return storage.getFile(storageKey);
  }

  async deleteDocument(documentId: string, userId: string, userRole: string): Promise<void> {
    const doc = await DocumentModel.findById(documentId);
    if (!doc) {
      throw ApiError.notFound('Document not found');
    }

    if (userRole !== 'admin' && doc.userId.toString() !== userId) {
      throw ApiError.forbidden('Cannot delete this document');
    }

    await storage.deleteFile(doc.storageKey);
    await ExtractedField.deleteMany({ documentId: doc._id });
    await DocumentModel.findByIdAndDelete(documentId);
  }
}

export const documentService = new DocumentService();
