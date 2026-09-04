export { register, login } from './authController.js';
export { getMe, updateMe } from './userController.js';
export { getAssessment, submitAssessment } from './assessmentController.js';
export {
  getRecommended,
  getCourse,
  markLessonProgress,
  submitCheckpoint,
  generateCourseHandler,
} from './courseController.js';
export { getCertificate } from './certificateController.js';
export { coachAdvice, ttsHandler } from './aiController.js';
