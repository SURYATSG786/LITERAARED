import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getAssessment, submitAssessment } from '../controllers/assessmentController.js';

const router = Router();

router.get('/', requireAuth, getAssessment);
router.post('/submit', requireAuth, submitAssessment);

export default router;
