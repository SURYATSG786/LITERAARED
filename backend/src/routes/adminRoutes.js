import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getAdminDashboard,
  getAdminLearners,
  getAdminLearnerDetails,
  getAdminNeedsAttention,
  sendAdminReminder,
  getAdminReports,
  exportAdminLearnersCsv,
  getAdminSettings,
  updateAdminSettings,
  quickFindLearners,
} from '../controllers/adminController.js';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', getAdminDashboard);
router.get('/learners', getAdminLearners);
router.get('/learner/:id', getAdminLearnerDetails);
router.get('/needs-attention', getAdminNeedsAttention);
router.post('/reminders', sendAdminReminder);
router.get('/reports', getAdminReports);
router.get('/reports/export-csv', exportAdminLearnersCsv);
router.get('/settings', getAdminSettings);
router.patch('/settings', updateAdminSettings);
router.get('/quick-find', quickFindLearners);

export default router;
