import { Request, Response, NextFunction } from 'express';
import { validateRequest } from '../../middleware/validate';
import {
  getUserMe,
  updateUserMe,
  deleteUserMe,
  getUsersList,
  getUserById,
  adminUpdateUser,
  adminDeleteUser,
  getUserStats,
} from './user.service';
import {
  updateProfileSchema,
  userQuerySchema,
  adminUpdateUserSchema,
} from './user.validator';

export class UserController {
  // ── Self-service ────────────────────────────────────────────────────────────

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await getUserMe(req.user!.userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateProfileSchema.parse(req.body);
      const user = await updateUserMe(req.user!.userId, parsed);
      res.json({ success: true, message: 'Profile updated successfully', data: { user } });
    } catch (err) {
      next(err);
    }
  }

  async deleteMe(req: Request, res: Response, next: NextFunction) {
    try {
      await deleteUserMe(req.user!.userId);
      // Clear the auth cookie so the client is logged out immediately
      res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'lax' });
      res.json({ success: true, message: 'Your account has been permanently deleted' });
    } catch (err) {
      next(err);
    }
  }

  // ── Admin ────────────────────────────────────────────────────────────────────

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const query = userQuerySchema.parse(req.query);
      const data = await getUsersList(query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await getUserStats();
      res.json({ success: true, data: { stats } });
    } catch (err) {
      next(err);
    }
  }

  async getUser(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const data = await getUserById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async adminUpdate(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const parsed = adminUpdateUserSchema.parse(req.body);
      const user = await adminUpdateUser(req.params.id, parsed);
      res.json({ success: true, message: 'User updated', data: { user } });
    } catch (err) {
      next(err);
    }
  }

  async adminDelete(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      await adminDeleteUser(req.params.id);
      res.json({ success: true, message: 'User deleted permanently' });
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
