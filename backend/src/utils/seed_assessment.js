import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { assertStoreWritable } from '../services/db.js';

assertStoreWritable();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(__dirname, '../../data');
const db = new Database(path.join(DATA_DIR, 'literaai.sqlite'));
export const ASSESSMENT_DATA = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/verified_assessments.json'), 'utf8'));

export function seedAssessmentQuestions() {
  const upsert = db.prepare('INSERT OR REPLACE INTO assessments (education_level, data) VALUES (?, ?)');
  db.transaction(() => ASSESSMENT_DATA.forEach((item) => upsert.run(item.education_level, JSON.stringify(item))))();
  console.log(`Seeded ${ASSESSMENT_DATA.reduce((total, level) => total + level.questions.length, 0)} assessment questions.`);
}

seedAssessmentQuestions();
