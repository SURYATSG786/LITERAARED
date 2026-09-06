import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPathFromScore } from '../utils/auth.js';
import { getCourseById, publicCourse } from './courses.js';

const SYSTEM_COURSE = `You are the LiteraAI Course Generation Engine. You create structured literacy courses for adult learners and first-generation students in India. You NEVER generate games, puzzles, or quiz-only content. You generate TEACHING content with supporting exercises. Return ONLY valid JSON matching the course schema with path, title, objective, lessons (4), checkpoint_test (10), certificate_criteria.`;

const PATH_LABELS = {
  en: { foundation: 'foundation', beginner: 'beginner', intermediate: 'intermediate', advanced: 'advanced' },
  hi: { foundation: 'आधार', beginner: 'प्रारंभिक', intermediate: 'मध्यम', advanced: 'उन्नत' },
  ta: { foundation: 'அடிப்படை', beginner: 'தொடக்க', intermediate: 'இடைநிலை', advanced: 'மேம்பட்ட' },
  te: { foundation: 'పునాది', beginner: 'ప్రాథమిక', intermediate: 'మధ్యస్థ', advanced: 'ఉన్నత' },
  kn: { foundation: 'ಆಧಾರ', beginner: 'ಪ್ರಾರಂಭಿಕ', intermediate: 'ಮಧ್ಯಮ', advanced: 'ಉನ್ನತ' },
  ml: { foundation: 'അടിസ്ഥാന', beginner: 'തുടക്ക', intermediate: 'മദ്ധ്യ', advanced: 'ഉയർന്ന' },
};

function coachFallback(lang, { name, lessonsDone, checkpointPassed, pathKey }) {
  const path = (PATH_LABELS[lang] || PATH_LABELS.en)[pathKey] || pathKey || '';
  const pct = Math.round((lessonsDone / 4) * 100);
  const messages = {
    en: {
      done: `Congratulations, ${name}! You earned your certificate. Keep reading every day to stay sharp.`,
      start: `Welcome, ${name}! Start your first lesson today — small steps build strong reading skills.`,
      ready: `Amazing work, ${name}! You've finished all lessons. Take the checkpoint test when you're ready.`,
      progress: `Keep going, ${name}! You're ${pct}% through your ${path} course. Practice a little every day.`,
    },
    hi: {
      done: `बधाई हो, ${name}! आपने प्रमाणपत्र हासिल किया। रोज़ थोड़ा पढ़ते रहें।`,
      start: `स्वागत है, ${name}! आज अपना पहला पाठ शुरू करें — छोटे कदम मज़बूत पढ़ाई बनाते हैं।`,
      ready: `शानदार, ${name}! सभी पाठ पूरे हुए। जब तैयार हों तब परीक्षा दें।`,
      progress: `आगे बढ़ते रहें, ${name}! आप अपने ${path} पाठ्यक्रम में ${pct}% पहुँचे हैं। रोज़ थोड़ा अभ्यास करें।`,
    },
    ta: {
      done: `வாழ்த்துக்கள், ${name}! சான்றிதழ் பெற்றுவிட்டீர்கள். தினம் சிறிது படியுங்கள்.`,
      start: `வரவேற்கிறோம், ${name}! இன்று முதல் பாடத்தைத் தொடங்குங்கள் — சிறிய அடிகள் வலுவான வாசிப்பை உருவாக்கும்.`,
      ready: `அருமை, ${name}! எல்லாப் பாடங்களும் முடிந்தன. தயாரானதும் தேர்வு எழுதுங்கள்.`,
      progress: `தொடருங்கள், ${name}! உங்கள் ${path} பாடநெறியில் ${pct}% முடித்துள்ளீர்கள். தினம் சிறிது பயிற்சி செய்யுங்கள்.`,
    },
    te: {
      done: `అభినందనలు, ${name}! మీరు సర్టిఫికెట్ సంపాదించారు. ప్రతిరోజు కొంచెం చదవండి.`,
      start: `స్వాగతం, ${name}! ఈరోజు మీ మొదటి పాఠం ప్రారంభించండి — చిన్న అడుగులు బలమైన చదవడాన్ని తీసుకువస్తాయి.`,
      ready: `అద్భుతం, ${name}! అన్ని పాఠాలు పూర్తయ్యాయి. సిద్ధమైనప్పుడు పరీక్ష రాయండి.`,
      progress: `కొనసాగించండి, ${name}! మీ ${path} కోర్సులో ${pct}% పూర్తి చేశారు. ప్రతిరోజు కొంచెం సాధన చేయండి.`,
    },
    kn: {
      done: `ಅಭಿನಂದನೆಗಳು, ${name}! ನೀವು ಪ್ರಮಾಣಪತ್ರ ಗಳಿಸಿದ್ದೀರಿ. ಪ್ರತಿದಿನ ಸ್ವಲ್ಪ ಓದಿ.`,
      start: `ಸ್ವಾಗತ, ${name}! ಇಂದು ನಿಮ್ಮ ಮೊದಲ ಪಾಠ ಪ್ರಾರಂಭಿಸಿ — ಸಣ್ಣ ಹೆಜ್ಜೆಗಳು ಬಲವಾದ ಓದನ್ನು ನಿರ್ಮಿಸುತ್ತವೆ.`,
      ready: `ಅದ್ಭುತ, ${name}! ಎಲ್ಲಾ ಪಾಠಗಳು ಮುಗಿದಿವೆ. ಸಿದ್ಧರಾದಾಗ ಪರೀಕ್ಷೆ ಬರೆಯಿರಿ.`,
      progress: `ಮುಂದುವರಿಸಿ, ${name}! ನಿಮ್ಮ ${path} ಕೋರ್ಸ್‌ನಲ್ಲಿ ${pct}% ಪೂರ್ಣಗೊಂಡಿದೆ. ಪ್ರತಿದಿನ ಸ್ವಲ್ಪ ಅಭ್ಯಾಸ ಮಾಡಿ.`,
    },
    ml: {
      done: `അഭിനന്ദനങ്ങൾ, ${name}! നിങ്ങൾ സർട്ടിഫിക്കറ്റ് നേടി. ദിവസവും കുറച്ച് വായിക്കൂ.`,
      start: `സ്വാഗതം, ${name}! ഇന്ന് ആദ്യ പാഠം ആരംഭിക്കൂ — ചെറിയ ചുവടുകൾ ശക്തമായ വായന ഉണ്ടാക്കും.`,
      ready: `അത്ഭുതം, ${name}! എല്ലാ പാഠങ്ങളും കഴിഞ്ഞു. തയ്യാറാകുമ്പോൾ പരീക്ഷ എഴുതൂ.`,
      progress: `തുടരൂ, ${name}! നിങ്ങളുടെ ${path} കോഴ്‌സിൽ ${pct}% പൂർത്തിയായി. ദിവസവും കുറച്ച് അഭ്യാസം ചെയ്യൂ.`,
    },
  };
  const pack = messages[lang] || messages.en;
  if (checkpointPassed) return pack.done;
  if (lessonsDone === 0) return pack.start;
  if (lessonsDone >= 4) return pack.ready;
  return pack.progress;
}

function getModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

export async function generateCourse({ assessment_score, education_level, preferred_language, uiLanguage, learningLanguage, learner_name }) {
  const fallbackPath = getPathFromScore(assessment_score);
  const ui = uiLanguage || preferred_language || 'en';
  const learning = learningLanguage || preferred_language || ui;
  const fallback = publicCourse(getCourseById(fallbackPath) || getCourseById(`${fallbackPath}-1`), ui, learning);

  // Generated courses are historically single-language. The canonical course
  // bank is used for mixed-language learners to keep the two channels strict.
  if (ui !== learning) return { course: fallback, source: 'static', reason: 'dual-language canonical course' };

  const model = getModel();
  if (!model) {
    return { course: fallback, source: 'static', reason: 'GEMINI_API_KEY not set' };
  }

  try {
    const prompt = `${SYSTEM_COURSE}

Input:
- assessment_score: ${assessment_score}
- education_level: ${education_level}
- preferred_language: ${preferred_language}
- learner_name: ${learner_name}
- mapped_path: ${fallbackPath}

Each lesson needs: title, learning_goal, teaching_content (80-100 words), image_prompt, practice_questions (5 with question, options[4], correct_answer, explanation).
Checkpoint: 10 questions. Threshold 70 for foundation/beginner, 75 for intermediate/advanced.
Write ALL learner-facing text in ${preferred_language || 'en'} using native script only (no English words mixed into other languages).`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in Gemini response');
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.lessons || parsed.lessons.length < 4) throw new Error('Incomplete course');
    parsed.id = parsed.path || fallbackPath;
    parsed.path = parsed.path || fallbackPath;
    return { course: parsed, source: 'gemini' };
  } catch (err) {
    console.warn('Gemini course generation failed, using static fallback:', err.message);
    return { course: fallback, source: 'static', reason: err.message };
  }
}

export async function getCoachAdvice(userProgress) {
  const model = getModel();
  const lessonsDone = userProgress.lessons_completed?.length || 0;
  const score = userProgress.assessment_score;
  const name = userProgress.name || 'learner';
  const path = userProgress.current_path || 'foundation';
  const lang = userProgress.preferred_language || 'en';

  const fallback = coachFallback(lang, {
    name,
    lessonsDone,
    checkpointPassed: userProgress.checkpoint_passed,
    pathKey: path,
  });

  if (!model) {
    return { message: fallback, source: 'static' };
  }

  const langName = {
    en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', kn: 'Kannada', ml: 'Malayalam',
  }[lang] || 'English';

  try {
    const prompt = `You are LiteraAI's literacy coach. Provide a short, encouraging, practical piece of advice (max 2 sentences) to a learner based on their current progress. Use a warm, supportive tone and simple language.
IMPORTANT: Write the entire reply in ${langName} only. Use native script. Do not mix English words into non-English replies.

Progress JSON: ${JSON.stringify({
  name,
  assessment_score: score,
  current_path: path,
  lessons_completed: lessonsDone,
  checkpoint_passed: userProgress.checkpoint_passed,
  streak: userProgress.streak,
  xp: userProgress.xp,
  preferred_language: lang,
})}`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI Coach timeout')), 2500)
    );

    const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
    const message = result.response.text().trim().slice(0, 400);
    return { message: message || fallback, source: 'gemini' };
  } catch (err) {
    console.warn('Coach advice fallback used:', err.message);
    return { message: fallback, source: 'static', reason: err.message };
  }
}
