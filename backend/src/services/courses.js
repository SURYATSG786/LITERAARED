import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPathFromScore, localize, LANGUAGES } from '../utils/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const verifiedAssessmentsPath = path.resolve(__dirname, '../data/verified_assessments.json');
const verifiedCourseQuestionsPath = path.resolve(__dirname, '../data/verified_course_questions.json');

let cachedAssessments = null;
let cachedCourses = null;

const COURSE_PATHS = ['foundation', 'beginner', 'intermediate', 'advanced'];
const COURSE_TITLES = {
  en: ['Reading Everyday Words', 'Understanding Everyday Sentences', 'Using Information in Daily Life', 'Reading for Understanding'],
  ta: ['அன்றாட சொற்களை வாசிப்போம்', 'அன்றாட வாக்கியங்களைப் புரிந்துகொள்வோம்', 'அன்றாட தகவல்களைப் பயன்படுத்துவோம்', 'வாசித்து புரிந்துகொள்வோம்'],
  te: ['రోజువారీ పదాలను చదవడం', 'రోజువారీ వాక్యాలను అర్థం చేసుకోవడం', 'రోజువారీ సమాచారాన్ని ఉపయోగించడం', 'చదివి అర్థం చేసుకోవడం'],
  kn: ['ದೈನಂದಿನ ಪದಗಳನ್ನು ಓದೋಣ', 'ದೈನಂದಿನ ವಾಕ್ಯಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳೋಣ', 'ದೈನಂದಿನ ಮಾಹಿತಿಯನ್ನು ಬಳಸೋಣ', 'ಓದಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳೋಣ'],
  ml: ['ദൈനംദിന വാക്കുകൾ വായിക്കാം', 'ദൈനംദിന വാക്യങ്ങൾ മനസ്സിലാക്കാം', 'ദൈനംദിന വിവരങ്ങൾ ഉപയോഗിക്കാം', 'വായിച്ച് മനസ്സിലാക്കാം'],
  hi: ['दैनिक शब्द पढ़ना', 'दैनिक वाक्यों को समझना', 'दैनिक जानकारी का उपयोग', 'पढ़कर समझना'],
};

const COURSE_OBJECTIVES = {
  en: [
    'Learn foundational vocabulary and recognition of everyday signs, words, and labels.',
    'Build basic comprehension by understanding simple sentences and daily announcements.',
    'Apply reading skills to interpret bills, forms, timetables, and notices in everyday life.',
    'Develop advanced fluency and reading comprehension for work, education, and civic life.'
  ],
  ta: [
    'அன்றாட சொற்கள், பெயர்ப்பலகைகள் மற்றும் வழிகாட்டிகளை எளிதாக வாசிக்கப் பழகுதல்.',
    'எளிய வாக்கியங்கள் மற்றும் பொது அறிவிப்புகளைப் படித்து முழுமையாகப் புரிந்துகொள்ளுதல்.',
    'கட்டண ரசீதுகள், விண்ணப்பங்கள் மற்றும் அரசு அறிவிப்புகளை அன்றாட வாழ்வில் பயன்படுத்துதல்.',
    'வேலைவாய்ப்பு மற்றும் பொது வாழ்க்கைக்குத் தேவையான உயர்நிலை வாசிப்புத் திறனை வளர்த்தல்.'
  ],
  te: [
    'రోజువారీ సంకేతాలు, బోర్డులు మరియు పదాలను సులభంగా చదవడం నేర్చుకోండి.',
    'సాధారణ వాక్యాలు మరియు రోజువారీ ప్రకటనలను చదివి అర్థం చేసుకోండి.',
    'బిల్లులు, ఫారమ్‌లు మరియు నోటీసులను అర్థం చేసుకుని ఉపయోగించండి.',
    'ఉద్యోగం మరియు ఉన్నత విద్య కోసం చదివే నైపుణ్యాన్ని పెంపొందించుకోండి.'
  ],
  kn: [
    'ದೈನಂದಿನ ಬೋರ್ಡ್‌ಗಳು ಮತ್ತು ಪದಗಳನ್ನು ಸುಲಭವಾಗಿ ಓದಲು ಕಲಿಯಿರಿ.',
    'ಸರಳ ವಾಕ್ಯಗಳು ಮತ್ತು ದಿನನಿತ್ಯದ ಪ್ರಕಟಣೆಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ.',
    'ರಶೀದಿಗಳು, ಅರ್ಜಿಗಳು ಮತ್ತು ಸೂಚನೆಗಳನ್ನು ಓದಿ ಬಳಸಿ.',
    'ಉದ್ಯೋಗ ಮತ್ತು ಶಿಕ್ಷಣಕ್ಕಾಗಿ ಸುಧಾರಿತ ಓದುವ ಸಾಮರ್ಥ್ಯವನ್ನು ಬೆಳೆಸಿಕೊಳ್ಳಿ.'
  ],
  ml: [
    'ദൈനംദിന ബോർഡുകളും വാക്കുകളും എളുപ്പത്തിൽ വായിക്കാൻ പഠിക്കുക.',
    'ലളിതമായ വാക്യങ്ങളും അറിയിപ്പുകളും മനസ്സിലാക്കുക.',
    'ബില്ലുകൾ, ഫോമുകൾ, പൊതു അറിയിപ്പുകൾ എന്നിവ ദൈനംദിന ജീവിതത്തിൽ ഉപയോഗിക്കുക.',
    'ഉന്നത വിദ്യാഭ്യാസത്തിനും തൊഴിലിനും ആവശ്യമായ വായനാപ്രാപ്തി നേടുക.'
  ],
  hi: [
    'दैनिक जीवन के बोर्ड, संकेत और शब्दों को आसानी से पढ़ना सीखें।',
    'सरल वाक्यों और दैनिक घोषणाओं को पढ़कर समझें।',
    'दैनिक जीवन में बिल, फॉर्म और नोटिस की जानकारी का उपयोग करें।',
    'कामकाज और शिक्षा के लिए उन्नत पठन क्षमता का विकास करें।'
  ],
};

