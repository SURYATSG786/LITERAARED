import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getMe,
  updateMe,
  awardWritingReward,
  awardPracticeReward,
  awardBadge,
  recordAlphabetProgress,
  getAlphabetProgress,
  buySkin,
  equipSkin,
  buyStreakSaver,
  useStreakSaver,
} from '../controllers/userController.js';

const router = Router();

router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, updateMe);
router.post('/rewards/writing', requireAuth, awardWritingReward);
router.post('/rewards/practice', requireAuth, awardPracticeReward);
router.post('/badge', requireAuth, awardBadge);
router.get('/writing/alphabet-progress', requireAuth, getAlphabetProgress);
router.post('/writing/alphabet-progress', requireAuth, recordAlphabetProgress);

// Shop Routes
router.post('/shop/buy-skin', requireAuth, buySkin);
router.post('/shop/equip-skin', requireAuth, equipSkin);
router.post('/shop/buy-streak-saver', requireAuth, buyStreakSaver);
router.post('/shop/use-streak-saver', requireAuth, useStreakSaver);

export default router;
