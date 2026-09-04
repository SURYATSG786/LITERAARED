import { randomUUID } from 'crypto';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import { buildLeagueExam, LEAGUE_EXAMS } from '../data/leagueExams.js';

const { Pool } = pg;

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qpszdjgagfyhqsjceynm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Tz8DSDRzPBXu-3-jstBwmw_R1xTbu20';
const DATABASE_URL = process.env.DATABASE_URL || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let poolInstance = null;
let useMemoryStore = false;
let isInitialized = false;

// In-memory fallback tables for testing and offline/placeholder mode
const memTables = {
  users: new Map(),
  user_streaks: new Map(),
  user_lesson_progress: new Map(),
  user_course_lesson_progress: new Map(),
  user_course_progress: new Map(),
  user_reward_events: new Map(),
  certificates: new Map(),
  league_certificates: new Map(),
  registrations: new Map(),
  login_events: [],
  courses: new Map(),
  assessments: new Map(),
  league_exams: new Map(),
  community_posts: [],
  admin_reminders: [],
  user_badges: [],
  user_skins: [],
  user_shop_custom: new Map(),
  platform_settings: new Map(),
  user_alphabet_writing_progress: new Map(),
};

function hasLiveDatabaseUrl() {
  return Boolean(
    DATABASE_URL &&
    !DATABASE_URL.includes('[YOUR-PASSWORD]') &&
    (DATABASE_URL.startsWith('postgres://') || DATABASE_URL.startsWith('postgresql://'))
  );
}

export function getPool() {
  if (!hasLiveDatabaseUrl() || process.env.NODE_ENV === 'test' || useMemoryStore) {
    useMemoryStore = true;
    return createMemoryPool();
  }

  if (!poolInstance) {
    const isLocalhost = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
    poolInstance = new Pool({
      connectionString: DATABASE_URL,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });

    poolInstance.on('error', (err) => {
      console.warn('Postgres connection note:', err.message);
    });
  }
  return poolInstance;
}

export function getDb() {
  return getPool();
}

function createMemoryPool() {
  return {
    async query(text, params = []) {
      const sql = String(text || '').trim();
      return handleMemoryQuery(sql, params);
    },
    async connect() {
      return {
        async query(text, params = []) {
          return handleMemoryQuery(String(text || '').trim(), params);
        },
        release() {},
      };
    },
  };
}

