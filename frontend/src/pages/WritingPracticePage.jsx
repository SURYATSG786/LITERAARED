import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Pencil,
  RotateCcw,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Gem,
  Star,
  Award,
  BookOpen,
  Volume2,
  RefreshCw,
  Check,
  AlertCircle,
  Bug,
  Terminal,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  Code,
  Lock,
  Headphones,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { PageTitle, ProgressBar } from '../components/ui';
import { GuideBird } from '../components/RedBird';
import { speakText } from '../audio';
import {
  A_Z_ALPHABET_DATA,
  TAMIL_LETTERS_DATA,
  TAMIL_WORDS_DATA,
  TELUGU_LETTERS_DATA,
  TELUGU_WORDS_DATA,
  MALAYALAM_LETTERS_DATA,
  MALAYALAM_WORDS_DATA,
  KANNADA_LETTERS_DATA,
  KANNADA_WORDS_DATA,
  HINDI_LETTERS_DATA,
  HINDI_WORDS_DATA,
  WRITING_SETS,
  checkIsDevMode,
  normalizeText,
  cleanScriptText,
  getGraphemes,
  levenshteinDistance,
  preprocessCanvasForOCR,
} from '../utils/handwritingEvaluator';

export { A_Z_ALPHABET_DATA, TAMIL_LETTERS_DATA, TAMIL_WORDS_DATA, TELUGU_LETTERS_DATA, TELUGU_WORDS_DATA, MALAYALAM_LETTERS_DATA, MALAYALAM_WORDS_DATA, KANNADA_LETTERS_DATA, KANNADA_WORDS_DATA, HINDI_LETTERS_DATA, HINDI_WORDS_DATA, WRITING_SETS, checkIsDevMode, normalizeText, getGraphemes, levenshteinDistance, preprocessCanvasForOCR };

