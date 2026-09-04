// Native Voice Assistant — server-side TTS proxy, ported from LiteraAI's /api/ai/tts.
// Surya supports 6 languages: en, hi, ta, te, kn, ml.
import { GoogleGenerativeAI } from '@google/generative-ai';

const SUPPORTED_LANGS = new Set(['en', 'hi', 'ta', 'te', 'kn', 'ml']);

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function safeLang(language) {
  const code = String(language || 'en').split('-')[0].split('_')[0].toLowerCase();
  return SUPPORTED_LANGS.has(code) ? code : 'en';
}

async function googleTranslateTts(text, language) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(language)}&client=tw-ob&q=${encodeURIComponent(text)}`;
  const ttsResponse = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!ttsResponse.ok) {
    throw new Error(`Google Translate TTS returned status ${ttsResponse.status}`);
  }
  const arrayBuffer = await ttsResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return { audio: buffer.toString('base64'), format: 'mp3' };
}

// Best-effort Gemini TTS fallback (only runs if GEMINI_API_KEY is configured
// and the installed SDK/model supports audio output in this environment).
async function geminiTts(text) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: { responseModalities: ['AUDIO'] },
  });
  const result = await model.generateContent(text);
  const parts = result.response?.candidates?.[0]?.content?.parts || [];
  const audioPart = parts.find((p) => p.inlineData?.data);
  if (!audioPart) throw new Error('No audio content returned from Gemini TTS');
  return { audio: audioPart.inlineData.data, format: 'pcm' };
}

/**
 * Synthesize speech for `text` in `language`.
 * 1) Google Translate TTS (native-accent, most reliable)
 * 2) Gemini TTS fallback (if configured)
 * Throws if both fail — the frontend falls back to guarded Web Speech Synthesis.
 */
export async function synthesizeSpeech(text, language) {
  const lang = safeLang(language);
  try {
    return await googleTranslateTts(text, lang);
  } catch (err) {
    console.warn('Google Translate TTS failed, trying Gemini fallback:', err.message);
  }
  return geminiTts(text);
}
