import {
  findUserById,
  updateUser,
  bumpActivity,
  sanitizeUser,
  getCourseScores as getCourseScoresDb,
  getCourseProgress,
  issueCourseCertificate,
} from '../services/db.js';
import { getPathFromScore } from '../utils/auth.js';
import {
  loadCourses,
  getRecommendedCourse,
  getCourseById,
  publicCourse,
  publicCourseSummary,
  calculateCourseScore,
  isCourseCertificateEligible,
} from '../services/courses.js';
import { generateCourse } from '../services/gemini.js';

export async function getRecommended(req, res) {
  try {
    const user = await findUserById(req.user.id);
    const score = user.assessment_score;

    if (score == null) {
      const uiLanguage = user.uiLanguage || 'en';
      const learningLanguage = user.learningLanguage || 'en';
      const allCourses = loadCourses(learningLanguage);
      const userCourses = allCourses
        .map((c) => publicCourseSummary(c, uiLanguage))
        .filter((c) => c && c.title !== null && c.title !== undefined);

      return res.json({
        path: null,
        recommended: null,
        courses: userCourses,
        locked: true,
        message: 'Complete the assessment first to unlock personalized courses.',
        uiLanguage,
        learningLanguage,
      });
    }

    const path = getPathFromScore(score);
    const uiLanguage = user.uiLanguage || 'en';
    const learningLanguage = user.learningLanguage || 'en';
    const allCourses = loadCourses(learningLanguage);

    const userCourses = allCourses
      .map((c) => publicCourseSummary(c, uiLanguage))
      .filter((c) => c && c.title !== null && c.title !== undefined);

    const recommendedFull = getRecommendedCourse(
      score,
      learningLanguage,
      user.education_level
    );
    const rec = publicCourseSummary(recommendedFull, uiLanguage);

    res.json({
      path,
      recommended: (rec && rec.title) ? rec : (userCourses[0] || null),
      courses: userCourses,
      uiLanguage,
      learningLanguage,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getCourse(req, res) {
  try {
    const user = await findUserById(req.user.id);
    const courseId = req.params.id;
    const course = getCourseById(
      courseId,
      user.learningLanguage,
      user.education_level
    );
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const progress = await getCourseProgress(user.id, courseId);
    res.json({
      course: publicCourse(course, user.uiLanguage, user.learningLanguage),
      progress: { ...progress, completion_percent: calculateCourseScore(progress.correct_answers, progress.total_questions) },
      uiLanguage: user.uiLanguage,
      learningLanguage: user.learningLanguage,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function markLessonProgress(req, res) {
  try {
    const user = await findUserById(req.user.id);
    const { lessonId } = req.params;
    const { correct_count, total_questions, course_id } = req.body || {};
    if (!course_id) return res.status(400).json({ error: 'course_id is required' });
    const course = getCourseById(course_id, user.learningLanguage, user.education_level);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    const lessonIndex = Number(lessonId);
    if (!Number.isInteger(lessonIndex) || lessonIndex < 0 || lessonIndex >= course.lessons.length) {
      return res.status(400).json({ error: 'Invalid lesson for course' });
    }
    const current = await getCourseProgress(user.id, course_id);
    const completed = new Set(current.lessons_completed || []);
    const isNewCompletion = !completed.has(lessonIndex);
    completed.add(lessonIndex);

    const expectedQuestions = course.lessons[lessonIndex].practice_questions?.length || 0;
    const totalQuestions = Math.max(0, Math.min(expectedQuestions, Number(total_questions) || expectedQuestions));
    const correctCount = Math.max(0, Math.min(totalQuestions, Number(correct_count) || 0));
    const lessonScore = calculateCourseScore(correctCount, totalQuestions);
    const existingScores = current.lesson_scores || {};
    const newLessonScores = { ...existingScores, [lessonIndex]: lessonScore };

    const xpGained = isNewCompletion ? 15 : 0;
    const gemsGained = isNewCompletion ? 2 : 0;
    const newXp = (user.xp || 0) + xpGained;
    const newGems = (user.gems || 0) + gemsGained;

    const updated = await updateUser(user.id, {
      xp: newXp,
      gems: newGems,
      course_progress: {
        ...current,
        course_id,
        lessons_completed: Array.from(completed),
        lesson_scores: newLessonScores,
        lesson_correct_counts: { [lessonIndex]: correctCount },
        lesson_question_counts: { [lessonIndex]: totalQuestions },
      },
    });
    const progress = {
      course_id: String(course_id),
      lessons_completed: Array.from(completed),
      lesson_scores: newLessonScores,
      correct_answers: correctCount,
      total_questions: totalQuestions,
    };
    await bumpActivity(user.id);
    const certificate = await maybeIssueCertificate(user, course, course_id, progress, lessonScore);
    const refreshed = await findUserById(user.id);

    const totalCourseLessons = course.lessons?.length || 1;
    const completionPercent = Math.min(100, Math.round((completed.size / totalCourseLessons) * 100));

    res.json({
      message: 'Lesson completed',
      xp_gained: xpGained,
      gems_gained: gemsGained,
      score: lessonScore,
      lessons_completed: Array.from(completed),
      completion_percent: completionPercent,
      certificate,
      user: sanitizeUser(refreshed || updated),
      uiLanguage: user.uiLanguage,
      learningLanguage: user.learningLanguage,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export function submitCheckpoint(req, res) {
  res.status(410).json({ error: 'Checkpoint tests are not part of the course completion flow.' });
}

async function maybeIssueCertificate(user, course, courseId, progress, score = 100) {
  if (!isCourseCertificateEligible(course, progress)) {
    return null;
  }
  const courseTitle = publicCourse(course, user.uiLanguage, user.learningLanguage)?.title || course?.title || 'Course 1: Reading Everyday Words';
  return issueCourseCertificate({
    userId: user.id,
    courseId: String(courseId),
    courseTitle,
    score: score || 100,
    uiLanguage: user.uiLanguage || 'en',
    learningLanguage: user.learningLanguage || 'en',
  });
}

export async function generateCourseHandler(req, res) {
  try {
    const user = await findUserById(req.user.id);
    const score = req.body?.assessment_score ?? user.assessment_score;
    if (score == null) {
      return res.status(400).json({ error: 'Assessment score required' });
    }
    const result = await generateCourse({
      assessment_score: score,
      education_level: req.body?.education_level || user.education_level,
      preferred_language: req.body?.learningLanguage || req.body?.learning_language || user.learningLanguage,
      uiLanguage: req.body?.uiLanguage || req.body?.ui_language || user.uiLanguage,
      learner_name: req.body?.learner_name || user.name,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getCourseScoresHandler(req, res) {
  try {
    const user = await findUserById(req.user.id);
    const { id } = req.params;
    const scores = await getCourseScoresDb(user.id, id);
    res.json(scores);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
