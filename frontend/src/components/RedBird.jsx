import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { speakText, stopSpeech } from '../audio';
import { useSpeaking } from '../hooks/useSpeaking';
import { useAuth } from '../contexts/AuthContext';

export const BIRD_SKINS = {
  classic: {
    id: 'classic',
    name: 'Classic RedBird',
    nameKey: 'skinClassic',
    price: 0,
    bodyGrad: { start: '#FF6655', mid: '#EF333A', end: '#A90F2B' },
    wingGrad: { start: '#FF8A62', end: '#B51635' },
    wingStroke: '#B51635',
    tuftBack: '#B81331',
    tuftFront: '#F74442',
    eyebrow: '#7B1730',
    blush: '#F46D6C',
    shadowColor: '#4C0A1B',
  },
  blue: {
    id: 'blue',
    name: 'Blue Bird',
    nameKey: 'skinBlue',
    price: 100,
    bodyGrad: { start: '#60A5FA', mid: '#2563EB', end: '#1E40AF' },
    wingGrad: { start: '#93C5FD', end: '#1D4ED8' },
    wingStroke: '#1D4ED8',
    tuftBack: '#1E3A8A',
    tuftFront: '#3B82F6',
    eyebrow: '#1E3A8A',
    blush: '#93C5FD',
    shadowColor: '#0F172A',
  },
  green: {
    id: 'green',
    name: 'Green Bird',
    nameKey: 'skinGreen',
    price: 100,
    bodyGrad: { start: '#4ADE80', mid: '#16A34A', end: '#15803D' },
    wingGrad: { start: '#86EFAC', end: '#166534' },
    wingStroke: '#166534',
    tuftBack: '#14532D',
    tuftFront: '#22C55E',
    eyebrow: '#14532D',
    blush: '#86EFAC',
    shadowColor: '#052E16',
  },
  golden: {
    id: 'golden',
    name: 'Golden Bird',
    nameKey: 'skinGolden',
    price: 300,
    bodyGrad: { start: '#FDE047', mid: '#EAB308', end: '#B45309' },
    wingGrad: { start: '#FEF08A', end: '#CA8A04' },
    wingStroke: '#B45309',
    tuftBack: '#92400E',
    tuftFront: '#FACC15',
    eyebrow: '#78350F',
    blush: '#FDE68A',
    shadowColor: '#451A03',
  },
};