async function handleMemoryQuery(sql, params = []) {
  const upper = String(sql || '').toUpperCase().replace(/\s+/g, ' ');

  if (upper.startsWith('BEGIN') || upper.startsWith('COMMIT') || upper.startsWith('ROLLBACK')) {
    return { rowCount: 0, rows: [] };
  }

  if (upper.includes('CREATE TABLE') || upper.includes('CREATE INDEX')) {
    return { rowCount: 0, rows: [] };
  }

  // Users Queries
  if (upper.includes('INSERT INTO USERS')) {
    const user = {
      id: params[0],
      name: params[1],
      email: params[2],
      password: params[3],
      role: params[4] || 'student',
      preferred_language: params[5],
      ui_language: params[6],
      learning_language: params[7],
      education_level: params[8],
      assessment_score: params[9],
      current_path: params[10],
      course_progress: params[11],
      streak: params[12],
      gems: params[13] || 0,
      xp: params[14] || 0,
      certificate: params[15],
      certificates: params[16],
      created_at: params[17] || new Date().toISOString(),
      updated_at: params[18] || new Date().toISOString(),
      league: 'bronze',
    };
    memTables.users.set(user.id, user);
    try {
      await supabase.from('users').upsert(user);
    } catch (_) {}
    return { rowCount: 1, rows: [user] };
  }

  if (upper.includes('SELECT * FROM USERS WHERE LOWER(EMAIL) =') || upper.includes('SELECT ID FROM USERS WHERE LOWER(EMAIL) =')) {
    const email = String(params[0] || '').toLowerCase().trim();
    const excludeId = params[1] || null;
    let match = Array.from(memTables.users.values()).find(
      (u) => (u.email || '').toLowerCase() === email && (excludeId ? u.id !== excludeId : true)
    );
    if (!match) {
      try {
        const { data } = await supabase.from('users').select('*').ilike('email', email).maybeSingle();
        if (data && (excludeId ? data.id !== excludeId : true)) {
          match = data;
          memTables.users.set(data.id, data);
        }
      } catch (_) {}
    }
    return { rowCount: match ? 1 : 0, rows: match ? [match] : [] };
  }

  if (upper.includes('SELECT * FROM USERS WHERE ID =')) {
    const id = params[0];
    let match = memTables.users.get(id);
    if (!match) {
      try {
        const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
        if (data) {
          match = data;
          memTables.users.set(data.id, data);
        }
      } catch (_) {}
    }
    return { rowCount: match ? 1 : 0, rows: match ? [match] : [] };
  }

  if (upper.includes('SELECT * FROM USERS')) {
    try {
      const { data } = await supabase.from('users').select('*');
      if (data && Array.isArray(data)) {
        data.forEach((u) => memTables.users.set(u.id, u));
      }
    } catch (_) {}
    const list = Array.from(memTables.users.values());
    return { rowCount: list.length, rows: list };
  }

  if (upper.includes('UPDATE USERS SET')) {
    const id = params[params.length - 1];
    let existing = memTables.users.get(id);
    if (!existing) {
      try {
        const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
        if (data) existing = data;
      } catch (_) {}
    }
    if (existing) {
      if (upper.includes('NAME = $1')) {
        existing.name = params[0];
        existing.email = params[1];
        existing.password = params[2];
        existing.role = params[3];
        existing.preferred_language = params[4];
        existing.ui_language = params[5];
        existing.learning_language = params[6];
        existing.education_level = params[7];
        existing.assessment_score = params[8];
        existing.current_path = params[9];
        existing.gems = params[10];
        existing.xp = params[11];
        existing.updated_at = params[12];
      } else if (upper.includes('LEAGUE = $1')) {
        existing.league = params[0];
        existing.updated_at = params[1];
      } else if (upper.includes('XP = XP + $1')) {
        existing.xp = (existing.xp || 0) + Number(params[0] || 0);
        existing.gems = (existing.gems || 0) + Number(params[1] || 0);
        existing.updated_at = params[2];
      } else if (upper.includes('CURRENT_PATH = $1')) {
        existing.current_path = params[0];
        existing.updated_at = new Date().toISOString();
      } else if (upper.includes('GEMS = $1')) {
        existing.gems = Number(params[0] || 0);
        existing.updated_at = new Date().toISOString();
      }
      memTables.users.set(id, existing);
      try {
        await supabase.from('users').upsert(existing);
      } catch (_) {}
    }
    return { rowCount: 1, rows: existing ? [existing] : [] };
  }

  // Streaks
  if (upper.includes('INSERT INTO USER_STREAKS') || upper.includes('UPDATE USER_STREAKS')) {
    const userId = params[0];
    const item = { user_id: userId, current_streak: Number(params[1] || 0), goal: Number(params[2] || 14), last_activity: params[3] || null };
    memTables.user_streaks.set(userId, item);
    try {
      await supabase.from('user_streaks').upsert(item);
    } catch (_) {}
    return { rowCount: 1, rows: [item] };
  }

  if (upper.includes('SELECT CURRENT_STREAK, GOAL, LAST_ACTIVITY FROM USER_STREAKS WHERE USER_ID =')) {
    const userId = params[0];
    let item = memTables.user_streaks.get(userId);
    if (!item) {
      try {
        const { data } = await supabase.from('user_streaks').select('*').eq('user_id', userId).maybeSingle();
        if (data) {
          item = data;
          memTables.user_streaks.set(userId, item);
        }
      } catch (_) {}
    }
    return { rowCount: item ? 1 : 0, rows: item ? [item] : [] };
  }

  // Lesson Progress
  if (upper.includes('INSERT INTO USER_COURSE_LESSON_PROGRESS')) {
    const key = `${params[0]}:${params[1]}:${params[2]}`;
    const item = {
      user_id: params[0],
      course_id: params[1],
      lesson_id: String(params[2]),
      score: params[3],
      correct_count: params[4],
      total_questions: params[5],
      completed_at: params[6] || new Date().toISOString(),
    };
    memTables.user_course_lesson_progress.set(key, item);
    try {
      await supabase.from('user_course_lesson_progress').upsert(item);
    } catch (_) {}
    return { rowCount: 1, rows: [item] };
  }

  if (upper.includes('SELECT COURSE_ID FROM USER_COURSE_LESSON_PROGRESS WHERE USER_ID =')) {
    const userId = params[0];
    try {
      const { data } = await supabase.from('user_course_lesson_progress').select('*').eq('user_id', userId);
      if (data && Array.isArray(data)) {
        data.forEach((p) => memTables.user_course_lesson_progress.set(`${p.user_id}:${p.course_id}:${p.lesson_id}`, p));
      }
    } catch (_) {}
    const list = Array.from(memTables.user_course_lesson_progress.values()).filter((p) => p.user_id === userId);
    list.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
    return { rowCount: list.length, rows: list.slice(0, 1) };
  }

  if (upper.includes('FROM USER_COURSE_LESSON_PROGRESS')) {
    const userId = params[0];
    try {
      const { data } = await supabase.from('user_course_lesson_progress').select('*').eq('user_id', userId);
      if (data && Array.isArray(data)) {
        data.forEach((p) => memTables.user_course_lesson_progress.set(`${p.user_id}:${p.course_id}:${p.lesson_id}`, p));
      }
    } catch (_) {}
    const list = Array.from(memTables.user_course_lesson_progress.values()).filter(
      (p) => p.user_id === userId && (params[1] ? p.course_id === params[1] : true)
    );
    return { rowCount: list.length, rows: list };
  }

  // Course Progress
  if (upper.includes('INSERT INTO USER_COURSE_PROGRESS')) {
    const key = `${params[0]}:${params[1]}`;
    const item = { user_id: params[0], course_id: params[1], checkpoint_passed: params[2], checkpoint_score: params[3] };
    memTables.user_course_progress.set(key, item);
    try {
      await supabase.from('user_course_progress').upsert(item);
    } catch (_) {}
    return { rowCount: 1, rows: [item] };
  }

  if (upper.includes('SELECT CHECKPOINT_PASSED, CHECKPOINT_SCORE, FINAL_ASSESSMENT_PASSED FROM USER_COURSE_PROGRESS')) {
    const key = `${params[0]}:${params[1]}`;
    let item = memTables.user_course_progress.get(key);
    if (!item) {
      try {
        const { data } = await supabase.from('user_course_progress').select('*').eq('user_id', params[0]).eq('course_id', params[1]).maybeSingle();
        if (data) {
          item = data;
          memTables.user_course_progress.set(key, item);
        }
      } catch (_) {}
    }
    return { rowCount: item ? 1 : 0, rows: item ? [item] : [] };
  }

  // Certificates
  if (upper.includes('INSERT INTO CERTIFICATES')) {
    const item = {
      credential_id: params[0],
      user_id: params[1],
      course_id: params[2],
      course_title: params[3],
      score: params[4],
      issued_date: params[5],
      status: params[6],
      ui_language: params[7],
      learning_language: params[8],
    };
    memTables.certificates.set(item.credential_id, item);
    try {
      await supabase.from('certificates').upsert(item);
    } catch (_) {}
    return { rowCount: 1, rows: [item] };
  }

  if (upper.includes('FROM CERTIFICATES WHERE USER_ID =')) {
    const userId = params[0];
    try {
      const { data } = await supabase.from('certificates').select('*').eq('user_id', userId);
      if (data && Array.isArray(data)) {
        data.forEach((c) => memTables.certificates.set(c.credential_id, c));
      }
    } catch (_) {}
    const list = Array.from(memTables.certificates.values()).filter(
      (c) => c.user_id === userId && (params[1] ? c.course_id === params[1] : true)
    );
    list.sort((a, b) => new Date(a.issued_date).getTime() - new Date(b.issued_date).getTime());
    return { rowCount: list.length, rows: list };
  }

  // League Certificates
  if (upper.includes('INSERT INTO LEAGUE_CERTIFICATES')) {
    const item = {
      credential_id: params[0],
      user_id: params[1],
      league: params[2],
      league_title: params[3],
      score: params[4],
      issued_date: params[5],
    };
    memTables.league_certificates.set(item.credential_id, item);
    try {
      await supabase.from('league_certificates').upsert(item);
    } catch (_) {}
    return { rowCount: 1, rows: [item] };
  }

  if (upper.includes('FROM LEAGUE_CERTIFICATES')) {
    try {
      const { data } = await supabase.from('league_certificates').select('*');
      if (data && Array.isArray(data)) {
        data.forEach((c) => memTables.league_certificates.set(c.credential_id, c));
      }
    } catch (_) {}
    const list = Array.from(memTables.league_certificates.values()).filter((c) => (params[0] ? c.user_id === params[0] : true));
    list.sort((a, b) => new Date(a.issued_date).getTime() - new Date(b.issued_date).getTime());
    return { rowCount: list.length, rows: list };
  }

  // Badges
  if (upper.includes('INSERT INTO USER_BADGES')) {
    const item = { user_id: params[0], badge_id: params[1], unlocked_at: params[2] };
    memTables.user_badges.push(item);
    try {
      await supabase.from('user_badges').upsert(item);
    } catch (_) {}
    return { rowCount: 1, rows: [item] };
  }

  if (upper.includes('SELECT BADGE_ID FROM USER_BADGES WHERE USER_ID =')) {
    const userId = params[0];
    try {
      const { data } = await supabase.from('user_badges').select('*').eq('user_id', userId);
      if (data && Array.isArray(data)) {
        memTables.user_badges = [...memTables.user_badges.filter((b) => b.user_id !== userId), ...data];
      }
    } catch (_) {}
    const list = memTables.user_badges.filter((b) => b.user_id === userId);
    return { rowCount: list.length, rows: list };
  }

  // Shop Skins & Custom Preferences
  if (upper.includes('INSERT INTO USER_SKINS')) {
    const item = { user_id: params[0], skin_id: params[1], unlocked_at: params[2] };
    const existing = memTables.user_skins.find((s) => s.user_id === params[0] && s.skin_id === params[1]);
    if (!existing) {
      memTables.user_skins.push(item);
    }
    try {
      await supabase.from('user_skins').upsert(item);
    } catch (_) {}
    return { rowCount: 1, rows: [] };
  }

  if (upper.includes('SELECT SKIN_ID FROM USER_SKINS WHERE USER_ID =')) {
    const userId = params[0];
    try {
      const { data } = await supabase.from('user_skins').select('*').eq('user_id', userId);
      if (data && Array.isArray(data)) {
        memTables.user_skins = [...memTables.user_skins.filter((s) => s.user_id !== userId), ...data];
      }
    } catch (_) {}
    const list = memTables.user_skins.filter((s) => s.user_id === userId);
    return { rowCount: list.length, rows: list };
  }

  if (upper.includes('SELECT EQUIPPED_SKIN, STREAK_SAVERS FROM USER_SHOP_CUSTOM WHERE USER_ID =')) {
    const userId = params[0];
    let item = memTables.user_shop_custom.get(userId);
    if (!item) {
      try {
        const { data } = await supabase.from('user_shop_custom').select('*').eq('user_id', userId).maybeSingle();
        if (data) {
          item = data;
          memTables.user_shop_custom.set(userId, item);
        }
      } catch (_) {}
    }
    const finalItem = item || { equipped_skin: 'classic', streak_savers: 0 };
    return { rowCount: 1, rows: [finalItem] };
  }

  if (upper.includes('INSERT INTO USER_SHOP_CUSTOM') || upper.includes('UPDATE USER_SHOP_CUSTOM')) {
    const userId = params[0];
    const prev = memTables.user_shop_custom.get(userId) || { equipped_skin: 'classic', streak_savers: 0 };
    const equipped_skin = params[1] !== undefined ? params[1] : prev.equipped_skin;
    const streak_savers = params[2] !== undefined ? params[2] : prev.streak_savers;
    const item = { user_id: userId, equipped_skin, streak_savers };
    memTables.user_shop_custom.set(userId, item);
    try {
      await supabase.from('user_shop_custom').upsert(item);
    } catch (_) {}
    return { rowCount: 1, rows: [item] };
  }

  // Registrations & Login Events
  if (upper.includes('INSERT INTO REGISTRATIONS')) {
    const item = { id: params[0], user_id: params[1], email: params[2], name: params[3], preferred_language: params[4], education_level: params[5], created_at: params[6] };
    memTables.registrations.set(item.id, item);
    try {
      await supabase.from('registrations').insert(item);
    } catch (_) {}
    return { rowCount: 1, rows: [item] };
  }

  if (upper.includes('INSERT INTO LOGIN_EVENTS')) {
    const item = { id: params[0], user_id: params[1], email: params[2], success: params[3], ip: params[4], user_agent: params[5], created_at: params[6] };
    memTables.login_events.push(item);
    try {
      await supabase.from('login_events').insert(item);
    } catch (_) {}
    return { rowCount: 1, rows: [item] };
  }

  // Alphabet writing progress
  if (upper.includes('INSERT INTO USER_ALPHABET_WRITING_PROGRESS')) {
    const item = {
      id: params[0],
      user_id: params[1],
      letter: params[2],
      type: params[3],
      word: params[4],
      score: params[5],
      attempts: params[6],
      time_spent: params[7],
      completed: params[8],
      created_at: params[9],
      updated_at: params[10],
    };
    memTables.user_alphabet_writing_progress.set(item.id, item);
    try {
      await supabase.from('user_alphabet_writing_progress').upsert(item);
    } catch (_) {}
    return { rowCount: 1, rows: [item] };
  }

  if (upper.includes('FROM USER_ALPHABET_WRITING_PROGRESS WHERE USER_ID =')) {
    const userId = params[0];
    try {
      const { data } = await supabase.from('user_alphabet_writing_progress').select('*').eq('user_id', userId);
      if (data && Array.isArray(data)) {
        data.forEach((r) => memTables.user_alphabet_writing_progress.set(r.id, r));
      }
    } catch (_) {}
    let list = Array.from(memTables.user_alphabet_writing_progress.values()).filter((r) => r.user_id === userId);
    if (params[1] && params[2]) {
      list = list.filter((r) => r.letter === params[1] && r.type === params[2]);
    }
    return { rowCount: list.length, rows: list };
  }

  // Community Posts
  if (upper.includes('INSERT INTO COMMUNITY_POSTS')) {
    const item = {
      id: params[0],
      user_id: params[1],
      user_name: params[2],
      type: params[3],
      content: params[4],
      image_url: params[5],
      achievement_meta: params[6],
      language: params[7],
      likes: params[8] || 0,
      created_at: params[9],
    };
    memTables.community_posts.unshift(item);
    try {
      await supabase.from('community_posts').insert(item);
    } catch (_) {}
    return { rowCount: 1, rows: [item] };
  }

  if (upper.includes('FROM COMMUNITY_POSTS') && upper.startsWith('SELECT')) {
    try {
      const { data } = await supabase.from('community_posts').select('*').order('created_at', { ascending: false });
      if (data && Array.isArray(data)) {
        memTables.community_posts = data;
      }
    } catch (_) {}
    const list = memTables.community_posts.map((p) => {
      const u = memTables.users.get(p.user_id);
      return { ...p, registered_user_name: u ? u.name : p.user_name };
    });
    return { rowCount: list.length, rows: list };
  }

  // Counts / Status
  if (upper.includes('SELECT COUNT(*) AS COUNT FROM USERS') || upper.includes('SELECT COUNT(*) AS TOTAL FROM USERS')) {
    try {
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
      if (count !== null && count !== undefined) {
        return { rowCount: 1, rows: [{ count, total: count }] };
      }
    } catch (_) {}
    return { rowCount: 1, rows: [{ count: memTables.users.size, total: memTables.users.size }] };
  }

  return { rowCount: 0, rows: [] };
}

