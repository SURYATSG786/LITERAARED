import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';
import { setAppLanguage } from '../i18n';

const AuthContext = createContext(null);

function getInitialUser() {
  try {
    const raw = localStorage.getItem('literaai_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);
  const [token, setToken] = useState(() => localStorage.getItem('literaai_token'));
  const [loading, setLoading] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  const saveUser = (nextUser) => {
    setUser(nextUser);
    try {
      if (nextUser) {
        localStorage.setItem('literaai_user', JSON.stringify(nextUser));
        if (nextUser.uiLanguage || nextUser.preferred_language) {
          setAppLanguage(nextUser.uiLanguage || nextUser.preferred_language);
        }
      } else {
        localStorage.removeItem('literaai_user');
      }
    } catch {}
  };

  useEffect(() => {
    let alive = true;
    async function boot() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user: me } = await api.me();
        if (!alive) return;
        saveUser(me);
      } catch {
        localStorage.removeItem('literaai_token');
        setToken(null);
        saveUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    }
    boot();
    return () => { alive = false; };
  }, [token]);

  async function login(email, password, languagePair = {}) {
    const data = await api.login({ email, password, ...languagePair });
    localStorage.setItem('literaai_token', data.token);
    setToken(data.token);
    saveUser(data.user);
    setJustLoggedIn(true);
    return data.user;
  }

  async function register(payload) {
    const data = await api.register(payload);
    localStorage.setItem('literaai_token', data.token);
    setToken(data.token);
    saveUser(data.user);
    setJustLoggedIn(true);
    return data.user;
  }

  async function mentorLogin(payload) {
    const data = await api.mentorLogin(payload);
    localStorage.setItem('literaai_token', data.token);
    setToken(data.token);
    saveUser(data.user);
    setJustLoggedIn(true);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('literaai_token');
    setToken(null);
    saveUser(null);
    setJustLoggedIn(false);
  }

  function refreshUser(next) {
    if (next && typeof next === 'object') {
      saveUser(next);
    } else {
      api.me().then((res) => {
        if (res?.user) saveUser(res.user);
      }).catch(() => {});
    }
  }

  function clearJustLoggedIn() {
    setJustLoggedIn(false);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, mentorLogin, logout, refreshUser, setUser: saveUser, justLoggedIn, clearJustLoggedIn }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
