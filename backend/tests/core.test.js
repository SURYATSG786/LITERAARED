import test from 'node:test';
import assert from 'node:assert/strict';
import { getPathFromScore, passwordStrengthOk, LANGUAGES, EDUCATION_LEVELS } from '../src/utils/auth.js';
import {
  scoreAssessment,
  getRecommendedCourse,
  getRecommendedCourses,
  scoreCheckpoint,
  getAssessmentQuestions,
  publicCourse,
  loadAssessments,
  loadCourses,
  isCompleteQuestion,
  calculateCompletion,
  calculateCourseScore,
} from '../src/services/courses.js';

test('only 6 supported languages', () => {
  assert.deepEqual(LANGUAGES, ['en', 'hi', 'ta', 'te', 'kn', 'ml']);
});

test('getPathFromScore maps bands correctly', () => {
  assert.equal(getPathFromScore(0), 'foundation');
  assert.equal(getPathFromScore(25), 'foundation');
  assert.equal(getPathFromScore(26), 'beginner');
  assert.equal(getPathFromScore(50), 'beginner');
  assert.equal(getPathFromScore(51), 'intermediate');
  assert.equal(getPathFromScore(75), 'intermediate');
  assert.equal(getPathFromScore(76), 'advanced');
  assert.equal(getPathFromScore(100), 'advanced');
});

test('passwordStrengthOk validates rules', () => {
  assert.equal(passwordStrengthOk('Password1'), true);
});

test('scoreAssessment uses answer_index', () => {
  const answers = Array.from({ length: 10 }, (_, i) => ({
    question_id: `nfe-${i + 1}`,
    answer_index: 99,
  }));
  answers[0].answer_index = 0; // Cow
  answers[1].answer_index = 1; // A
  answers[2].answer_index = 2; // Yellow
  const result = scoreAssessment('No Formal Education', answers);
  assert.equal(result.correct, 2);
  assert.equal(result.score, 25);
  assert.equal(result.path, 'foundation');
});

test('4 recommended courses per path', () => {
  assert.equal(loadCourses('en').length, 4);
  assert.equal(getRecommendedCourse(10).path, 'foundation');
  assert.equal(getRecommendedCourse(90).path, 'advanced');
});

test('assessment questions localize to Tamil without English fallback for question text', () => {
  const qs = getAssessmentQuestions('High School', 'ta');
  assert.equal(qs.length, 8);
  assert.match(qs[0].question, /கூட்டம்/);
  assert.ok(qs[0].options.every((o) => typeof o === 'string' && o.length > 0));
  assert.ok(qs[0].image);
});

test('every assessment question is complete in all 6 languages', () => {
  for (const level of EDUCATION_LEVELS) {
    const bank = loadAssessments().find((a) => a.education_level === level);
    assert.ok(bank, level);
    assert.equal(bank.questions.length, 8, level);
    for (const q of bank.questions) {
      assert.equal(isCompleteQuestion(q), true, `${level}/${q.id}`);
    }
    for (const lang of LANGUAGES) {
      const qs = getAssessmentQuestions(level, lang);
      assert.equal(qs.length, 8, `${level}/${lang}`);
      for (const q of qs) {
        assert.ok(String(q.question || '').trim(), `${level}/${lang}/${q.id} question`);
        assert.equal(q.options.length, 4, `${level}/${lang}/${q.id} options`);
        assert.ok(q.options.every((o) => String(o || '').trim()), `${level}/${lang}/${q.id} empty option`);
      }
    }
  }
});

test('Primary School question 6 has the approved drink-water content', () => {
  const qs = getAssessmentQuestions('Primary School', 'en');
  const q6 = qs.find((q) => q.id === 'ps-6');
  assert.ok(q6);
  assert.match(q6.question, /Drink water/i);
  assert.equal(q6.options.length, 4);
  assert.ok(q6.options.includes('Drink'));
});

