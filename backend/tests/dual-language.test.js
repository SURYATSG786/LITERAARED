import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES } from '../src/utils/auth.js';
import { getAssessmentQuestions, getCourseById, publicCourse } from '../src/services/courses.js';

test('all 36 UI/learning language combinations keep prompts and options in their respective channels', () => {
  for (const uiLanguage of LANGUAGES) {
    for (const learningLanguage of LANGUAGES) {
      const assessment = getAssessmentQuestions('Primary School', uiLanguage, learningLanguage);
      assert.ok(assessment.length > 0, `${uiLanguage}/${learningLanguage} assessment exists`);

      const question = assessment[0];
      assert.equal(question.question, getAssessmentQuestions('Primary School', uiLanguage, 'en')[0].question);
      assert.deepEqual(question.options, getAssessmentQuestions('Primary School', 'en', learningLanguage)[0].options);
      assert.equal(question.options.length, 4);

      const learningCourse = getCourseById(`foundation-${learningLanguage}`, learningLanguage);
      const course = publicCourse(learningCourse, uiLanguage, learningLanguage);
      const uiCourse = publicCourse(learningCourse, uiLanguage, uiLanguage);
      const contentCourse = publicCourse(learningCourse, learningLanguage, learningLanguage);
      assert.ok(course.title && course.lessons[0]?.title, `${uiLanguage}/${learningLanguage} UI labels exist`);
      assert.equal(course.title, uiCourse.title);
      assert.equal(course.lessons[0].practice_questions[0].question, uiCourse.lessons[0].practice_questions[0].question);
      assert.deepEqual(course.lessons[0].practice_questions[0].options, contentCourse.lessons[0].practice_questions[0].options);
      assert.equal(course.lessons[0].practice_questions[0].options.length, 4);
    }
  }
});
