import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createUser,
  getCommunityPosts,
  createCommunityPost,
  likeCommunityPost,
  deleteCommunityPost,
} from '../src/services/db.js';

test('Community posts CRUD operations linked to real registered users', async () => {
  // 1. Create a real registered user
  const user = await createUser({
    name: 'Lakshmi Narayanan',
    email: `lakshmi_${Date.now()}@example.com`,
    password: 'password123',
    preferred_language: 'ta',
    education_level: 'Primary School',
  });

  assert.ok(user.id, 'Registered user should have an ID');

  // 2. Create a new community photo feedback post for the real registered user
  const photoPost = await createCommunityPost({
    userId: user.id,
    userName: user.name,
    type: 'photo_feedback',
    content: 'தமிழ் எழுத்து பயிற்சி படம் (Tamil handwriting practice photo)',
    imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    achievementMeta: null,
    language: 'ta',
  });

  assert.ok(photoPost.id, 'Post should have an assigned ID');
  assert.equal(photoPost.user_id, user.id);
  assert.equal(photoPost.user_name, 'Lakshmi Narayanan');
  assert.equal(photoPost.type, 'photo_feedback');
  assert.equal(photoPost.likes, 0);

  // 3. Like post
  const likeResult = await likeCommunityPost(photoPost.id);
  assert.equal(likeResult.likes, 1, 'Likes count should be incremented to 1');

  // 4. Create an achievement post for registered user
  const achievementPost = await createCommunityPost({
    userId: user.id,
    userName: user.name,
    type: 'achievement',
    content: 'Completed 7-day streak milestone!',
    imageUrl: null,
    achievementMeta: { title: '7-Day Streak', badge: '🔥', streak: 7 },
    language: 'ta',
  });

  assert.equal(achievementPost.type, 'achievement');
  assert.equal(achievementPost.user_name, 'Lakshmi Narayanan');

  // 5. Retrieve posts
  const allPosts = await getCommunityPosts();
  assert.ok(allPosts.length >= 2);
  const foundPhoto = allPosts.find((p) => p.id === photoPost.id);
  assert.ok(foundPhoto);
  assert.equal(foundPhoto.user_name, 'Lakshmi Narayanan');

  // 6. Delete post (Authorized)
  const delResult = await deleteCommunityPost(photoPost.id, user.id);
  assert.equal(delResult.success, true);

  // 7. Delete post (Unauthorized) should throw 403
  let threwUnauthorized = false;
  try {
    await deleteCommunityPost(achievementPost.id, 'other_user_id');
  } catch (err) {
    threwUnauthorized = true;
    assert.equal(err.status, 403);
  }
  assert.equal(threwUnauthorized, true, 'Deleting another user post must fail with 403');
});