test('Tamil Primary School question 6 has approved localized text', () => {
  const bank = loadAssessments().find((a) => a.education_level === 'Primary School');
  const raw = bank.questions.find((q) => q.id === 'ps-6');
  assert.ok(raw);
  const taCorrect = raw.options[raw.correct_index].ta;
  assert.match(raw.question.ta, /தண்ணீர்/);
  assert.equal(taCorrect, 'குடிக்க வேண்டும்');

  const ta = getAssessmentQuestions('Primary School', 'ta');
  const q6 = ta.find((q) => q.id === 'ps-6');
  assert.ok(q6);
  assert.equal(q6.options.includes('தொப்பி'), false);
  assert.ok(q6.options.includes(taCorrect));
});

test('foundation courses contain ten localized verified questions', () => {
  for (const lang of LANGUAGES) {
    const course = loadCourses(lang).find((item) => item.path === 'foundation');
    assert.equal(course.lessons[0].practice_questions.length, 10);
    const first = course.lessons[0].practice_questions[0];
    assert.equal(first.options.length, 4);
    assert.ok(first.options[first.correct_index]);
  }
});

test('course answer positions are deterministic and identical across translations', () => {
  const baseline = loadCourses('en');
  for (const lang of LANGUAGES) {
    const translated = loadCourses(lang);
    for (const sourceCourse of baseline) {
      const translatedCourse = translated.find((course) => course.path === sourceCourse.path);
      assert.ok(translatedCourse, `${lang}/${sourceCourse.path}`);
      sourceCourse.lessons.forEach((lesson, lessonIndex) => {
        lesson.practice_questions.forEach((question, questionIndex) => {
          const translatedQuestion = translatedCourse.lessons[lessonIndex].practice_questions[questionIndex];
          assert.equal(translatedQuestion.correct_index, question.correct_index, `${lang}/${sourceCourse.path}/lesson-${lessonIndex}/question-${questionIndex}`);
          assert.ok(translatedQuestion.options[translatedQuestion.correct_index]);
        });
      });
      sourceCourse.checkpoint_test.forEach((question, questionIndex) => {
        assert.equal(translatedCourse.checkpoint_test[questionIndex].correct_index, question.correct_index, `${lang}/${sourceCourse.path}/checkpoint-${questionIndex}`);
      });
    }
  }
});

test('course completion is completed lessons divided by total lessons and never exceeds 100%', () => {
  assert.equal(calculateCompletion([], 4), 0);
  assert.equal(calculateCompletion([0, 1], 4), 50);
  assert.equal(calculateCompletion([0, 1, 2, 3], 4), 100);
  assert.equal(calculateCompletion([0, 1, 2, 3, 4], 4), 100);
});

test('MVP course delivery excludes legacy checkpoints and clamps practice score', () => {
  const course = getRecommendedCourse(10, 'en');
  const delivered = publicCourse(course, 'en', 'en');
  assert.equal('checkpoint_test' in delivered, false);
  assert.equal(calculateCourseScore(0, 10), 0);
  assert.equal(calculateCourseScore(10, 10), 100);
  assert.equal(calculateCourseScore(11, 10), 100);
});

test('no placeholder-like options in any language (assessments + courses)', () => {
  const placeholder = /^(Wrong choice|Wrong option|தவறான தேர்வு|गलत विकल्प|తప్పు ఎంపిక|ತಪ್ಪು ಆಯ್ಕೆ|തെറ്റായ തിരഞ്ഞെടുപ്പ്|Placeholder|dummy)$/i;
  const langs = LANGUAGES;

  function checkOptions(options, path) {
    for (const opt of options || []) {
      if (typeof opt === 'string') {
        assert.equal(placeholder.test(opt.trim()), false, `${path}: ${opt}`);
      } else if (opt && typeof opt === 'object') {
        for (const lang of langs) {
          const v = String(opt[lang] || '').trim();
          assert.ok(v.length > 0, `${path}.${lang} empty`);
          assert.equal(placeholder.test(v), false, `${path}.${lang}: ${v}`);
        }
      }
    }
  }

  for (const level of EDUCATION_LEVELS) {
    const bank = loadAssessments().find((a) => a.education_level === level);
    assert.equal(bank.questions.length, 8, level);
    for (const q of bank.questions) {
      checkOptions(q.options, `${level}/${q.id}`);
    }
  }

  for (const course of loadCourses()) {
    for (const lesson of course.lessons) {
      for (const q of lesson.practice_questions || []) {
        checkOptions(q.options, `${course.id}/${q.id || 'pq'}`);
      }
    }
    for (const q of course.checkpoint_test || []) {
      checkOptions(q.options, `${course.id}/${q.id || 'cp'}`);
    }
  }
});

