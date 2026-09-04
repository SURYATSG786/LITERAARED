import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import assessmentRoutes from './assessmentRoutes.js';
import courseRoutes from './courseRoutes.js';
import certificateRoutes from './certificateRoutes.js';
import aiRoutes from './aiRoutes.js';
import leagueRoutes from './leagueRoutes.js';
import communityRoutes from './communityRoutes.js';
import mentorRoutes from './mentorRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/assessment', assessmentRoutes);
router.use('/certificate', certificateRoutes);
router.use('/community', communityRoutes);
router.use('/mentor', mentorRoutes);
router.use('/admin', adminRoutes);
router.use(courseRoutes);
router.use(aiRoutes);
router.use(leagueRoutes);

export default router;
