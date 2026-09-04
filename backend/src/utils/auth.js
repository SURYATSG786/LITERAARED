import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const LANGUAGES = ['en', 'hi', 'ta', 'te', 'kn', 'ml'];

export const EDUCATION_LEVELS = [
  'No Formal Education',
  'Primary School',
  'Middle School',
  'High School',
];

export function getPathFromScore(score) {
  if (score <= 25) return 'foundation';
  if (score <= 50) return 'beginner';
  if (score <= 75) return 'intermediate';
  return 'advanced';
}

export function localize(value, lang = 'en') {
  if (value == null) return value;
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (typeof value === 'object' && !Array.isArray(value)) {
    if (value[lang] !== undefined && value[lang] !== null) return value[lang];
    if (value.en !== undefined && value.en !== null) return value.en;
    const first = Object.values(value)[0];
    return first !== undefined ? first : '';
  }
  return value;
}

export function passwordStrengthOk(password) {
  return typeof password === 'string'
    && password.length >= 8
    && /[A-Za-z]/.test(password)
    && /\d/.test(password);
}

const JWT_SECRET = process.env.JWT_SECRET || 'literaai-dev-secret-change-me';
const JWT_EXPIRES = '7d';

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
