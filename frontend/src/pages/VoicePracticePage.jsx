import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Star,
  Gem,
  Award,
  Headphones,
  Languages,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../contexts/AuthContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { PageTitle, ProgressBar } from '../components/ui';
import { GuideBird } from '../components/RedBird';
import {
  VOICE_ALPHABETS,
  VOICE_WORDS,
  VOICE_SENTENCES_EN,
  TAMIL_VOICE_ALPHABETS,
  TAMIL_VOICE_WORDS,
  TAMIL_VOICE_SENTENCES,
  TELUGU_VOICE_ALPHABETS,
  TELUGU_VOICE_WORDS,
  TELUGU_VOICE_SENTENCES,
  MALAYALAM_VOICE_ALPHABETS,
  MALAYALAM_VOICE_WORDS,
  MALAYALAM_VOICE_SENTENCES,
  KANNADA_VOICE_ALPHABETS,
  KANNADA_VOICE_WORDS,
  KANNADA_VOICE_SENTENCES,
  HINDI_VOICE_ALPHABETS,
  HINDI_VOICE_WORDS,
  HINDI_VOICE_SENTENCES,
  INDIC_VOICE_SENTENCES,
  getVoicePracticeData,
} from '../data/voicePracticeData';
import { gradePronunciation, speakText, stopSpeech } from '../audio';
import api from '../api/client';

