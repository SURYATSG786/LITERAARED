import {
  createUser,
  findUserByEmail,
  getUserWithPassword,
  recordLoginEvent,
  sanitizeUser,
  updateUser,
} from '../services/db.js';
import {
  hashPassword,
  comparePassword,
  signToken,
  passwordStrengthOk,
  LANGUAGES,
  EDUCATION_LEVELS,
} from '../utils/auth.js';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function register(req, res) {
  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const preferred_language = body.preferred_language || body.uiLanguage || body.ui_language;
    const uiLanguage = body.uiLanguage || body.ui_language || preferred_language;
    const learningLanguage = body.learningLanguage || body.learning_language || preferred_language;
    const education_level = body.education_level;

    if (!name || !email || !password || !preferred_language || !education_level) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address (e.g. learner@example.com)' });
    }
    if (await findUserByEmail(email)) {
      return res.status(409).json({ error: 'Email already registered. Please log in instead.' });
    }
    if (![preferred_language, uiLanguage, learningLanguage].every((language) => LANGUAGES.includes(language))) {
      return res.status(400).json({ error: 'Invalid preferred language' });
    }
    if (!EDUCATION_LEVELS.includes(education_level)) {
      return res.status(400).json({ error: 'Invalid education level' });
    }
    if (!passwordStrengthOk(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters and include a letter and a number',
      });
    }

    const user = await createUser({
      name,
      email,
      password: hashPassword(password),
      preferred_language,
      uiLanguage,
      learningLanguage,
      education_level,
    });

    const token = signToken(user);
    return res.status(201).json({ token, user, message: 'Registration successful' });
  } catch (err) {
    console.error('register failed:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Registration failed' });
  }
}

export async function login(req, res) {
  try {
    const { email, password, uiLanguage: requestedUiLanguage, ui_language, learningLanguage: requestedLearningLanguage, learning_language } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await getUserWithPassword(email);
    const meta = {
      email,
      ip: req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
    };
    if (!user || !comparePassword(password, user.password)) {
      await recordLoginEvent({ ...meta, userId: user?.id || null, success: false });
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    await recordLoginEvent({ ...meta, userId: user.id, success: true });
    const uiLanguage = requestedUiLanguage || ui_language || user.uiLanguage || user.preferred_language;
    const learningLanguage = requestedLearningLanguage || learning_language || user.learningLanguage || user.preferred_language;
    if (![uiLanguage, learningLanguage].every((language) => LANGUAGES.includes(language))) {
      return res.status(400).json({ error: 'Invalid interface or learning language' });
    }
    // A learner can choose a different pair at every sign-in.  Persist it so
    // all following API requests use the same UI/content-language split.
    const safe = await updateUser(user.id, { uiLanguage, learningLanguage });
    res.json({ token: signToken(safe), user: safe });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
}

const MENTOR_CODE_PATTERN = /^redmentor\d+$/;

export async function mentorLogin(req, res) {
  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const mentorCode = String(body.mentorCode || '');
    const uiLanguage = body.uiLanguage || body.ui_language;

    if (!email || !mentorCode || !uiLanguage) {
      return res.status(400).json({ error: 'Email, mentor code, and interface language are required' });
    }
    if (!email.includes('@')) return res.status(400).json({ error: 'Enter a valid email address' });
    if (!email.endsWith('@redbirdliteraai.in')) {
      return res.status(400).json({ error: 'Use an email ending in @redbirdliteraai.in' });
    }
    if (!LANGUAGES.includes(uiLanguage)) return res.status(400).json({ error: 'Invalid interface language' });
    if (!MENTOR_CODE_PATTERN.test(mentorCode)) {
      return res.status(401).json({ error: 'Mentor code must be redmentor followed by a number' });
    }

    const existing = await findUserByEmail(email);
    let user;
    if (existing) {
      if (existing.role !== 'mentor' || !comparePassword(mentorCode, existing.password)) {
        await recordLoginEvent({ email, userId: existing.id, success: false });
        return res.status(401).json({ error: 'Invalid mentor email or code' });
      }
      user = await updateUser(existing.id, { uiLanguage, learningLanguage: uiLanguage });
    } else {
      user = await createUser({
        name: email.split('@')[0].replace(/[._-]+/g, ' ').trim() || 'Mentor',
        email,
        password: hashPassword(mentorCode),
        role: 'mentor',
        preferred_language: uiLanguage,
        uiLanguage,
        learningLanguage: uiLanguage,
        education_level: 'Primary School',
      });
    }

    await recordLoginEvent({ email, userId: user.id, success: true });
    return res.json({ token: signToken(user), user });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Mentor login failed' });
  }
}
