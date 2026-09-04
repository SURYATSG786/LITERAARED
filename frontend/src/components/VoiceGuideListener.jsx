import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { speakText } from '../audio';

function getAccessibleName(el) {
  const aria = el.getAttribute('aria-label');
  if (aria && aria.trim()) return aria.trim();

  const title = el.getAttribute('title');
  if (title && title.trim()) return title.trim();

  const val = el.getAttribute('value');
  if (val && val.trim() && el.tagName === 'INPUT') return val.trim();

  const text = el.textContent && el.textContent.trim();
  if (text) return text.replace(/\s+/g, ' ').slice(0, 200);

  return '';
}

/**
 * Native Voice Guide Listener.
 * Speech is restricted to Questions & Answer options only.
 * General UI control buttons (Submit, Continue, Check Answer, etc.) are kept quiet.
 */
export function VoiceGuideListener() {
  return null;
}

export default VoiceGuideListener;
