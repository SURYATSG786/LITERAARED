const TOKEN_KEY = 'literaai_token';
const ENTRY_PATHS = new Set(['/login', '/register', '/mentor-login']);

export function readSessionToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearSessionToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function writeSessionToken(token) {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function initializeSession(pathname) {
  // Discard legacy persistent tokens rather than silently choosing an account.
  localStorage.removeItem(TOKEN_KEY);
  if (ENTRY_PATHS.has(pathname.replace(/\/$/, ''))) clearSessionToken();
  return readSessionToken();
}
