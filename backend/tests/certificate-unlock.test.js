import test from 'node:test';
import assert from 'node:assert/strict';
import { createUser, findUserById, getCertificateForCourse } from '../src/services/db.js';
import { loadAssessments, loadCourses } from '../src/services/courses.js';
import { submitAssessment } from '../src/controllers/assessmentController.js';
import { markLessonProgress } from '../src/controllers/courseController.js';

const LANGUAGES = ['en', 'ta', 'te', 'kn', 'ml', 'hi'];

for (const lang of LANGUAGES) {
  test(`Certificate is NOT unlocked by initial assessment alone in language "${lang}"`, async () => {
    const user = await createUser({
      name: `Test Student ${lang.toUpperCase()}`,
      email: `cert_test_${lang}_${Date.now()}@literaai.test`,
      password: 'Password123!',
      preferred_language: lang,
      ui_language: lang,
      learning_language: lang,
      education_level: 'Primary School',
    });

    const bank = loadAssessments().find((a) => a.education_level === 'Primary School');
    assert.ok(bank, 'Assessment bank should exist');

    // Submit assessment with 100% score
    const answers = bank.questions.map((q) => ({
      question_id: q.id,
      answer_index: q.correct_index,
    }));

    let assessRes = null;
    const res = {
      json(data) { assessRes = data; },
      status(code) { return this; },
    };

    await submitAssessment({ user: { id: user.id }, body: { answers } }, res);

    assert.ok(assessRes, 'Assessment response must exist');
    assert.equal(assessRes.score, 100);

    // Fetch user and verify NO certificate is unlocked
    const freshUser = await findUserById(user.id);
    assert.equal(freshUser.assessment_score, 100);
    assert.deepEqual(freshUser.certificates, [], `User in ${lang} must have 0 certificates after initial assessment`);
    assert.equal(freshUser.certificate?.issued, false, `Default certificate must not be issued for ${lang}`);

    // Verify DB query returns null
    const certCourse0 = await getCertificateForCourse(user.id, `foundation_${lang}`);
    assert.equal(certCourse0, null, `Course certificate must be null prior to completing the course for ${lang}`);
  });

  test(`Certificate IS unlocked ONLY after completing all lessons of a course in language "${lang}"`, async () => {
    const user = await createUser({
      name: `Course Completer ${lang.toUpperCase()}`,
      email: `complete_test_${lang}_${Date.now()}@literaai.test`,
      password: 'Password123!',
      preferred_language: lang,
      ui_language: lang,
      learning_language: lang,
      education_level: 'Primary School',
    });

    const courses = loadCourses(lang);
    const targetCourse = courses[0]; // foundation course
    assert.ok(targetCourse, `Foundation course must exist for ${lang}`);

    const totalLessons = targetCourse.lessons.length;
    let completeRes = null;
    const res = {
      json(data) { completeRes = data; },
      status(code) { return this; },
    };

    // Complete all lessons of the course
    for (let i = 0; i < totalLessons; i++) {
      await markLessonProgress({
        user: { id: user.id },
        params: { lessonId: String(i) },
        body: {
          course_id: targetCourse.id,
          correct_count: 5,
          total_questions: 5,
        },
      }, res);
    }

    assert.ok(completeRes, 'Lesson completion response must exist');
    assert.ok(completeRes.certificate, 'Certificate should be issued upon course completion');
    assert.equal(completeRes.certificate.issued, true);
    assert.equal(completeRes.certificate.ui_language, lang);

    // Verify user profile in DB now has the unlocked certificate
    const completedUser = await findUserById(user.id);
    assert.equal(completedUser.certificates.length, 1, `User must have 1 certificate for completed course in ${lang}`);
    assert.equal(completedUser.certificates[0].issued, true);
    assert.equal(completedUser.certificates[0].course_id, String(targetCourse.id));

    // Verify other courses (e.g. beginner / course 1) are still locked
    const certCourse1 = await getCertificateForCourse(user.id, `beginner_${lang}`);
    assert.equal(certCourse1, null, `Uncompleted course 2 must remain locked in ${lang}`);
  });
}
