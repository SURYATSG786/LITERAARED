import { Router } from 'express';
import { register, login, mentorLogin } from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/mentor-login', mentorLogin);

export default router;