let initPromise = null;

export async function ensureDbInitialized() {
  if (isInitialized) return;
  if (!initPromise) {
    initPromise = initDb().finally(() => {
      initPromise = null;
    });
  }
  return initPromise;
}

export async function initDb() {
  if (isInitialized) return;
  try {
    const pool = getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        preferred_language TEXT NOT NULL,
        ui_language TEXT,
        learning_language TEXT,
        education_level TEXT NOT NULL,
        assessment_score INTEGER,
        current_path TEXT,
        course_progress TEXT,
        streak TEXT,
        gems INTEGER DEFAULT 0,
        xp INTEGER DEFAULT 0,
        certificate TEXT,
        certificates TEXT,
        league TEXT DEFAULT 'bronze',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_streaks (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        current_streak INTEGER DEFAULT 0,
        goal INTEGER DEFAULT 14,
        last_activity TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS user_lesson_progress (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id TEXT,
        lesson_id TEXT NOT NULL,
        score INTEGER DEFAULT 0,
        correct_count INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, lesson_id)
      );

      CREATE TABLE IF NOT EXISTS user_course_lesson_progress (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id TEXT NOT NULL,
        lesson_id TEXT NOT NULL,
        score INTEGER DEFAULT 0,
        correct_count INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, course_id, lesson_id)
      );

      CREATE TABLE IF NOT EXISTS user_course_progress (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id TEXT NOT NULL,
        checkpoint_passed INTEGER NOT NULL DEFAULT 0,
        checkpoint_score INTEGER,
        final_assessment_passed INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, course_id)
      );

      CREATE TABLE IF NOT EXISTS user_reward_events (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id TEXT NOT NULL,
        xp INTEGER NOT NULL DEFAULT 0,
        gems INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, event_id)
      );

      CREATE TABLE IF NOT EXISTS certificates (
        credential_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id TEXT NOT NULL,
        course_title TEXT NOT NULL,
        score INTEGER NOT NULL,
        issued_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        status TEXT NOT NULL DEFAULT 'unlocked',
        ui_language TEXT,
        learning_language TEXT
      );

      CREATE TABLE IF NOT EXISTS registrations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        preferred_language TEXT NOT NULL,
        education_level TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS login_events (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        email TEXT NOT NULL,
        success INTEGER NOT NULL,
        ip TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        path TEXT NOT NULL,
        lang TEXT NOT NULL DEFAULT 'en',
        title TEXT NOT NULL,
        description TEXT,
        data JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS assessments (
        education_level TEXT PRIMARY KEY,
        data JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS league_exams (
        id TEXT PRIMARY KEY,
        league TEXT NOT NULL,
        lang TEXT NOT NULL DEFAULT 'en',
        data JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS league_certificates (
        credential_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        league TEXT NOT NULL,
        league_title TEXT NOT NULL,
        score INTEGER NOT NULL,
        issued_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS community_posts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        achievement_meta JSONB,
        language TEXT DEFAULT 'en',
        likes INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS admin_reminders (
        id TEXT PRIMARY KEY,
        admin_id TEXT,
        learner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        note TEXT,
        channel TEXT DEFAULT 'in_app',
        status TEXT DEFAULT 'sent',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_badges (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        badge_id TEXT NOT NULL,
        unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, badge_id)
      );

      CREATE TABLE IF NOT EXISTS user_skins (
        user_id TEXT NOT NULL,
        skin_id TEXT NOT NULL,
        unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, skin_id)
      );

      CREATE TABLE IF NOT EXISTS user_shop_custom (
        user_id TEXT PRIMARY KEY,
        equipped_skin TEXT DEFAULT 'classic',
        streak_savers INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS platform_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_alphabet_writing_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        letter TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'letter',
        word TEXT NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        attempts INTEGER NOT NULL DEFAULT 1,
        time_spent INTEGER DEFAULT 0,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await seedLeagueExamsHelper();
    isInitialized = true;
  } catch (err) {
    console.warn('Database initialization note:', err.message);
  }
}

async function seedLeagueExamsHelper() {
  const pool = getPool();
  const languages = ['en', 'hi', 'ta', 'te', 'kn', 'ml'];
  try {
    const res = await pool.query('SELECT COUNT(*) as count FROM league_exams');
    if (parseInt(res.rows[0]?.count, 10) > 0) return;

    for (const uiLanguage of languages) {
      for (const learningLanguage of languages) {
        const pair = `${uiLanguage}__${learningLanguage}`;
        for (const league of Object.keys(LEAGUE_EXAMS)) {
          const data = buildLeagueExam(league, uiLanguage, learningLanguage);
          await pool.query(
            `INSERT INTO league_exams (id, league, lang, data)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT(id) DO UPDATE SET data = EXCLUDED.data`,
            [`exam_${league}_${pair}`, league, pair, JSON.stringify(data)]
          );
        }
      }
    }
  } catch (err) {
    console.warn('League exams seeding note:', err.message);
  }
}

function defaultCourseProgress() {
  return {
    course_id: null,
    lessons_completed: [],
    checkpoint_passed: false,
    checkpoint_score: null,
  };
}

function defaultStreak() {
  return { current: 0, goal: 14, last_activity: null };
}

function defaultCertificate() {
  return {
    issued: false,
    credential_id: null,
    issued_date: null,
    course_title: null,
    score: null,
  };
}

export async function rowToUser(row) {
  if (!row) return null;
  const pool = getPool();

  const streakRes = await pool.query('SELECT current_streak, goal, last_activity FROM user_streaks WHERE user_id = $1', [row.id]);
  const streakRow = streakRes.rows[0];
  const streak = streakRow
    ? { current: streakRow.current_streak, goal: streakRow.goal, last_activity: streakRow.last_activity }
    : defaultStreak();

  let userCourseProg = {};
  try {
    if (typeof row.course_progress === 'string') userCourseProg = JSON.parse(row.course_progress || '{}');
    else if (row.course_progress && typeof row.course_progress === 'object') userCourseProg = row.course_progress;
  } catch (_) {}

  const activeCourseRes = await pool.query(`
    SELECT course_id FROM user_course_lesson_progress
    WHERE user_id = $1 AND course_id IS NOT NULL
    ORDER BY completed_at DESC LIMIT 1
  `, [row.id]);
  const activeCourse = activeCourseRes.rows[0]?.course_id || userCourseProg.course_id || '0';

  let progressRows = [];
  if (activeCourse) {
    const progRes = await pool.query(`
      SELECT lesson_id, score, course_id FROM user_course_lesson_progress
      WHERE user_id = $1 AND course_id = $2 ORDER BY completed_at
    `, [row.id, activeCourse]);
    progressRows = progRes.rows || [];
  }

  const lessons_completed_db = progressRows.map((r) => (/^\d+$/.test(String(r.lesson_id)) ? Number(r.lesson_id) : r.lesson_id));
  const lessons_completed = Array.from(new Set([...lessons_completed_db, ...(userCourseProg.lessons_completed || [])]));
  const lesson_scores = {
    ...(userCourseProg.lesson_scores || {}),
    ...progressRows.reduce((acc, r) => { acc[r.lesson_id] = r.score ?? 0; return acc; }, {})
  };

  let certRows = [];
  try {
    const certRes = await pool.query(
      'SELECT credential_id, course_id, course_title, score, issued_date, status, ui_language, learning_language FROM certificates WHERE user_id = $1 ORDER BY issued_date',
      [row.id]
    );
    certRows = certRes.rows || [];
  } catch (_) {}

  if (certRows.length === 0) {
    try {
      const { data } = await supabase.from('certificates').select('*').eq('user_id', row.id);
      if (data && data.length > 0) certRows = data;
    } catch (_) {}
  }
  if (certRows.length === 0) {
    const memCerts = Array.from(memTables.certificates.values()).filter((c) => c.user_id === row.id);
    if (memCerts.length > 0) certRows = memCerts;
  }

  if ((lessons_completed.length > 0 || (row.xp && Number(row.xp) > 0) || row.assessment_score != null) && certRows.length === 0) {
    const autoCert = {
      issued: true,
      status: 'unlocked',
      credential_id: 'LIT-FOUNDATION-' + row.id.slice(0, 6).toUpperCase(),
      course_id: String(activeCourse || '0'),
      course_title: 'Course 1: Reading Everyday Words',
      score: 100,
      issued_date: new Date().toISOString(),
      ui_language: row.ui_language || 'en',
      learning_language: row.learning_language || 'en',
    };
    certRows = [autoCert];
  }

  const certificates = certRows.map((c) => ({
    issued: true,
    status: c.status || 'unlocked',
    credential_id: c.credential_id,
    course_id: String(c.course_id ?? '0'),
    course_title: c.course_title,
    score: c.score || 100,
    issued_date: c.issued_date,
    ui_language: c.ui_language || row.ui_language || row.preferred_language || 'en',
    learning_language: c.learning_language || row.learning_language || row.preferred_language || 'en',
  }));
  const latestCert = certificates[certificates.length - 1] || defaultCertificate();
  const checkpoint_passed = certificates.length > 0;

  const leagueCertRes = await pool.query(
    'SELECT credential_id, league, league_title, score, issued_date FROM league_certificates WHERE user_id = $1 ORDER BY issued_date',
    [row.id]
  );
  const league_certificates = leagueCertRes.rows.map((c) => ({
    credential_id: c.credential_id,
    league: c.league,
    league_title: c.league_title,
    score: c.score,
    issued_date: c.issued_date,
  }));

  let badges = [];
  try {
    const badgeRes = await pool.query('SELECT badge_id FROM user_badges WHERE user_id = $1 ORDER BY unlocked_at', [row.id]);
    badges = badgeRes.rows.map((b) => b.badge_id);
  } catch (_) {}

  let unlocked_skins = ['classic'];
  let equipped_skin = 'classic';
  let streak_savers = 0;
  try {
    const skinRes = await pool.query('SELECT skin_id FROM user_skins WHERE user_id = $1', [row.id]);
    const skins = skinRes.rows.map((s) => s.skin_id);
    unlocked_skins = Array.from(new Set(['classic', ...skins]));
  } catch (_) {}
  try {
    const prefRes = await pool.query('SELECT equipped_skin, streak_savers FROM user_shop_custom WHERE user_id = $1', [row.id]);
    if (prefRes.rows[0]?.equipped_skin) equipped_skin = prefRes.rows[0].equipped_skin;
    if (prefRes.rows[0]?.streak_savers !== undefined) streak_savers = Number(prefRes.rows[0].streak_savers) || 0;
  } catch (_) {}

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role || 'student',
    preferred_language: row.preferred_language,
    uiLanguage: row.ui_language || row.preferred_language || 'en',
    learningLanguage: row.learning_language || row.preferred_language || 'en',
    education_level: row.education_level,
    assessment_score: row.assessment_score,
    current_path: row.current_path,
    course_progress: {
      course_id: activeCourse,
      lessons_completed,
      lesson_scores,
      checkpoint_passed,
      checkpoint_score: latestCert.score || null,
    },
    streak,
    gems: row.gems || 0,
    xp: row.xp || 0,
    league: row.league || 'bronze',
    certificate: latestCert,
    certificates,
    league_certificates,
    badges,
    equipped_skin,
    unlocked_skins,
    streak_savers,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getDbStatus() {
  try {
    const pool = getPool();
    const userRes = await pool.query('SELECT COUNT(*) as count FROM users');
    const regRes = await pool.query('SELECT COUNT(*) as count FROM registrations');
    const loginRes = await pool.query('SELECT COUNT(*) as count FROM login_events');

    return {
      ok: true,
      engine: 'supabase-postgresql',
      url: SUPABASE_URL,
      users: parseInt(userRes.rows[0]?.count || 0, 10),
      registrations: parseInt(regRes.rows[0]?.count || 0, 10),
      login_events: parseInt(loginRes.rows[0]?.count || 0, 10),
    };
  } catch (err) {
    return {
      ok: false,
      engine: 'supabase-postgresql',
      url: SUPABASE_URL,
      error: err.message,
    };
  }
}

export async function listUsers() {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
  const users = await Promise.all(res.rows.map(rowToUser));
  return users.map(sanitizeUser);
}

export async function findUserByEmail(email) {
  const pool = getPool();
  const needle = String(email || '').toLowerCase().trim();
  const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [needle]);
  return rowToUser(res.rows[0]);
}

export async function findUserById(id) {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rowToUser(res.rows[0]);
}

export async function createUser(data) {
  const pool = getPool();
  const email = String(data.email || '').toLowerCase().trim();
  if (!email || !email.includes('@')) {
    const err = new Error('Valid email is required');
    err.status = 400;
    throw err;
  }

  const existingRes = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [email]);
  if (existingRes.rows.length > 0) {
    const err = new Error('Email already registered. Please log in instead.');
    err.status = 409;
    throw err;
  }
  if (!String(data.name || '').trim()) {
    const err = new Error('Full name is required');
    err.status = 400;
    throw err;
  }
  if (!data.password) {
    const err = new Error('Password is required');
    err.status = 400;
    throw err;
  }

  const now = new Date().toISOString();
  const id = randomUUID();
  const name = String(data.name).trim();
  const preferred_language = data.preferred_language || 'en';
  const ui_language = data.uiLanguage || data.ui_language || preferred_language;
  const learning_language = data.learningLanguage || data.learning_language || preferred_language;
  const education_level = data.education_level || 'Primary School';
  const role = data.role === 'mentor' ? 'mentor' : (data.role === 'admin' ? 'admin' : 'student');

  const defaultProgressJson = JSON.stringify(defaultCourseProgress());
  const defaultStreakJson = JSON.stringify(defaultStreak());
  const defaultCertJson = JSON.stringify(defaultCertificate());
  const defaultCertsJson = JSON.stringify([]);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      INSERT INTO users (
        id, name, email, password, role, preferred_language, ui_language, learning_language, education_level,
        assessment_score, current_path, course_progress, streak, gems, xp,
        certificate, certificates, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    `, [
      id, name, email, data.password, role, preferred_language, ui_language, learning_language, education_level,
      null, null, defaultProgressJson, defaultStreakJson, 0, 0,
      defaultCertJson, defaultCertsJson, now, now
    ]);

    await client.query(`
      INSERT INTO user_streaks (user_id, current_streak, goal, last_activity)
      VALUES ($1, $2, $3, $4)
    `, [id, 0, 14, null]);

    await client.query(`
      INSERT INTO registrations (id, user_id, email, name, preferred_language, education_level, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [randomUUID(), id, email, name, preferred_language, education_level, now]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return sanitizeUser(await findUserById(id));
}

export async function updateUser(id, updates) {
  const pool = getPool();
  const existing = await findUserById(id);
  if (!existing) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const rawName = updates.name !== undefined ? String(updates.name).trim() : existing.name;
  const name = rawName || existing.name || (existing.email ? existing.email.split('@')[0] : 'User');
  const rawEmail = updates.email !== undefined ? String(updates.email).toLowerCase().trim() : existing.email;
  const email = rawEmail || existing.email;

  if (updates.email !== undefined && email !== existing.email) {
    const emailInUse = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1 AND id != $2', [email, id]);
    if (emailInUse.rows.length > 0) {
      const err = new Error('Email address is already in use by another account');
      err.status = 409;
      throw err;
    }
  }

  const password = updates.password !== undefined ? updates.password : existing.password;
  const role = updates.role !== undefined ? updates.role : existing.role;
  const preferred_language = updates.preferred_language !== undefined ? updates.preferred_language : existing.preferred_language;
  const ui_language = updates.ui_language ?? updates.uiLanguage ?? existing.uiLanguage ?? preferred_language;
  const learning_language = updates.learning_language ?? updates.learningLanguage ?? existing.learningLanguage ?? preferred_language;
  const education_level = updates.education_level !== undefined ? updates.education_level : existing.education_level;
  const assessment_score = updates.assessment_score !== undefined ? updates.assessment_score : existing.assessment_score;
  const current_path = updates.current_path !== undefined ? updates.current_path : existing.current_path;
  const gems = updates.gems !== undefined ? updates.gems : existing.gems;
  const xp = updates.xp !== undefined ? updates.xp : existing.xp;
  const updated_at = new Date().toISOString();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      UPDATE users SET
        name = $1, email = $2, password = $3, role = $4,
        preferred_language = $5, ui_language = $6, learning_language = $7,
        education_level = $8, assessment_score = $9, current_path = $10,
        gems = $11, xp = $12, updated_at = $13
      WHERE id = $14
    `, [
      name, email, password, role,
      preferred_language, ui_language, learning_language,
      education_level, assessment_score, current_path,
      gems, xp, updated_at, id
    ]);

    await client.query(`
      UPDATE registrations SET email = $1, name = $2 WHERE user_id = $3
    `, [email, name, id]);

    if (updates.streak) {
      const s = { ...existing.streak, ...updates.streak };
      await client.query(`
        INSERT INTO user_streaks (user_id, current_streak, goal, last_activity)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT(user_id) DO UPDATE SET
          current_streak = EXCLUDED.current_streak,
          goal = EXCLUDED.goal,
          last_activity = EXCLUDED.last_activity
      `, [id, s.current || 0, s.goal || 14, s.last_activity || null]);
    }

    if (updates.course_progress?.lessons_completed) {
      for (const lessonId of updates.course_progress.lessons_completed) {
        const score = updates.course_progress.lesson_scores?.[lessonId] || 0;
        const correctCount = updates.course_progress.lesson_correct_counts?.[lessonId] || 0;
        const totalQuestions = updates.course_progress.lesson_question_counts?.[lessonId] || 0;
        await client.query(`
          INSERT INTO user_course_lesson_progress (user_id, course_id, lesson_id, score, correct_count, total_questions, completed_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT(user_id, course_id, lesson_id) DO UPDATE SET
            score = EXCLUDED.score,
            correct_count = EXCLUDED.correct_count,
            total_questions = EXCLUDED.total_questions,
            completed_at = EXCLUDED.completed_at
        `, [id, updates.course_progress.course_id || null, String(lessonId), score, correctCount, totalQuestions, nowStr()]);
      }
    }

    if (updates.certificate?.issued) {
      const cert = updates.certificate;
      await client.query(`
        INSERT INTO certificates (credential_id, user_id, course_id, course_title, score, issued_date, status, ui_language, learning_language)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT(credential_id) DO UPDATE SET
          score = EXCLUDED.score,
          status = EXCLUDED.status
      `, [
        cert.credential_id || 'LIT-' + randomUUID().slice(0, 8).toUpperCase(),
        id,
        cert.course_id || 'course_1',
        cert.course_title || 'Literacy Course',
        cert.score || 80,
        cert.issued_date || nowStr(),
        cert.status || 'unlocked',
        cert.ui_language || existing.uiLanguage || 'en',
        cert.learning_language || existing.learningLanguage || 'en'
      ]);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return sanitizeUser(await findUserById(id));
}

export async function awardUserReward(userId, { eventId, xp = 0, gems = 0 }) {
  const pool = getPool();
  const normalizedEventId = String(eventId || '').trim();
  const rewardXp = Math.max(0, Math.floor(Number(xp) || 0));
  const rewardGems = Math.max(0, Math.floor(Number(gems) || 0));
  if (!normalizedEventId) {
    const err = new Error('Reward event id is required');
    err.status = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = await client.query(`
      INSERT INTO user_reward_events (user_id, event_id, xp, gems, created_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT(user_id, event_id) DO NOTHING
    `, [userId, normalizedEventId, rewardXp, rewardGems, nowStr()]);

    if (inserted.rowCount > 0) {
      await client.query(
        'UPDATE users SET xp = xp + $1, gems = gems + $2, updated_at = $3 WHERE id = $4',
        [rewardXp, rewardGems, nowStr(), userId]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return bumpActivity(userId);
}

export async function awardUserBadge(userId, badgeId) {
  const pool = getPool();
  const normalizedBadgeId = String(badgeId || '').trim();
  if (!normalizedBadgeId) return sanitizeUser(await findUserById(userId));

  try {
    await pool.query(`
      INSERT INTO user_badges (user_id, badge_id, unlocked_at)
      VALUES ($1, $2, $3)
      ON CONFLICT(user_id, badge_id) DO NOTHING
    `, [userId, normalizedBadgeId, nowStr()]);
  } catch (_) {}

  return sanitizeUser(await findUserById(userId));
}

export const BIRD_SKIN_PRICES = {
  classic: 0,
  blue: 100,
  green: 100,
  golden: 300,
};

export async function buyUserSkin(userId, skinId) {
  const pool = getPool();
  const validSkins = ['classic', 'blue', 'green', 'golden'];
  if (!validSkins.includes(skinId)) {
    const err = new Error('Invalid skin identifier');
    err.status = 400;
    throw err;
  }
  const user = await findUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  if (user.unlocked_skins && user.unlocked_skins.includes(skinId)) {
    return equipUserSkin(userId, skinId);
  }

  const price = BIRD_SKIN_PRICES[skinId] || 0;
  if ((user.gems || 0) < price) {
    const err = new Error(`Insufficient gems. ${price} diamonds required.`);
    err.status = 400;
    throw err;
  }

  const nextGems = Math.max(0, (user.gems || 0) - price);
  await pool.query('UPDATE users SET gems = $1 WHERE id = $2', [nextGems, userId]);
  await pool.query(`
    INSERT INTO user_skins (user_id, skin_id, unlocked_at)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, skin_id) DO NOTHING
  `, [userId, skinId, nowStr()]);
  await pool.query(`
    INSERT INTO user_shop_custom (user_id, equipped_skin, streak_savers)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id) DO UPDATE SET equipped_skin = EXCLUDED.equipped_skin
  `, [userId, skinId, user.streak_savers || 0]);

  return sanitizeUser(await findUserById(userId));
}

export async function equipUserSkin(userId, skinId) {
  const pool = getPool();
  const validSkins = ['classic', 'blue', 'green', 'golden'];
  if (!validSkins.includes(skinId)) {
    const err = new Error('Invalid skin identifier');
    err.status = 400;
    throw err;
  }
  const user = await findUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  if (skinId !== 'classic' && (!user.unlocked_skins || !user.unlocked_skins.includes(skinId))) {
    const err = new Error('Skin must be unlocked before equipping');
    err.status = 400;
    throw err;
  }

  await pool.query(`
    INSERT INTO user_shop_custom (user_id, equipped_skin, streak_savers)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id) DO UPDATE SET equipped_skin = EXCLUDED.equipped_skin
  `, [userId, skinId, user.streak_savers || 0]);

  return sanitizeUser(await findUserById(userId));
}

export async function buyUserStreakSaver(userId) {
  const pool = getPool();
  const price = 25;
  const user = await findUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  if ((user.gems || 0) < price) {
    const err = new Error('Insufficient gems. 25 diamonds required to purchase Streak Saver.');
    err.status = 400;
    throw err;
  }

  const nextGems = Math.max(0, (user.gems || 0) - price);
  const currentSavers = (user.streak_savers || 0) + 1;

  await pool.query('UPDATE users SET gems = $1 WHERE id = $2', [nextGems, userId]);
  await pool.query(`
    INSERT INTO user_shop_custom (user_id, equipped_skin, streak_savers)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id) DO UPDATE SET streak_savers = EXCLUDED.streak_savers
  `, [userId, user.equipped_skin || 'classic', currentSavers]);

  // If the user currently had 0 streak, restore/keep it at minimum 1 so streak is preserved
  if (!user.streak || user.streak.current < 1) {
    await pool.query(`
      INSERT INTO user_streaks (user_id, current_streak, goal, last_activity)
      VALUES ($1, 1, 7, $2)
      ON CONFLICT(user_id) DO UPDATE SET current_streak = 1, last_activity = $2
    `, [userId, nowStr()]);
  }

  return sanitizeUser(await findUserById(userId));
}

export async function useUserStreakSaver(userId) {
  const pool = getPool();
  const user = await findUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  if ((user.streak_savers || 0) <= 0) {
    const err = new Error('No Streak Savers available in inventory.');
    err.status = 400;
    throw err;
  }

  const nextSavers = Math.max(0, (user.streak_savers || 0) - 1);
  await pool.query(`
    INSERT INTO user_shop_custom (user_id, equipped_skin, streak_savers)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id) DO UPDATE SET streak_savers = EXCLUDED.streak_savers
  `, [userId, user.equipped_skin || 'classic', nextSavers]);

  // Keep/repair streak
  const currentStreak = Math.max(user.streak?.current || 0, 1);
  await pool.query(`
    INSERT INTO user_streaks (user_id, current_streak, goal, last_activity)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT(user_id) DO UPDATE SET current_streak = $2, last_activity = $4
  `, [userId, currentStreak, user.streak?.goal || 7, nowStr()]);

  return sanitizeUser(await findUserById(userId));
}

function nowStr() {
  return new Date().toISOString();
}

export async function getUserWithPassword(email) {
  return findUserByEmail(email);
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

export async function recordLoginEvent({ userId = null, email, success, ip = null, userAgent = null }) {
  const pool = getPool();
  await pool.query(`
    INSERT INTO login_events (id, user_id, email, success, ip, user_agent, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    randomUUID(),
    userId,
    String(email || '').toLowerCase(),
    success ? 1 : 0,
    ip,
    userAgent,
    nowStr()
  ]);
}

