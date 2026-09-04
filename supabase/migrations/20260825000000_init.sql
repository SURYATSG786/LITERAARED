-- LiteraAI Supabase PostgreSQL Schema

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

CREATE INDEX IF NOT EXISTS idx_alphabet_progress_user ON user_alphabet_writing_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_alphabet_progress_letter ON user_alphabet_writing_progress(letter);

-- Disable Row Level Security for backend-controlled application tables
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_streaks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_lesson_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_course_lesson_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_course_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_reward_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS login_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS league_exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS league_certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS community_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS platform_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_alphabet_writing_progress DISABLE ROW LEVEL SECURITY;
