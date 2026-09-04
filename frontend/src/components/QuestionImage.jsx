import { motion } from 'motion/react';

/**
 * Rich Animated Educational Scene Definitions for all Questions across all 4 Courses & Assessments.
 * Strictly 1 single animated icon per question — NO WORDS / NO TEXT in the image box.
 */
const SCENES = {
  wash: {
    bg: 'from-cyan-100 via-sky-200 to-blue-200',
    glow: 'rgba(56, 189, 248, 0.35)',
    primary: '🧼',
    anim: 'bounce',
  },
  numbers: {
    bg: 'from-indigo-100 via-purple-200 to-pink-200',
    glow: 'rgba(168, 85, 247, 0.35)',
    primary: '🔢',
    anim: 'float',
  },
  bus: {
    bg: 'from-amber-100 via-yellow-200 to-orange-200',
    glow: 'rgba(245, 158, 11, 0.35)',
    primary: '🚌',
    anim: 'drive',
  },
  car: {
    bg: 'from-blue-100 via-sky-200 to-indigo-200',
    glow: 'rgba(59, 130, 246, 0.35)',
    primary: '🚗',
    anim: 'drive',
  },
  train: {
    bg: 'from-teal-100 via-cyan-200 to-blue-200',
    glow: 'rgba(20, 184, 166, 0.35)',
    primary: '🚆',
    anim: 'drive',
  },
  bicycle: {
    bg: 'from-emerald-100 via-teal-200 to-green-200',
    glow: 'rgba(16, 185, 129, 0.35)',
    primary: '🚲',
    anim: 'bounce',
  },
  boat: {
    bg: 'from-sky-100 via-blue-200 to-indigo-200',
    glow: 'rgba(14, 165, 233, 0.35)',
    primary: '⛵',
    anim: 'float',
  },
  apple: {
    bg: 'from-rose-100 via-red-200 to-pink-200',
    glow: 'rgba(239, 68, 68, 0.35)',
    primary: '🍎',
    anim: 'pulse',
  },
  banana: {
    bg: 'from-amber-100 via-yellow-200 to-orange-100',
    glow: 'rgba(234, 179, 8, 0.35)',
    primary: '🍌',
    anim: 'float',
  },
  water: {
    bg: 'from-cyan-100 via-sky-200 to-teal-200',
    glow: 'rgba(6, 182, 212, 0.35)',
    primary: '💧',
    anim: 'pulse',
  },
  bottle: {
    bg: 'from-teal-100 via-emerald-200 to-cyan-200',
    glow: 'rgba(20, 184, 166, 0.35)',
    primary: '🧴',
    anim: 'float',
  },
  pencil: {
    bg: 'from-purple-100 via-indigo-200 to-violet-200',
    glow: 'rgba(139, 92, 246, 0.35)',
    primary: '✏️',
    anim: 'float',
  },
  book: {
    bg: 'from-blue-100 via-sky-200 to-indigo-200',
    glow: 'rgba(59, 130, 246, 0.35)',
    primary: '📖',
    anim: 'float',
  },
  library: {
    bg: 'from-violet-100 via-purple-200 to-indigo-200',
    glow: 'rgba(147, 51, 234, 0.35)',
    primary: '📚',
    anim: 'float',
  },
  door: {
    bg: 'from-amber-100 via-orange-200 to-amber-300',
    glow: 'rgba(217, 119, 6, 0.35)',
    primary: '🚪',
    anim: 'pulse',
  },
  exit: {
    bg: 'from-emerald-100 via-green-200 to-teal-200',
    glow: 'rgba(34, 197, 94, 0.35)',
    primary: '🚪',
    anim: 'pulse',
  },
  light: {
    bg: 'from-yellow-100 via-amber-200 to-orange-200',
    glow: 'rgba(234, 179, 8, 0.45)',
    primary: '💡',
    anim: 'pulse',
  },
  school: {
    bg: 'from-blue-100 via-sky-200 to-indigo-200',
    glow: 'rgba(59, 130, 246, 0.35)',
    primary: '🏫',
    anim: 'bounce',
  },
  teacher: {
    bg: 'from-indigo-100 via-sky-200 to-purple-200',
    glow: 'rgba(99, 102, 241, 0.35)',
    primary: '🧑‍🏫',
    anim: 'float',
  },
  sit: {
    bg: 'from-rose-100 via-amber-200 to-yellow-100',
    glow: 'rgba(251, 113, 133, 0.35)',
    primary: '🪑',
    anim: 'bounce',
  },
  sun: {
    bg: 'from-amber-100 via-yellow-200 to-orange-200',
    glow: 'rgba(245, 158, 11, 0.45)',
    primary: '☀️',
    anim: 'spin-slow',
  },
  night: {
    bg: 'from-indigo-200 via-blue-900/40 to-purple-900/30',
    glow: 'rgba(99, 102, 241, 0.45)',
    primary: '🌙',
    anim: 'float',
  },
  time: {
    bg: 'from-purple-100 via-violet-200 to-indigo-200',
    glow: 'rgba(168, 85, 247, 0.35)',
    primary: '⏰',
    anim: 'pulse',
  },
  stop: {
    bg: 'from-rose-100 via-red-200 to-orange-200',
    glow: 'rgba(239, 68, 68, 0.45)',
    primary: '🛑',
    anim: 'pulse',
  },
  money: {
    bg: 'from-emerald-100 via-teal-200 to-green-200',
    glow: 'rgba(16, 185, 129, 0.45)',
    primary: '💰',
    anim: 'bounce',
  },
  calendar: {
    bg: 'from-sky-100 via-indigo-200 to-blue-200',
    glow: 'rgba(59, 130, 246, 0.35)',
    primary: '📅',
    anim: 'float',
  },
  food: {
    bg: 'from-amber-100 via-orange-200 to-rose-200',
    glow: 'rgba(249, 115, 22, 0.35)',
    primary: '🍲',
    anim: 'bounce',
  },
  medicine: {
    bg: 'from-teal-100 via-cyan-200 to-sky-200',
    glow: 'rgba(20, 184, 166, 0.35)',
    primary: '💊',
    anim: 'pulse',
  },
  home: {
    bg: 'from-teal-100 via-emerald-200 to-green-200',
    glow: 'rgba(16, 185, 129, 0.35)',
    primary: '🏡',
    anim: 'bounce',
  },
  family: {
    bg: 'from-pink-100 via-rose-200 to-purple-200',
    glow: 'rgba(244, 63, 94, 0.35)',
    primary: '👨‍👩‍👧‍👦',
    anim: 'float',
  },
  hand: {
    bg: 'from-amber-100 via-orange-100 to-rose-200',
    glow: 'rgba(251, 146, 60, 0.35)',
    primary: '✋',
    anim: 'pulse',
  },
  dog: {
    bg: 'from-amber-100 via-yellow-200 to-orange-200',
    glow: 'rgba(245, 158, 11, 0.35)',
    primary: '🐶',
    anim: 'bounce',
  },
  cat: {
    bg: 'from-pink-100 via-rose-200 to-purple-100',
    glow: 'rgba(244, 63, 94, 0.35)',
    primary: '🐱',
    anim: 'bounce',
  },
  cow: {
    bg: 'from-green-100 via-emerald-200 to-teal-200',
    glow: 'rgba(34, 197, 94, 0.35)',
    primary: '🐄',
    anim: 'float',
  },
  elephant: {
    bg: 'from-slate-100 via-zinc-200 to-neutral-200',
    glow: 'rgba(148, 163, 184, 0.35)',
    primary: '🐘',
    anim: 'float',
  },
  bird: {
    bg: 'from-cyan-100 via-sky-200 to-blue-200',
    glow: 'rgba(56, 189, 248, 0.35)',
    primary: '🐦',
    anim: 'bounce',
  },
  fish: {
    bg: 'from-sky-100 via-cyan-200 to-blue-200',
    glow: 'rgba(14, 165, 233, 0.35)',
    primary: '🐟',
    anim: 'float',
  },
  market: {
    bg: 'from-amber-100 via-orange-200 to-yellow-200',
    glow: 'rgba(245, 158, 11, 0.35)',
    primary: '🏪',
    anim: 'bounce',
  },
  bakery: {
    bg: 'from-amber-100 via-yellow-200 to-orange-200',
    glow: 'rgba(234, 179, 8, 0.35)',
    primary: '🥖',
    anim: 'float',
  },
  waste: {
    bg: 'from-emerald-100 via-teal-200 to-cyan-200',
    glow: 'rgba(16, 185, 129, 0.35)',
    primary: '🗑️',
    anim: 'bounce',
  },
  mail: {
    bg: 'from-blue-100 via-sky-200 to-indigo-200',
    glow: 'rgba(59, 130, 246, 0.35)',
    primary: '✉️',
    anim: 'float',
  },
  idcard: {
    bg: 'from-blue-100 via-indigo-200 to-sky-200',
    glow: 'rgba(59, 130, 246, 0.35)',
    primary: '🪪',
    anim: 'float',
  },
  signin: {
    bg: 'from-blue-100 via-indigo-200 to-sky-200',
    glow: 'rgba(59, 130, 246, 0.35)',
    primary: '✍️',
    anim: 'float',
  },
  warning: {
    bg: 'from-yellow-100 via-amber-200 to-red-200',
    glow: 'rgba(234, 179, 8, 0.45)',
    primary: '⚠️',
    anim: 'pulse',
  },
  meeting: {
    bg: 'from-indigo-100 via-sky-200 to-blue-200',
    glow: 'rgba(99, 102, 241, 0.35)',
    primary: '👥',
    anim: 'float',
  },
  alphabet: {
    bg: 'from-sky-100 via-indigo-200 to-purple-200',
    glow: 'rgba(99, 102, 241, 0.35)',
    primary: '🔤',
    anim: 'float',
  },
  open: {
    bg: 'from-emerald-100 via-teal-200 to-green-200',
    glow: 'rgba(16, 185, 129, 0.35)',
    primary: '🔓',
    anim: 'pulse',
  },
  star: {
    bg: 'from-amber-100 via-yellow-200 to-orange-200',
    glow: 'rgba(245, 158, 11, 0.45)',
    primary: '⭐',
    anim: 'spin-slow',
  },
};