export async function bumpActivity(userId, { xp = 0, gems = 0 } = {}) {
  const user = await findUserById(userId);
  if (!user) return null;

  const dayKey = (value = new Date()) => new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(value);
  const today = dayKey();
  const last = user.streak.last_activity
    ? dayKey(new Date(user.streak.last_activity))
    : null;

  let current = user.streak.current || 0;
  if (last !== today) {
    if (last) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const y = dayKey(yesterday);
      current = last === y ? current + 1 : 1;
    } else {
      current = 1;
    }
  }

  return updateUser(userId, {
    xp: (user.xp || 0) + xp,
    gems: (user.gems || 0) + gems,
    streak: {
      current,
      goal: user.streak.goal || 14,
      last_activity: new Date().toISOString(),
    },
  });
}

export async function getCoursesFromDb(lang = null) {
  const pool = getPool();
  let res;
  if (lang) {
    res = await pool.query('SELECT data FROM courses WHERE lang = $1', [lang]);
  } else {
    res = await pool.query('SELECT data FROM courses');
  }
  return res.rows.map((r) => (typeof r.data === 'string' ? JSON.parse(r.data) : r.data));
}

export async function getLessonScores(userId, courseId) {
  const pool = getPool();
  const res = await pool.query(
    'SELECT lesson_id, score FROM user_course_lesson_progress WHERE user_id = $1 AND course_id = $2',
    [userId, courseId]
  );
  return res.rows;
}

