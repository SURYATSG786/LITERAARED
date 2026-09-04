import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';
import { setAppLanguage } from '../i18n';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('literaai_token'));
  const [loading, setLoading] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

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
        setUser(me);
        if (me.uiLanguage || me.preferred_language) {
          await setAppLanguage(me.uiLanguage || me.preferred_language);
        }
      } catch {
        localStorage.removeItem('literaai_token');
        setToken(null);
        setUser(null);
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
    setUser(data.user);
    if (data.user.uiLanguage || data.user.preferred_language) {
      await setAppLanguage(data.user.uiLanguage || data.user.preferred_language);
    }
    setJustLoggedIn(true);
    return data.user;
  }

  async function register(payload) {
    const data = await api.register(payload);
    localStorage.setItem('literaai_token', data.token);
    setToken(data.token);
    setUser(data.user);
    await setAppLanguage(data.user.uiLanguage || payload.uiLanguage || payload.preferred_language);
    setJustLoggedIn(true);
    return data.user;
  }

  async function mentorLogin(payload) {
    const data = await api.mentorLogin(payload);
    localStorage.setItem('literaai_token', data.token);
    setToken(data.token);
    setUser(data.user);
    await setAppLanguage(data.user.uiLanguage || payload.uiLanguage);
    setJustLoggedIn(true);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('literaai_token');
    setToken(null);
    setUser(null);
    setJustLoggedIn(false);
  }

  function refreshUser(next) {
    setUser(next);
  }

  function clearJustLoggedIn() {
    setJustLoggedIn(false);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, mentorLogin, logout, refreshUser, setUser, justLoggedIn, clearJustLoggedIn }}
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
