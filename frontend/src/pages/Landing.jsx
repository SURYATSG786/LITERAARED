import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { SUPPORTED_LANGS, setAppLanguage } from '../i18n';
import { RedBird } from '../components/RedBird';
import BackendStatus from '../components/BackendStatus';

export default function Landing() {
  const { t, i18n } = useTranslation();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [uiLanguage, setUiLanguage] = useState((i18n.language || 'en').split('-')[0]);
  const [learningLanguage, setLearningLanguage] = useState((i18n.language || 'en').split('-')[0]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'mentor' ? '/mentor-dashboard' : '/dashboard'} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password, { uiLanguage, learningLanguage });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || t('error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="auth-page sky-page relative min-h-screen overflow-x-hidden px-4 py-4">
        <div className="auth-layout mx-auto grid max-w-6xl md:grid-cols-2">
          <motion.section
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="auth-showcase flex flex-col justify-center"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
              <motion.div
                animate={{ y: [0, -12, 0], rotate: [-2, 3, -2] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                className="shrink-0"
              >
                <RedBird size={120} mood="wave" />
              </motion.div>
              <div className="role-speech text-sm font-black shadow-lg">
                {t('birdGuideLogin')}
              </div>
            </div>
            <h1 className="sky-title text-5xl leading-none md:text-6xl font-black">LiteraAI</h1>
            <p className="sky-tagline mt-3 text-2xl md:text-3xl font-extrabold">{t('tagline')}</p>
            <p className="sky-sub mt-4 max-w-md text-lg leading-snug font-bold">{t('subtitle')}</p>
          </motion.section>

          <motion.form
            onSubmit={onSubmit}
            className="auth-card auth-login-card sky-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <h2 className="auth-heading display text-2xl font-bold">{t('login')}</h2>
            <p className="auth-intro sky-sub text-sm">{t('birdGuideLogin')}</p>
            <BackendStatus light />
            {error ? <div className="sky-error mb-4" role="alert">{error}</div> : null}

            <label className="block">
              <span className="sky-label">{t('email')}</span>
              <input className="sky-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
            <label className="block">
              <span className="sky-label">{t('password')}</span>
              <input className="sky-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </label>
            <div className="auth-pair-grid grid grid-cols-2">
            <label className="block">
              <span className="sky-label">{t('interfaceLanguage')}</span>
              <select
                className="sky-select font-extrabold"
                value={uiLanguage}
                onChange={(e) => {
                  setUiLanguage(e.target.value);
                  setAppLanguage(e.target.value);
                }}
              >
                {SUPPORTED_LANGS.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="sky-label">{t('learningLanguage')}</span>
              <select
                className="sky-select font-extrabold"
                value={learningLanguage}
                onChange={(e) => setLearningLanguage(e.target.value)}
              >
                {SUPPORTED_LANGS.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </label>
            </div>
            <p className="auth-language-note">{t('interfaceLanguageDescription')} {t('learningLanguageDescription')}</p>

            <button className="auth-submit sky-btn" disabled={busy} type="submit">
              {busy ? t('loading') : t('login')}
            </button>

            <div className="auth-switch sky-sub text-center space-y-2">
              <p>
                <Link className="sky-link" to="/register">
                  {t('signup')}
                </Link>
              </p>
              <p className="pt-2 border-t border-black/10 text-xs">
                <Link className="sky-link font-black text-[#055f9e]" to="/mentor-login">
                  🛡️ Are you an Admin? Login to Admin Portal →
                </Link>
              </p>
            </div>
          </motion.form>
        </div>
      </div>
    </>
  );
}