/** LiteraAI Bird — friendly literacy guide mascot with unlockable color skins */
export function RedBird({ size = 120, mood = 'happy', className = '', speaking: speakingProp, flying = false, teacher = false, skin: skinProp }) {
  const autoSpeaking = useSpeaking();
  let authContextUser = null;
  try {
    const auth = useAuth();
    authContextUser = auth?.user;
  } catch (_) {}

  const activeSkinKey = skinProp || authContextUser?.equipped_skin || authContextUser?.birdSkin || 'classic';
  const skin = BIRD_SKINS[activeSkinKey] || BIRD_SKINS.classic;

  const speaking = speakingProp !== undefined ? speakingProp : autoSpeaking;
  const brow = mood === 'think' ? -6 : mood === 'cheer' ? 2 : 4;
  const waving = mood !== 'idle';

  const bodyGradId = `birdBody_${skin.id}`;
  const wingGradId = `birdWing_${skin.id}`;
  const shadowId = `birdShadow_${skin.id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label={`LiteraAI ${skin.name}`}
    >
      <defs>
        <linearGradient id={bodyGradId} x1="42" y1="44" x2="155" y2="171" gradientUnits="userSpaceOnUse">
          <stop stopColor={skin.bodyGrad.start} />
          <stop offset="0.52" stopColor={skin.bodyGrad.mid} />
          <stop offset="1" stopColor={skin.bodyGrad.end} />
        </linearGradient>
        <linearGradient id={wingGradId} x1="40" y1="78" x2="76" y2="148" gradientUnits="userSpaceOnUse">
          <stop stopColor={skin.wingGrad.start} />
          <stop offset="1" stopColor={skin.wingGrad.end} />
        </linearGradient>
        <linearGradient id="birdBellyShared" x1="100" y1="119" x2="100" y2="169" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF4CE" />
          <stop offset="1" stopColor="#FFC36D" />
        </linearGradient>
        <linearGradient id="birdBeakShared" x1="100" y1="111" x2="100" y2="142" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF16D" />
          <stop offset="1" stopColor="#FF9B19" />
        </linearGradient>
        <filter id={shadowId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="5" stdDeviation="3" floodColor={skin.shadowColor} floodOpacity=".26" />
        </filter>
      </defs>
      <ellipse cx="100" cy="181" rx="53" ry="9" fill="rgba(3,32,56,0.18)" />
      <path d="M73 62 Q82 31 100 49 Q118 31 127 62" fill={skin.tuftBack} />
      <path d="M79 61 Q91 26 100 53 Q109 26 121 61" fill={skin.tuftFront} />
      <g filter={`url(#${shadowId})`}>
        <path d="M42 112 Q42 65 79 52 Q100 39 122 52 Q159 65 159 112 L151 150 Q138 174 100 177 Q62 174 49 150 Z" fill={`url(#${bodyGradId})`} />
        {flying ? (
          <>
            <motion.path d="M61 113 Q40 82 22 70 Q18 101 39 130 Q48 140 64 136 Z" fill={`url(#${wingGradId})`} stroke={skin.wingStroke} strokeWidth="2" style={{ transformBox: 'fill-box', transformOrigin: '100% 66%' }} animate={{ rotate: [-8, -40, -8] }} transition={{ duration: 0.34, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.path d="M139 113 Q160 82 178 70 Q182 101 161 130 Q152 140 136 136 Z" fill={`url(#${wingGradId})`} stroke={skin.wingStroke} strokeWidth="2" style={{ transformBox: 'fill-box', transformOrigin: '0% 66%' }} animate={{ rotate: [8, 40, 8] }} transition={{ duration: 0.34, repeat: Infinity, ease: 'easeInOut' }} />
          </>
        ) : (
          <>
            {waving ? (
              <motion.path
                d="M58 112 Q32 92 27 67 Q6 83 19 111 Q27 131 48 139 Z"
                fill={`url(#${wingGradId})`}
                stroke={skin.wingStroke}
                strokeWidth="2"
                style={{ transformBox: 'fill-box', transformOrigin: '92% 78%' }}
                animate={{ rotate: [0, -25, -8, -25, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              />
            ) : (
              <path d="M61 113 Q43 92 33 113 Q31 140 52 151 Q70 151 76 136 Z" fill={`url(#${wingGradId})`} stroke={skin.wingStroke} strokeWidth="2" />
            )}

            {waving ? (
              <motion.path
                d="M142 112 Q168 92 173 67 Q194 83 181 111 Q173 131 152 139 Z"
                fill={`url(#${wingGradId})`}
                stroke={skin.wingStroke}
                strokeWidth="2"
                style={{ transformBox: 'fill-box', transformOrigin: '8% 78%' }}
                animate={{ rotate: [0, 25, 8, 25, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              />
            ) : (
              <path d="M139 113 Q157 92 167 113 Q169 140 148 151 Q130 151 124 136 Z" fill={`url(#${wingGradId})`} stroke={skin.wingStroke} strokeWidth="2" />
            )}
          </>
        )}
        <path d="M67 137 Q100 116 133 137 L137 159 Q100 177 63 159 Z" fill="url(#birdBellyShared)" />
      </g>
      {teacher ? (
        <>
          <g aria-label="Teacher glasses">
            <circle cx="79" cy="96" r="21" fill="none" stroke="#17364e" strokeWidth="4.5" />
            <circle cx="121" cy="96" r="21" fill="none" stroke="#17364e" strokeWidth="4.5" />
            <path d="M100 96 H100" stroke="#17364e" strokeWidth="5" strokeLinecap="round" />
            <path d="M58 88 Q51 86 47 90 M142 88 Q149 86 153 90" stroke="#17364e" strokeWidth="4" strokeLinecap="round" fill="none" />
          </g>
          <g transform="rotate(28 151 130)" aria-label="Marker held in wing">
            <rect x="143" y="113" width="15" height="39" rx="6" fill="#3B78B8" stroke="#174C82" strokeWidth="2" />
            <rect x="143" y="123" width="15" height="5" fill="#D9F1FF" />
            <path d="M143 113 H158 L155 107 H146 Z" fill="#F3C84B" stroke="#A36E14" strokeWidth="2" />
            <path d="M146 152 H155 L150.5 159 Z" fill="#25394A" />
          </g>
        </>
      ) : null}
      <path d={`M64 ${83 + brow} Q78 ${76 + brow} 93 84`} stroke={skin.eyebrow} strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d={`M107 84 Q122 ${76 + brow} 136 ${83 + brow}`} stroke={skin.eyebrow} strokeWidth="5" strokeLinecap="round" fill="none" />
      <ellipse cx="79" cy="96" rx="21" ry="23" fill="#FFFDF5" />
      <ellipse cx="121" cy="96" rx="21" ry="23" fill="#FFFDF5" />
      <ellipse cx="81" cy="99" rx="10" ry="12" fill="#51312B" />
      <ellipse cx="119" cy="99" rx="10" ry="12" fill="#51312B" />
      <circle cx="84" cy="95" r="3.8" fill="#fff" /><circle cx="122" cy="95" r="3.8" fill="#fff" />
      <circle cx="78" cy="103" r="2" fill="#19131A" /><circle cx="116" cy="103" r="2" fill="#19131A" />
      <ellipse cx="61" cy="119" rx="8" ry="3.4" fill={skin.blush} opacity=".58" />
      <ellipse cx="139" cy="119" rx="8" ry="3.4" fill={skin.blush} opacity=".58" />
      {/* Fixed upper bill: the face never moves while the bird talks. */}
      <path d="M89 119 Q100 112 111 119 L100 129 Z" fill="url(#birdBeakShared)" stroke="#D77615" strokeWidth="1.8" />
      <path d="M96 119 Q100 116 104 119" stroke="#FFF7AB" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".8" />
      <circle cx="96" cy="122" r="1.1" fill="#C76A14" /><circle cx="104" cy="122" r="1.1" fill="#C76A14" />
      {/* A small lower bill gently drops while speaking; there is no exposed mouth cavity. */}
      <motion.path
        d="M90 128 Q100 132 110 128 Q108 138 100 140 Q92 138 90 128 Z"
        fill="#FF9B19"
        stroke="#D77615"
        strokeWidth="1.8"
        style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
        animate={{ y: speaking ? [0, 4, 0] : 0 }}
        transition={{ duration: 0.34, repeat: speaking ? Infinity : 0, ease: 'easeInOut' }}
      />
      {!speaking ? <path d="M92 129 Q100 132 108 129" stroke="#A65416" strokeWidth="1.7" strokeLinecap="round" fill="none" /> : null}
      <path d="M80 172 V181 M80 181 H70 M80 181 H89" stroke="#F68A16" strokeWidth="5" strokeLinecap="round" />
      <path d="M120 172 V181 M120 181 H111 M120 181 H130" stroke="#F68A16" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

/** Cheerful landing-page Red Bird with teacher accessories. */
export function TeacherBird({ size = 120, className = '' }) {
  return <RedBird size={size} className={className} mood="cheer" teacher />;
}

/**
 * In-flow welcome animation for login/register.
 * Never uses a full-screen overlay, so it cannot cover form fields.
 */
export function FlyingBirdGreeting({ message, onDone, compact = false }) {
  return (
    <motion.div
      className={`mb-5 flex items-end gap-3 ${compact ? '' : 'md:mb-6'}`}
      initial={{ opacity: 0, x: -48, y: -8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 90, damping: 14 }}
      onAnimationComplete={() => {
        if (!onDone) return;
        setTimeout(() => onDone(), 2400);
      }}
    >
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, -3, 0, 3, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="shrink-0"
      >
        <RedBird size={compact ? 72 : 96} mood="wave" />
      </motion.div>
      <motion.div
        className="speech-bubble speech-bubble--tail-left relative max-w-sm flex-1 px-4 py-3 text-sm font-black leading-snug text-black md:text-base"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {message}
      </motion.div>
    </motion.div>
  );
}

/** Persistent Duolingo-style guide shown on learning pages */
export function GuideBird({ message, mood = 'wave', size = 56, autoSpeak = true, onSpeechEnd, className = '' }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!message || !autoSpeak) return;
    speakText(message, i18n.language, false, true)
      .then(() => {
        if (onSpeechEnd) onSpeechEnd();
      })
      .catch(() => {
        if (onSpeechEnd) onSpeechEnd();
      });
  }, [message, i18n.language, autoSpeak]);

  const handleSpeak = () => {
    if (!message) return;
    stopSpeech();
    speakText(message, i18n.language)
      .then(() => {
        if (onSpeechEnd) onSpeechEnd();
      })
      .catch(() => {
        if (onSpeechEnd) onSpeechEnd();
      });
  };

  return (
    <div
      className={`guide-bird inline-flex max-w-full cursor-pointer items-center gap-1.5 ${className}`}
      onClick={handleSpeak}
      title="Click to hear bird guide"
    >
      <div className="speech-bubble speech-bubble--tail-right relative max-w-xs sm:max-w-sm md:max-w-md px-3.5 py-2 text-xs font-black leading-snug text-black">
        {message}
      </div>
      <motion.div
        animate={{ y: [0, -6, 0], rotate: [-2, 3, -2] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        className="shrink-0 flex items-center justify-center"
      >
        <RedBird size={size} mood={mood} />
      </motion.div>
    </div>
  );
}

/**
 * One-shot "welcome back" arrival that fires right after a successful login.
 * Flies in from the bottom, waves, speaks the line in the user's chosen
 * language via native voice, then floats away on its own.
 */
export function LoginWelcomeToast({ message, lang = 'en', onDone, autoDismissMs = 6000 }) {
  const spokenRef = useRef(false);

  useEffect(() => {
    if (!message || spokenRef.current) return;
    spokenRef.current = true;
    speakText(message, lang, false, true).catch(() => {});
    return () => stopSpeech();
  }, [message, lang]);

  useEffect(() => {
    if (!onDone) return undefined;
    const timer = setTimeout(onDone, autoDismissMs);
    return () => clearTimeout(timer);
  }, [onDone, autoDismissMs]);

  function dismiss() {
    stopSpeech();
    onDone?.();
  }

  return (
    <motion.div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-6 z-[70] flex justify-center md:inset-x-auto md:bottom-8 md:right-8 md:justify-end"
      initial={{ opacity: 0, y: 80, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.9, transition: { duration: 0.25 } }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
    >
      <div className="flex max-w-sm items-end gap-3">
        <motion.button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss greeting"
          className="shrink-0 cursor-pointer border-0 bg-transparent p-0"
          initial={{ rotate: -8 }}
          animate={{ y: [0, -10, 0], rotate: [-4, 4, -4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <RedBird size={88} mood="wave" />
        </motion.button>
        <motion.button
          type="button"
          onClick={dismiss}
          className="speech-bubble speech-bubble--tail-left relative flex-1 cursor-pointer border-0 px-4 py-3 text-left text-sm font-black leading-snug text-black md:text-base"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 16 }}
        >
          {message}
        </motion.button>
      </div>
    </motion.div>
  );
}

/** Compact brand row with optional one-shot greeting */
export function AuthBirdHeader({ message, showGreeting, onGreetingDone, brand = 'LiteraAI', birdSize = 52 }) {
  return (
    <div className="mb-4">
      <AnimatePresence mode="wait">
        {showGreeting ? (
          <FlyingBirdGreeting key="greet" message={message} onDone={onGreetingDone} compact />
        ) : (
          <motion.div
            key="brand"
            className="mb-2 flex items-center gap-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <RedBird size={birdSize} mood="happy" />
            </motion.div>
            {brand ? (
              <div className="display text-sm font-bold uppercase tracking-[0.18em] text-white/60">{brand}</div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
