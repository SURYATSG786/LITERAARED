import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getLeagueStatus,
  getLeagueExam,
  submitLeagueExam,
  getLeaderboard,
} from '../controllers/leagueController.js';

const router = Router();

router.get('/league/status', requireAuth, getLeagueStatus);
router.get('/league/leaderboard', requireAuth, getLeaderboard);
router.get('/league/exam', requireAuth, getLeagueExam);
router.post('/league/exam/submit', requireAuth, submitLeagueExam);

export default router;