test('native assessment and course text has no Latin English letters', () => {
  const latin = /[A-Za-z]/;
  const nativeLangs = ['hi', 'ta', 'te', 'kn', 'ml'];
  for (const level of EDUCATION_LEVELS) {
    const bank = loadAssessments().find((a) => a.education_level === level);
    for (const q of bank.questions) {
      for (const lang of nativeLangs) {
        assert.equal(latin.test(q.question[lang]), false, `${level}/${q.id} question.${lang}: ${q.question[lang]}`);
        q.options.forEach((opt, i) => {
          assert.equal(latin.test(opt[lang]), false, `${level}/${q.id} opt${i}.${lang}: ${opt[lang]}`);
        });
      }
    }
  }
  // Sample Primary Tamil question must remain native-language text.
  const ta = getAssessmentQuestions('Primary School', 'ta');
  const ps1 = ta.find((q) => q.id === 'ps-1');
  assert.ok(ps1);
  assert.equal(/go|going|apple|article/i.test(ps1.question), false);
  assert.match(ps1.question, /கைகளை/);
  assert.ok(ps1.options.every((o) => !/[A-Za-z]/.test(o)));
  assert.ok(ps1.options.includes('கைகளை கழுவ வேண்டும்'));
  const ps3 = ta.find((q) => q.id === 'ps-3');
  assert.equal(/article|apple|___ apple/i.test(ps3.question), false);
  assert.ok(ps3.options.every((o) => !/[A-Za-z]/.test(o)));
  assert.equal(ps3.options.includes('தொப்பி'), false);

  function walk(obj, path = 'courses') {
    if (obj && typeof obj === 'object') {
      if (Object.prototype.hasOwnProperty.call(obj, 'en') && nativeLangs.some((l) => Object.prototype.hasOwnProperty.call(obj, l))) {
        for (const lang of nativeLangs) {
          if (typeof obj[lang] === 'string') {
            assert.equal(latin.test(obj[lang]), false, `${path}.${lang}: ${obj[lang].slice(0, 80)}`);
          }
        }
        return;
      }
      for (const [k, v] of Object.entries(obj)) walk(v, `${path}.${k}`);
    } else if (Array.isArray(obj)) {
      obj.forEach((v, i) => walk(v, `${path}[${i}]`));
    }
  }
  walk(loadCourses());
});

test('course content localizes', () => {
  const course = getRecommendedCourse(10, 'ta');
  const ta = publicCourse(course, 'ta');
  assert.equal(ta.title, 'அன்றாட சொற்களை வாசிப்போம்');
  assert.ok(ta.lessons.length >= 1);
  assert.equal(ta.lessons[0].practice_questions[0].options.length, 4);
});

test('checkpoint scoring with indices', () => {
  const course = getRecommendedCourse(10);
  const fail = scoreCheckpoint(course.id, Array(10).fill(9));
  assert.equal(fail.passed, false);
  const perfect = course.checkpoint_test.map((q) => q.correct_index);
  const pass = scoreCheckpoint(course.id, perfect);
  assert.equal(pass.passed, true);
  assert.equal(pass.score, 100);
});
