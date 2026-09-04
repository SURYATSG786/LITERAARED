import test from 'node:test';
import assert from 'node:assert';
import { getPool, createUser, bumpActivity, updateUser } from '../src/services/db.js';
import {
  getAdminDashboard,
  getAdminLearners,
  getAdminLearnerDetails,
  getAdminNeedsAttention,
  sendAdminReminder,
  getAdminReports,
  getAdminSettings,
  updateAdminSettings,
  quickFindLearners,
} from '../src/controllers/adminController.js';

test('adminController: getAdminDashboard returns live metrics and recent records', async () => {
  let responseData = null;
  const mockRes = {
    json: (data) => {
      responseData = data;
    },
    status: () => mockRes,
  };

  const mockReq = { user: { role: 'admin' }, query: {} };
  await getAdminDashboard(mockReq, mockRes);

  assert.ok(responseData, 'Should return response data');
  assert.ok(responseData.stats, 'Stats object should exist');
  assert.ok(typeof responseData.stats.totalStudents.value === 'number', 'totalStudents value should be numeric');
  assert.ok(typeof responseData.stats.completedAssessments.value === 'number', 'completedAssessments should be numeric');
  assert.ok(typeof responseData.stats.avgAssessmentScore.value === 'number', 'avgAssessmentScore should be numeric');
  assert.ok(typeof responseData.stats.unlockedCourses.value === 'number', 'unlockedCourses should be numeric');
  assert.ok(responseData.overview, 'Overview summary should exist');
  assert.ok(Array.isArray(responseData.recentRegistrations), 'recentRegistrations should be an array');
  assert.ok(Array.isArray(responseData.recentCertificates), 'recentCertificates should be an array');
});

test('adminController: getAdminLearners joins user_streaks and returns live data with sort and pagination', async () => {
  const pool = getPool();
  
  // Seed a test learner with specific streak and score to verify live database join
  const testEmail = `parity_test_${Date.now()}@literaai.test`;
  const newUser = await createUser({
    name: 'Streak Parity Student',
    email: testEmail,
    password: 'TestPassword123!',
    preferred_language: 'ta',
    education_level: 'primary',
    role: 'learner',
  });

  await updateUser(newUser.id, { assessment_score: 85, current_path: 'Basic Literacy' });

  // Bump activity to create streak record
  await bumpActivity(newUser.id);
  await pool.query('UPDATE user_streaks SET current_streak = 7 WHERE user_id = $1', [newUser.id]);

  let responseData = null;
  const mockRes = {
    json: (data) => {
      responseData = data;
    },
    status: () => mockRes,
  };

  const mockReq = {
    user: { role: 'admin' },
    query: {
      search: testEmail,
      page: '1',
      limit: '10',
      sortBy: 'streak_days',
      sortOrder: 'desc',
    },
  };

  await getAdminLearners(mockReq, mockRes);

  assert.ok(responseData, 'Should return learners response');
  assert.ok(Array.isArray(responseData.learners), 'learners should be an array');
  assert.strictEqual(responseData.learners.length, 1, 'Should find the specific test learner');

  const learner = responseData.learners[0];
  assert.strictEqual(learner.email, testEmail);
  assert.strictEqual(learner.streak_days, 7, 'Streak days should match user_streaks record exactly');
  assert.strictEqual(learner.streakDays, 7, 'streakDays camelCase alias should also match');
  assert.strictEqual(learner.assessment_score, 85, 'Assessment score should match record');
  assert.strictEqual(learner.assessmentScore, 85, 'assessmentScore alias should match');
  assert.strictEqual(learner.preferred_language, 'ta');
  assert.strictEqual(learner.preferredLanguage, 'TA');
  assert.ok(responseData.pagination, 'Pagination should exist');
  assert.strictEqual(responseData.pagination.total, 1);
});

test('adminController: getAdminNeedsAttention flags inactive, low score, and unassessed learners', async () => {
  let responseData = null;
  const mockRes = {
    json: (data) => {
      responseData = data;
    },
    status: () => mockRes,
  };

  const mockReq = { user: { role: 'admin' } };
  await getAdminNeedsAttention(mockReq, mockRes);

  assert.ok(responseData, 'Should return attention list response');
  assert.ok(typeof responseData.count === 'number', 'Count should be numeric');
  assert.ok(Array.isArray(responseData.learners), 'learners should be an array');

  if (responseData.learners.length > 0) {
    const item = responseData.learners[0];
    assert.ok(item.id, 'Learner ID should exist');
    assert.ok(item.name, 'Learner name should exist');
    assert.ok(item.flagReason || item.reason, 'Flag reason should exist');
    assert.ok(['critical', 'warning', 'info'].includes(item.severity), 'Severity should be valid');
    assert.ok(['low_score', 'inactive', 'unassessed'].includes(item.flagType), 'FlagType should be valid');
    assert.ok(typeof item.streak_days === 'number', 'streak_days should be numeric');
    assert.ok(typeof item.streakDays === 'number', 'streakDays should be numeric');
  }
});

test('adminController: getAdminLearnerDetails returns complete history', async () => {
  const testEmail = `details_test_${Date.now()}@literaai.test`;
  const newUser = await createUser({
    name: 'Details Check Learner',
    email: testEmail,
    password: 'TestPassword123!',
    preferred_language: 'hi',
    education_level: 'middle',
    role: 'learner',
  });

  await updateUser(newUser.id, { assessment_score: 92, current_path: 'Advanced Literacy' });

  let responseData = null;
  const mockRes = {
    json: (data) => {
      responseData = data;
    },
    status: () => mockRes,
  };

  await getAdminLearnerDetails({ user: { role: 'admin' }, params: { id: newUser.id } }, mockRes);

  assert.ok(responseData, 'Should return learner details');
  assert.ok(responseData.learner, 'learner object should exist');
  assert.strictEqual(responseData.learner.email, testEmail);
  assert.strictEqual(responseData.learner.assessment_score, 92);
  assert.ok(responseData.diagnostic, 'diagnostic summary should exist');
  assert.strictEqual(responseData.diagnostic.score, 92);
  assert.ok(Array.isArray(responseData.lessonHistory), 'lessonHistory should be an array');
  assert.ok(Array.isArray(responseData.certificates), 'certificates should be an array');
  assert.ok(Array.isArray(responseData.reminders), 'reminders should be an array');
});

