import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  listPosts,
  createPost,
  toggleLike,
  removePost,
} from '../controllers/communityController.js';

const router = Router();

router.get('/', listPosts);
router.post('/', requireAuth, createPost);
router.post('/:id/like', requireAuth, toggleLike);
router.delete('/:id', requireAuth, removePost);

export default router;
