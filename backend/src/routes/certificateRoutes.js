import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getCertificate, getLeagueCertificate } from '../controllers/certificateController.js';

const router = Router();

router.get('/generate', requireAuth, getCertificate);
router.get('/league', requireAuth, getLeagueCertificate);

export default router;
