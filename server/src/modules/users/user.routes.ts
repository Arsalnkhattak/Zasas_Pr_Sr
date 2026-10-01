import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ── Self-service routes (any authenticated user) ────────────────────────────
router.get('/me', userController.getMe);
router.put('/me', userController.updateMe);
router.delete('/me', userController.deleteMe);

// ── Admin-only routes ────────────────────────────────────────────────────────
router.get('/', authorize('admin', 'staff'), userController.listUsers);
router.get('/stats/summary', authorize('admin'), userController.getStats);
router.get('/:id', authorize('admin', 'staff'), userController.getUser);
router.patch('/:id', authorize('admin'), userController.adminUpdate);
router.delete('/:id', authorize('admin'), userController.adminDelete);

export const userRoutes = router;
