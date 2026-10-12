import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/client';
import { initializeSession, writeSessionToken, clearSessionToken } from '../auth/session';
import { setAppLanguage } from '../i18n';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => initializeSession(window.location.pathname));
  const [loading, setLoading] = useState(true);
  const sessionVersion = useRef(0);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  useEffect(() => {
    let alive = true;
    const version = sessionVersion.current;
    async function boot() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user: me } = await api.me();
        if (!alive || version !== sessionVersion.current) return;
        setUser(me);
        if (me.uiLanguage || me.preferred_language) {
          await setAppLanguage(me.uiLanguage || me.preferred_language);
        }
      } catch {
        if (!alive || version !== sessionVersion.current) return;
        clearSessionToken();
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
    sessionVersion.current += 1;
    writeSessionToken(data.token);
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
    sessionVersion.current += 1;
    writeSessionToken(data.token);
    setToken(data.token);
    setUser(data.user);
    await setAppLanguage(data.user.uiLanguage || payload.uiLanguage || payload.preferred_language);
    setJustLoggedIn(true);
    return data.user;
  }

  async function mentorLogin(payload) {
    const data = await api.mentorLogin(payload);
    sessionVersion.current += 1;
    writeSessionToken(data.token);
    setToken(data.token);
    setUser(data.user);
    await setAppLanguage(data.user.uiLanguage || payload.uiLanguage);
    setJustLoggedIn(true);
    return data.user;
  }

  const logout = useCallback(() => {
    sessionVersion.current += 1;
    clearSessionToken();
    setToken(null);
    setUser(null);
    setJustLoggedIn(false);
    setLoading(false);
  }, []);

  function refreshUser(next) {
    if (next && typeof next === 'object') {
      setUser(next);
    } else {
      const version = sessionVersion.current;
      api.me().then((res) => {
        if (version === sessionVersion.current && res?.user) setUser(res.user);
      }).catch(() => {});
    }
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