/** Direct Mapping Table for Every Course Question ID & Assessment ID */
const QUESTION_ID_MAP = {
  // Course 1 Questions
  course1_q1: 'school',
  course1_q2: 'family',
  course1_q3: 'water',
  course1_q4: 'hand',
  course1_q5: 'dog',
  course1_q6: 'market',
  course1_q7: 'book',
  course1_q8: 'bus',
  course1_q9: 'banana',
  course1_q10: 'home',

  // Course 2 Questions
  course2_q1: 'door',
  course2_q2: 'bus',
  course2_q3: 'wash',
  course2_q4: 'library',
  course2_q5: 'book',
  course2_q6: 'time',
  course2_q7: 'water',
  course2_q8: 'teacher',
  course2_q9: 'book',
  course2_q10: 'light',

  // Course 3 Questions
  course3_q1: 'bottle',
  course3_q2: 'time',
  course3_q3: 'train',
  course3_q4: 'library',
  course3_q5: 'money',
  course3_q6: 'warning',
  course3_q7: 'time',
  course3_q8: 'idcard',
  course3_q9: 'medicine',
  course3_q10: 'mail',

  // Course 4 Questions
  course4_q1: 'time',
  course4_q2: 'signin',
  course4_q3: 'money',
  course4_q4: 'meeting',
  course4_q5: 'open',
  course4_q6: 'bus',
  course4_q7: 'bus',
  course4_q8: 'waste',
  course4_q9: 'family',
  course4_q10: 'exit',

  // Assessment Questions
  'nfe-1': 'apple',
  'nfe-2': 'car',
  'nfe-3': 'numbers',
  'nfe-4': 'sit',
  'nfe-5': 'sun',
  'nfe-6': 'numbers',
  'nfe-7': 'book',
  'nfe-8': 'door',
  'ps-1': 'wash',
  'ps-2': 'numbers',
  'ps-3': 'bus',
  'ps-4': 'time',
  'ps-5': 'pencil',
  'ps-6': 'water',
  'ps-7': 'numbers',
  'ps-8': 'door',
  'ms-1': 'medicine',
  'ms-2': 'numbers',
  'ms-3': 'time',
  'ms-4': 'light',
  'ms-5': 'home',
  'ms-6': 'calendar',
  'ms-7': 'stop',
  'ms-8': 'time',
  'hs-1': 'time',
  'hs-2': 'money',
  'hs-3': 'exit',
  'hs-4': 'numbers',
  'hs-5': 'time',
  'hs-6': 'stop',
  'hs-7': 'book',
  'hs-8': 'money',
};

