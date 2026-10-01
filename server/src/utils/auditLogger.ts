import { Request } from 'express';
import { AuditLog } from '../modules/audit/audit.model';
import { logger } from './logger';

export const logAuditEvent = async (
  req: Request,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, any>
) => {
  try {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const userId = req.user?.userId;

    await AuditLog.create({
      userId: userId || undefined,
      action,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      details,
    });
  } catch (err: any) {
    logger.warn(`Failed to write audit log: ${err.message}`);
  }
};
