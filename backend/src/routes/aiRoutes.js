import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { coachAdvice, ttsHandler, transcribeTamil } from '../controllers/aiController.js';

const router = Router();

router.post('/coach', requireAuth, coachAdvice);
router.post('/coach-advice', requireAuth, coachAdvice);
router.post('/ai/tts', ttsHandler);
router.post('/ai/transcribe-tamil', requireAuth, transcribeTamil);

export default router;
