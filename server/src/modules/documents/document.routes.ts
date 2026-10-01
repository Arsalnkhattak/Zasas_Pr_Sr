import { Router } from 'express';
import multer from 'multer';
import { documentController } from './document.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// All document routes require authentication
router.use(authenticate);

router.post('/upload', upload.single('file'), documentController.upload);
router.get('/', documentController.list);
router.get('/:id', documentController.getDetails);
router.get('/:id/url', documentController.getSecureUrl);
router.delete('/:id', documentController.remove);

// Endpoint to stream local files securely
router.get('/file/*', documentController.serveFile);

export const documentRoutes = router;
