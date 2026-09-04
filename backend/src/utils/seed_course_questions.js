import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { assertStoreWritable } from '../services/db.js';

assertStoreWritable();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(__dirname, '../../data');
const db = new Database(path.join(DATA_DIR, 'literaai.sqlite'));
const verified = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/verified_course_questions.json'), 'utf8'));
const paths = ['foundation', 'beginner', 'intermediate', 'advanced'];
const titles = {
  en: ['Reading Everyday Words', 'Understanding Everyday Sentences', 'Using Information in Daily Life', 'Reading for Understanding'],
  ta: ['அன்றாட சொற்களை வாசிப்போம்', 'அன்றாட வாக்கியங்களைப் புரிந்துகொள்வோம்', 'அன்றாட தகவல்களைப் பயன்படுத்துவோம்', 'வாசித்து புரிந்துகொள்வோம்'],
  te: ['రోజువారీ పదాలను చదవడం', 'రోజువారీ వాక్యాలను అర్థం చేసుకోవడం', 'రోజువారీ సమాచారాన్ని ఉపయోగించడం', 'చదివి అర్థం చేసుకోవడం'],
  kn: ['ದೈನಂದಿನ ಪದಗಳನ್ನು ಓದೋಣ', 'ದೈನಂದಿನ ವಾಕ್ಯಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳೋಣ', 'ದೈನಂದಿನ ಮಾಹಿತಿಯನ್ನು ಬಳಸೋಣ', 'ಓದಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳೋಣ'],
  ml: ['ദൈനംദിന വാക്കുകൾ വായിക്കാം', 'ദൈനംദിന വാക്യങ്ങൾ മനസ്സിലാക്കാം', 'ദൈനംദിന വിവരങ്ങൾ ഉപയോഗിക്കാം', 'വായിച്ച് മനസ്സിലാക്കാം'],
  hi: ['दैनिक शब्द पढ़ना', 'दैनिक वाक्यों को समझना', 'दैनिक जानकारी का उपयोग', 'पढ़कर समझना'],
};

const select = db.prepare('SELECT id, path, lang, data FROM courses WHERE path = ? AND lang = ?');
const update = db.prepare('UPDATE courses SET title = ?, data = ? WHERE id = ?');

db.transaction(() => {
  for (const [lang, perCourse] of Object.entries(verified)) {
    paths.forEach((pathKey, index) => {
      const row = select.get(pathKey, lang);
      if (!row) throw new Error(`Course not found: ${pathKey}/${lang}`);
      const course = JSON.parse(row.data);
      const questions = perCourse[index];
      if (!Array.isArray(questions) || questions.length !== 10) throw new Error(`Invalid verified data: ${pathKey}/${lang}`);
      // Preserve the course, lesson, navigation, and completion shape. Replace
      // every old question collection with the exact verified ten-question set.
      course.lessons.forEach((lesson) => { lesson.practice_questions = questions; });
      course.checkpoint = { ...(course.checkpoint || {}), questions };
      course.checkpoint_test = questions;
      course.title = titles[lang][index];
      course.lessons.forEach((lesson) => { lesson.title = course.title; });
      update.run(JSON.stringify(course.title), JSON.stringify(course), row.id);
    });
  }
})();

console.log(`Seeded ${Object.keys(verified).length * paths.length * 10} verified course questions across ${Object.keys(verified).length} languages.`);