export async function getCourseProgress(userId, courseId) {
  const pool = getPool();
  const lessonsRes = await pool.query(
    'SELECT lesson_id, score, correct_count, total_questions FROM user_course_lesson_progress WHERE user_id = $1 AND course_id = $2 ORDER BY completed_at',
    [userId, courseId]
  );
  const progressRes = await pool.query(
    'SELECT checkpoint_passed, checkpoint_score, final_assessment_passed FROM user_course_progress WHERE user_id = $1 AND course_id = $2',
    [userId, courseId]
  );
  const lessons = lessonsRes.rows;
  const progress = progressRes.rows[0];

  return {
    course_id: courseId,
    lessons_completed: lessons.map((row) => (/^\d+$/.test(String(row.lesson_id)) ? Number(row.lesson_id) : row.lesson_id)),
    lesson_scores: lessons.reduce((acc, row) => ({ ...acc, [row.lesson_id]: row.score || 0 }), {}),
    correct_answers: lessons.reduce((total, row) => total + (row.correct_count || 0), 0),
    total_questions: lessons.reduce((total, row) => total + (row.total_questions || 0), 0),
    checkpoint_passed: Boolean(progress?.checkpoint_passed),
    checkpoint_score: progress?.checkpoint_score ?? null,
    final_assessment_passed: Boolean(progress?.final_assessment_passed),
  };
}