function buildStaticCourses() {
  if (cachedCourses) return cachedCourses;

  let rawVerified = {};
  try {
    if (fs.existsSync(verifiedCourseQuestionsPath)) {
      rawVerified = JSON.parse(fs.readFileSync(verifiedCourseQuestionsPath, 'utf8'));
    }
  } catch (err) {
    console.warn('Could not read verified course questions:', err.message);
  }

  const courses = [];

  for (const lang of LANGUAGES) {
    const langQuestions = rawVerified[lang] || [];
    COURSE_PATHS.forEach((pathKey, courseIdx) => {
      const questions = langQuestions[courseIdx] || [];
      const title = COURSE_TITLES[lang]?.[courseIdx] || `Course ${courseIdx + 1}`;
      const objective = COURSE_OBJECTIVES[lang]?.[courseIdx] || 'Master foundational literacy skills.';

      const lessons = [
        {
          id: '0',
          title: title,
          learning_goal: objective,
          teaching_content: `Practice reading and understanding words for ${title}.`,
          image_key: 'book',
          practice_questions: questions,
        },
      ];

      courses.push({
        id: `${pathKey}_${lang}`,
        path: pathKey,
        lang,
        title,
        objective,
        certificate_criteria: { min_score_percent: 70 },
        lesson_count: 1,
        lessons,
        checkpoint: { questions },
        checkpoint_test: questions,
      });
    });
  }

  cachedCourses = courses;
  return cachedCourses;
}

export function loadCourses(lang = null) {
  const all = buildStaticCourses();
  if (lang) {
    return all.filter((c) => c.lang === lang);
  }
  return all;
}

export function loadAssessments() {
  if (!cachedAssessments) {
    if (fs.existsSync(verifiedAssessmentsPath)) {
      try {
        cachedAssessments = JSON.parse(fs.readFileSync(verifiedAssessmentsPath, 'utf8'));
      } catch (err) {
        console.error('Failed to load verified assessments:', err);
        cachedAssessments = [];
      }
    } else {
      cachedAssessments = [];
    }
  }
  return cachedAssessments;
}

export function isCompleteQuestion(q) {
  if (!q || typeof q !== 'object') return false;
  if (!q.id || q.correct_index == null || !(q.correct_index >= 0 && q.correct_index < 4)) return false;
  const textOk = (value) => {
    if (value == null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'object' && !Array.isArray(value)) {
      return LANGUAGES.every((lang) => String(value[lang] || '').trim().length > 0);
    }
    return false;
  };
  if (!textOk(q.question)) return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  return q.options.every((opt) => textOk(opt));
}

