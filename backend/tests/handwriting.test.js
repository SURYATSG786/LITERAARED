import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WRITING_SETS,
  normalizeText,
  cleanScriptText,
  getGraphemes,
  levenshteinDistance,
  evaluateHandwriting,
  checkIsDevMode,
} from '../../frontend/src/utils/handwritingEvaluator.js';

test('WRITING_SETS has all 6 languages with 5 words each', () => {
  const langs = ['en', 'ta', 'te', 'kn', 'ml', 'hi'];
  for (const lang of langs) {
    assert.ok(WRITING_SETS[lang], `Missing writing set for ${lang}`);
    assert.equal(WRITING_SETS[lang].length, 5, `Language ${lang} must have 5 writing challenges`);
  }
});

test('cleanScriptText removes punctuation and zero-width noise', () => {
  assert.equal(cleanScriptText('அம்மா.'), 'அம்மா');
  assert.equal(cleanScriptText(' \u200B Cat ! '), 'cat');
  assert.equal(cleanScriptText('పుస్తకం?'), 'పుస్తకం');
  assert.equal(cleanScriptText('ಪುಸ್ತಕ#'), 'ಪುಸ್ತಕ');
  assert.equal(cleanScriptText('സ്കൂൾ;'), 'സ്കൂൾ');
  assert.equal(cleanScriptText('विद्यालय!'), 'विद्यालय');
});

test('getGraphemes segments Indic and English text correctly', () => {
  assert.deepEqual(getGraphemes('Cat'), ['C', 'a', 't']);
  const taGraphemes = getGraphemes('அம்மா');
  assert.ok(taGraphemes.length >= 3, `Tamil graphemes count: ${taGraphemes.length}`);
});

test('evaluateHandwriting handles exact matches for all 6 languages', () => {
  const langs = ['en', 'ta', 'te', 'kn', 'ml', 'hi'];
  for (const lang of langs) {
    for (const challenge of WRITING_SETS[lang]) {
      const res = evaluateHandwriting({
        recognizedText: challenge.target,
        engOCRText: '',
        targetWord: challenge.target,
        safeLang: lang,
        strokeMetrics: { width: 100, height: 50, drawnPixels: 500 },
        isSingleLetter: challenge.target.length === 1,
      });
      assert.equal(res.isMatch, true, `Exact match failed for ${lang}/${challenge.target}: ${res.reason}`);
    }
  }
});

test('evaluateHandwriting accepts fuzzy / punctuation-padded OCR text across all 6 languages', () => {
  const testCases = [
    { lang: 'en', target: 'Cat', ocr: 'Cat.', expected: true },
    { lang: 'en', target: 'School', ocr: 'School!', expected: true },
    { lang: 'ta', target: 'அம்மா', ocr: 'அம்மா.', expected: true },
    { lang: 'ta', target: 'மரம்', ocr: 'மரம்~', expected: true },
    { lang: 'te', target: 'అమ్మ', ocr: 'అమ్మ\n', expected: true },
    { lang: 'te', target: 'పుస్తకం', ocr: 'పుస్తకం.', expected: true },
    { lang: 'kn', target: 'ಅಮ್ಮ', ocr: 'ಅಮ್ಮ ', expected: true },
    { lang: 'kn', target: 'ಮರ', ocr: 'ಮರ.', expected: true },
    { lang: 'ml', target: 'അമ്മ', ocr: 'അമ്മ!', expected: true },
    { lang: 'ml', target: 'పుസ്തകം', ocr: 'పుസ്തകം.', expected: true },
    { lang: 'hi', target: 'माँ', ocr: 'माँ.', expected: true },
    { lang: 'hi', target: 'पुस्तक', ocr: 'पुस्तक ', expected: true },
  ];

  for (const tc of testCases) {
    const res = evaluateHandwriting({
      recognizedText: tc.ocr,
      engOCRText: '',
      targetWord: tc.target,
      safeLang: tc.lang,
      strokeMetrics: { width: 120, height: 60, drawnPixels: 600 },
      isSingleLetter: tc.target.length === 1,
    });
    assert.equal(res.isMatch, tc.expected, `Punctuation fuzzy match failed for ${tc.lang}/${tc.target} with OCR "${tc.ocr}"`);
  }
});

test('evaluateHandwriting accepts single letter practice strokes for all 6 languages', () => {
  const singleLetters = [
    { lang: 'en', target: 'I', ocr: 'l' },
    { lang: 'ta', target: 'அ', ocr: 'அ' },
    { lang: 'te', target: 'అ', ocr: 'అ' },
    { lang: 'kn', target: 'ಅ', ocr: 'ಅ' },
    { lang: 'ml', target: 'അ', ocr: 'അ' },
    { lang: 'hi', target: 'अ', ocr: 'अ' },
  ];

  for (const sl of singleLetters) {
    const res = evaluateHandwriting({
      recognizedText: sl.ocr,
      engOCRText: '',
      targetWord: sl.target,
      safeLang: sl.lang,
      strokeMetrics: { width: 40, height: 80, aspectRatio: 0.5, drawnPixels: 250 },
      isSingleLetter: true,
    });
    assert.equal(res.isMatch, true, `Single letter test failed for ${sl.lang}/${sl.target} with OCR "${sl.ocr}"`);
  }
});

test('evaluateHandwriting rejects incomplete words to avoid false positives', () => {
  const res = evaluateHandwriting({
    recognizedText: 'Sch',
    engOCRText: '',
    targetWord: 'Education',
    safeLang: 'en',
    strokeMetrics: { width: 80, height: 40, drawnPixels: 200 },
    isSingleLetter: false,
  });
  assert.equal(res.isMatch, false, 'Incomplete word "Sch" for "Education" must be rejected');
});

test('checkIsDevMode returns false in non-browser Node environment', () => {
  assert.equal(checkIsDevMode(), false);
});
