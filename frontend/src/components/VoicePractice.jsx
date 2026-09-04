import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { gradePronunciation, speakText, stopSpeech } from '../audio';

export function VoicePractice({ targetText, className = '', onGraded }) {
  const { t, i18n } = useTranslation();
  const {
    listening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition(i18n.language);

  const [gradedResult, setGradedResult] = useState(null);

  const combinedText = (transcript + (interimTranscript ? ` ${interimTranscript}` : '')).trim();

  useEffect(() => {
    setGradedResult(null);
    resetTranscript();
  }, [targetText, resetTranscript]);

  useEffect(() => {
    if (!listening && transcript) {
      const result = gradePronunciation(targetText, transcript);
      setGradedResult(result);
      if (onGraded) onGraded(result);

      if (result.score >= 70) {
        speakText(t('correctCheer', "Woohoo! That's correct!"), i18n.language).catch(() => {});
      } else if (result.score > 0) {
        speakText(t('tryAgainVoice', 'Not quite, try again!'), i18n.language).catch(() => {});
      }
    }
  }, [listening, transcript, targetText, i18n.language, t, onGraded]);

  const toggleListen = () => {
    stopSpeech();
    if (listening) {
      stopListening();
    } else {
      setGradedResult(null);
      resetTranscript();
      startListening();
    }
  };

  const handleListenSample = () => {
    stopSpeech();
    speakText(targetText, i18n.language).catch(() => {});
  };

  return (
    <div className={`glass-card rounded-3xl p-4 md:p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#06304f]/12 pb-3">
        <div className="flex items-center gap-2 font-extrabold text-[#06304f]/90">
          <Sparkles className="h-5 w-5 text-[var(--accent-2)]" />
          <span>{t('voicePractice', 'Voice Practice')}</span>
        </div>
        <button
          type="button"
          data-no-voice-guide="true"
          onClick={handleListenSample}
          className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs"
          aria-label={t('listenSample', 'Listen sample')}
        >
          <Volume2 size={16} />
          <span>{t('listen', 'Listen')}</span>
        </button>
      </div>

      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[#06304f]/60">
          {t('targetPhrase', 'Say this phrase out loud:')}
        </p>
        <p className="display mt-1 text-lg font-extrabold text-[#06304f] md:text-xl">
          "{targetText}"
        </p>
      </div>

      {!isSupported ? (
        <div className="rounded-2xl bg-amber-500/15 px-3 py-2 text-xs font-extrabold text-amber-800">
          {t('micNotSupported', 'Browser speech recognition is not supported in this browser. Please use Chrome or Edge.')}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <motion.button
            type="button"
            data-no-voice-guide="true"
            onClick={toggleListen}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className={`relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition ${
              listening
                ? 'bg-rose-600 shadow-rose-600/50'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/40'
            }`}
            aria-label={listening ? t('stopListening', 'Stop listening') : t('startSpeaking', 'Start speaking')}
          >
            {listening ? (
              <motion.div
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <MicOff className="h-7 w-7" />
              </motion.div>
            ) : (
              <Mic className="h-7 w-7" />
            )}
          </motion.button>

          <p className="text-xs font-extrabold text-[#06304f]/70">
            {listening
              ? t('listeningNow', 'Listening... Speak clearly in your native voice')
              : t('tapMicToSpeak', 'Tap microphone to practice speaking')}
          </p>

          {combinedText ? (
            <div className="w-full rounded-2xl bg-[#0b6fb8]/8 p-3 text-center">
              <span className="text-xs font-semibold text-[#06304f]/60">{t('spokenText', 'You said:')} </span>
              <span className="text-sm font-bold text-[#06304f]">"{combinedText}"</span>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl bg-red-500/12 px-3 py-1.5 text-xs font-bold text-red-800">
              {error === 'not-allowed'
                ? t('micDenied', 'Microphone access was denied. Please allow microphone permissions.')
                : error}
            </div>
          ) : null}

          <AnimatePresence>
            {gradedResult ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full rounded-2xl border border-[#06304f]/15 bg-white/55 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#06304f]/70">
                    {t('pronunciationScore', 'Pronunciation Accuracy')}
                  </span>
                  <div className="flex items-center gap-1">
                    <CheckCircle2
                      className={`h-5 w-5 ${
                        gradedResult.score >= 70 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    />
                    <span className="display text-xl font-bold text-[#06304f]">
                      {gradedResult.score}%
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {gradedResult.words.map((w, idx) => (
                    <span
                      key={idx}
                      className={`rounded-lg px-2 py-1 text-xs font-extrabold ${
                        w.correct
                          ? 'bg-emerald-500/20 text-emerald-800 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-800 border border-rose-500/40'
                      }`}
                    >
                      {w.text}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    data-no-voice-guide="true"
                    onClick={toggleListen}
                    className="flex items-center gap-1 text-xs font-extrabold text-[var(--accent-2)] hover:underline"
                  >
                    <RefreshCw size={14} />
                    <span>{t('tryAgain', 'Try again')}</span>
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default VoicePractice;
