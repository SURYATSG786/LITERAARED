import rawVerified from './verified_course_questions.json';

export const COURSE_PATHS = ['foundation', 'beginner', 'intermediate', 'advanced'];

export const COURSE_TITLES = {
  en: ['Reading Everyday Words', 'Understanding Everyday Sentences', 'Using Information in Daily Life', 'Reading for Understanding'],
  ta: ['அன்றாட சொற்களை வாசிப்போம்', 'அன்றாட வாக்கியங்களைப் புரிந்துகொள்வோம்', 'அன்றாட தகவல்களைப் பயன்படுத்துவோம்', 'வாசித்து புரிந்துகொள்வோம்'],
  te: ['రోజువారీ పదాలను చదవడం', 'రోజువారీ వాక్యాలను అర్థం చేసుకోవడం', 'రోజువారీ సమాచారాన్ని ఉపయోగించడం', 'చదివి అర్థం చేసుకోవడం'],
  kn: ['ದೈನಂದಿನ ಪದಗಳನ್ನು ಓದೋಣ', 'ದೈನಂದಿನ ವಾಕ್ಯಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳೋಣ', 'ದೈನಂದಿನ ಮಾಹಿತಿಯನ್ನು ಬಳಸೋಣ', 'ಓದಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳೋಣ'],
  ml: ['ദൈനംദിന വാക്കുകൾ വായിക്കാം', 'ദൈനംദിന വാക്യങ്ങൾ മനസ്സിലാക്കാം', 'ദൈനംദിന വിവരങ്ങൾ ഉപയോഗിക്കാം', 'വായിച്ച് മനസ്സിലാക്കാം'],
  hi: ['दैनिक शब्द पढ़ना', 'दैनिक वाक्यों को समझना', 'दैनिक जानकारी का उपयोग', 'पढ़कर समझना'],
};

export const COURSE_OBJECTIVES = {
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

export function getStaticCoursesList(uiLang = 'en') {
  const safeLang = COURSE_TITLES[uiLang] ? uiLang : 'en';
  return COURSE_PATHS.map((pathKey, idx) => ({
    id: String(idx),
    path: pathKey,
    title: COURSE_TITLES[safeLang][idx],
    objective: COURSE_OBJECTIVES[safeLang][idx],
    lesson_count: 1,
  }));
}

export function getStaticCourseById(courseId, uiLang = 'en', learningLang = uiLang) {
  const safeUi = COURSE_TITLES[uiLang] ? uiLang : 'en';
  const safeLearning = COURSE_TITLES[learningLang] ? learningLang : safeUi;
  const uiQuestionsList = rawVerified[safeUi] || rawVerified.en || [];
  const learningQuestionsList = rawVerified[safeLearning] || rawVerified.en || [];

  let idx = 0;
  if (/^\d+$/.test(String(courseId))) {
    idx = Number(courseId) % 4;
  } else if (String(courseId).includes('foundation')) {
    idx = 0;
  } else if (String(courseId).includes('beginner')) {
    idx = 1;
  } else if (String(courseId).includes('intermediate')) {
    idx = 2;
  } else if (String(courseId).includes('advanced')) {
    idx = 3;
  }

  const pathKey = COURSE_PATHS[idx];
  const uiQuestions = uiQuestionsList[idx] || [];
  const learningQuestions = learningQuestionsList[idx] || [];

  const questions = learningQuestions.map((learningQ, qIdx) => {
    const uiQ = uiQuestions[qIdx] || learningQ;
    return {
      ...learningQ,
      question: uiQ.question || learningQ.question,
      explanation: uiQ.explanation || learningQ.explanation || '',
    };
  });

  const title = COURSE_TITLES[safeUi]?.[idx] || `Course ${idx + 1}`;
  const objective = COURSE_OBJECTIVES[safeUi]?.[idx] || 'Master foundational literacy skills.';

  return {
    id: String(idx),
    path: pathKey,
    lang: safeLearning,
    ui_lang: safeUi,
    title,
    objective,
    certificate_criteria: { min_score_percent: 70 },
    lesson_count: 1,
    lessons: [
      {
        id: '0',
        title,
        learning_goal: objective,
        teaching_content: `Practice reading and understanding words for ${title}.`,
        image_key: 'book',
        practice_questions: questions.length > 0 ? questions : uiQuestions,
      },
    ],
  };
}
