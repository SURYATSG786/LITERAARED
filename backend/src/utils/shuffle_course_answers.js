/*
 * Deterministically reorder course-only answer options.  A question's stable
 * structural key (course path + collection + question position) is shared by
 * every translation, so equivalent questions always retain the same answer
 * index in en, hi, ta, te, kn, and ml. Initial-assessment data is never read.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(__dirname, '../../data');
const db = new Database(path.join(dataDir, 'literaai.sqlite'));
const verifiedPath = path.resolve(__dirname, '../data/verified_course_questions.json');

function hashToIndex(key) {
  let hash = 2166136261;
  for (const char of key) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 4;
}

function shuffleQuestion(question, key) {
  if (!question || !Array.isArray(question.options) || question.options.length !== 4) {
    throw new Error(`Invalid course question at ${key}`);
  }
  if (!Number.isInteger(question.correct_index) || question.correct_index < 0 || question.correct_index > 3) {
    throw new Error(`Invalid correct_index at ${key}`);
  }
  const targetIndex = hashToIndex(key);
  const correctOption = question.options[question.correct_index];
  const distractors = question.options.filter((_, index) => index !== question.correct_index);
  const options = [...distractors];
  options.splice(targetIndex, 0, correctOption);
  return { ...question, options, correct_index: targetIndex };
}

function shuffleCourse(course) {
  const courseIndex = ['foundation', 'beginner', 'intermediate', 'advanced'].indexOf(course.path);
  const collections = [];
  for (const [lessonIndex, lesson] of (course.lessons || []).entries()) {
    collections.push({ owner: lesson, field: 'practice_questions', key: `lesson-${lessonIndex}` });
    if (Array.isArray(lesson.quiz)) collections.push({ owner: lesson, field: 'quiz', key: `lesson-${lessonIndex}-quiz` });
  }
  for (const field of ['checkpoint_test', 'course_quiz', 'final_assessment']) {
    if (Array.isArray(course[field])) collections.push({ owner: course, field, key: field });
  }
  for (const collection of collections) {
    const questions = collection.owner[collection.field];
    collection.owner[collection.field] = questions.map((question, questionIndex) =>
      shuffleQuestion(question, `course-${courseIndex}:${collection.key}:${questionIndex}`)
    );
  }
  return course;
}

function validateTranslations(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const course = JSON.parse(row.data);
    const key = course.path;
    const signature = JSON.stringify([
      ...(course.lessons || []).flatMap((lesson, lessonIndex) => (lesson.practice_questions || []).map((q, qi) => [`l${lessonIndex}`, qi, q.correct_index])),
      ...(course.checkpoint_test || []).map((q, qi) => ['checkpoint', qi, q.correct_index]),
      ...(course.course_quiz || []).map((q, qi) => ['quiz', qi, q.correct_index]),
      ...(course.final_assessment || []).map((q, qi) => ['final', qi, q.correct_index]),
    ]);
    if (grouped.has(key) && grouped.get(key) !== signature) throw new Error(`Translation answer-position mismatch for ${key}`);
    grouped.set(key, signature);
  }
}

const rows = db.prepare('SELECT id, data FROM courses').all();
const update = db.prepare('UPDATE courses SET data = ? WHERE id = ?');
const shuffledRows = rows.map((row) => ({ ...row, data: JSON.stringify(shuffleCourse(JSON.parse(row.data))) }));
validateTranslations(shuffledRows);
db.transaction(() => shuffledRows.forEach((row) => update.run(row.data, row.id)))();

// Keep the verified course source aligned with the database. It contains only
// course questions; the verified Initial Assessment source is intentionally not
// opened or changed.
const verified = JSON.parse(fs.readFileSync(verifiedPath, 'utf8'));
for (const [lang, courses] of Object.entries(verified)) {
  courses.forEach((questions, courseIndex) => {
    verified[lang][courseIndex] = questions.map((question, questionIndex) =>
      shuffleQuestion(question, `course-${courseIndex}:lesson-0:${questionIndex}`)
    );
  });
}
fs.writeFileSync(verifiedPath, `${JSON.stringify(verified, null, 2)}\n`);

console.log(`Shuffled and validated ${shuffledRows.length} course datasets with shared translated answer positions.`);