export default function VoicePracticePage() {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  const uiLanguage = user?.uiLanguage || user?.preferred_language || i18n.language || 'en';
  const currentLang = user?.learningLanguage || user?.preferred_language || 'en';
  const isEnglish = currentLang === 'en';
  const isTamil = currentLang === 'ta';
  const isTelugu = currentLang === 'te';
  const isMalayalam = currentLang === 'ml';
  const isKannada = currentLang === 'kn';
  const isHindi = currentLang === 'hi';
  const isStructured = isEnglish || isTamil || isTelugu || isMalayalam || isKannada || isHindi;

  // Screen: 'welcome' | 'practice' | 'completed'
  const [screen, setScreen] = useState('welcome');

  // 2-Level progression: 'word' | 'sentence'
  const [voiceLevel, setVoiceLevel] = useState('word');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Scores & feedback tracking
  const [results, setResults] = useState({});
  const [gradedResult, setGradedResult] = useState(null);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [totalGemsEarned, setTotalGemsEarned] = useState(0);
  const practiceSessionId = useRef(crypto.randomUUID());
  const lastEvaluatedRef = useRef({ text: '', itemKey: '' });
  const awardedItemsRef = useRef(new Set());

  // Active items list based on language and level
  const activeItems = useMemo(() => {
    if (isEnglish) {
      if (voiceLevel === 'word') return VOICE_WORDS;
      return VOICE_SENTENCES_EN;
    }
    if (isTamil) {
      if (voiceLevel === 'word') return TAMIL_VOICE_WORDS;
      return TAMIL_VOICE_SENTENCES;
    }
    if (isTelugu) {
      if (voiceLevel === 'word') return TELUGU_VOICE_WORDS;
      return TELUGU_VOICE_SENTENCES;
    }
    if (isMalayalam) {
      if (voiceLevel === 'word') return MALAYALAM_VOICE_WORDS;
      return MALAYALAM_VOICE_SENTENCES;
    }
    if (isKannada) {
      if (voiceLevel === 'word') return KANNADA_VOICE_WORDS;
      return KANNADA_VOICE_SENTENCES;
    }
    if (isHindi) {
      if (voiceLevel === 'word') return HINDI_VOICE_WORDS;
      return HINDI_VOICE_SENTENCES;
    }
    return INDIC_VOICE_SENTENCES[currentLang] || INDIC_VOICE_SENTENCES.hi;
  }, [isEnglish, isTamil, isTelugu, isMalayalam, isKannada, isHindi, voiceLevel, currentLang]);

  const currentItem = activeItems[currentIndex] || activeItems[0];
  const targetText = isStructured
    ? voiceLevel === 'word'
      ? currentItem?.word || ''
      : currentItem?.text || ''
    : currentItem?.text || '';

  const {
    listening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    audioLevel,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition(currentLang);

  const combinedText = (transcript + (interimTranscript ? ` ${interimTranscript}` : '')).trim();

  // Reset transcript and stop speech on item change
  useEffect(() => {
    if (screen !== 'practice') return;
    setGradedResult(null);
    lastEvaluatedRef.current = { text: '', itemKey: '' };
    resetTranscript();
    stopSpeech();
  }, [screen, currentIndex, voiceLevel, currentLang, resetTranscript]);

  // Evaluate speech when user finishes speaking (once per unique utterance)
  useEffect(() => {
    if (!listening && transcript && currentItem) {
      const itemKey = `${voiceLevel}_${currentIndex}`;
      if (
        lastEvaluatedRef.current.text === transcript &&
        lastEvaluatedRef.current.itemKey === itemKey
      ) {
        return;
      }
      lastEvaluatedRef.current = { text: transcript, itemKey };

      const variants = [];
      const res = gradePronunciation(targetText, transcript, variants);
      setGradedResult(res);

      if (res.score >= 70) {
        setResults((prev) => ({ ...prev, [itemKey]: res }));

        // Award reward once per item key
        if (!awardedItemsRef.current.has(itemKey)) {
          awardedItemsRef.current.add(itemKey);
          const earnedXp = isStructured ? (voiceLevel === 'word' ? 15 : 25) : 50;
          const earnedGems = isStructured ? 1 : 2;
          setTotalXpEarned((prev) => prev + earnedXp);
          setTotalGemsEarned((prev) => prev + earnedGems);

          api.awardPracticeReward(
            `voice:${practiceSessionId.current}:${currentLang}:${voiceLevel}:${currentIndex}`,
            'voice_sentence',
          )
            .then((reward) => {
              if (reward?.user) refreshUser(reward.user);
            })
            .catch(() => {});
        }

        speakText(t('correctCheer', "Woohoo! That's correct!"), uiLanguage, false, true).catch(() => {});
        confetti({ particleCount: 35, spread: 55, origin: { y: 0.6 } });
      } else if (res.score > 0) {
        speakText(t('tryAgainVoice', 'Not quite, try again!'), uiLanguage, false, true).catch(() => {});
      }
    }
  }, [listening, transcript, targetText, currentItem, currentLang, isStructured, voiceLevel, currentIndex, uiLanguage]);

  const handleListenSample = () => {
    stopSpeech();
    speakText(targetText, currentLang).catch(() => {});
  };

  const toggleListen = () => {
    stopSpeech();
    if (listening) {
      stopListening();
    } else {
      setGradedResult(null);
      resetTranscript();
      startListening(targetText);
    }
  };

  const handleNext = () => {
    if (currentIndex < activeItems.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else if (isStructured) {
      if (voiceLevel === 'word') {
        setVoiceLevel('sentence');
        setCurrentIndex(0);
      } else {
        setScreen('completed');
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
      }
    } else {
      setScreen('completed');
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleLevelChange = (level) => {
    setVoiceLevel(level);
    setCurrentIndex(0);
    setGradedResult(null);
    resetTranscript();
    stopSpeech();
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between gap-2 p-1 sm:p-1.5 pb-2 h-[calc(100vh-110px)] min-h-0">
      {/* Top Banner Guide */}
      <div className="flex items-center justify-end shrink-0">
        <GuideBird
          key={`${screen}-${voiceLevel}-${currentIndex}-${currentLang}`}
          message={
            screen === 'welcome'
              ? t('birdGuideVoicePractice', 'Listen carefully to the native sound, then tap the mic and speak out loud!')
              : screen === 'practice'
              ? gradedResult?.score >= 70
                ? t('correctCheer', "Woohoo! That's correct!")
                : gradedResult && gradedResult.score < 70
                ? t('tryAgainVoice', 'Not quite, try again!')
                : t('birdGuideVoicePractice', 'Listen carefully to the native sound, then tap the mic and speak out loud!')
              : t('sessionCompletedTitle', 'Practice Completed!')
          }
          mood={screen === 'completed' ? 'cheer' : gradedResult?.score >= 70 ? 'cheer' : 'happy'}
          size={42}
        />
      </div>

      {/* 1. WELCOME INITIAL SCREEN */}
      {screen === 'welcome' && (
        <motion.div
          className="w-full rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl border-2 border-indigo-300/40 flex-1 flex flex-col justify-center h-full min-h-0 relative overflow-hidden"
          style={{
            boxShadow: '0 24px 48px -10px rgba(99, 102, 241, 0.18), 0 12px 28px -6px rgba(16, 185, 129, 0.16)',
          }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <video
            className="absolute inset-0 z-0 h-full w-full object-cover"
            src="/assets/voice_landing.mp4?v=1"
            autoPlay
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-end h-full max-w-6xl mx-auto w-full">
            {/* Right Content & Actions Column */}
            <div className="w-full md:w-[54%] lg:w-[50%] md:ml-auto space-y-3.5 sm:space-y-4.5 text-center md:text-left">
              <div className="space-y-2">
                <h2 className="display text-2xl sm:text-3xl lg:text-4xl font-black text-black leading-tight">
                  {isTamil
                    ? t('taVoiceJourneyTitle', 'தமிழ் குரல் உச்சரிப்புப் பயிற்சி')
                    : isTelugu
                    ? t('teVoiceJourneyTitle', 'తెలుగు వాయిస్ ఉచ్ఛారణ సాధన')
                    : isMalayalam
                    ? t('mlVoiceJourneyTitle', 'മലയാളം വോയ്‌സ് ഉച്ചാരണ പരിശീലനം')
                    : isKannada
                    ? t('knVoiceJourneyTitle', 'ಕನ್ನಡ ಧ್ವನಿ ಉಚ್ಚಾರಣೆ ಪ್ರಾವೀಣ್ಯತೆ')
                    : isHindi
                    ? t('hiVoiceJourneyTitle', 'हिंदी वॉइस उच्चारण अभ्यास')
                    : isEnglish
                    ? t('voiceJourneyTitle', 'English Voice Pronunciation Mastery')
                    : t('voicePractice', 'Voice Practice')}
                </h2>

                <p className="text-xs sm:text-sm font-bold text-black/85 leading-relaxed max-w-md">
                  {isTamil
                    ? t('taVoiceJourneySub', '3-நிலை உச்சரிப்புப் பயணம்: நிலை 1 எழுத்து ஒலிகள் (உயிரெழுத்து + மெய்யெழுத்து), நிலை 2 சொற்கள், மற்றும் நிலை 3 வாக்கியங்கள்.')
                    : isTelugu
                    ? t('teVoiceJourneySub', '3-స్థాయిల ఉచ్ఛారణ సాధన: స్థాయి 1 అక్షరాల శబ్దాలు (అచ్చులు + హల్లులు), స్థాయి 2 ప్రాథమిక పదాలు, మరియు స్థాయి 3 వాక్యాలు.')
                    : isMalayalam
                    ? t('mlVoiceJourneySub', '3-ഘട്ട ഉച്ചാരണ യാത്ര: ലെവൽ 1 അക്ഷരങ്ങൾ (15 സ്വരാക്ഷരങ്ങൾ + 36 വ്യഞ്ജനാക്ഷരങ്ങൾ), ലെവൽ 2 വാക്കുകൾ (10 അടിസ്ഥാന വാക്കുകൾ), ലെവൽ 3 വാക്യങ്ങൾ (10 പരിശീലന വാക്യങ്ങൾ).')
                    : isKannada
                    ? t('knVoiceJourneySub', '2-ಹಂತದ ಉಚ್ಚಾರಣಾ ಪಯಣ: ಹಂತ 1 ಪದಗಳು (10 ಮೂಲಭೂತ ಪದಗಳು), ಮತ್ತು ಹಂತ 2 ವಾಕ್ಯಗಳು (10 ಅಭ್ಯಾಸ ವಾಕ್ಯಗಳು).')
                    : isHindi
                    ? t('hiVoiceJourneySub', '2-स्तरीय उच्चारण यात्रा: स्तर 1 शब्द (10 बुनियादी शब्द), और स्तर 2 वाक्य (10 अभ्यास वाक्य)।')
                    : isEnglish
                    ? t('voiceJourneySub', 'Follow the 2-level pronunciation journey: Level 1 Vocabulary words, and Level 2 Conversational sentences.')
                    : t('voicePracticeSub', 'Practice speaking everyday sentences out loud. Complete all sentences to earn XP, Gems, and improve your speaking confidence.')}
                </p>
              </div>

              {/* Language selection info pill */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="text-xs sm:text-sm font-black text-black uppercase tracking-wider">
                  {t('selectedLanguage', 'Selected Language')}:
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 text-black font-black text-xs sm:text-sm border-2 border-indigo-400/80 shadow-xs backdrop-blur-sm">
                  {isTamil ? 'TAMIL (தமிழ்)' : isTelugu ? 'TELUGU (తెలుగు)' : isMalayalam ? 'MALAYALAM (മലയാളം)' : isKannada ? 'KANNADA (ಕನ್ನಡ)' : isHindi ? 'HINDI (हिंदी)' : currentLang.toUpperCase()}
                </span>
              </div>

              {/* Rewards Showcase Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div
                  className="rounded-2xl p-2.5 sm:p-3 border-2 border-sky-300/80 flex flex-col items-center text-center shadow-sm backdrop-blur-md"
                  style={{ background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.92) 0%, rgba(224, 242, 254, 0.85) 100%)' }}
                >
                  <Star className="text-amber-500 mb-1" size={20} />
                  <span className="text-xs sm:text-sm font-black text-black">{isStructured ? '+15 / +25 XP' : '+50 XP'}</span>
                  <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-black/70 mt-0.5">
                    {t('perStageReward', 'Per Stage')}
                  </span>
                </div>
                <div
                  className="rounded-2xl p-2.5 sm:p-3 border-2 border-emerald-300/80 flex flex-col items-center text-center shadow-sm backdrop-blur-md"
                  style={{ background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.92) 0%, rgba(236, 253, 245, 0.85) 100%)' }}
                >
                  <Gem className="text-amber-500 mb-1" size={20} />
                  <span className="text-xs sm:text-sm font-black text-black">{isStructured ? '+100 Gems' : '+5 Gems'}</span>
                  <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-black/70 mt-0.5">
                    {t('fullCompletionReward', 'Full Completion')}
                  </span>
                </div>
                <div
                  className="rounded-2xl p-2.5 sm:p-3 border-2 border-purple-300/80 flex flex-col items-center text-center shadow-sm backdrop-blur-md"
                  style={{ background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.92) 0%, rgba(243, 232, 255, 0.85) 100%)' }}
                >
                  <Award className="text-amber-500 mb-1" size={20} />
                  <span className="text-xs sm:text-sm font-black text-black">{isKannada ? t('knVoiceMasterBadge', 'ಕನ್ನಡ ಧ್ವನಿ ಮಾಸ್ಟರ್') : isHindi ? t('hiVoiceMasterBadge', 'हिंदी वॉइस मास्टर') : t('badgeVoiceMaster', 'Voice Master')}</span>
                  <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-black/70 mt-0.5">
                    {t('verifiedBadge', 'Verified Badge')}
                  </span>
                </div>
              </div>

              {/* Start Speaking CTA */}
              <div className="pt-1">
                <button
                  type="button"
                  className="btn-primary w-full sm:w-auto px-8 py-3 text-sm sm:text-base font-black flex items-center justify-center gap-2.5 shadow-xl hover:scale-102 transition-all cursor-pointer"
                  onClick={() => {
                    practiceSessionId.current = crypto.randomUUID();
                    setScreen('practice');
                    setVoiceLevel('word');
                    setCurrentIndex(0);
                    setResults({});
                    setGradedResult(null);
                    resetTranscript();
                  }}
                >
                  <Mic size={18} />
                  <span>{isHindi ? t('startHindiVoice', 'हिंदी वॉइस यात्रा शुरू करें 🚀') : isKannada ? t('startKannadaVoice', 'ಕನ್ನಡ ಧ್ವನಿ ಪಯಣ ಪ್ರಾರಂಭಿಸಿ 🚀') : isMalayalam ? t('startMalayalamVoice', 'മലയാളം വോയ്‌സ് യാത്ര ആരംഭിക്കുക 🚀') : isStructured ? t('startVoiceJourney', 'Start Voice Journey 🚀') : t('startVoicePractice', 'Start Voice Practice')}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. INTERACTIVE PRACTICE SCREEN (2-Column Filled Layout Matching Writing Practice) */}
      {screen === 'practice' && (
        <motion.div
          className="glass-card rounded-3xl p-3.5 sm:p-4 shadow-xl border-2 border-[#032038]/20 flex-1 flex flex-col justify-between space-y-2 h-full min-h-0 overflow-hidden"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          key={`${voiceLevel}_${currentIndex}_${currentLang}`}
        >
          {/* Top Roadmap / Quick Navigation Tabs (For Structured 2-Levels: Words -> Sentences) */}
          {isStructured && (
            <div className="shrink-0 space-y-1.5 border-b border-black/10 pb-2">
              <div className="flex items-center justify-between text-xs font-black text-black">
                <span className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-900 px-3 py-0.5 font-black text-[11px] border border-indigo-300 shadow-xs">
                  {voiceLevel === 'word' &&
                    t('wordSoundHeader', { word: currentItem?.word, current: currentIndex + 1, total: activeItems.length, defaultValue: `Word ${currentItem?.word} (${currentIndex + 1} of ${activeItems.length}): Vocabulary Sound` })}
                  {voiceLevel === 'sentence' &&
                    t('sentenceFluencyHeader', { current: currentIndex + 1, total: activeItems.length, defaultValue: `Sentence ${currentIndex + 1} of ${activeItems.length}: Fluency Practice` })}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-black">
                    {currentIndex + 1} / {activeItems.length} {t('completed', 'Done')}
                  </span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-900 border border-amber-400/40">
                    +{totalXpEarned} XP
                  </span>
                </div>
              </div>

              {/* 2 Level Stepper Tabs (Words -> Sentences) */}
              <div className="grid grid-cols-2 gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleLevelChange('word')}
                  className={`py-2 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                    voiceLevel === 'word'
                      ? 'btn-primary text-black shadow-md border-amber-500/80 scale-101'
                      : 'bg-white/80 text-black border-slate-300 hover:bg-white'
                  }`}
                >
                  <Volume2 size={15} />
                  <span>{t('voiceLevel2Tab', { count: isEnglish ? 26 : 10, defaultValue: `1. Words (${isEnglish ? 26 : 10}) 🗣️` })}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLevelChange('sentence')}
                  className={`py-2 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                    voiceLevel === 'sentence'
                      ? 'btn-primary text-black shadow-md border-amber-500/80 scale-101'
                      : 'bg-white/80 text-black border-slate-300 hover:bg-white'
                  }`}
                >
                  <Languages size={15} />
                  <span>{t('voiceLevel3Tab', { count: 10, defaultValue: '2. Sentences (10) 💬' })}</span>
                </button>
              </div>

              {/* Quick Navigation Carousel for Word level */}
              {voiceLevel === 'word' && (
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar scroll-smooth">
                  {activeItems.map((item, idx) => {
                    const isCurrent = currentIndex === idx;
                    const itemResult = results[`${voiceLevel}_${idx}`];
                    const isPassed = itemResult?.score >= 70;

                    let btnCls = 'shrink-0 px-2.5 h-8 rounded-xl font-black text-xs flex items-center justify-center transition-all border-2 cursor-pointer min-w-[32px]';
                    if (isCurrent) {
                      btnCls += ' bg-indigo-600 text-white border-indigo-700 shadow-md scale-110 ring-2 ring-indigo-400';
                    } else if (isPassed) {
                      btnCls += ' bg-emerald-100 text-emerald-800 border-emerald-400 hover:bg-emerald-200';
                    } else {
                      btnCls += ' bg-white text-black border-slate-300 hover:bg-slate-100';
                    }

                    const displayLabel = `${item.word || item.text || idx + 1} ${item.emoji || ''}`;

                    return (
                      <button
                        key={`${item.word || item.id || idx}_${idx}`}
                        type="button"
                        onClick={() => {
                          setCurrentIndex(idx);
                          setGradedResult(null);
                          resetTranscript();
                        }}
                        className={btnCls}
                        title={item.word || item.text || `Item ${idx + 1}`}
                      >
                        {isPassed ? (
                          <Star size={13} className="text-emerald-700 fill-emerald-500" />
                        ) : (
                          displayLabel
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Non-Structured Header */}
          {!isStructured && (
            <div className="flex items-center justify-between text-xs font-black text-black border-b border-black/10 pb-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-0.5 text-black uppercase tracking-wider font-black border border-black/20 text-[11px]">
                <Sparkles size={12} />
                Sentence {currentIndex + 1} of {activeItems.length}
              </span>
              <span className="text-black font-black text-xs">
                +{totalXpEarned} XP
              </span>
            </div>
          )}

          {/* 2-Column Balanced Layout */}
          <div className="grid gap-4 md:grid-cols-12 flex-1 h-full items-stretch min-h-0 py-1">
            {/* Left Column (5/12): Target Information Card ABOVE + Picture Box BELOW */}
            <div className="md:col-span-5 flex flex-col h-full gap-2.5 min-h-0 justify-between">
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-indigo-900 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-300 self-start shrink-0">
                <Mic size={12} />
                <span>
                  {voiceLevel === 'word'
                    ? `${t('level1Badge', 'Level 1 • Word Pronunciation')} "${currentItem?.word || ''}"`
                    : t('level2Badge', 'Level 2 • Sentence Fluency')}
                </span>
              </div>

              {/* Target Text / Question Card placed ABOVE the picture */}
              <div className="rounded-2xl bg-white/95 p-3 sm:p-4 border-2 border-black/15 shadow-xs flex items-center justify-between gap-3 shrink-0">
                <div className="text-left flex-1 min-w-0">
                  <span className="text-[10px] font-black uppercase text-slate-500 block mb-0.5">
                    {t('targetToSay', 'Say this out loud:')}
                  </span>
                  <h4 className="display text-base sm:text-lg md:text-xl font-black text-black leading-snug break-words">
                    {targetText}
                  </h4>
                </div>
                <button
                  type="button"
                  className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-black/5 hover:bg-black/10 text-black transition cursor-pointer border border-black/15 flex items-center gap-1.5 text-xs font-black shrink-0"
                  onClick={handleListenSample}
                  title="Listen pronunciation"
                >
                  <Volume2 size={18} className="text-indigo-600" />
                  <span>{t('listenSampleVoice', 'Listen')}</span>
                </button>
              </div>

              {/* 3D Animated Emoji Picture Box placed BELOW the question card */}
              <div className="relative flex-1 w-full rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[150px] bg-gradient-to-br from-[#fdfbf7] via-[#f8f5ee] to-[#f3ece0] border-2 border-black/15 items-center justify-center">
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
                  <span className="text-7xl sm:text-8xl md:text-9xl filter drop-shadow-xl select-none leading-none">
                    {currentItem?.emoji || '🗣️'}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-700 mt-2 tracking-wider text-center max-w-[90%]">
                    {isStructured && voiceLevel === 'word' && (
                      <>
                        {currentItem?.word || ''}{' '}
                        {uiLanguage !== currentLang && currentItem?.translations?.[uiLanguage]
                          ? `(${currentItem.translations[uiLanguage]})`
                          : ''}
                      </>
                    )}
                    {isStructured && voiceLevel === 'sentence' && (
                      <>
                        {uiLanguage !== currentLang && currentItem?.translations?.[uiLanguage]
                          ? `${currentItem.translations[uiLanguage]}`
                          : ''}
                      </>
                    )}
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Right Column (7/12): Microphone Speaking & Accuracy Feedback */}
            <div className="md:col-span-7 flex flex-col justify-between h-full space-y-2 min-h-0">
              <div className="relative rounded-2xl bg-white border-2 border-[#032038]/25 shadow-inner p-4 flex flex-col items-center justify-center text-center flex-1 min-h-[220px]">
                {!isSupported ? (
                  <div className="rounded-2xl bg-amber-500/20 p-3 text-center text-xs font-black text-amber-900 border-2 border-amber-500/40">
                    {t('micNotSupported', 'Browser speech recognition is not supported in this browser. Please use Chrome or Edge.')}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 w-full max-w-md">
                    {/* Big Mic Button with Pulsing Wave */}
                    <div className="relative flex items-center justify-center">
                      {listening && (
                        <motion.div
                          className="absolute rounded-full bg-red-400/30 -inset-4"
                          animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0.2, 0.7] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={toggleListen}
                        className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center shadow-xl transition-all cursor-pointer ${
                          listening
                            ? 'bg-red-500 text-white scale-105 ring-4 ring-red-300 animate-pulse'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105 ring-4 ring-indigo-200'
                        }`}
                      >
                        {listening ? <MicOff size={32} /> : <Mic size={32} />}
                      </button>
                    </div>

                    <span className="text-xs sm:text-sm font-black text-black">
                      {listening
                        ? t('listeningMic', 'Listening... Speak now!')
                        : t('tapToSpeak', 'Tap mic to start speaking')}
                    </span>

                    {error && (
                      <div className="w-full rounded-2xl bg-red-50 border border-red-200 p-2.5 text-xs font-bold text-red-700 shadow-xs">
                        {error}
                      </div>
                    )}
                    {/* Spoken Transcript Bubble */}
                    {combinedText && (
                      <div className="w-full rounded-2xl bg-slate-50 border border-slate-200 p-2.5 text-xs sm:text-sm font-black text-slate-800 shadow-xs max-h-16 overflow-y-auto">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-0.5">
                          {t('heardYouSay', 'Heard you say:')}
                        </span>
                        "{combinedText}"
                      </div>
                    )}

                    {/* Pronunciation Feedback Chip */}
                    {gradedResult && (
                      <div
                        className={`w-full rounded-2xl p-2.5 text-xs font-black border flex items-center justify-between gap-2 shadow-sm ${
                          gradedResult.score >= 70
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : 'bg-amber-50 text-amber-900 border-amber-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {gradedResult.score >= 70 ? (
                            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle size={18} className="text-amber-600 shrink-0" />
                          )}
                          <span>
                            {gradedResult.score >= 70
                              ? t('greatPronunciation', 'Great Pronunciation!')
                              : t('practiceMoreVoice', 'Keep practicing, try again!')}
                          </span>
                        </div>
                        <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white/80 border border-black/10">
                          {gradedResult.score}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Navigation Buttons */}
              <div className="flex items-center justify-between gap-2 shrink-0 pt-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="btn-secondary px-4 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>{t('previous', 'Previous')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary px-6 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:scale-102 transition cursor-pointer"
                >
                  <span>
                    {currentIndex < activeItems.length - 1
                      ? t('next', 'Next')
                      : isStructured && voiceLevel !== 'sentence'
                      ? t('goToSentencesLevel', 'Next Level: Sentences 💬')
                      : t('finishPractice', 'Finish Practice 🎉')}
                  </span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. SESSION COMPLETED SCREEN */}
      {screen === 'completed' && (
        <motion.div
          className="glass-card rounded-3xl p-6 sm:p-10 shadow-2xl border-2 border-emerald-300/40 text-center flex-1 flex flex-col items-center justify-center space-y-4 max-w-2xl mx-auto w-full h-full min-h-0"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-300 flex items-center justify-center text-4xl shadow-lg">
            🎉
          </div>

          <div className="space-y-1">
            <h2 className="display text-2xl sm:text-3xl font-black text-black">
              {t('voiceJourneyCompletedTitle', 'Voice Practice Completed! 🌟')}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-600 max-w-md mx-auto">
              {t('voiceJourneyCompletedSub', 'Awesome job! You practiced native pronunciation and expanded your speaking confidence.')}
            </p>
          </div>

          {/* Reward Summary Pill */}
          <div className="flex items-center justify-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 font-black text-sm shadow-xs">
              <Star size={18} className="text-amber-500 fill-amber-400" />
              <span>+{totalXpEarned} XP</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 font-black text-sm shadow-xs">
              <Gem size={18} className="text-emerald-500 fill-emerald-400" />
              <span>+{totalGemsEarned} Gems</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setScreen('welcome');
                setVoiceLevel('word');
                setCurrentIndex(0);
                setResults({});
                setGradedResult(null);
              }}
              className="btn-secondary px-6 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw size={16} />
              <span>{t('practiceAgain', 'Practice Again')}</span>
            </button>
            <button
              type="button"
              onClick={() => window.location.href = '/courses'}
              className="btn-primary px-8 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>{t('goToCourses', 'Go to Courses')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