function localizeQuestion(q, uiLanguage = 'en', learningLanguage = uiLanguage) {
  return {
    id: q.id,
    image: q.image || q.image_key || 'book',
    question: localize(q.question, uiLanguage),
    options: (q.options || []).map((o) => localize(o, learningLanguage)).filter((o) => String(o || '').trim().length > 0),
  };
}

function localizeQuestionWithAnswer(q, uiLanguage, learningLanguage) {
  return {
    ...localizeQuestion(q, uiLanguage, learningLanguage),
    correct_index: q.correct_index,
    explanation: localize(q.explanation, uiLanguage),
  };
}

function localizeLesson(lesson, uiLanguage, learningLanguage, includeAnswers = true) {
  return {
    id: lesson.id,
    title: localize(lesson.title, uiLanguage),
    learning_goal: localize(lesson.learning_goal, uiLanguage),
    teaching_content: localize(lesson.teaching_content, learningLanguage),
    image_key: lesson.image_key || 'book',
    practice_questions: (lesson.practice_questions || []).map((q) =>
      includeAnswers ? localizeQuestionWithAnswer(q, uiLanguage, learningLanguage) : localizeQuestion(q, uiLanguage, learningLanguage)
    ),
  };
}

function courseVariant(course, lang) {
  if (!course || !lang) return course;
  return loadCourses(lang).find((candidate) => candidate.path === course.path) || course;
}

export function getCoursesByPath(pathKey, lang = null) {
  return loadCourses(lang).filter((c) => c.path === pathKey);
}

const DEFAULT_FOUNDATION_COURSE = {
  id: 'foundation-1',
  path: 'foundation',
  title: { en: 'Literacy Foundations', hi: 'साक्षरता की नींव' },
  objective: { en: 'Build basic reading and writing skills', hi: 'बुनियादी पठन और लेखन कौशल बनाएं' },
  certificate_criteria: { min_score_percent: 70 },
  lessons: [
    {
      id: '0',
      title: { en: 'Alphabet Basics', hi: 'वर्णमाला के मूल तत्व' },
      learning_goal: { en: 'Recognize basic letters and sounds', hi: 'मूल अक्षरों और ध्वनियों को पहचानें' },
      teaching_content: { en: 'Practice reading basic letters and words.', hi: 'मूल अक्षरों और शब्दों को पढ़ने का अभ्यास करें।' },
      image_key: 'book',
      practice_questions: [
        {
          id: 'q1',
          question: { en: 'Which letter comes first?', hi: 'कौन सा अक्षर पहले आता है?' },
          options: [{ en: 'A' }, { en: 'B' }, { en: 'C' }, { en: 'D' }],
          correct_index: 0,
        },
      ],
    },
  ],
  checkpoint_test: [],
};

export function getCourseById(id, lang = null) {
  const found = loadCourses(lang).find((c) => c.id === id || c.path === id);
  return found || loadCourses('en').find((c) => c.id === id || c.path === id) || DEFAULT_FOUNDATION_COURSE;
}

export function getRecommendedCourses(score, lang = null) {
  return getCoursesByPath(getPathFromScore(score), lang);
}

export function getRecommendedCourse(score, lang = null) {
  const list = getRecommendedCourses(score, lang);
  return list[0] || null;
}

export function getAssessmentQuestions(educationLevel, uiLanguage = 'en', learningLanguage = uiLanguage) {
  const bank = loadAssessments().find((a) => a.education_level === educationLevel);
  if (!bank) return [];
  return bank.questions
    .filter(isCompleteQuestion)
    .map((q) => localizeQuestion(q, uiLanguage, learningLanguage))
    .filter((q) => q.question && Array.isArray(q.options) && q.options.length === 4);
}

