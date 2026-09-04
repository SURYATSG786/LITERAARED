import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { SUPPORTED_LANGS, setAppLanguage } from '../i18n';
import { MentorBird } from '../components/RoleBirds';
import BackendStatus from '../components/BackendStatus';

const MENTOR_CODE_PATTERN = /^redmentor\d+$/;

export default function MentorLogin() {
  const { t, i18n } = useTranslation();
  const { user, mentorLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', mentorCode: '', uiLanguage: (i18n.language || 'en').split('-')[0] });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === 'mentor' ? '/mentor-dashboard' : '/dashboard'} replace />;

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    if (!form.email.toLowerCase().endsWith('@redbirdliteraai.in')) {
      setError(t('mentorEmailDomainError'));
      return;
    }
    if (!MENTOR_CODE_PATTERN.test(form.mentorCode)) {
      setError(t('invalidMentorCode'));
      return;
    }
    setBusy(true);
    try {
      await mentorLogin(form);
      navigate('/mentor-dashboard');
    } catch (err) {
      setError(err.message || t('mentorLoginError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page sky-page relative min-h-screen overflow-x-hidden px-4 py-4">
      <div className="auth-layout mx-auto grid max-w-6xl md:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="auth-showcase mentor-showcase flex flex-col items-center text-center"
        >
          <p className="mentor-quote">“{t('mentorQuote', 'Behind every confident reader is an administrator who never stopped believing.')}”</p>
          <div className="mentor-brand-bird"><MentorBird /></div>
          <h1 className="sky-title text-5xl leading-none md:text-6xl">LiteraAI</h1>
          <p className="sky-tagline mt-3 text-2xl md:text-3xl">{t('mentorPortal', 'Admin portal')}</p>
        </motion.section>

        <motion.form
          onSubmit={onSubmit}
          className="auth-card auth-login-card sky-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <h2 className="auth-heading display text-2xl font-bold">{t('mentorLogin', 'Admin login')}</h2>
          <p className="auth-intro sky-sub text-sm">{t('mentorLoginIntro', 'Use your admin code to access the portal.')}</p>
          <BackendStatus light />
          {error ? <div className="sky-error mb-4" role="alert">{error}</div> : null}

          <label className="block">
            <span className="sky-label">{t('email', 'Email')}</span>
            <input className="sky-input" type="email" required value={form.email} onChange={(event) => setField('email', event.target.value)} autoComplete="email" />
          </label>
          <label className="block">
            <span className="sky-label">{t('mentorCode', 'Admin code')}</span>
            <input className="sky-input" type="password" required value={form.mentorCode} onChange={(event) => setField('mentorCode', event.target.value)} autoComplete="current-password" />
          </label>
          <label className="block">
            <span className="sky-label">{t('interfaceLanguage')}</span>
            <select
              className="sky-select font-extrabold"
              value={form.uiLanguage}
              onChange={(event) => {
                setField('uiLanguage', event.target.value);
                setAppLanguage(event.target.value);
              }}
            >
              {SUPPORTED_LANGS.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}
            </select>
          </label>

          <button className="auth-submit sky-btn" disabled={busy} type="submit">{busy ? t('loading') : t('signIn')}</button>
          <p className="auth-switch sky-sub text-center"><Link className="sky-link" to="/">{t('chooseDifferentRole')}</Link></p>
        </motion.form>
      </div>
    </div>
  );
}
