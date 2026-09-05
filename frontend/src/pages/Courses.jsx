import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { BookOpen, Sparkles, CheckCircle2, Trophy, Lock } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { ProgressBar } from '../components/ui';
import { GuideBird } from '../components/RedBird';
import { getStaticCoursesList } from '../data/staticCourses';

const DEFAULT_TITLES = {
  en: ['Reading Everyday Words', 'Understanding Everyday Sentences', 'Using Information in Daily Life', 'Reading for Understanding'],
  ta: ['அன்றாட சொற்களை வாசிப்போம்', 'அன்றாட வாக்கியங்களைப் புரிந்துகொள்வோம்', 'அன்றாட தகவல்களைப் பயன்படுத்துவோம்', 'வாசித்து புரிந்துகொள்வோம்'],
  te: ['రోజువారీ పదాలను చదవడం', 'రోజువారీ వాక్యాలను అర్థం చేసుకోవడం', 'రోజువారీ సమాచారాన్ని ఉపయోగించడం', 'చదివి అర్థం చేసుకోవడం'],
  kn: ['ದೈನಂದಿನ ಪದಗಳನ್ನು ಓದೋಣ', 'ದೈನಂದಿನ ವಾಕ್ಯಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳೋಣ', 'ದೈನಂದಿನ ಮಾಹಿತಿಯನ್ನು ಬಳಸೋಣ', 'ಓದಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳೋಣ'],
  ml: ['ദൈനംദിന വാക്കുകൾ വായിക്കാം', 'ദൈനംദിന വാക്യങ്ങൾ മനസ്സിലാക്കാം', 'ദൈനംദിന വിവരങ്ങൾ ഉപയോഗിക്കാം', 'വായിച്ച് മനസ്സിലാക്കാം'],
  hi: ['दैनिक शब्द पढ़ना', 'दैनिक वाक्यों को समझना', 'दैनिक जानकारी का उपयोग', 'पढ़कर समझना'],
};

const DEFAULT_PATHS = ['foundation', 'beginner', 'intermediate', 'advanced'];

function LockedChainsOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden rounded-[28px]">
      {/* Ambient subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-900/5 via-slate-900/5 to-amber-900/10 backdrop-blur-[0.3px]" />

      {/* Central Attractive 3D Padlock */}
      <motion.div
        className="relative z-20 flex flex-col items-center justify-center -mt-8"
        initial={{ scale: 0.95 }}
        animate={{ scale: [1, 1.06, 1], y: [0, -4, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Glow Halo */}
        <div className="absolute -inset-4 rounded-full bg-amber-400/40 blur-lg animate-pulse" />

        {/* Lock Body SVG */}
        <svg width="72" height="78" viewBox="0 0 68 74" fill="none" className="drop-shadow-[0_10px_22px_rgba(0,0,0,0.4)]">
          <defs>
            <linearGradient id="shackleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="35%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fff3b0" />
              <stop offset="30%" stopColor="#ffd700" />
              <stop offset="75%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <path d="M20 32 V 19 C 20 11.268 26.268 5 34 5 C 41.732 5 48 11.268 48 19 V 32" stroke="url(#shackleGrad)" strokeWidth="8" strokeLinecap="round" />
          <rect x="8" y="28" width="52" height="42" rx="12" fill="url(#bodyGrad)" stroke="#78350f" strokeWidth="2.5" />
          <rect x="12" y="32" width="44" height="18" rx="8" fill="white" fillOpacity="0.28" />
          <circle cx="34" cy="46" r="4.5" fill="#451a03" />
          <polygon points="32,47 36,47 35.2,56 32.8,56" fill="#451a03" />
          <circle cx="20" cy="38" r="2.5" fill="white" fillOpacity="0.85" />
        </svg>
      </motion.div>
    </div>
  );
}

const COURSE_THEMES = [
  {
    gradient: 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(224, 242, 254, 0.94) 45%, rgba(186, 230, 253, 0.90) 100%)',
    borderColor: '#38bdf8',
    glow: '0 20px 40px -10px rgba(0, 0, 0, 0.16), 0 10px 24px -5px rgba(2, 132, 199, 0.28), 0 2px 6px 0 rgba(0, 0, 0, 0.08), inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.95)',
    iconColor: 'text-sky-600',
    badge: 'bg-sky-100 text-sky-950 border-sky-300',
    image: '/assets/course_bird_foundation.png',
  },
  {
    gradient: 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(220, 252, 231, 0.94) 45%, rgba(187, 247, 208, 0.90) 100%)',
    borderColor: '#4ade80',
    glow: '0 20px 40px -10px rgba(0, 0, 0, 0.16), 0 10px 24px -5px rgba(22, 163, 74, 0.28), 0 2px 6px 0 rgba(0, 0, 0, 0.08), inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.95)',
    iconColor: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    image: '/assets/course_bird_beginner.png',
  },
  {
    gradient: 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(243, 232, 255, 0.94) 45%, rgba(221, 214, 254, 0.90) 100%)',
    borderColor: '#c084fc',
    glow: '0 20px 40px -10px rgba(0, 0, 0, 0.16), 0 10px 24px -5px rgba(147, 51, 234, 0.28), 0 2px 6px 0 rgba(0, 0, 0, 0.08), inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.95)',
    iconColor: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-950 border-purple-300',
    image: '/assets/course_bird_intermediate.png',
  },
  {
    gradient: 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 228, 230, 0.94) 45%, rgba(254, 205, 211, 0.90) 100%)',
    borderColor: '#fb7185',
    glow: '0 20px 40px -10px rgba(0, 0, 0, 0.16), 0 10px 24px -5px rgba(225, 29, 72, 0.28), 0 2px 6px 0 rgba(0, 0, 0, 0.08), inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.95)',
    iconColor: 'text-rose-600',
    badge: 'bg-rose-100 text-rose-950 border-rose-300',
    image: '/assets/course_bird_advanced.png',
  },
];

