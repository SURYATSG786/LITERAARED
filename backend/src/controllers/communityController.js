import {
  getCommunityPosts,
  createCommunityPost,
  likeCommunityPost,
  deleteCommunityPost,
} from '../services/db.js';

export async function listPosts(_req, res) {
  try {
    const posts = await getCommunityPosts();
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createPost(req, res) {
  try {
    const { type, content, imageUrl, achievementMeta, language } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post content cannot be empty' });
    }
    const validTypes = ['photo_feedback', 'comment', 'achievement'];
    const postType = validTypes.includes(type) ? type : 'comment';

    const post = await createCommunityPost({
      userId: req.user.id,
      userName: req.user.name,
      type: postType,
      content: content.trim(),
      imageUrl: imageUrl || null,
      achievementMeta: achievementMeta || null,
      language: language || req.user.preferred_language || 'en',
    });

    res.status(201).json({ post });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function toggleLike(req, res) {
  try {
    const { id } = req.params;
    const result = await likeCommunityPost(id);
    if (!result) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function removePost(req, res) {
  try {
    const { id } = req.params;
    const result = await deleteCommunityPost(id, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
