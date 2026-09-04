import { awardUserReward, findUserById, updateUser } from '../services/db.js';
import { getAssessmentQuestions, scoreAssessment, getRecommendedCourse, publicCourseSummary } from '../services/courses.js';

export async function getAssessment(req, res) {
  try {
    const user = await findUserById(req.user.id);
    const questions = getAssessmentQuestions(
      user.education_level,
      user.uiLanguage,
      user.learningLanguage
    );
    res.json({ questions, uiLanguage: user.uiLanguage, learningLanguage: user.learningLanguage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function submitAssessment(req, res) {
  try {
    const user = await findUserById(req.user.id);
    const answers = req.body.answers || [];
    const result = scoreAssessment(
      user.education_level,
      answers
    );
    const updated = await updateUser(user.id, {
      assessment_score: result.score,
      current_path: result.path,
    });
    const reward = { xp: 20, gems: 2 };
    const rewardedUser = await awardUserReward(user.id, {
      eventId: `assessment:${user.education_level}`,
      ...reward,
    });
    const recommendedFull = getRecommendedCourse(result.score);
    const recommended_course = publicCourseSummary(
      recommendedFull,
      user.uiLanguage,
      user.learningLanguage
    );
    res.json({
      score: result.score,
      path: result.path,
      user: rewardedUser || updated,
      reward,
      recommended_course,
      uiLanguage: user.uiLanguage,
      learningLanguage: user.learningLanguage,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