export default function WritingPracticePage() {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const activeLang = user?.learningLanguage || user?.preferred_language || i18n.language || 'en';
  const safeLang = WRITING_SETS[activeLang] ? activeLang : 'en';
  const isEnglish = safeLang === 'en';
  const isTamil = safeLang === 'ta';
  const isTelugu = safeLang === 'te';
  const isMalayalam = safeLang === 'ml';
  const isKannada = safeLang === 'kn';
  const isHindi = safeLang === 'hi';
  const isStructured = isEnglish || isTamil || isTelugu || isMalayalam || isKannada || isHindi;
  const structuredLetters = isTamil ? TAMIL_LETTERS_DATA : isTelugu ? TELUGU_LETTERS_DATA : isMalayalam ? MALAYALAM_LETTERS_DATA : isKannada ? KANNADA_LETTERS_DATA : isHindi ? HINDI_LETTERS_DATA : A_Z_ALPHABET_DATA;
  const writingSet = WRITING_SETS[safeLang];
  const userUiLang = user?.uiLanguage || user?.preferred_language || i18n.language || 'en';

  // Screen states: 'welcome' | 'challenge' | 'completed'
  const [screen, setScreen] = useState('welcome');
  const [currentIndex, setCurrentIndex] = useState(0);

  // English A-Z Track Specific States
  // targetStage: 'letter' | 'word'
  const [targetStage, setTargetStage] = useState('letter');
  // stepFlow: 'listen' | 'trace' | 'write'
  const [stepFlow, setStepFlow] = useState('listen');
  const [alphabetProgress, setAlphabetProgress] = useState(null);
  const [alphabetIndex, setAlphabetIndex] = useState(0);

  // Canvas drawing state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const currentStrokeRef = useRef([]);

  // Verification & feedback states
  const [verifying, setVerifying] = useState(false);
  const [feedback, setFeedback] = useState(null); // { status: 'correct' | 'incorrect', score: 0, message: '', coachTip: '' }
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [totalGemsEarned, setTotalGemsEarned] = useState(0);
  const sessionIdRef = useRef(null);

  // Debug system state & Dev Mode flag
  const isDevMode = checkIsDevMode();
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [copiedLogId, setCopiedLogId] = useState(null);

  // Load English A-Z progress from backend if English
  useEffect(() => {
    if (isEnglish && user?.id) {
      api.getAlphabetWritingProgress()
        .then((res) => {
          if (res?.progress) {
            setAlphabetProgress(res.progress);
            if (res.progress.highestUnlockedIndex !== undefined) {
              setAlphabetIndex(res.progress.highestUnlockedIndex);
            }
          }
        })
        .catch(() => {});
    }
  }, [isEnglish, user?.id]);

  const currentAlphabetItem = isStructured ? (structuredLetters[alphabetIndex] || structuredLetters[0]) : null;
  const currentChallenge = isStructured
    ? {
        id: `${safeLang}_${currentAlphabetItem.letter}_${targetStage}`,
        target: targetStage === 'letter' ? currentAlphabetItem.letter : currentAlphabetItem.word,
        label: targetStage === 'letter' ? currentAlphabetItem.letter : currentAlphabetItem.word,
        emoji: currentAlphabetItem.emoji,
        hint: targetStage === 'letter'
          ? currentAlphabetItem.hint
          : (isTamil ? `${currentAlphabetItem.word} என்று எழுதவும்` : t('writeWordPrompt', { word: currentAlphabetItem.word, defaultValue: `Write "${currentAlphabetItem.word}"` })),
        phonetic: currentAlphabetItem.phonetic,
      }
    : (writingSet[currentIndex] || writingSet[0]);

  const isSingleLetter = isStructured ? (targetStage === 'letter') : (currentChallenge.target.length === 1);

  function getAlphabetState(letter, idx) {
    const p = alphabetProgress?.progressMap?.[letter];
    const isFullyDone = p?.letterCompleted && p?.wordCompleted;
    if (isFullyDone) return 'mastered';
    if (p?.letterCompleted || p?.wordCompleted) return 'in_progress';
    const isUnlocked = idx === 0 || idx <= (alphabetProgress?.highestUnlockedIndex ?? 0) || (idx > 0 && alphabetProgress?.progressMap?.[structuredLetters[idx - 1]?.letter]?.letterCompleted && alphabetProgress?.progressMap?.[structuredLetters[idx - 1]?.letter]?.wordCompleted);
    if (isUnlocked) return 'unlocked';
    return 'locked';
  }

  function handleSelectAlphabet(idx) {
    const state = getAlphabetState(structuredLetters[idx].letter, idx);
    if (state !== 'locked') {
      setAlphabetIndex(idx);
      setTargetStage('letter');
      setStepFlow('listen');
      resetCanvas();
    }
  }

  // Sync guide outline default with stepFlow
  useEffect(() => {
    if (stepFlow === "trace") {
      setShowGuide(true);
    } else if (stepFlow === "write") {
      setShowGuide(false);
    }
  }, [stepFlow]);

  // Canvas setup
  useEffect(() => {
    if (screen === 'challenge' && canvasRef.current) {
      resetCanvas();
    }
  }, [screen, currentIndex, alphabetIndex, targetStage, stepFlow]);

  function resetCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw crisp white background for OCR
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Primary guideline baseline for neat handwriting
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    // Midline
    ctx.moveTo(0, canvas.height * 0.5);
    ctx.lineTo(canvas.width, canvas.height * 0.5);
    // Base writing line
    ctx.moveTo(0, canvas.height * 0.75);
    ctx.lineTo(canvas.width, canvas.height * 0.75);
    ctx.stroke();

    // Center vertical guide
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    setHasDrawn(false);
    setFeedback(null);
    setStrokes([]);
    currentStrokeRef.current = [];
  }

  function getCoordinates(e) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, t: Date.now() };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = e.clientX;
    let clientY = e.clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      t: Date.now(),
    };
  }

  function startDrawing(e) {
    e.preventDefault();
    if (feedback?.status === 'correct') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pt = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.strokeStyle = '#000000'; // Pure Black stroke
    ctx.fillStyle = '#000000';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
    setHasDrawn(true);
    currentStrokeRef.current = [pt];
  }

  function draw(e) {
    e.preventDefault();
    if (!isDrawing || feedback?.status === 'correct') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pt = getCoordinates(e);

    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    currentStrokeRef.current.push(pt);
  }

  function stopDrawing(e) {
    if (e) e.preventDefault();
    if (isDrawing && currentStrokeRef.current.length > 0) {
      setStrokes(prev => [...prev, [...currentStrokeRef.current]]);
      currentStrokeRef.current = [];
    }
    setIsDrawing(false);
  }

      async function handleCheckWriting() {
    setVerifying(true);
    setFeedback(null);

    const targetText = (currentChallenge?.target || "").trim();

    try {
      // Do not evaluate or fail trace - award 100% completion upon practice
      const coachPraise = t("feedbackGreatJob", { target: targetText, defaultValue: `Great job practicing "${targetText}"! Keep up the momentum! ✨` });

      setFeedback({
        status: "correct",
        message: t("practiceCompleted", "Completed! Great practice! 🎉"),
        coachTip: coachPraise,
      });

      // Save progress to database & award XP/Gems
      if (isEnglish) {
        try {
          const res = await api.saveAlphabetWritingProgress({
            letter: currentAlphabetItem.letter,
            type: targetStage,
            word: currentAlphabetItem.word,
            score: 100,
            timeSpent: 15,
            event_id: `${sessionIdRef.current}:az:${currentAlphabetItem.letter}:${targetStage}`,
          });
          if (res?.progress) setAlphabetProgress(res.progress);
          if (res?.awarded) {
            setTotalXpEarned(prev => prev + res.awarded.xp);
            setTotalGemsEarned(prev => prev + res.awarded.gems);
          }
          if (res?.user) refreshUser(res.user);
        } catch (_) {}
      } else {
        try {
          const result = await api.awardWritingReward(`${sessionIdRef.current}:challenge:${currentIndex}`, "challenge");
          setTotalXpEarned(total => total + result.awarded.xp);
          setTotalGemsEarned(total => total + result.awarded.gems);
          refreshUser(result.user);
        } catch (_) {}
      }

      // Play authentic bird reaction voice in UI language & trigger confetti
      const uiLanguage = user?.uiLanguage || user?.preferred_language || i18n.language || "en";
      speakText(t("correctCheer", "Woohoo! That's correct!"), uiLanguage, false, true).catch(() => {});
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error("Check writing error:", err);
      setFeedback({
        status: "correct",
        message: t("practiceCompleted", "Completed! Great practice! 🎉"),
        coachTip: t("feedbackGreatJob", { target: targetText, defaultValue: `Great job practicing "${targetText}"!` }),
      });
    } finally {
      setVerifying(false);
    }
  }

  function handleNextStep() {
    // Silently save progress in background
    if (isEnglish) {
      api.saveAlphabetWritingProgress({
        letter: currentAlphabetItem.letter,
        type: targetStage,
        word: currentAlphabetItem.word,
        score: 100,
        timeSpent: 15,
        event_id: `${sessionIdRef.current}:az:${currentAlphabetItem.letter}:${targetStage}`,
      }).then(res => {
        if (res?.progress) setAlphabetProgress(res.progress);
        if (res?.awarded) {
          setTotalXpEarned(prev => prev + res.awarded.xp);
          setTotalGemsEarned(prev => prev + res.awarded.gems);
        }
        if (res?.user) refreshUser(res.user);
      }).catch(() => {});
    } else {
      api.awardWritingReward(`${sessionIdRef.current}:challenge:${currentIndex}`, 'challenge').then(result => {
        if (result?.awarded) {
          setTotalXpEarned(total => total + result.awarded.xp);
          setTotalGemsEarned(total => total + result.awarded.gems);
        }
        if (result?.user) refreshUser(result.user);
      }).catch(() => {});
    }

    if (isStructured) {
      if (targetStage === 'letter') {
        // Move to word stage of the same letter
        setTargetStage('word');
        setStepFlow('listen');
        resetCanvas();
      } else {
        // Word stage completed -> advance to next letter
        if (alphabetIndex + 1 < structuredLetters.length) {
          setAlphabetIndex(prev => prev + 1);
          setTargetStage('letter');
          setStepFlow('listen');
          resetCanvas();
        } else {
          finishSession();
        }
      }
    } else {
      if (currentIndex + 1 < writingSet.length) {
        setCurrentIndex(prev => prev + 1);
        resetCanvas();
      } else {
        finishSession();
      }
    }
  }

  async function finishSession() {
    setScreen('completed');

    if (user?.id) {
      try {
        localStorage.setItem(`literaai_badge_writing_${user.id}`, 'true');
        const existingBadges = JSON.parse(localStorage.getItem(`literaai_badges_${user.id}`) || '[]');
        if (!existingBadges.includes('writing_master')) {
          existingBadges.push('writing_master');
          localStorage.setItem(`literaai_badges_${user.id}`, JSON.stringify(existingBadges));
        }
      } catch (_) {}
    }

    try {
      const result = await api.awardWritingReward(`${sessionIdRef.current}:completion`, 'completion');
      await api.awardBadge('writing_master').catch(() => {});
      if (isEnglish) {
        await api.awardBadge('english_alphabet_master').catch(() => {});
      }
      if (isTamil) {
        await api.awardBadge('tamil_writing_master').catch(() => {});
      }
      if (result?.user) {
        refreshUser(result.user);
      }
    } catch (_) {
      api.awardBadge('writing_master').catch(() => {});
    }

    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
    });
  }

  function playLetterPronunciation() {
    if (isStructured) {
      if (currentAlphabetItem) {
        speakText(currentAlphabetItem.letter, safeLang);
      } else {
        speakText(currentChallenge.target, safeLang);
      }
    } else {
      speakText(currentChallenge.target, safeLang);
    }
  }

  function playWordPronunciation() {
    if (isStructured) {
      if (currentAlphabetItem) {
        speakText(currentAlphabetItem.word, safeLang);
      } else {
        speakText(currentChallenge.target, safeLang);
      }
    } else {
      speakText(currentChallenge.target, safeLang);
    }
  }

  return (
    <div className="w-full flex-1 flex flex-col justify-between gap-2.5 p-1 sm:p-1.5 pb-2 h-[calc(100vh-110px)] min-h-0">
      {/* Top Banner Guide */}
      <div className="flex items-center justify-end shrink-0">
        <GuideBird
          message={
            screen === 'welcome'
              ? t('birdGuideWriting', 'Draw each letter or word on the handwriting canvas, then tap Check Writing!')
              : screen === 'challenge'
              ? feedback?.status === 'correct'
                ? t('correctCheer', "Woohoo! That's correct!")
                : feedback?.status === 'incorrect'
                ? t('tryAgainVoice', 'Not quite, try again!')
                : t('birdGuideWriting', 'Draw each letter or word on the handwriting canvas, then tap Check Writing!')
              : t('sessionCompletedTitle', 'Practice Completed!')
          }
          mood={screen === 'completed' ? 'cheer' : feedback?.status === 'correct' ? 'cheer' : 'happy'}
          size={42}
        />
      </div>

      {/* 1. WELCOME SCREEN (Using Uploaded Custom Writing Illustrated Banner) */}
      {screen === 'welcome' && (
        <motion.div
          className="w-full rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl border-2 border-purple-300/40 flex-1 flex flex-col justify-center h-full min-h-0 relative overflow-hidden"
          style={{
            boxShadow: '0 24px 48px -10px rgba(147, 51, 234, 0.18), 0 12px 28px -6px rgba(16, 185, 129, 0.16)',
          }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/assets/writing_landing.mp4"
            autoPlay
            loop
            playsInline
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-end h-full max-w-6xl mx-auto w-full">
            {/* Right Content & Actions Column */}
            <div className="w-full md:w-[54%] lg:w-[50%] md:ml-auto space-y-3.5 sm:space-y-4.5 text-center md:text-left">
              <div className="space-y-2">
                <h2 className="display text-2xl sm:text-3xl lg:text-4xl font-black text-black leading-tight">
                  {isTamil
                    ? t('taWritingJourneyTitle', 'தமிழ் எழுத்துப் பயிற்சிப் பயணம்')
                    : isTelugu
                    ? t('teWritingJourneyTitle', 'తెలుగు వ్రాత సాధన ప్రయాణం')
                    : isMalayalam
                    ? t('mlWritingJourneyTitle', 'മലയാളം എഴുത്ത് പരിശീലന യാത്ര')
                    : isKannada
                    ? t('knWritingJourneyTitle', 'ಕನ್ನಡ ಬರವಣಿಗೆ ಅಭ್ಯಾಸ ಪಯಣ')
                    : isHindi
                    ? t('hiWritingJourneyTitle', 'हिंदी लेखन अभ्यास यात्रा')
                    : isEnglish
                    ? t('azJourneyTitle', 'English A–Z Alphabet Journey')
                    : t('writingPractice') || 'Writing Practice'}
                </h2>

                <p className="text-xs sm:text-sm font-bold text-black/85 leading-relaxed max-w-md">
                  {isTamil
                    ? t('taWritingJourneySub', '12 உயிரெழுத்துக்கள் மற்றும் 18 மெய்யெழுத்துக்கள் (மொத்தம் 30 எழுத்துக்கள்) மற்றும் 10 அடிப்படைச் சொற்களை எழுதிப் பழகுங்கள்!')
                    : isTelugu
                    ? t('teWritingJourneySub', '15 అచ్చులు మరియు 36 హల్లులు (మొత్తం 51 అక్షరాలు) మరియు 10 ప్రాథమిక పదాలను వ్రాయడం సాధన చేయండి!')
                    : isMalayalam
                    ? t('mlWritingJourneySub', '15 സ്വരാക്ഷരങ്ങളും 36 വ്യഞ്ജനാക്ഷരങ്ങളും (ആകെ 51 അക്ഷരങ്ങൾ) 10 അടിസ്ഥാന വാക്കുകളും കേട്ടും വരച്ചും പഠിക്കുക!')
                    : isKannada
                    ? t('knWritingJourneySub', '15 ಸ್ವರಗಳು ಮತ್ತು 36 ವ್ಯಂಜನಗಳು (ಒಟ್ಟು 51 ಅಕ್ಷರಗಳು) ಮತ್ತು 10 ಮೂಲಭೂತ ಪದಗಳನ್ನು ಅಭ್ಯಾಸ ಮಾಡಿ!')
                    : isHindi
                    ? t('hiWritingJourneySub', '13 स्वर और 36 व्यंजन (कुल 49 अक्षर) और 10 बुनियादी शब्दों का अभ्यास करें!')
                    : isEnglish
                    ? t('azJourneySub', 'Master all 26 English alphabets (A to Z) with 3-step learning: Listen to sounds, Trace guided strokes, and Freehand write vocabulary words!')
                    : t('writingPracticeSub') ||
                      'Practice writing important everyday words using handwriting. Complete all five writing challenges to earn XP, Gems, and improve your writing skills.'}
                </p>
              </div>

              {/* Language selection info pill */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="text-xs sm:text-sm font-black text-black uppercase tracking-wider">
                  {t('selectedLanguage', 'Selected Language')}:
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 text-black font-black text-xs sm:text-sm border-2 border-purple-400/80 shadow-xs backdrop-blur-sm">
                  {isTamil ? 'TAMIL (தமிழ்)' : isTelugu ? 'TELUGU (తెలుగు)' : isMalayalam ? 'MALAYALAM (മലയാളം)' : isKannada ? 'KANNADA (ಕನ್ನಡ)' : isHindi ? 'HINDI (हिंदी)' : safeLang.toUpperCase()}
                </span>
              </div>

              {/* Rewards Showcase Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div
                  className="rounded-2xl p-2.5 sm:p-3 border-2 border-sky-300/80 flex flex-col items-center text-center shadow-sm backdrop-blur-md"
                  style={{ background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.92) 0%, rgba(224, 242, 254, 0.85) 100%)' }}
                >
                  <Star className="text-amber-500 mb-1" size={20} />
                  <span className="text-xs sm:text-sm font-black text-black">{isStructured ? '+10 / +20 XP' : '+50 XP'}</span>
                  <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-black/70 mt-0.5">
                    {t('perStageReward', 'Per Stage')}
                  </span>
                </div>
                <div
                  className="rounded-2xl p-2.5 sm:p-3 border-2 border-emerald-300/80 flex flex-col items-center text-center shadow-sm backdrop-blur-md"
                  style={{ background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.92) 0%, rgba(236, 253, 245, 0.85) 100%)' }}
                >
                  <Gem className="text-amber-500 mb-1" size={20} />
                  <span className="text-xs sm:text-sm font-black text-black">{isStructured ? '+500 XP & Gems' : '+5 Gems'}</span>
                  <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-black/70 mt-0.5">
                    {isTamil ? t('taWritingCompletionReward', 'பயிற்சி நிறைவு') : isTelugu ? t('teWritingCompletionReward', 'సాధన పూర్తి') : isMalayalam ? t('mlWritingCompletionReward', 'പൂർത്തീകരണം') : isKannada ? t('knWritingCompletionReward', 'ಕನ್ನಡ 51 ಅಕ್ಷರಗಳ ಪೂರ್ಣತೆ') : isHindi ? t('hiWritingCompletionReward', 'हिंदी 49 अक्षर पूर्णता') : t('azCompletionReward', 'A–Z Completion')}
                  </span>
                </div>
                <div
                  className="rounded-2xl p-2.5 sm:p-3 border-2 border-purple-300/80 flex flex-col items-center text-center shadow-sm backdrop-blur-md"
                  style={{ background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.92) 0%, rgba(243, 232, 255, 0.85) 100%)' }}
                >
                  <Award className="text-amber-500 mb-1" size={20} />
                  <span className="text-xs sm:text-sm font-black text-black">{isTamil ? t('taWritingMasterBadge', 'தமிழ் மாஸ்டர்') : isTelugu ? t('teWritingMasterBadge', 'తెలుగు మాస్టர்') : isMalayalam ? t('mlWritingMasterBadge', 'മലയാളം മാസ്റ്റർ') : isKannada ? t('knWritingMasterBadge', 'ಕನ್ನಡ ಮಾಸ್ಟರ್') : isHindi ? t('hiWritingMasterBadge', 'हिंदी मास्टर') : isEnglish ? t('azMasterBadge', 'A–Z Master') : t('badge', 'Badge')}</span>
                  <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-black/70 mt-0.5">
                    {t('verifiedBadge', 'Verified Badge')}
                  </span>
                </div>
              </div>

              {/* Start Writing CTA */}
              <div className="pt-1">
                <button
                  type="button"
                  className="btn-primary w-full sm:w-auto px-8 py-3 text-sm sm:text-base font-black flex items-center justify-center gap-2.5 shadow-xl hover:scale-102 transition-all cursor-pointer"
                  onClick={() => {
                    sessionIdRef.current = crypto.randomUUID();
                    setScreen('challenge');
                    setCurrentIndex(0);
                    setStepFlow('listen');
                    setTargetStage('letter');
                    setTotalXpEarned(0);
                    setTotalGemsEarned(0);
                  }}
                >
                  <Pencil size={18} />
                  <span>{isTamil ? t('startTamilWriting', 'பயிற்சியைத் தொடங்குங்கள் 🚀') : isTelugu ? t('startTeluguWriting', 'సాధన ప్రారంభించండి 🚀') : isMalayalam ? t('startMalayalamWriting', 'മലയാളം പരിശീലനം ആരംഭിക്കുക 🚀') : isKannada ? t('startKannadaWriting', 'ಕನ್ನಡ ಪಯಣ ಪ್ರಾರಂಭಿಸಿ 🚀') : isHindi ? t('startHindiWriting', 'हिंदी यात्रा शुरू करें 🚀') : isEnglish ? t('startAZJourney', 'Start A–Z Journey 🚀') : t('startWriting') || 'Start Writing'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. CHALLENGE & LEARNING SCREEN */}
      {screen === 'challenge' && (
        <motion.div
          className="glass-card rounded-3xl p-3.5 sm:p-4 shadow-xl border-2 border-[#032038]/20 flex-1 flex flex-col justify-between space-y-2 h-full min-h-0 overflow-hidden"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          key={`${isStructured ? alphabetIndex : currentIndex}_${targetStage}_${stepFlow}`}
        >
          {/* Horizontal Stepper / Roadmap Bar (For English & Tamil Structured) */}
          {isStructured && (
            <div className="shrink-0 space-y-1.5 border-b border-black/10 pb-2">
              <div className="flex items-center justify-between text-xs font-black text-black">
                <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-900 px-3 py-0.5 font-black text-[11px] border border-purple-300 shadow-xs">
                  {t('alphabetProgressBanner', {
                    letter: currentAlphabetItem.letter,
                    current: alphabetIndex + 1,
                    total: structuredLetters.length,
                    stage: targetStage === 'letter'
                      ? t('letterStrokeStage', 'Letter Stroke')
                      : t('wordStage', { word: currentAlphabetItem.word, emoji: currentAlphabetItem.emoji, defaultValue: `Word (${currentAlphabetItem.word} ${currentAlphabetItem.emoji})` }),
                    defaultValue: `Alphabet ${currentAlphabetItem.letter} (${alphabetIndex + 1} of ${structuredLetters.length}): ${targetStage === 'letter' ? 'Letter Stroke' : `Word (${currentAlphabetItem.word} ${currentAlphabetItem.emoji})`}`
                  })}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-black">
                    {alphabetProgress?.completedCount || 0} / {structuredLetters.length} {t('masteredCount', 'Mastered')}
                  </span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-900 border border-amber-400/40">
                    +{totalXpEarned} XP
                  </span>
                </div>
              </div>

              {/* Quick Navigation Carousel */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar scroll-smooth">
                {structuredLetters.map((item, idx) => {
                  const state = getAlphabetState(item.letter, idx);
                  const isCurrent = isStructured && alphabetIndex === idx;

                  let btnCls = 'shrink-0 px-2.5 h-8 rounded-xl font-black text-xs flex items-center justify-center transition-all border-2 cursor-pointer min-w-[32px]';
                  if (isCurrent) {
                    btnCls += ' bg-purple-600 text-white border-purple-700 shadow-md scale-110 ring-2 ring-purple-400';
                  } else if (state === 'mastered') {
                    btnCls += ' bg-emerald-100 text-emerald-800 border-emerald-400 hover:bg-emerald-200';
                  } else if (state === 'in_progress') {
                    btnCls += ' bg-amber-100 text-amber-800 border-amber-400 hover:bg-amber-200';
                  } else if (state === 'unlocked') {
                    btnCls += ' bg-white text-black border-slate-300 hover:bg-slate-100';
                  } else {
                    btnCls += ' bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200';
                  }

                  return (
                    <button
                      key={item.letter}
                      type="button"
                      onClick={() => handleSelectAlphabet(idx)}
                      className={btnCls}
                      title={`Item ${item.letter} (${item.word} ${item.emoji})`}
                    >
                      {state === 'mastered' ? (
                        <Star size={13} className="text-emerald-700 fill-emerald-500" />
                      ) : state === 'in_progress' ? (
                        <span className="text-[10px] font-black">{item.letter}</span>
                      ) : (
                        item.letter
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Non-Structured Progress Bar */}
          {!isStructured && (
            <div className="space-y-1 shrink-0">
              <div className="flex items-center justify-between text-xs font-black text-black">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-0.5 text-black uppercase tracking-wider font-black border border-black/20 text-[11px]">
                  <Sparkles size={12} />
                  Challenge {currentIndex + 1} of 5
                </span>
                <span className="text-black font-black text-xs">
                  {Math.round(((currentIndex + 1) / writingSet.length) * 100)}%
                </span>
              </div>
              <ProgressBar value={currentIndex + 1} max={writingSet.length} />
            </div>
          )}

          {/* Two-Step Flow Stepper Tabs (Listen -> Trace) */}
          {isStructured && (
            <div className="grid grid-cols-2 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setStepFlow('listen')}
                className={`py-2 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                  stepFlow === 'listen'
                    ? 'btn-primary text-black shadow-md border-amber-500/80 scale-101'
                    : 'bg-white/80 text-black border-slate-300 hover:bg-white'
                }`}
              >
                <Headphones size={15} />
                <span>{t('tabListen', '1. Listen 🔊')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStepFlow('trace');
                  resetCanvas();
                }}
                className={`py-2 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                  stepFlow === 'trace'
                    ? 'btn-primary text-black shadow-md border-amber-500/80 scale-101'
                    : 'bg-white/80 text-black border-slate-300 hover:bg-white'
                }`}
              >
                <Pencil size={15} />
                <span>{t('tabTrace', '2. Trace ✍️')}</span>
              </button>
            </div>
          )}

          {/* Step 1: Listen Card View (2-Column Balanced Layout like Course Player) */}
          {isStructured && stepFlow === 'listen' && (
            <div className="grid gap-4 md:grid-cols-12 flex-1 h-full items-stretch min-h-0 py-1">
              {/* Left Column: Picture Card (Emoji Illustration Box like CoursePlayer) */}
              <div className="md:col-span-5 flex flex-col h-full gap-2.5 min-h-0">
                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-purple-900 bg-purple-100 px-3.5 py-1.5 rounded-full border border-purple-300 self-start shrink-0">
                  <Headphones size={13} />
                  <span>{t('step1Title', 'Step 1 • Listen & Pronounce')}</span>
                </div>

                <div className="relative flex-1 w-full rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[220px] bg-gradient-to-br from-[#fdfbf7] via-[#f8f5ee] to-[#f3ece0] border-2 border-black/15 items-center justify-center">
                  {/* Ambient Halo Glow */}
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

                  {/* Primary Center Animated 3D Emoji Icon */}
                  <motion.div
                    className="relative z-10 flex flex-col items-center justify-center p-4 text-center"
                    animate={{
                      y: [-6, 6, -6],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 3.0,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <span className="text-8xl sm:text-9xl md:text-[110px] filter drop-shadow-2xl select-none leading-none">
                      {currentAlphabetItem.emoji}
                    </span>
                    <span className="text-sm font-black text-slate-700 mt-2 tracking-wider">
                      {currentAlphabetItem.word} {userUiLang !== safeLang && currentAlphabetItem?.translations?.[userUiLang] ? `(${currentAlphabetItem.translations[userUiLang]})` : ''}
                    </span>
                  </motion.div>
                </div>
              </div>

              {/* Right Column: Letter, Word & Audio Actions */}
              <div className="md:col-span-7 flex flex-col justify-between h-full space-y-3 py-1 min-h-0">
                <div className="space-y-3 flex-1 flex flex-col justify-center">
                  {/* Big Letter Card */}
                  <div className="rounded-2xl bg-white/90 p-4 border-2 border-purple-200 shadow-xs text-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 block">
                      {isTamil ? t('tamilAlphabet', 'Tamil Letter') : isTelugu ? t('teluguAlphabet', 'Telugu Letter') : isMalayalam ? t('malayalamAlphabet', 'Malayalam Letter') : isKannada ? t('kannadaAlphabet', 'ಕನ್ನಡ ಅಕ್ಷರ') : isHindi ? t('hindiAlphabet', 'हिंदी अक्षर') : isEnglish ? t('englishAlphabet', 'English Alphabet') : t('letter', 'Letter')}
                    </span>
                    <h3 className="display text-4xl sm:text-6xl font-black text-black tracking-wide my-1">
                      {currentAlphabetItem.letter}
                    </h3>
                  </div>

                  {/* Audio Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={playLetterPronunciation}
                      className="btn-secondary py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer hover:scale-102 transition"
                    >
                      <Volume2 size={16} className="text-purple-600 shrink-0" />
                      <span>{t('hearLetterSound', 'Hear Letter')} ({currentAlphabetItem.letter})</span>
                    </button>

                    <button
                      type="button"
                      onClick={playWordPronunciation}
                      className="btn-secondary py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer hover:scale-102 transition"
                    >
                      <Volume2 size={16} className="text-sky-600 shrink-0" />
                      <span>{t('hearWordSound', 'Hear Word')} ({currentAlphabetItem.word})</span>
                    </button>
                  </div>
                </div>

                {/* Forward to Trace CTA Button */}
                <div className="pt-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setStepFlow('trace');
                      resetCanvas();
                    }}
                    className="btn-primary w-full py-3.5 text-sm sm:text-base font-black flex items-center justify-center gap-2.5 shadow-xl hover:scale-101 transition cursor-pointer"
                  >
                    <span>{`${t('nextTraceLetter', 'Next: Trace Letter')} (${currentAlphabetItem.letter})`}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Steps 2 & 3 (Trace & Write) + Non-Structured Challenge View (2-Column Filled Layout) */}
          {(!isStructured || stepFlow !== 'listen') && (
            <div className="grid gap-4 md:grid-cols-12 flex-1 h-full items-stretch min-h-0 py-1">
              {/* Left Column: Picture Card + Stroke Info */}
              <div className="md:col-span-4 flex flex-col h-full gap-2.5 min-h-0 justify-between">
                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-purple-900 bg-purple-100 px-3 py-1 rounded-full border border-purple-300 self-start shrink-0">
                  <Pencil size={12} />
                  <span>
                    {isStructured
                      ? stepFlow === 'trace'
                        ? `${t('step2Title', 'Step 2 • Trace')} "${currentChallenge.target}"`
                        : `${t('step3Title', 'Step 3 • Write')} "${currentChallenge.target}"`
                      : `Challenge ${currentIndex + 1}: ${currentChallenge.target}`}
                  </span>
                </div>

                {/* Illustrated Picture Box */}
                <div className="relative flex-1 w-full rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[160px] bg-gradient-to-br from-[#fdfbf7] via-[#f8f5ee] to-[#f3ece0] border-2 border-black/15 items-center justify-center">
                  <motion.div
                    className="absolute w-36 h-36 rounded-full pointer-events-none blur-xl"
                    style={{ background: 'rgba(235, 210, 165, 0.45)' }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="relative z-10 flex flex-col items-center justify-center p-3 text-center"
                    animate={{ y: [-4, 4, -4], scale: [1, 1.04, 1] }}
                    transition={{ duration: 3.0, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <span className="text-7xl sm:text-8xl filter drop-shadow-xl select-none leading-none">
                      {currentChallenge.emoji}
                    </span>
                    <span className="text-xs font-black text-slate-700 mt-1 tracking-wider">
                      {currentChallenge.target} {isStructured && userUiLang !== safeLang && targetStage === 'word' && currentAlphabetItem?.translations?.[userUiLang] ? `(${currentAlphabetItem.translations[userUiLang]})` : ''}
                    </span>
                  </motion.div>
                </div>

                {/* Target Letter / Word Card with Audio */}
                <div className="rounded-2xl bg-white/90 p-3 border-2 border-black/10 shadow-xs flex items-center justify-between gap-2 shrink-0">
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">
                      {targetStage === 'word' ? t('targetWord', 'Target Word') : t('targetCharacter', 'Target Character')}
                    </span>
                    <h4 className="display text-2xl sm:text-3xl font-black text-black leading-none">{currentChallenge.target}</h4>
                  </div>
                  <button
                    type="button"
                    className="p-2 rounded-xl bg-black/5 hover:bg-black/10 text-black transition cursor-pointer border border-black/15 flex items-center gap-1 text-xs font-black"
                    onClick={playWordPronunciation}
                    title="Listen pronunciation"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
              </div>

              {/* Right Column: Full-Height Handwriting Canvas & Controls */}
              <div className="md:col-span-8 flex flex-col justify-between h-full space-y-2 min-h-0">
                <div className="relative rounded-2xl bg-white border-2 border-[#032038]/25 shadow-inner overflow-hidden flex items-center justify-center touch-none flex-1 min-h-[220px]">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={300}
                    className="w-full h-full cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />

                  {/* Guided Trace Template Outline Overlay */}
                  {showGuide && (
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                      style={{
                        fontSize: isSingleLetter
                          ? "200px"
                          : currentChallenge.target.length > 5
                          ? "110px"
                          : currentChallenge.target.length > 3
                          ? "135px"
                          : "160px",
                        fontFamily: "'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Devanagari', 'Noto Sans Kannada', 'Noto Sans Malayalam', system-ui, -apple-system, sans-serif",
                        letterSpacing: isSingleLetter ? "0" : "4px",
                        color: "transparent",
                        WebkitTextFillColor: "transparent",
                        WebkitTextStroke: "3px rgba(100, 116, 139, 0.75)",
                        textStroke: "3px rgba(100, 116, 139, 0.75)",
                        filter: "drop-shadow(0 0 1px rgba(71, 85, 105, 0.4))",
                        fontWeight: 900,
                        lineHeight: 1,
                      }}
                    >
                      {currentChallenge.target}
                    </div>
                  )}

                  {!hasDrawn && !verifying && !feedback && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
                      <Pencil className="opacity-30 mb-1" size={24} />
                      <span className="text-xs font-black opacity-60 uppercase tracking-widest">
                        {stepFlow === 'trace' ? t('tabTrace', '2. Trace ✍️') : t('tabWrite', '3. Write 📝')}
                      </span>
                    </div>
                  )}
                </div>

                

                {/* Control Action Buttons Bar */}
                <div className="flex items-center justify-between gap-2 pt-0.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn-ghost py-2 px-3 text-xs font-black flex items-center gap-1.5 text-black cursor-pointer border border-slate-300 rounded-xl hover:bg-slate-100"
                      onClick={resetCanvas}
                    >
                      <RotateCcw size={14} /> {t('clearCanvas', 'Clear')}
                    </button>

                    <button
                      type="button"
                      className={`btn-ghost py-2 px-3 text-xs font-black flex items-center gap-1.5 cursor-pointer border rounded-xl transition ${
                        showGuide
                          ? 'bg-purple-100 border-purple-400 text-purple-900'
                          : 'border-slate-300 text-black hover:bg-slate-100'
                      }`}
                      onClick={() => setShowGuide(!showGuide)}
                    >
                      {showGuide ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span>{showGuide ? t('hideOutline', 'Hide Outline') : t('showOutline', 'Show Outline')}</span>
                    </button>
                  </div>

                  {/* Forward Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn-primary py-2.5 px-5 text-xs sm:text-sm font-black flex items-center gap-2 shadow-xl hover:scale-102 transition cursor-pointer"
                      onClick={handleNextStep}
                    >
                      {isStructured ? (
                        targetStage === 'letter' ? (
                          <>
                            <span>{`${t('nextWord', 'Next: Word')} (${currentAlphabetItem.word})`}</span>
                            <ArrowRight size={16} />
                          </>
                        ) : alphabetIndex < structuredLetters.length - 1 ? (
                          <>
                            <span>{`${t('nextAlphabet', 'Next Alphabet')} (${structuredLetters[alphabetIndex + 1]?.letter})`}</span>
                            <ArrowRight size={16} />
                          </>
                        ) : (
                          <>
                            <span>{t('completeJourney', 'Complete Journey')}</span>
                            <Check size={16} />
                          </>
                        )
                      ) : currentIndex < writingSet.length - 1 ? (
                        <>
                          <span>{t('nextWord', 'Next Challenge')}</span>
                          <ArrowRight size={16} />
                        </>
                      ) : (
                        <>
                          <span>{t('finishPractice', 'Finish Practice')}</span>
                          <Check size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 3. SESSION COMPLETED SCREEN */}
      {screen === 'completed' && (
        <motion.div
          className="w-full rounded-3xl p-4 sm:p-8 lg:p-10 shadow-2xl border-2 border-emerald-300/60 flex-1 flex flex-col justify-center h-full min-h-0 relative overflow-hidden"
          style={{
            boxShadow: '0 24px 48px -10px rgba(16, 185, 129, 0.25), 0 12px 28px -6px rgba(147, 51, 234, 0.18)',
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/assets/writing_completion_bird.mp4"
            autoPlay
            loop
            playsInline
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-end h-full max-w-6xl mx-auto w-full">
            {/* Glass Card Container positioned on the right side */}
            <div className="w-full md:w-[54%] lg:w-[50%] md:ml-auto glass-card rounded-3xl p-5 sm:p-7 border-2 border-white/90 shadow-2xl flex flex-col items-center space-y-4 backdrop-blur-md bg-white/92">
              <div className="space-y-1.5 max-w-md text-center">
                <h2 className="display text-2xl sm:text-3xl font-black text-black">
                  {isTamil
                    ? t('taWritingCompletedTitle', 'தமிழ் எழுத்துப் பயிற்சி நிறைவுற்றது! 🎉')
                    : isTelugu
                    ? t('teWritingCompletedTitle', 'తెలుగు రచన ప్రయాణం పూర్తయింది! 🎉')
                    : isMalayalam
                    ? t('mlWritingCompletedTitle', 'മലയാളം എഴുത്ത് യാത്ര വിജയകരമായി പൂർത്തിയായി! 🎉')
                    : isKannada
                    ? t('knWritingCompletedTitle', 'ಕನ್ನಡ ಬರವಣಿಗೆ ಪಯಣ ಪೂರ್ಣಗೊಂಡಿದೆ! 🎉')
                    : isHindi
                    ? t('hiWritingCompletedTitle', 'हिंदी लेखन यात्रा सफलतापूर्वक पूरी हुई! 🎉')
                    : isEnglish
                    ? t('azJourneyCompletedTitle', 'English A–Z Alphabet Journey Mastered!')
                    : t('sessionCompletedTitle') || 'Practice Completed!'}
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-700">
                  {isTamil
                    ? t('taWritingCompletedSub', 'வாழ்த்துகள்! நீங்கள் 30 தமிழ் எழுத்துக்களையும் சொற்களையும் துல்லியமாக எழுதி முடித்துவிட்டீர்கள்.')
                    : isTelugu
                    ? t('teWritingCompletedSub', 'అభినందనలు! మీరు అన్ని 51 తెలుగు అక్షరాలు మరియు ప్రాథమిక పదాలను విజయవంతంగా పూర్తి చేశారు.')
                    : isMalayalam
                    ? t('mlWritingCompletedSub', 'അഭിനന്ദനങ്ങൾ! നിങ്ങൾ 51 മലയാളം അക്ഷരങ്ങളും അടിസ്ഥാന വാക്കുകളും പൂർത്തിയാക്കി.')
                    : isKannada
                    ? t('knWritingCompletedSub', 'ಅಭಿನಂದನೆಗಳು! ನೀವು ಎಲ್ಲಾ 51 ಕನ್ನಡ ಅಕ್ಷರಗಳು ಮತ್ತು ಮೂಲಭೂತ ಪದಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಳಿಸಿದ್ದೀರಿ.')
                    : isHindi
                    ? t('hiWritingCompletedSub', 'बधाई हो! आपने सभी 49 हिंदी अक्षर और बुनियादी शब्द सफलतापूर्वक पूरे कर लिए हैं।')
                    : isEnglish
                    ? t('azJourneyCompletedSub', 'Congratulations! You have completed all 26 alphabets and words with high handwriting accuracy. Your English Alphabet Master badge is unlocked!')
                    : t('sessionCompletedSub') || 'Great handwriting practice! Your scores have been saved to your profile.'}
                </p>
              </div>

              {/* Reward Badges Box */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full text-center">
                <div className="rounded-2xl bg-white/95 p-3 border-2 border-sky-300/80 shadow-md flex flex-col items-center justify-center">
                  <Star className="text-amber-500 mb-1" size={22} />
                  <span className="text-base sm:text-lg font-black text-black">+{totalXpEarned || 500} XP</span>
                  <span className="text-[10px] font-black uppercase text-slate-500 block">{t('totalXpTitle', 'Total XP')}</span>
                </div>
                <div className="rounded-2xl bg-white/95 p-3 border-2 border-emerald-300/80 shadow-md flex flex-col items-center justify-center">
                  <Gem className="text-emerald-500 mb-1" size={22} />
                  <span className="text-base sm:text-lg font-black text-black">+{totalGemsEarned || 50} Gems</span>
                  <span className="text-[10px] font-black uppercase text-slate-500 block">{t('gems', 'Gems')}</span>
                </div>
                <div className="rounded-2xl bg-white/95 p-3 border-2 border-purple-300/80 shadow-md flex flex-col items-center justify-center">
                  <Award className="text-amber-500 mb-1" size={22} />
                  <span className="text-xs sm:text-sm font-black text-black">{isTamil ? t('taWritingMasterBadge', 'தமிழ் மாஸ்டர்') : isTelugu ? t('teWritingMasterBadge', 'తెలుగు మాస్టర్') : isMalayalam ? t('mlWritingMasterBadge', 'മലയാളം മാസ്റ്റർ') : isKannada ? t('knWritingMasterBadge', 'ಕನ್ನಡ ಮಾಸ್ಟರ್') : isHindi ? t('hiWritingMasterBadge', 'हिंदी मास्टर') : isEnglish ? t('azMasterBadge', 'A–Z Master') : t('badge', 'Badge')}</span>
                  <span className="text-[10px] font-black uppercase text-slate-500 block">{t('badge', 'Badge')}</span>
                </div>
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1 w-full">
                <button
                  type="button"
                  className="btn-secondary px-6 py-2.5 rounded-2xl font-black text-xs sm:text-sm cursor-pointer shadow-md"
                  onClick={() => {
                    setScreen('welcome');
                    setAlphabetIndex(0);
                    setCurrentIndex(0);
                    setTargetStage('letter');
                    setStepFlow('listen');
                  }}
                >
                  {t('practiceAgain', 'Practice Again ✍️')}
                </button>
                <button
                  type="button"
                  className="btn-primary px-8 py-2.5 rounded-2xl font-black text-xs sm:text-sm cursor-pointer shadow-xl"
                  onClick={() => navigate('/dashboard')}
                >
                  {t('goToDashboard', 'Go to Dashboard ➔')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