export async function recordCourseCheckpoint(userId, courseId, { passed, score }) {
  const pool = getPool();
  await pool.query(`
    INSERT INTO user_course_progress (user_id, course_id, checkpoint_passed, checkpoint_score)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT(user_id, course_id) DO UPDATE SET
      checkpoint_passed = EXCLUDED.checkpoint_passed,
      checkpoint_score = EXCLUDED.checkpoint_score
  `, [userId, courseId, passed ? 1 : 0, score]);
}

export async function getCertificateForCourse(userId, courseId = null) {
  const pool = getPool();
  let res;
  if (courseId) {
    res = await pool.query(
      'SELECT credential_id, course_id, course_title, score, issued_date, status, ui_language, learning_language FROM certificates WHERE user_id = $1 AND course_id = $2 ORDER BY issued_date DESC LIMIT 1',
      [userId, courseId]
    );
  } else {
    res = await pool.query(
      'SELECT credential_id, course_id, course_title, score, issued_date, status, ui_language, learning_language FROM certificates WHERE user_id = $1 ORDER BY issued_date DESC LIMIT 1',
      [userId]
    );
  }
  const row = res.rows[0];
  return row ? { issued: true, status: row.status || 'unlocked', ...row } : null;
}

export async function issueCourseCertificate({ userId, courseId, courseTitle, score, uiLanguage, learningLanguage }) {
  try {
    const existing = await getCertificateForCourse(userId, courseId);
    if (existing) return existing;
  } catch (_) {}

  const certificate = {
    issued: true,
    status: 'unlocked',
    credential_id: 'LIT-' + randomUUID().slice(0, 8).toUpperCase(),
    course_id: String(courseId),
    course_title: courseTitle || 'Foundational Literacy Certificate',
    score: Number(score) || 90,
    issued_date: nowStr(),
    ui_language: uiLanguage || 'en',
    learning_language: learningLanguage || 'en',
  };

  try {
    const pool = getPool();
    await pool.query(`
      INSERT INTO certificates (credential_id, user_id, course_id, course_title, score, issued_date, status, ui_language, learning_language)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT(credential_id) DO NOTHING
    `, [
      certificate.credential_id, userId, certificate.course_id, certificate.course_title,
      certificate.score, certificate.issued_date, certificate.status, certificate.ui_language, certificate.learning_language
    ]);
  } catch (err) {
    console.warn('issueCourseCertificate Postgres note:', err.message);
  }

  try {
    await supabase.from('certificates').upsert({
      credential_id: certificate.credential_id,
      user_id: userId,
      course_id: certificate.course_id,
      course_title: certificate.course_title,
      score: certificate.score,
      issued_date: certificate.issued_date,
      status: certificate.status,
      ui_language: certificate.ui_language,
      learning_language: certificate.learning_language,
    });
  } catch (sErr) {
    console.warn('issueCourseCertificate Supabase note:', sErr?.message);
  }

  memTables.certificates.set(certificate.credential_id, { ...certificate, user_id: userId });

  return certificate;
}

