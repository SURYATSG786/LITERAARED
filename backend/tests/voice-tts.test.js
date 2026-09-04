import test from 'node:test';
import assert from 'node:assert/strict';
import { synthesizeSpeech } from '../src/services/tts.js';
import { loadCourses } from '../src/services/courses.js';

test('voice guidance TTS service synthesizes audio for all 6 supported languages', async () => {
  const languages = ['te', 'hi', 'ta', 'kn', 'ml', 'en'];
  for (const lang of languages) {
    const res = await synthesizeSpeech('నమస్కారం', lang);
    assert.ok(res, `TTS response for ${lang} must exist`);
    assert.ok(res.audio, `TTS audio base64 for ${lang} must exist`);
    assert.ok(typeof res.audio === 'string' && res.audio.length > 0, `TTS audio for ${lang} must be a non-empty string`);
    assert.ok(['mp3', 'pcm'].includes(res.format), `Format for ${lang} must be mp3 or pcm`);
  }
});

test('voice guidance condition: zero Latin characters in Telugu course text to read', () => {
  const courses = loadCourses('te');
  const latin = /[A-Za-z]/;
  const teCourses = courses.filter((c) => {
    const title = typeof c.title === 'object' ? c.title.te : c.title;
    return Boolean(title);
  });
  
  assert.ok(teCourses.length >= 4, 'Must have at least 4 courses with Telugu content');
  
  for (const c of teCourses) {
    for (const l of c.lessons) {
      for (const q of (l.practice_questions || [])) {
        const text = typeof q.question === 'object' ? (q.question.te || '') : (q.question || '');
        assert.equal(latin.test(text), false, `Telugu question '${text}' contains Latin characters`);
        for (const opt of q.options) {
          const optText = typeof opt === 'object' ? (opt.te || '') : (opt || '');
          assert.equal(latin.test(optText), false, `Telugu option '${optText}' contains Latin characters`);
        }
      }
    }
  }
});
