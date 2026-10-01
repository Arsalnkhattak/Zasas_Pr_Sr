import { Router } from 'express';
import { profileController } from './profile.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', profileController.getProfile);
router.patch('/fields/:fieldId', profileController.updateField);
router.post('/confirm', profileController.confirm);

export const profileRoutes = router;
