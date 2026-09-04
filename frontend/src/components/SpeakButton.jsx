import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, Square } from 'lucide-react';
import { speakText, stopSpeech } from '../audio';

/** Native Voice Assistant button — speaks `text` in the current app language. */
export function SpeakButton({ text, label, className = '', language }) {
  const { t, i18n } = useTranslation();
  const [speaking, setSpeaking] = useState(false);

  async function toggle() {
    if (speaking) {
      stopSpeech();
      setSpeaking(false);
      return;
    }
    if (!text || !text.trim()) return;
    setSpeaking(true);
    try {
      await speakText(text, language || i18n.language);
    } finally {
      setSpeaking(false);
    }
  }

  return (
    <button
      type="button"
      data-no-voice-guide="true"
      className={`btn-ghost flex items-center gap-2 px-3 py-2 text-sm ${className}`}
      onClick={toggle}
      aria-pressed={speaking}
      aria-label={speaking ? t('stop', 'Stop') : (label || t('listen'))}
    >
      {speaking ? <Square size={16} /> : <Volume2 size={16} />}
      {speaking ? t('stop', 'Stop') : (label || t('listen'))}
    </button>
  );
}

export default SpeakButton;