test('adminController: sendAdminReminder logs reminder and returns success', async () => {
  const testEmail = `reminder_test_${Date.now()}@literaai.test`;
  const newUser = await createUser({
    name: 'Reminder Target',
    email: testEmail,
    password: 'TestPassword123!',
    preferred_language: 'kn',
    education_level: 'high',
    role: 'learner',
  });

  let responseData = null;
  let statusSet = 200;
  const mockRes = {
    status: (code) => {
      statusSet = code;
      return mockRes;
    },
    json: (data) => {
      responseData = data;
    },
  };

  await sendAdminReminder(
    {
      user: { id: 'test_admin_id', role: 'admin' },
      body: {
        learnerId: newUser.id,
        note: 'Keep learning Kannada alphabet!',
        channel: 'in_app',
      },
    },
    mockRes
  );

  assert.strictEqual(statusSet, 201, 'Should return 201 Created');
  assert.ok(responseData.success, 'Success flag should be true');
  assert.ok(responseData.reminderId, 'Reminder ID should be generated');

  const pool = getPool();
  const res = await pool.query('SELECT * FROM admin_reminders WHERE id = $1', [responseData.reminderId]);
  const saved = res.rows[0];
  assert.ok(saved, 'Reminder record should exist in database');
  assert.strictEqual(saved.learner_id, newUser.id);
  assert.strictEqual(saved.note, 'Keep learning Kannada alphabet!');
});

test('adminController: getAdminReports aggregates distributions from live data', async () => {
  let responseData = null;
  const mockRes = {
    json: (data) => {
      responseData = data;
    },
    status: () => mockRes,
  };

  await getAdminReports({ user: { role: 'admin' } }, mockRes);

  assert.ok(responseData, 'Should return reports response');
  assert.ok(Array.isArray(responseData.registrationsTimeline), 'registrationsTimeline should be an array');
  assert.ok(Array.isArray(responseData.scoreDistribution), 'scoreDistribution should be an array');
  assert.strictEqual(responseData.scoreDistribution.length, 5, 'Should have 5 score histogram buckets');
  assert.ok(Array.isArray(responseData.courseCompletionRates), 'courseCompletionRates should be an array');
  assert.ok(Array.isArray(responseData.languageDistribution), 'languageDistribution should be an array');
});

test('adminController: getAdminSettings and updateAdminSettings persist configuration and admin profile', async () => {
  // Create an admin user to test profile updates
  const adminEmail = `admin_profile_${Date.now()}@literaai.test`;
  const adminUser = await createUser({
    name: 'Initial Admin Name',
    email: adminEmail,
    password: 'AdminPassword123!',
    preferred_language: 'en',
    role: 'admin',
  });

  let updatedData = null;
  const mockResUpdate = {
    json: (data) => {
      updatedData = data;
    },
    status: () => mockResUpdate,
  };

  await updateAdminSettings(
    {
      user: { id: adminUser.id, role: 'admin' },
      body: {
        name: 'Surya Chief Administrator',
        email: `updated_${adminEmail}`,
        preferred_language: 'ta',
        settings: {
          defaultStreakGoal: 21,
          assessmentPassThreshold: 45,
          inactivityAlertDays: 7,
        },
      },
    },
    mockResUpdate
  );

  assert.ok(updatedData.success, 'Update should succeed');
  assert.ok(updatedData.admin, 'Admin object should be returned');
  assert.strictEqual(updatedData.admin.name, 'Surya Chief Administrator');
  assert.strictEqual(updatedData.admin.email, `updated_${adminEmail}`);

  let settingsData = null;
  const mockResGet = {
    json: (data) => {
      settingsData = data;
    },
    status: () => mockResGet,
  };

  await getAdminSettings({ user: { id: adminUser.id, role: 'admin' } }, mockResGet);

  assert.ok(settingsData, 'Should return settings');
  assert.strictEqual(settingsData.admin.name, 'Surya Chief Administrator');
  assert.strictEqual(settingsData.admin.email, `updated_${adminEmail}`);
  assert.strictEqual(settingsData.admin.preferred_language, 'ta');
  assert.strictEqual(settingsData.settings.defaultStreakGoal, 21);
  assert.strictEqual(settingsData.settings.assessmentPassThreshold, 45);
  assert.strictEqual(settingsData.settings.inactivityAlertDays, 7);
});

test('adminController: quickFindLearners returns matching live users', async () => {
  const testEmail = `quickfind_${Date.now()}@literaai.test`;
  await createUser({
    name: 'QuickFind Unique Student',
    email: testEmail,
    password: 'TestPassword123!',
    preferred_language: 'te',
    role: 'learner',
  });

  let responseData = null;
  const mockRes = {
    json: (data) => {
      responseData = data;
    },
    status: () => mockRes,
  };

  await quickFindLearners({ user: { role: 'admin' }, query: { q: testEmail } }, mockRes);

  assert.ok(responseData, 'Should return search response');
  assert.ok(Array.isArray(responseData.results), 'results should be an array');
  assert.strictEqual(responseData.results.length, 1);
  assert.strictEqual(responseData.results[0].email, testEmail);
});
