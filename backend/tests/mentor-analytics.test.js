import test from 'node:test';
import assert from 'node:assert';
import { getMentorDashboard, getLearnerDetails } from '../src/controllers/mentorController.js';

test('mentorController: returns comprehensive analytics and respects excludeTest query parameter', async () => {
  // Mock res object
  let responseData = null;
  const mockRes = {
    json: (data) => {
      responseData = data;
    },
    status: () => mockRes,
  };

  // 1. Test standard dashboard fetch
  const mockReqAll = { user: { role: 'mentor' }, query: {} };
  await getMentorDashboard(mockReqAll, mockRes);

  assert.ok(responseData, 'Should return response data');
  assert.ok(responseData.overview, 'Overview should exist');
  assert.ok(typeof responseData.overview.totalLearners === 'number', 'totalLearners should be a number');
  assert.ok(Array.isArray(responseData.learners), 'learners should be an array');
  assert.ok(responseData.leagueMonitoring, 'leagueMonitoring should exist');
  assert.ok(responseData.courseAnalytics, 'courseAnalytics should exist');
  assert.ok(responseData.assessmentAnalytics, 'assessmentAnalytics should exist');
  assert.ok(responseData.meta, 'meta should exist');

  const totalAll = responseData.overview.totalLearners;

  // 2. Test with excludeTest=true
  const mockReqFiltered = { user: { role: 'mentor' }, query: { excludeTest: 'true' } };
  let filteredData = null;
  const mockResFiltered = {
    json: (data) => {
      filteredData = data;
    },
    status: () => mockResFiltered,
  };

  await getMentorDashboard(mockReqFiltered, mockResFiltered);
  assert.ok(filteredData, 'Filtered data should exist');
  assert.ok(filteredData.overview.totalLearners <= totalAll, 'Filtered total should be <= unfiltered total');
  assert.strictEqual(filteredData.meta.excludedTestAccounts, true);

  // 3. Test name formatting (first letter capitalized)
  if (filteredData.learners.length > 0) {
    const firstLearner = filteredData.learners[0];
    assert.ok(firstLearner.name.length > 0, 'Name should not be empty');
    assert.strictEqual(
      firstLearner.name[0],
      firstLearner.name[0].toUpperCase(),
      'First character of name should be capitalized'
    );
  }
});

test('mentorController: getLearnerDetails returns comprehensive profile or 404 for invalid ID', async () => {
  let notFoundStatus = null;
  const mockRes404 = {
    status: (code) => {
      notFoundStatus = code;
      return mockRes404;
    },
    json: () => {},
  };

  await getLearnerDetails({ user: { role: 'mentor' }, params: { id: 999999 } }, mockRes404);
  assert.strictEqual(notFoundStatus, 404, 'Should return 404 for nonexistent learner');
});
