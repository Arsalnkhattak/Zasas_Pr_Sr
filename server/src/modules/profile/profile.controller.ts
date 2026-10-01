import { Request, Response, NextFunction } from 'express';
import { profileService } from './profile.service';
import { ApiError } from '../../utils/errors';

export class ProfileController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await profileService.getProfile(req.user!.userId);
      res.status(200).json({
        success: true,
        data: { profile },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateField(req: Request, res: Response, next: NextFunction) {
    try {
      const fieldId = req.params.fieldId as string;
      const { userValue } = req.body;

      if (userValue === undefined) {
        throw ApiError.badRequest('userValue is required');
      }

      const updated = await profileService.updateExtractedField(fieldId, req.user!.userId, userValue);
      res.status(200).json({
        success: true,
        message: 'Field updated',
        data: { field: updated },
      });
    } catch (error) {
      next(error);
    }
  }

  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId, fields } = req.body;
      if (!documentId || !Array.isArray(fields)) {
        throw ApiError.badRequest('documentId and fields array are required');
      }

      const profile = await profileService.confirmDocumentAndSyncProfile(req.user!.userId, {
        documentId,
        fields,
      });

      res.status(200).json({
        success: true,
        message: 'Document confirmed and student profile synced successfully',
        data: { profile },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const profileController = new ProfileController();
