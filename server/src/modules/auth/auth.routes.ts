import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.validator';

const router = Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/verify-email', validateRequest(verifyEmailSchema), authController.verifyEmail);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.me);

// Role-protected test route for verification
router.get('/admin-only', authenticate, authorize('admin'), (req, res) => {
  res.json({ success: true, message: 'Welcome to admin restricted area', user: req.user });
});

router.get('/staff-or-admin', authenticate, authorize('staff', 'admin'), (req, res) => {
  res.json({ success: true, message: 'Welcome to staff/admin area', user: req.user });
});

export const authRoutes = router;
