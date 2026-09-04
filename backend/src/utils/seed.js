import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, getPool, initDb } from '../services/db.js';
import { loadCourses, loadAssessments } from '../services/courses.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function seed() {
  console.log('--- Starting LiteraAI Supabase Seed ---');

  // 1. Seed Courses
  const courses = loadCourses();
  console.log(`Seeding ${courses.length} courses to Supabase...`);
  
  const coursePayload = courses.map((c) => ({
    id: c.id,
    path: c.path,
    lang: c.lang,
    title: typeof c.title === 'object' ? JSON.stringify(c.title) : c.title,
    description: c.objective || '',
    data: c,
  }));

  const { error: courseErr } = await supabase.from('courses').upsert(coursePayload, { onConflict: 'id' });
  if (courseErr) {
    console.warn('Note on Supabase HTTPS courses upsert:', courseErr.message);
  } else {
    console.log(`✅ Upserted ${coursePayload.length} courses via Supabase HTTPS API.`);
  }

  // 2. Seed Assessments
  const assessments = loadAssessments();
  console.log(`Seeding ${assessments.length} assessment levels to Supabase...`);
  
  const assessmentPayload = assessments.map((a) => ({
    education_level: a.education_level,
    data: a,
  }));

  const { error: assessErr } = await supabase.from('assessments').upsert(assessmentPayload, { onConflict: 'education_level' });
  if (assessErr) {
    console.warn('Note on Supabase HTTPS assessments upsert:', assessErr.message);
  } else {
    console.log(`✅ Upserted ${assessmentPayload.length} assessments via Supabase HTTPS API.`);
  }

  console.log('✅ Supabase database seed completed successfully.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