export default function Courses() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentLang = user?.learningLanguage || user?.uiLanguage || i18n.language || 'en';
  const initialStaticCourses = getStaticCoursesList(currentLang);

  const [data, setData] = useState({ courses: initialStaticCourses });
  const [error, setError] = useState('');
  const [courseScores, setCourseScores] = useState({});

  useEffect(() => {
    api.recommended()
      .then((res) => {
        if (res?.courses?.length > 0) {
          setData(res);
        }
      })
      .catch((err) => {
        console.warn('Courses background sync note:', err?.message);
      });
  }, [user?.assessment_score, currentLang]);

  useEffect(() => {
    const courses = data?.courses || initialStaticCourses;
    if (courses.length === 0 || user?.assessment_score == null) return;
    courses.forEach((c) => {
      api.getCourseScores(c.id).then((scores) => {
        if (scores) {
          setCourseScores((prev) => ({ ...prev, [c.id]: scores }));
        }
      }).catch(() => {});
    });
  }, [data?.courses, user?.assessment_score]);

  const isLocked = user?.assessment_score == null;
  const coursesToRender = (data?.courses && data.courses.length > 0) ? data.courses : initialStaticCourses;

  return (
    <div className="w-full flex-1 flex flex-col justify-between gap-2.5 sm:gap-3 p-1 sm:p-1.5 pb-2 h-[calc(100vh-105px)] min-h-0">
      {/* Top Banner Guide */}
      <div className="flex items-center justify-end shrink-0">
        <GuideBird
          message={
            isLocked
              ? t('unlockCourses', 'Courses unlock after your assessment')
              : t('birdGuideLesson', 'Keep learning and completing lessons!')
          }
          mood={isLocked ? 'think' : 'happy'}
          size={42}
        />
      </div>

      {error ? <div className="banner-err rounded-xl px-3 py-2 font-extrabold shrink-0">{error}</div> : null}

      {/* 2x2 Balanced Grid (2 in each row) filling 100% of the page perfectly */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-5 items-stretch flex-1 min-h-0 p-1">
        {coursesToRender.map((course, i) => {
          const scores = courseScores[course.id];
          const hasScores = scores?.lessons?.length > 0;
          const completedLessons = scores?.lessons?.length || 0;
          const totalLessons = course.lesson_count || 1;
          const theme = COURSE_THEMES[i % COURSE_THEMES.length];

          return (
            <motion.article
              key={course.id || i}
              className="relative flex flex-col justify-between rounded-3xl p-4 sm:p-5 border-2 shadow-xl h-full min-h-0 transition"
              style={{
                background: theme.gradient,
                borderColor: theme.borderColor,
                boxShadow: theme.glow,
              }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
            >
              {isLocked && <LockedChainsOverlay />}
              <div className="shrink-0 mb-1">
                <div className="mb-1.5 flex items-center justify-between">
                  <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wider border shadow-xs ${
                    isLocked
                      ? 'bg-slate-200/90 text-black border-slate-300'
                      : theme.badge
                  }`}>
                    {isLocked && <Lock size={13} className="text-black" />}
                    <span>{t(`pathLabels.${course.path}`, course.path?.toUpperCase())}</span>
                  </div>

                  {isLocked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/30 px-3 py-0.5 text-[11px] font-black text-black border border-amber-400/50 shadow-xs">
                      🔒 {t('locked', 'Locked')}
                    </span>
                  ) : (
                    scores?.course_average > 0 && (
                      <div className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-0.5 text-xs font-black text-black border border-black/10 shadow-xs">
                        <Trophy size={13} className="text-amber-500" /> {scores.course_average}%
                      </div>
                    )
                  )}
                </div>

                <h2 className="display flex items-start gap-2 text-sm sm:text-base font-black leading-snug text-black">
                  <BookOpen className={`mt-0.5 shrink-0 ${theme.iconColor}`} size={18} />
                  <span>{course.title}</span>
                </h2>
              </div>

              {/* Mascot Illustration Filling the gap beautifully */}
              <div className="flex-1 flex items-center justify-center my-1 py-1 min-h-0">
                <img
                  src={theme.image}
                  alt={course.title}
                  className="h-20 sm:h-24 lg:h-28 w-auto max-w-full object-contain rounded-2xl transition-transform hover:scale-104"
                />
              </div>

              {/* Per-lesson score indicators & Action button */}
              <div className="mt-2 space-y-2 shrink-0">
                {isLocked ? (
                  <div className="space-y-2">
                    <div>
                      <div className="mb-1 flex justify-between text-xs font-black text-[#032038]/70">
                        <span>{t('lessonsCompleted')}</span>
                        <span>0 {t('of')} {totalLessons}</span>
                      </div>
                      <ProgressBar value={0} max={totalLessons} label={t('lessonsCompleted')} />
                    </div>

                    <button
                      className="btn-primary w-full py-2.5 sm:py-3 text-xs sm:text-sm font-black shadow-lg cursor-pointer flex items-center justify-center gap-2"
                      type="button"
                      onClick={() => navigate('/assessment')}
                    >
                      <Lock size={15} />
                      <span>{t('takeAssessmentToUnlock', 'Take Assessment to Unlock')}</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-black text-[#032038]/80">
                        <span>{t('lessonsCompleted')}</span>
                        <span>{completedLessons} {t('of')} {totalLessons}</span>
                      </div>
                      <ProgressBar value={completedLessons} max={totalLessons} label={t('lessonsCompleted')} />

                      {hasScores && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {Array.from({ length: totalLessons }, (_, li) => {
                            const lessonScore = scores.lessons.find((l) => String(l.lesson_id) === String(li));
                            return (
                              <span
                                key={li}
                                className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-black border ${
                                  lessonScore
                                    ? lessonScore.score >= 70
                                      ? 'bg-green-500/20 text-green-950 border-green-600/40'
                                      : 'bg-amber-500/20 text-amber-950 border-amber-600/40'
                                    : 'bg-white/40 text-[#032038]/60 border-[#032038]/15'
                                }`}
                              >
                                {lessonScore ? (
                                  <>
                                    <CheckCircle2 size={11} className="text-emerald-700" />
                                    L{li + 1}: {lessonScore.score}%
                                  </>
                                ) : (
                                  <>L{li + 1}</>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="btn-primary flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-black shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                        type="button"
                        onClick={() => navigate(`/course/${course.id}`)}
                      >
                        <span>{completedLessons >= totalLessons && completedLessons > 0 ? (t('reviewCourse') || 'Review Course 🔁') : t('startCourse')}</span>
                      </button>

                      {completedLessons >= totalLessons && completedLessons > 0 && (
                        <button
                          className="py-2.5 sm:py-3 px-3.5 rounded-2xl font-black text-xs sm:text-sm bg-amber-400 hover:bg-amber-300 text-amber-950 border-2 border-amber-500 shadow-md cursor-pointer transition flex items-center gap-1 shrink-0"
                          type="button"
                          onClick={() => navigate('/certificate')}
                        >
                          <span>🎓 {t('certificate')}</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