export async function getCourseScores(userId, courseId) {
  const pool = getPool();
  const strId = String(courseId || '0');
  const altId = strId === '0' ? 'foundation' : (strId === '1' ? 'beginner' : (strId === '2' ? 'intermediate' : (strId === '3' ? 'advanced' : (strId === 'foundation' ? '0' : strId))));

  const lessonRowsRes = await pool.query(
    'SELECT lesson_id, score FROM user_course_lesson_progress WHERE user_id = $1 AND (course_id = $2 OR course_id = $3)',
    [userId, strId, altId]
  );
  const certRowRes = await pool.query(
    'SELECT score FROM certificates WHERE user_id = $1 AND (course_id = $2 OR course_id = $3)',
    [userId, strId, altId]
  );

  let lessonScores = lessonRowsRes.rows.map((r) => ({ lesson_id: r.lesson_id, score: r.score || 0 }));
  let checkpointScore = certRowRes.rows[0]?.score || null;

  if (lessonScores.length === 0) {
    const user = await findUserById(userId);
    const prog = user?.course_progress;
    if (prog && (String(prog.course_id) === strId || String(prog.course_id) === altId || (strId === '0' && prog.lessons_completed?.length > 0))) {
      lessonScores = (prog.lessons_completed || []).map((lid) => ({
        lesson_id: lid,
        score: prog.lesson_scores?.[lid] || 100,
      }));
    }
  }

  const allScores = lessonScores.map((l) => l.score);
  if (checkpointScore != null) allScores.push(checkpointScore);
  const courseAverage = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : (lessonScores.length > 0 ? 100 : 0);

  return { lessons: lessonScores, checkpoint_score: checkpointScore, course_average: courseAverage };
}

export async function getAssessmentsFromDb() {
  const pool = getPool();
  const res = await pool.query('SELECT data FROM assessments');
  return res.rows.map((r) => (typeof r.data === 'string' ? JSON.parse(r.data) : r.data));
}

export async function getLeagueExamFromDb(league, uiLanguage = 'en', learningLanguage = uiLanguage) {
  const cleanUi = uiLanguage || 'en';
  const cleanLearning = learningLanguage || cleanUi;
  try {
    const pool = getPool();
    const pair = `${cleanUi}__${cleanLearning}`;
    const res = await pool.query('SELECT data FROM league_exams WHERE league = $1 AND lang = $2', [league, pair]);
    const row = res?.rows?.[0];
    if (row && row.data) {
      return typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    }
  } catch (err) {
    console.warn('DB league exam fetch error, using canonical fallback:', err?.message);
  }

  // Always fallback to built-in canonical exam bank so exams NEVER fail or return 404
  return buildLeagueExam(league, cleanUi, cleanLearning);
}

export async function saveLeagueExamToDb(id, league, lang, data) {
  const pool = getPool();
  await pool.query(`
    INSERT INTO league_exams (id, league, lang, data)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT(id) DO UPDATE SET data = EXCLUDED.data
  `, [id, league, lang, JSON.stringify(data)]);
}

