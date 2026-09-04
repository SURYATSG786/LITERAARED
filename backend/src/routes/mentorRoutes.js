import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getMentorDashboard,
  getLearnerDetails,
  assignCourseToLearner,
  sendLearnerReminder,
  addLearnerDirect,
  getAlphabetAnalytics,
} from '../controllers/mentorController.js';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', getMentorDashboard);
router.get('/learner/:id', getLearnerDetails);
router.get('/analytics/alphabet-progress', getAlphabetAnalytics);
router.post('/assign-course', assignCourseToLearner);
router.post('/send-reminder', sendLearnerReminder);
router.post('/add-learner', addLearnerDirect);

export default router;
