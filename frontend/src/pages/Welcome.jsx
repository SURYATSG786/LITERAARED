import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RedBird } from '../components/RedBird';
import { MentorBird, StudentBird } from '../components/RoleBirds';
import { speakText, stopSpeech } from '../audio';
import { SUPPORTED_LANGS, setAppLanguage } from '../i18n';

const START_MESSAGE = 'Hello! I am Red. First, choose the language you would like to use.';

export default function Welcome() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState('language');
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [birdLanded, setBirdLanded] = useState(false);
  const greeting = t('roleWelcome', 'Hello! I am Red. Are you joining us as an Admin or a Student?');

  useEffect(() => {
    if (!birdLanded) return undefined;
    const message = step === 'language' ? START_MESSAGE : greeting;
    const language = step === 'language' ? 'en' : i18n.language;
    speakText(message, language, false, true).catch(() => {});
    return () => stopSpeech();
  }, [birdLanded, greeting, i18n.language, step]);

  async function chooseLanguage(code) {
    if (selectedLanguage || step !== 'language') return;
    setSelectedLanguage(code);
    await setAppLanguage(code);
    window.setTimeout(() => setStep('role'), 520);
  }

  const activeLanguage = SUPPORTED_LANGS.find((language) => language.code === selectedLanguage);

  return (
    <main className="role-page sky-page relative min-h-screen overflow-x-hidden px-4 py-4">
      <div className="role-shell mx-auto">
        <motion.div
          className="role-bird"
          initial={{ opacity: 0, x: -340, y: 120, rotate: -22 }}
          animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
          transition={{ duration: 2.15, ease: [0.18, 0.82, 0.22, 1], delay: 0.12 }}
          onAnimationComplete={() => setBirdLanded(true)}
        >
          <motion.div animate={{ y: [0, -12, 0], rotate: [-2, 3, -2] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
            <RedBird size={118} mood={birdLanded ? 'wave' : 'happy'} flying={!birdLanded} />
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              className="role-speech"
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: birdLanded ? 1 : 0, scale: birdLanded ? 1 : 0.85, y: birdLanded ? 0 : 8 }}
              exit={{ opacity: 0, scale: 0.92, y: -6 }}
              transition={{ type: 'spring', stiffness: 180, damping: 16 }}
            >
              {step === 'language' ? START_MESSAGE : greeting}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 'language' ? (
            <motion.section
              key="language"
              className="role-card sky-card"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14, scale: 0.97 }}
              transition={{ duration: 0.45, delay: 0.2 }}
            >
              <div className="role-kicker"><Sparkles size={16} /> LiteraAI</div>
              <h1 className="display role-title">Choose your language</h1>
              <p className="role-subtitle">Pick the language that feels most comfortable for you.</p>
              <div className="language-options" role="list" aria-label="Choose your language">
                {SUPPORTED_LANGS.map((language, index) => (
                  <motion.button
                    type="button"
                    key={language.code}
                    className={`language-option ${selectedLanguage === language.code ? 'is-selected' : ''}`}
                    onClick={() => chooseLanguage(language.code)}
                    disabled={Boolean(selectedLanguage)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.28 + index * 0.06 }}
                    whileHover={!selectedLanguage ? { y: -3, scale: 1.03 } : undefined}
                    whileTap={!selectedLanguage ? { scale: 0.97 } : undefined}
                  >
                    <span>{language.label}</span>
                    {selectedLanguage === language.code ? <Check size={18} strokeWidth={3} /> : null}
                  </motion.button>
                ))}
              </div>
              {activeLanguage ? <p className="language-confirm">Wonderful — {activeLanguage.label} it is!</p> : null}
            </motion.section>
          ) : (
            <motion.section
              key="role"
              className="role-card sky-card"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 150, damping: 17 }}
            >
              <div className="role-kicker"><Sparkles size={16} /> LiteraAI</div>
              <h1 className="display role-title">{t('chooseYourPath', 'Choose your path')}</h1>
              <p className="role-subtitle">{t('chooseRoleDescription', 'Select how you would like to begin today.')}</p>

              <div className="role-options">
                <motion.button type="button" className="role-option role-mentor" onClick={() => navigate('/mentor-login')} whileHover={{ y: -6, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <motion.div className="role-icon" animate={{ y: [0, -7, 0], rotate: [-3, 3, -3] }} transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}>
                    <MentorBird />
                  </motion.div>
                  <span className="role-option-title">{t('mentor', 'Admin')}</span>
                  <span className="role-option-copy">{t('mentorDescription', 'Guide and encourage learners.')}</span>
                </motion.button>

                <motion.button type="button" className="role-option role-student" onClick={() => navigate('/login')} whileHover={{ y: -6, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <motion.div className="role-icon" animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
                    <StudentBird />
                  </motion.div>
                  <span className="role-option-title">{t('student', 'Student')}</span>
                  <span className="role-option-copy">{t('studentDescription', 'Learn, practise, and grow.')}</span>
                </motion.button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