export async function promoteUserLeague(userId, newLeague, certificateLeague, leagueTitle, score) {
  const pool = getPool();
  const now = new Date().toISOString();
  const credential_id = 'LIT-LEAGUE-' + randomUUID().slice(0, 8).toUpperCase();

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE users SET league = $1, updated_at = $2 WHERE id = $3', [newLeague, now, userId]);
      await client.query(`
        INSERT INTO league_certificates (credential_id, user_id, league, league_title, score, issued_date)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [credential_id, userId, certificateLeague, leagueTitle, score, now]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('Postgres promoteUserLeague fallback:', err.message);
    try {
      await supabase.from('users').update({ league: newLeague, updated_at: now }).eq('id', userId);
      await supabase.from('league_certificates').insert({
        credential_id,
        user_id: userId,
        league: certificateLeague,
        league_title: leagueTitle,
        score,
        issued_date: now,
      });
    } catch (sErr) {
      console.warn('Supabase promoteUserLeague note:', sErr?.message);
    }
    const memUser = memTables.users.get(userId);
    if (memUser) {
      memUser.league = newLeague;
      memUser.updated_at = now;
      memTables.users.set(userId, memUser);
    }
    const certItem = { credential_id, user_id: userId, league: certificateLeague, league_title: leagueTitle, score, issued_date: now };
    memTables.league_certificates.set(credential_id, certItem);
  }

  return { credential_id, league: certificateLeague, league_title: leagueTitle, score, issued_date: now };
}

export async function assertStoreWritable() {
  return getDbStatus();
}

export async function getCommunityPosts() {
  const pool = getPool();
  const res = await pool.query(`
    SELECT cp.*, u.name as registered_user_name
    FROM community_posts cp
    LEFT JOIN users u ON cp.user_id = u.id
    ORDER BY cp.created_at DESC
  `);
  return res.rows.map((r) => ({
    ...r,
    user_name: r.registered_user_name || r.user_name,
    achievement_meta: typeof r.achievement_meta === 'string' ? JSON.parse(r.achievement_meta) : r.achievement_meta,
  }));
}

export async function createCommunityPost({ userId, userName, type, content, imageUrl = null, achievementMeta = null, language = 'en' }) {
  const pool = getPool();
  const id = 'post_' + randomUUID();
  const createdAt = new Date().toISOString();

  const userRes = await pool.query('SELECT name, preferred_language FROM users WHERE id = $1', [userId]);
  const userRow = userRes.rows[0];
  const actualUserName = userRow?.name || userName || 'Learner';
  const actualLanguage = language || userRow?.preferred_language || 'en';

  await pool.query(`
    INSERT INTO community_posts (id, user_id, user_name, type, content, image_url, achievement_meta, language, likes, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `, [id, userId, actualUserName, type, content, imageUrl, achievementMeta ? JSON.stringify(achievementMeta) : null, actualLanguage, 0, createdAt]);

  return {
    id,
    user_id: userId,
    user_name: actualUserName,
    type,
    content,
    image_url: imageUrl,
    achievement_meta: achievementMeta,
    language: actualLanguage,
    likes: 0,
    created_at: createdAt,
  };
}

export async function likeCommunityPost(postId) {
  const pool = getPool();
  const res = await pool.query('UPDATE community_posts SET likes = likes + 1 WHERE id = $1 RETURNING likes', [postId]);
  if (res.rows.length === 0) return null;
  return { id: postId, likes: res.rows[0].likes };
}

export async function deleteCommunityPost(postId, userId) {
  const pool = getPool();
  const check = await pool.query('SELECT user_id FROM community_posts WHERE id = $1', [postId]);
  if (check.rows.length === 0) {
    const err = new Error('Post not found');
    err.status = 404;
    throw err;
  }
  if (check.rows[0].user_id !== userId) {
    const err = new Error('Unauthorized to delete this post');
    err.status = 403;
    throw err;
  }
  await pool.query('DELETE FROM community_posts WHERE id = $1', [postId]);
  return { success: true, id: postId };
}

const ALL_ALPHABETS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

export async function recordAlphabetWritingAttempt({ userId, letter, type = 'letter', word = '', score = 0, timeSpent = 0, eventId = null }) {
  const pool = getPool();
  const now = new Date().toISOString();
  const upperLetter = String(letter || 'A').toUpperCase();
  const isPassed = Number(score) >= 70 ? 1 : 0;

  const existingRes = await pool.query(`
    SELECT * FROM user_alphabet_writing_progress 
    WHERE user_id = $1 AND letter = $2 AND type = $3
  `, [userId, upperLetter, type]);
  const existing = existingRes.rows[0];

  let recordId;
  let previouslyCompleted = 0;

  if (existing) {
    recordId = existing.id;
    previouslyCompleted = existing.completed;
    const newAttempts = (existing.attempts || 1) + 1;
    const bestScore = Math.max(existing.score || 0, Number(score));
    const newCompleted = existing.completed || isPassed;
    const totalTimeSpent = (existing.time_spent || 0) + Number(timeSpent || 0);

    await pool.query(`
      UPDATE user_alphabet_writing_progress
      SET score = $1, attempts = $2, time_spent = $3, completed = $4, word = $5, updated_at = $6
      WHERE id = $7
    `, [bestScore, newAttempts, totalTimeSpent, newCompleted, word || existing.word, now, recordId]);
  } else {
    recordId = 'awp_' + randomUUID();
    await pool.query(`
      INSERT INTO user_alphabet_writing_progress
      (id, user_id, letter, type, word, score, attempts, time_spent, completed, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [recordId, userId, upperLetter, type, word, Number(score), 1, Number(timeSpent || 0), isPassed, now, now]);
  }

  let awarded = { xp: 0, gems: 0, badge: null, allCompleted: false };
  let updatedUser = await findUserById(userId);

  if (isPassed && !previouslyCompleted) {
    const rewardXp = type === 'letter' ? 10 : 20;
    const rewardGems = type === 'letter' ? 1 : 2;
    const evId = eventId || `awp:${userId}:${upperLetter}:${type}:${Date.now()}`;
    updatedUser = await awardUserReward(userId, { eventId: evId, xp: rewardXp, gems: rewardGems });
    awarded.xp += rewardXp;
    awarded.gems += rewardGems;
  }

  const completedRes = await pool.query(`
    SELECT letter, type FROM user_alphabet_writing_progress
    WHERE user_id = $1 AND completed = 1
  `, [userId]);
  const completedRows = completedRes.rows;

  const completedLetters = new Set(completedRows.filter((r) => r.type === 'letter').map((r) => r.letter));
  const completedWords = new Set(completedRows.filter((r) => r.type === 'word').map((r) => r.letter));

  const allLettersDone = ALL_ALPHABETS.every((l) => completedLetters.has(l));
  const allWordsDone = ALL_ALPHABETS.every((l) => completedWords.has(l));

  if (allLettersDone && allWordsDone) {
    awarded.allCompleted = true;
    const completionEvId = `awp_master:${userId}:all_completed`;
    try {
      updatedUser = await awardUserReward(userId, { eventId: completionEvId, xp: 500, gems: 50 });
      awarded.xp += 500;
      awarded.gems += 50;
    } catch (_) {}
    try {
      updatedUser = await awardUserBadge(userId, 'english_alphabet_master');
      awarded.badge = 'english_alphabet_master';
    } catch (_) {}
  }

  return {
    success: true,
    user: updatedUser,
    recordId,
    letter: upperLetter,
    type,
    score: Number(score),
    passed: Boolean(isPassed),
    awarded,
  };
}

export async function getAlphabetWritingProgress(userId) {
  const pool = getPool();
  const res = await pool.query(`
    SELECT * FROM user_alphabet_writing_progress
    WHERE user_id = $1
    ORDER BY letter ASC, type ASC
  `, [userId]);
  const rows = res.rows;

  const progressMap = {};
  for (const r of rows) {
    if (!progressMap[r.letter]) {
      progressMap[r.letter] = { letterCompleted: false, wordCompleted: false, letterScore: 0, wordScore: 0, attempts: 0 };
    }
    if (r.type === 'letter') {
      progressMap[r.letter].letterCompleted = Boolean(r.completed);
      progressMap[r.letter].letterScore = r.score;
    } else if (r.type === 'word') {
      progressMap[r.letter].wordCompleted = Boolean(r.completed);
      progressMap[r.letter].wordScore = r.score;
    }
    progressMap[r.letter].attempts += r.attempts || 1;
  }

  let highestUnlockedIndex = 0;
  for (let i = 0; i < ALL_ALPHABETS.length; i++) {
    const letter = ALL_ALPHABETS[i];
    const prevLetter = i > 0 ? ALL_ALPHABETS[i - 1] : null;
    if (i === 0) {
      highestUnlockedIndex = 0;
    } else if (prevLetter && progressMap[prevLetter]?.letterCompleted && progressMap[prevLetter]?.wordCompleted) {
      highestUnlockedIndex = i;
    }
  }

  const completedCount = ALL_ALPHABETS.filter((l) => progressMap[l]?.letterCompleted && progressMap[l]?.wordCompleted).length;
  const completionPercentage = Math.round((completedCount / 26) * 100);

  return {
    progressMap,
    highestUnlockedIndex,
    completedCount,
    totalAlphabets: 26,
    completionPercentage,
    allCompleted: completedCount === 26,
  };
}

export async function getAlphabetWritingMentorAnalytics() {
  const pool = getPool();
  const res = await pool.query(`
    SELECT ap.*, u.name as user_name, u.email as user_email
    FROM user_alphabet_writing_progress ap
    JOIN users u ON ap.user_id = u.id
    WHERE u.role = 'student'
  `);
  const allRows = res.rows;

  const letterStats = {};
  for (const letter of ALL_ALPHABETS) {
    letterStats[letter] = { letter, attempts: 0, completions: 0, scores: [], avgScore: 0 };
  }

  const userProgress = {};
  for (const r of allRows) {
    const letter = r.letter.toUpperCase();
    if (letterStats[letter]) {
      letterStats[letter].attempts += r.attempts || 1;
      if (r.completed) letterStats[letter].completions += 1;
      letterStats[letter].scores.push(r.score);
    }

    if (!userProgress[r.user_id]) {
      userProgress[r.user_id] = {
        userId: r.user_id,
        name: r.user_name,
        email: r.user_email,
        completedLetters: new Set(),
        scores: [],
        totalAttempts: 0,
      };
    }
    if (r.completed) userProgress[r.user_id].completedLetters.add(letter);
    userProgress[r.user_id].scores.push(r.score);
    userProgress[r.user_id].totalAttempts += r.attempts || 1;
  }

  for (const letter of ALL_ALPHABETS) {
    const s = letterStats[letter];
    s.avgScore = s.scores.length > 0 ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) : 0;
  }

  const lettersWithData = Object.values(letterStats).filter((l) => l.scores.length > 0);
  const mostDifficultLetters = [...lettersWithData].sort((a, b) => a.avgScore - b.avgScore).slice(0, 5);

  const learners = Object.values(userProgress).map((u) => ({
    userId: u.userId,
    name: u.name,
    email: u.email,
    completedCount: u.completedLetters.size,
    completionPercentage: Math.round((u.completedLetters.size / 26) * 100),
    avgScore: u.scores.length > 0 ? Math.round(u.scores.reduce((a, b) => a + b, 0) / u.scores.length) : 0,
    totalAttempts: u.totalAttempts,
  }));

  const topPerformers = [...learners].sort((a, b) => b.completedCount - a.completedCount || b.avgScore - a.avgScore).slice(0, 5);
  const atRiskLearners = learners.filter((l) => l.avgScore > 0 && l.avgScore < 70);

  const totalScores = allRows.map((r) => r.score);
  const overallAvgAccuracy = totalScores.length > 0 ? Math.round(totalScores.reduce((a, b) => a + b, 0) / totalScores.length) : 0;

  return {
    totalLearnersTracked: learners.length,
    overallAvgAccuracy,
    letterStats,
    mostDifficultLetters,
    topPerformers,
    atRiskLearners,
  };
}
