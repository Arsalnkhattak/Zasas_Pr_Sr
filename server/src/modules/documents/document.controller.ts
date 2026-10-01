import { Request, Response, NextFunction } from 'express';
import { documentService } from './document.service';
import { ApiError } from '../../utils/errors';
import { logAuditEvent } from '../../utils/auditLogger';

export class DocumentController {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw ApiError.badRequest('File is required for upload');
      }

      const docType = req.body.docType;
      if (!docType) {
        throw ApiError.badRequest('docType is required');
      }

      const doc = await documentService.uploadDocument(req.user!.userId, docType, req.file);

      await logAuditEvent(req, 'DOCUMENT_UPLOAD', 'Document', doc._id.toString(), {
        docType,
        originalName: doc.originalName,
        fileSize: doc.fileSize,
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully and enqueued for OCR analysis',
        data: { document: doc },
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const docs = await documentService.getUserDocuments(req.user!.userId);
      res.status(200).json({
        success: true,
        data: { documents: docs },
      });
    } catch (error) {
      next(error);
    }
  }

  async getDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await documentService.getDocumentById(id, req.user!.userId, req.user!.role);

      await logAuditEvent(req, 'DOCUMENT_VIEW_DETAILS', 'Document', id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSecureUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const url = await documentService.getSecureViewUrl(id, req.user!.userId, req.user!.role);

      await logAuditEvent(req, 'DOCUMENT_GENERATE_VIEW_URL', 'Document', id);

      res.status(200).json({
        success: true,
        data: { viewUrl: url },
      });
    } catch (error) {
      next(error);
    }
  }

  async serveFile(req: Request, res: Response, next: NextFunction) {
    try {
      // Direct file serving for local storage provider
      // Match storageKey from wildcards / file/:user/*
      const storageKey = req.params[0] as string;
      const buffer = await documentService.getFileBuffer(storageKey, req.user!.userId, req.user!.role);

      await logAuditEvent(req, 'DOCUMENT_DOWNLOAD_FILE', 'Document', storageKey);

      res.setHeader('Content-Type', 'image/jpeg');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await documentService.deleteDocument(id, req.user!.userId, req.user!.role);

      await logAuditEvent(req, 'DOCUMENT_DELETE', 'Document', id);

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();