export function scoreAssessment(educationLevel, answers) {
  const bank = loadAssessments().find((a) => a.education_level === educationLevel);
  if (!bank) {
    const err = new Error('Invalid education level');
    err.status = 400;
    throw err;
  }
  const byId = Object.fromEntries(bank.questions.map((q) => [q.id, q]));
  let correct = 0;
  const answeredQuestionIds = new Set();
  for (const ans of answers) {
    const q = byId[ans.question_id];
    if (!q || answeredQuestionIds.has(q.id)) continue;
    answeredQuestionIds.add(q.id);
    const idx = typeof ans.answer_index === 'number' ? ans.answer_index : Number(ans.answer_index);
    if (idx === q.correct_index) correct += 1;
  }
  const total = bank.questions.length;
  const score = Math.round((correct / total) * 100);
  return { score, correct, total, path: getPathFromScore(score) };
}

export function scoreCheckpoint(courseIdOrObject, rawAnswers) {
  const course = typeof courseIdOrObject === 'string'
    ? getCourseById(courseIdOrObject)
    : (courseIdOrObject?.id ? getCourseById(courseIdOrObject.id) || courseIdOrObject : courseIdOrObject);
  if (!course || !course.checkpoint_test) {
    const err = new Error('Course or checkpoint test not found');
    err.status = 404;
    throw err;
  }
  const answers = Array.isArray(rawAnswers)
    ? rawAnswers
    : (Array.isArray(rawAnswers?.answers) ? rawAnswers.answers : []);

  const questions = course.checkpoint_test || [];
  let correct = 0;
  answers.forEach((ans, i) => {
    const q = questions[i];
    const idx = typeof ans === 'number' ? ans : Number(ans);
    if (q && idx === q.correct_index) correct += 1;
  });
  const totalQuestions = questions.length || 1;
  const score = Math.round((correct / totalQuestions) * 100);
  const minScore = course.certificate_criteria?.min_score_percent ?? 70;
  return { score, correct, total: questions.length, passed: score >= minScore, minScore, course };
}

export function calculateCompletion(completedLessons, totalLessons) {
  const completed = new Set(completedLessons || []).size;
  const total = Number(totalLessons) || 0;
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((Math.min(completed, total) / total) * 100)));
}

export function calculateCourseScore(correctAnswers, totalQuestions) {
  const correct = Math.max(0, Number(correctAnswers) || 0);
  const total = Number(totalQuestions) || 0;
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((Math.min(correct, total) / total) * 100)));
}

export function hasFinalAssessment(course) {
  return Array.isArray(course?.final_assessment) && course.final_assessment.length > 0;
}

export function isCourseCertificateEligible(course, progress) {
  const lessonCount = course?.lessons?.length || 0;
  const completed = new Set(progress?.lessons_completed || []).size;
  return lessonCount > 0 && completed >= lessonCount;
}

export function publicCourse(course, uiLanguage = 'en', learningLanguage = uiLanguage) {
  if (!course) return null;
  const uiCourse = courseVariant(course, uiLanguage);
  const learningCourse = courseVariant(course, learningLanguage);
  return {
    id: learningCourse.id,
    path: learningCourse.path,
    title: localize(uiCourse.title, uiLanguage),
    objective: localize(uiCourse.objective, uiLanguage),
    certificate_criteria: learningCourse.certificate_criteria,
    lesson_count: learningCourse.lessons.length,
    lessons: learningCourse.lessons.map((learningLesson, index) => {
      const uiLesson = uiCourse.lessons[index] || learningLesson;
      return ({
        index,
        ...localizeLesson({ ...learningLesson, title: uiLesson.title, learning_goal: uiLesson.learning_goal }, uiLanguage, learningLanguage, true),
        practice_questions: learningLesson.practice_questions.map((learningQuestion, questionIndex) => {
          const uiQuestion = uiLesson.practice_questions?.[questionIndex] || learningQuestion;
          return localizeQuestionWithAnswer({ ...learningQuestion, question: uiQuestion.question, explanation: uiQuestion.explanation }, uiLanguage, learningLanguage);
        }),
      });
    }),
  };
}

export function publicCourseSummary(course, lang = 'en') {
  if (!course) return null;
  const uiCourse = courseVariant(course, lang);
  return {
    id: course.id,
    path: course.path,
    title: localize(uiCourse.title, lang),
    objective: localize(uiCourse.objective, lang),
    certificate_criteria: course.certificate_criteria,
    lesson_count: course.lessons.length,
  };
}
