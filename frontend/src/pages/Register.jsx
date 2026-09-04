import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { SUPPORTED_LANGS, setAppLanguage } from '../i18n';
import { RedBird } from '../components/RedBird';
import BackendStatus from '../components/BackendStatus';

const EDU = [
  { value: 'No Formal Education', key: 'edu_none' },
  { value: 'Primary School', key: 'edu_primary' },
  { value: 'Middle School', key: 'edu_middle' },
  { value: 'High School', key: 'edu_high' },
];

const FEATURES = [
  { icon: '🤖', title: 'AI-Powered', desc: 'Personalized lessons that adapt to your pace' },
  { icon: '🌍', title: 'Multilingual', desc: 'Learn in Hindi, Tamil, Telugu, Kannada & more' },
  { icon: '🎯', title: 'Track Progress', desc: 'Earn certificates and track your journey' },
  { icon: '🆓', title: '100% Free', desc: 'Quality education accessible to everyone' },
];

export default function Register() {
  const { t, i18n } = useTranslation();
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    uiLanguage: (i18n.language || 'en').split('-')[0],
    learningLanguage: (i18n.language || 'en').split('-')[0],
    education_level: 'Primary School',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
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
          {/* Left side — redesigned branding panel */}
          <motion.section
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="auth-showcase flex flex-col items-start"
          >
            {/* Mascot + brand */}
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [0, -3, 0, 3, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <RedBird size={80} mood="wave" />
              </motion.div>
              <div>
                <h1 className="sky-title text-5xl leading-none md:text-6xl">LiteraAI</h1>
                <p className="sky-tagline mt-1 text-xl md:text-2xl">{t('tagline')}</p>
              </div>
            </div>

            {/* Feature cards */}
            <div className="auth-feature-grid grid w-full grid-cols-2">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
                  className="rounded-2xl border border-white/60 bg-white/40 p-3 backdrop-blur-sm"
                  style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                >
                  <div className="mb-2 text-2xl">{f.icon}</div>
                  <h3 className="display text-sm font-bold text-[var(--text)]">{f.title}</h3>
                  <p className="mt-1 text-xs leading-snug text-[var(--muted)]">{f.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            className="auth-social flex items-center gap-3 rounded-xl border border-white/50 bg-white/30 px-4 py-3 backdrop-blur-sm"
            >
              <div className="flex -space-x-2">
                {['🧑‍🎓', '👩‍🏫', '👨‍💻'].map((e, i) => (
                  <span key={i} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-sky-100 text-sm">{e}</span>
                ))}
              </div>
              <p className="text-sm font-semibold text-[var(--text)]">
                Join thousands learning to read &amp; write
              </p>
            </motion.div>
          </motion.section>

          {/* Right side — register form */}
          <motion.form
            onSubmit={onSubmit}
            className="auth-card sky-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <h2 className="auth-heading display text-2xl font-bold">{t('signup')}</h2>
            <BackendStatus light />
            {error ? <div className="sky-error mb-4" role="alert">{error}</div> : null}

            <div className="auth-field-grid grid grid-cols-2">
              <label className="block">
                <span className="sky-label">{t('fullName')}</span>
                <input className="sky-input" required value={form.name} onChange={(e) => setField('name', e.target.value)} autoComplete="name" />
              </label>
              <label className="block">
                <span className="sky-label">Age</span>
                <input className="sky-input" type="number" min="5" max="120" required value={form.age} onChange={(e) => setField('age', e.target.value)} placeholder="e.g. 25" />
              </label>
            </div>
            <label className="block">
              <span className="sky-label">{t('email')}</span>
              <input className="sky-input" type="email" required value={form.email} onChange={(e) => setField('email', e.target.value)} autoComplete="email" />
            </label>
            <label className="block">
              <span className="sky-label">{t('password')}</span>
              <input className="sky-input" type="password" required value={form.password} onChange={(e) => setField('password', e.target.value)} autoComplete="new-password" />
              <span className="sky-sub mt-1 block text-xs">{t('passwordHint')}</span>
            </label>
            <div className="auth-pair-grid grid grid-cols-2">
              <label className="block">
                <span className="sky-label">{t('interfaceLanguage')}</span>
                <select
                  className="sky-select font-extrabold"
                  value={form.uiLanguage}
                  onChange={(e) => {
                    setField('uiLanguage', e.target.value);
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
                  value={form.learningLanguage}
                  onChange={(e) => setField('learningLanguage', e.target.value)}
                >
                  {SUPPORTED_LANGS.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <p className="auth-language-note">{t('interfaceLanguageDescription')} {t('learningLanguageDescription')}</p>
            <label className="block">
              <span className="sky-label">{t('educationLevel')}</span>
              <select
                className="sky-select font-extrabold"
                value={form.education_level}
                onChange={(e) => setField('education_level', e.target.value)}
              >
                {EDU.map((e) => (
                  <option key={e.value} value={e.value}>{t(e.key)}</option>
                ))}
              </select>
            </label>

            <button className="auth-submit sky-btn" disabled={busy} type="submit">
              {busy ? t('loading') : t('signup')}
            </button>
            <p className="auth-switch sky-sub text-center">
              <Link className="sky-link" to="/login">{t('login')}</Link>
            </p>
          </motion.form>
        </div>
      </div>
    </>
  );
}
