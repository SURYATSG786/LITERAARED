import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getRecommended,
  getCourse,
  markLessonProgress,
  submitCheckpoint,
  generateCourseHandler,
  getCourseScoresHandler,
} from '../controllers/courseController.js';

const router = Router();

router.get('/courses/recommended', requireAuth, getRecommended);
router.get('/courses/:id/scores', requireAuth, getCourseScoresHandler);
router.get('/courses/:id', requireAuth, getCourse);
router.post('/lessons/:lessonId/progress', requireAuth, markLessonProgress);
router.post('/checkpoint/:courseId', requireAuth, submitCheckpoint);
router.post('/generate-course', requireAuth, generateCourseHandler);

export default router;
