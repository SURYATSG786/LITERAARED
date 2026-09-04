import { verifyToken } from '../utils/auth.js';
import { findUserById, sanitizeUser } from '../services/db.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = verifyToken(token);
    const user = await findUserById(payload.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = sanitizeUser(user);
    req.userRaw = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