/**
 * Automatically deduce the appropriate visual scene matching the question's
 * concept and correct answer across all 4 courses, checkpoint tests, and assessments.
 */
function resolveScene(imageKey, questionText, questionId) {
  // 1. Direct Question ID Match (sorted by length descending so q10 matches before q1)
  const qId = String(questionId || '').toLowerCase();
  const sortedKeys = Object.keys(QUESTION_ID_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (qId.includes(key)) {
      return SCENES[QUESTION_ID_MAP[key]] || SCENES.book;
    }
  }

  // 2. Direct Image Key Match
  const normKey = String(imageKey || '').toLowerCase().trim();
  if (normKey && normKey !== 'book' && SCENES[normKey]) {
    return SCENES[normKey];
  }

  // 3. Question Text Keyword Analysis
  const text = `${normKey} ${String(questionText || '')}`.toLowerCase();

  if (/wash|hand|soap|clean hand|கழுவ|చేతులు|കൈ|ತೊಳೆಯ|हाथ धो/i.test(text)) return SCENES.wash;
  if (/emergency exit|exit|வெளியேறு|నిష్క్రమణ|പുറത്തേക്ക്|ಹೊರಹೋಗುವ|निकास/i.test(text)) return SCENES.exit;
  if (/door|close the door|open the door|கதவு|తలుపు|വാതിൽ|ಬಾಗಿಲು|दरवाजा/i.test(text)) return SCENES.door;
  if (/turn off the light|turn off light|light|switch off|விளக்கு|లైట్|വെളിച്ചം|ದೀಪ|लाइट/i.test(text)) return SCENES.light;
  if (/classroom|blackboard|teacher|ஆசிரியர்|ఉపాధ్యాయుడు|അധ്യാപകൻ|ಶಿಕ್ಷಕ|शिक्षक/i.test(text)) return SCENES.teacher;
  if (/school|learn|students|பள்ளி|పాఠశాల|സ്കൂൾ|ಶಾಲೆ|स्कूल|पाठशाला/i.test(text)) return SCENES.school;
  if (/library|borrow a book|நூலகம்|గ్రంథాలయం|ലൈബ്രറി|ಗ್ರಂಥಾಲಯ|पुस्तकालय/i.test(text)) return SCENES.library;
  if (/waste bin|waste|trash|clean area|குப்பை|చెత్త|മാലിന്യം|ಕಸ|कचरा/i.test(text)) return SCENES.waste;
  if (/visitors must sign in|sign in|signature|கையொப்ப|సంతకం|ഒപ്പ്|ಸಹಿ|हस्ताक्षर/i.test(text)) return SCENES.signin;
  if (/id card|identification|document|அடையாள|గుర్తింపు|തിരിച്ചറിയൽ|ಗುರುತಿನ|पहचान/i.test(text)) return SCENES.idcard;
  if (/danger|warning sign|warning|ஆபத்து|ప్రమాదం|അപകടം|ಅಪಾಯ|खतरा/i.test(text)) return SCENES.warning;
  if (/community meeting|meeting|கூட்டம்|సమావేశం|യോഗം|ಸಭೆ|बैठक/i.test(text)) return SCENES.meeting;
  if (/medicine|take after food|மருந்து|మందు|മരുന്ന്|ಔಷಧ|दवा/i.test(text)) return SCENES.medicine;
  if (/bottle|பாட்டில்|సీసా|കുപ്പി|ಬಾಟಲ್|बोतल/i.test(text)) return SCENES.bottle;
  if (/train|ரயில்|రైలు|ട്രെയിൻ|ರೈಲು|ट्रेन|रेल/i.test(text)) return SCENES.train;
  if (/school trip|school bus|bus|seats|occupied|பேருந்து|బస్సు|ബസ്|ಬಸ್ಸು|बस/i.test(text)) return SCENES.bus;
  if (/car|vehicle|கார்|కారు|കാർ|ಕಾರು|कार/i.test(text)) return SCENES.car;
  if (/bicycle|cycle|மிதிவண்டி|సైకిల్|സൈക്കിൾ|ಸೈಕಲ್|साइकिल/i.test(text)) return SCENES.bicycle;
  if (/boat|ship|படகு|పడవ|ബോട്ട്|ದೋಣಿ|नाव/i.test(text)) return SCENES.boat;
  if (/fruit|banana|mango|பழம்|పండు|പഴം|ಹಣ್ಣು|फल|केला/i.test(text)) return SCENES.banana;
  if (/apple|ஆப்பிள்|ఆపిల్|ആപ്പിൾ|ಸೇಬು|सेब/i.test(text)) return SCENES.apple;
  if (/water|drink|குடி|నీరు|വെള്ളം|ನೀರು|पानी|जल/i.test(text)) return SCENES.water;
  if (/part of the body|hand|உடல்|శరీర|ശരീര|ದೇಹ|हाथ|शरीर/i.test(text)) return SCENES.hand;
  if (/animal|dog|நாய்|కుక్క|നായ|ನಾಯಿ|कुत्ता/i.test(text)) return SCENES.dog;
  if (/cat|பூனை|పిల్లి|പൂച്ച|ಬೆಕ್ಕು|बिल्ली/i.test(text)) return SCENES.cat;
  if (/cow|பசு|ఆవు|പശു|ಹಸು|गाय/i.test(text)) return SCENES.cow;
  if (/market|shop|buy|store|கடை|சந்தை|అంగడి|കട|ಅಂಗಡಿ|दुकान|बाजार/i.test(text)) return SCENES.market;
  if (/place where people live|house|home|வீடு|ఇల్లు|വീട്|ಮನೆ|घर/i.test(text)) return SCENES.home;
  if (/family member|family|mother|parents|குடும்ப|కుటుంబ|കുടുംബ|ಕುಟುಂಬ|परिवार|माता/i.test(text)) return SCENES.family;
  if (/used for reading|reading a book|book|புத்தகம்|పుస్తకం|പുസ്തകം|ಪುಸ್ತಕ|किताब/i.test(text)) return SCENES.book;
  if (/writing|pencil|pen|எழுது|వ్రాయు|എഴുതുക|ಬರೆಯಲು|पेंसिल|कलम|लिखना/i.test(text)) return SCENES.pencil;
  if (/sit down|sit|chair|அமர்|కూర్చో|ഇരിക്കുക|ಕುಳಿತು|बैठना|कुर्सी/i.test(text)) return SCENES.sit;
  if (/sun|சூரியன்|సూర్యుడు|സൂര്യൻ|ಸೂರ್ಯ|सूर्य/i.test(text)) return SCENES.sun;
  if (/night|moon|இரவு|రాత్రి|രാത്രി|ರಾತ್ರಿ|रात|चाँद/i.test(text)) return SCENES.night;
  if (/o'clock|hour|minute|clock|starts at|time|journey|மணி|గంట|മണി|ಗಂಟೆ|बजे|समय/i.test(text)) return SCENES.time;
  if (/stop|signal|traffic|red light|green light|நிறுத்து|ఆగు|നിർത്തുക|ನಿಲ್ಲಿಸಿ|रुकना|सिग्नल/i.test(text)) return SCENES.stop;
  if (/₹|money|cost|spend|price|pay|ரூபாய்|రూపాయలు|രൂപ|ರೂಪಾಯಿ|रुपये|खर्च/i.test(text)) return SCENES.money;
  if (/shop is closed|closed every monday|the shop is open|is open|கடை மூடப்பட்டுள்ளது|மூசிవేయబడింది|അടച്ചിരിക്കുന്നു|ಮುಚ್ಚಲಾಗಿದೆ|दुकान बंद/i.test(text)) return SCENES.open;
  if (/monday|tuesday|wednesday|thursday|friday|saturday|sunday|calendar|திங்கள்|సోమవారం|തിങ്കൾ|ಸೋಮವಾರ|सोमवार|दिन/i.test(text)) return SCENES.calendar;
  if (/food|eat|eating|plate|spoon|meal|உணவு|ఆహారం|ഭക്ഷണം|ಊಟ|खाना|भोजन/i.test(text)) return SCENES.food;
  if (/number|largest|smallest|bigger|math|count|எண்|సంఖ్య|സംഖ്യ|ಸಂಖ್ಯೆ|संख्या/i.test(text)) return SCENES.numbers;

  return SCENES[normKey] || SCENES.book;
}

export function QuestionImage({ imageKey, question, questionId, className = '' }) {
  const scene = resolveScene(imageKey, question, questionId);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-[#fdfbf7] via-[#f8f5ee] to-[#f3ece0] shadow-inner transition-all select-none border-2 border-black/15 ${className}`}
      aria-hidden="true"
    >
      {/* Background Animated Ambient Halo Glow */}
      <motion.div
        className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full pointer-events-none blur-2xl"
        style={{ background: 'rgba(235, 210, 165, 0.45)' }}
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Primary Center Animated Icon - Single Icon Only */}
      <motion.div
        className="relative z-10 flex items-center justify-center p-4"
        animate={
          scene.anim === 'bounce'
            ? { y: [0, -10, 0], scale: [1, 1.04, 1] }
            : scene.anim === 'drive'
            ? { x: [-8, 8, -8], y: [0, -2, 0] }
            : scene.anim === 'pulse'
            ? { scale: [1, 1.08, 1] }
            : scene.anim === 'spin-slow'
            ? { rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }
            : { y: [-6, 6, -6], scale: [1, 1.03, 1] }
        }
        transition={{
          duration: scene.anim === 'drive' ? 2.5 : 3.0,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <span className="text-7xl sm:text-8xl md:text-9xl filter drop-shadow-xl select-none leading-none">
          {scene.primary}
        </span>
      </motion.div>
    </div>
  );
}

export default QuestionImage;
