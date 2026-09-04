import test from 'node:test';
import assert from 'node:assert/strict';
import { createUser, findUserById } from '../src/services/db.js';
import { loadAssessments } from '../src/services/courses.js';
import { submitAssessment } from '../src/controllers/assessmentController.js';

test('submitAssessment correctly scores answers and updates user assessment_score', async () => {
  const user = await createUser({
    name: 'Test Student Assessment',
    email: `assessment_${Date.now()}@school.test`,
    password: 'Password1',
    preferred_language: 'en',
    education_level: 'Primary School',
  });

  const bank = loadAssessments().find((a) => a.education_level === 'Primary School');

  // Submit correct answers for all questions (8/8 -> 100%)
  const answers100 = bank.questions.map((q) => ({
    question_id: q.id,
    answer_index: q.correct_index,
  }));

  let resData = null;
  const res = {
    json(data) {
      resData = data;
    },
    status(code) {
      return this;
    },
  };

  await submitAssessment({ user: { id: user.id }, body: { answers: answers100 } }, res);

  assert.ok(resData);
  assert.equal(resData.score, 100);
  assert.equal(resData.user.assessment_score, 100);

  // Re-fetch user from DB
  let updatedUser = await findUserById(user.id);
  assert.equal(updatedUser.assessment_score, 100);

  // Test partial score (4 correct, 4 wrong -> 50%)
  const answers50 = bank.questions.map((q, idx) => ({
    question_id: q.id,
    answer_index: idx < 4 ? q.correct_index : (q.correct_index + 1) % 4,
  }));

  await submitAssessment({ user: { id: user.id }, body: { answers: answers50 } }, res);

  assert.equal(resData.score, 50);
  assert.equal(resData.user.assessment_score, 50);

  updatedUser = await findUserById(user.id);
  assert.equal(updatedUser.assessment_score, 50);

  // Duplicate answers must not inflate the score.
  const repeated = Array.from({ length: 12 }, () => ({
    question_id: bank.questions[0].id,
    answer_index: bank.questions[0].correct_index,
  }));
  await submitAssessment({ user: { id: user.id }, body: { answers: repeated } }, res);
  assert.equal(resData.score, 13);
});
