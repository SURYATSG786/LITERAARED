import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES } from '../src/utils/auth.js';
import { buildLeagueExam } from '../src/data/leagueExams.js';

const EXPECTED = {
  bronze: { ids: ['bronze_q1', 'bronze_q2', 'bronze_q3'], answers: [1, 1, 1], required: 2 },
  silver: { ids: ['silver_q1', 'silver_q2', 'silver_q3'], answers: [0, 1, 2], required: 2 },
  gold: { ids: ['gold_q1', 'gold_q2', 'gold_q3'], answers: [0, 1, 1], required: 3 },
};

test('League exams validate all 36 UI/learning language pairs', () => {
  for (const [league, expected] of Object.entries(EXPECTED)) {
    for (const uiLanguage of LANGUAGES) {
      for (const learningLanguage of LANGUAGES) {
        const exam = buildLeagueExam(league, uiLanguage, learningLanguage);
        const uiOnly = buildLeagueExam(league, uiLanguage, 'en');
        const learningOnly = buildLeagueExam(league, 'en', learningLanguage);

        assert.equal(exam.questions.length, 3, `${league} ${uiLanguage}->${learningLanguage}`);
        assert.equal(exam.required_correct, expected.required);
        assert.deepEqual(exam.questions.map((q) => q.id), expected.ids);
        assert.deepEqual(exam.questions.map((q) => q.correct_index), expected.answers);

        exam.questions.forEach((question, index) => {
          assert.equal(question.question, uiOnly.questions[index].question, `${league} prompt in ${uiLanguage}`);
          assert.deepEqual(question.options, learningOnly.questions[index].options, `${league} options in ${learningLanguage}`);
          assert.equal(question.options.length, 4);
          assert.ok(question.options[question.correct_index]?.trim(), `${league} correct option remains present`);
        });
      }
    }
  }
});

test('League progression has the requested pass thresholds', () => {
  assert.equal(buildLeagueExam('bronze').target_league, 'silver');
  assert.equal(buildLeagueExam('silver').target_league, 'gold');
  assert.equal(buildLeagueExam('gold').target_league, null);
});
