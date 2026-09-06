import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Flame,
  Gem,
  Star,
  BookOpenCheck,
  Trophy,
  CheckCircle2,
  Mic,
  Sparkles,
  ArrowRight,
  Bot,
  Target,
  Pencil,
  GraduationCap,
  Award,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { StatChip, ProgressBar } from '../components/ui';
import { GuideBird } from '../components/RedBird';
import { SpeakButton } from '../components/SpeakButton';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [coach, setCoach] = useState('');
  const [busy, setBusy] = useState(false);

  const currentUiLang = user?.uiLanguage || user?.preferred_language || 'en';
  const currentLearningLang = user?.learningLanguage || user?.preferred_language || currentUiLang;

  const [courseScores, setCourseScores] = useState(() => {
    try {
      const cached = localStorage.getItem(`literaai_scores_${user?.id || 'guest'}_${currentLearningLang}`);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      const cached = localStorage.getItem(`literaai_scores_${user?.id || 'guest'}_${currentLearningLang}`);
      setCourseScores(cached ? JSON.parse(cached) : {});
    } catch {}
  }, [currentLearningLang, user?.id]);

  useEffect(() => {
    let alive = true;
    api.recommended()
      .then((res) => {
        if (!alive) return;
        if (res?.scores_by_id) {
          setCourseScores(res.scores_by_id);
          try {
            localStorage.setItem(`literaai_scores_${user?.id || 'guest'}_${currentLearningLang}`, JSON.stringify(res.scores_by_id));
          } catch {}
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user?.assessment_score, currentUiLang, currentLearningLang, user?.id]);

  const lessonsDone = useMemo(() => {
    const scoredCourses = Object.values(courseScores || {});
    if (scoredCourses.length > 0) {
      return scoredCourses.filter((s) => (s?.lessons?.length || 0) > 0).length;
    }
    if (Array.isArray(user?.certificates)) {
      const certCount = user.certificates.filter((c) => (c.learning_language || 'en') === currentLearningLang).length;
      if (certCount > 0) return certCount;
    }
    if (user?.course_progress?.course_id && user.course_progress.learning_language === currentLearningLang) {
      return user.course_progress.lessons_completed?.length || 0;
    }
    return 0;
  }, [courseScores, user?.certificates, user?.course_progress, currentLearningLang]);

  const lessonScores = useMemo(() => {
    const map = {};
    Object.entries(courseScores || {}).forEach(([cid, s]) => {
      if (Array.isArray(s?.lessons)) {
        s.lessons.forEach((l) => {
          map[`${cid}_${l.lesson_id}`] = l.score || 0;
        });
      }
    });
    return map;
  }, [courseScores]);

  const scoreValues = Object.values(lessonScores).filter((v) => v > 0);
  const avgScore =
    scoreValues.length > 0
      ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
      : 0;

  // Determine earned badges from user.badges or persistent local storage fallback
  const userBadges = Array.isArray(user?.badges) ? user.badges : [];
  const localBadges = user?.id
    ? (() => {
        try {
          return JSON.parse(localStorage.getItem(`literaai_badges_${user.id}`) || '[]');
        } catch (_) {
          return [];
        }
      })()
    : [];
  const hasWritingLocal = user?.id ? localStorage.getItem(`literaai_badge_writing_${user.id}`) === 'true' : false;
  const hasVoiceLocal = user?.id ? localStorage.getItem(`literaai_badge_voice_${user.id}`) === 'true' : false;

  const hasWritingBadge = userBadges.includes('writing_master') || userBadges.includes('writing_beginner') || localBadges.includes('writing_master') || hasWritingLocal;
  const hasVoiceBadge = userBadges.includes('voice_master') || localBadges.includes('voice_master') || hasVoiceLocal;

  const unlockedBadgesCount = (hasWritingBadge ? 1 : 0) + (hasVoiceBadge ? 1 : 0);
  const totalBadgesCount = 2;

  useEffect(() => {
    let alive = true;
    api
      .coach()
      .then((res) => {
        if (alive) setCoach(res.message);
      })
      .catch(() => {
        if (alive) setCoach(t('birdGuideDashboard'));
      });
    return () => {
      alive = false;
    };
  }, [user?.name, lessonsDone, t]);

  async function setGoal(goal) {
    if (!user) return;
    const prevStreak = user.streak;
    
    // Instantaneous UI update & celebration (0ms perceived latency)
    refreshUser({ ...user, streak: { ...(user.streak || {}), goal } });
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    
    // Sync to backend asynchronously
    try {
      const { user: next } = await api.updateMe({ streak_goal: goal });
      if (next) refreshUser(next);
    } catch (err) {
      console.warn('Failed to sync streak goal, rolling back:', err);
      refreshUser({ ...user, streak: prevStreak });
    }
  }

  const firstName = user?.name?.split(' ')[0] || 'Learner';

  return (
    <div className="w-full flex-1 flex flex-col justify-between gap-2 sm:gap-2.5 p-1 sm:p-1.5 pb-2 h-[calc(100vh-105px)] min-h-0">
      {/* 1. Personalized Welcome Banner with Guide Bird (Sunshine Multicolor Gradient) */}
      <motion.div
        className="relative overflow-hidden rounded-3xl p-3.5 sm:p-4 border-2 shrink-0"
        style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 35%, #fde68a 75%, #fed7aa 100%)',
          borderColor: 'rgba(251, 191, 36, 0.7)',
          boxShadow: '0 16px 36px -6px rgba(0, 0, 0, 0.12), 0 8px 20px -4px rgba(245, 158, 11, 0.25)',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="space-y-0.5 max-w-2xl">
            <h1 className="display text-lg sm:text-xl font-black text-black leading-tight flex items-center gap-1.5">
              {t('welcome', { name: firstName })} 👋
            </h1>

            <p className="text-[11px] sm:text-xs font-bold text-gray-700 leading-relaxed">
              {user?.assessment_score == null
                ? t('unlockCourses')
                : 'Great progress! Open your courses and keep your streak alive.'}
            </p>
          </div>

          <div className="shrink-0 self-end md:self-center">
            <GuideBird
              message={
                user?.assessment_score == null
                  ? t('birdGuideDashboard')
                  : 'Great progress! Open your courses and keep your streak alive.'
              }
              mood={user?.assessment_score == null ? 'cheer' : 'happy'}
              size={42}
            />
          </div>
        </div>
      </motion.div>

      {/* 2. Top 5 Visual Stat Chips Row with Vibrant Multicolor Fills & Deep Elevation Shadows */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 shrink-0 p-1">
        {/* Streak (Peach-to-Gold Multicolor Gradient) */}
        <div
          className="rounded-2xl p-3 border-2 border-[#fb923c]/60 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 40%, #fed7aa 75%, #fef08a 100%)',
            boxShadow: '0 14px 28px -6px rgba(0, 0, 0, 0.12), 0 6px 14px -3px rgba(234, 88, 12, 0.25)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ea580c] to-[#f97316] flex items-center justify-center text-white shadow-sm shrink-0">
              <Flame size={20} className="fill-white" />
            </div>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-wider text-gray-700 truncate">
                {t('streak') || 'Streak'}
              </span>
              <span className="text-base sm:text-lg font-black text-black leading-none">
                {user?.streak?.current ?? 0} {t('days') || 'days'}
              </span>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl shrink-0">🔥</span>
        </div>

        {/* Gems (Sky-to-Lavender Multicolor Gradient) */}
        <div
          className="rounded-2xl p-3 border-2 border-[#38bdf8]/60 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 40%, #c7d2fe 75%, #e0e7ff 100%)',
            boxShadow: '0 14px 28px -6px rgba(0, 0, 0, 0.12), 0 6px 14px -3px rgba(2, 132, 199, 0.25)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] flex items-center justify-center text-white shadow-sm shrink-0">
              <Gem size={20} className="fill-white" />
            </div>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-wider text-[#0284c7] truncate">
                {t('gems') || 'Gems'}
              </span>
              <span className="text-base sm:text-lg font-black text-black leading-none">
                {user?.gems ?? 0}
              </span>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl shrink-0">💎</span>
        </div>

        {/* XP (Mint-to-Sunshine Multicolor Gradient) */}
        <div
          className="rounded-2xl p-3 border-2 border-[#4ade80]/60 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #bbf7d0 75%, #fef9c3 100%)',
            boxShadow: '0 14px 28px -6px rgba(0, 0, 0, 0.12), 0 6px 14px -3px rgba(22, 163, 74, 0.25)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#16a34a] to-[#4ade80] flex items-center justify-center text-white shadow-sm shrink-0">
              <Star size={20} className="fill-white" />
            </div>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-wider text-[#16a34a] truncate">
                {t('xp') || 'XP'}
              </span>
              <span className="text-base sm:text-lg font-black text-black leading-none">
                {user?.xp ?? 0}
              </span>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl shrink-0">⭐</span>
        </div>

        {/* Lessons Completed (Rose-to-Pink Blossom Multicolor Gradient) */}
        <div
          className="rounded-2xl p-3 border-2 border-[#fb7185]/60 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 40%, #fecdd3 75%, #fce7f3 100%)',
            boxShadow: '0 14px 28px -6px rgba(0, 0, 0, 0.12), 0 6px 14px -3px rgba(225, 29, 72, 0.25)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#e11d48] to-[#fb7185] flex items-center justify-center text-white shadow-sm shrink-0">
              <BookOpenCheck size={20} className="text-white" />
            </div>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-wider text-[#e11d48] truncate">
                {t('lessonsCompleted') || 'Lessons completed'}
              </span>
              <span className="text-base sm:text-lg font-black text-black leading-none">
                {lessonsDone} {t('of') || 'of'} 4
              </span>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl shrink-0">📖</span>
        </div>

        {/* League (Gold-to-Amber Multicolor Gradient) */}
        <div
          onClick={() => navigate('/league')}
          className="rounded-2xl p-3 border-2 border-[#f59e0b]/60 flex items-center justify-between cursor-pointer hover:scale-102 transition-transform"
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 40%, #fde68a 75%, #fed7aa 100%)',
            boxShadow: '0 14px 28px -6px rgba(0, 0, 0, 0.12), 0 6px 14px -3px rgba(217, 119, 6, 0.25)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#d97706] to-[#f59e0b] flex items-center justify-center text-white shadow-sm shrink-0">
              <Trophy size={20} className="fill-white" />
            </div>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-wider text-[#d97706] truncate">
                {t('league') || 'League'}
              </span>
              <span className="text-base sm:text-lg font-black text-black leading-none">
                {t(`${user?.league || 'bronze'}League`, `${(user?.league || 'bronze').charAt(0).toUpperCase() + (user?.league || 'bronze').slice(1)} League`)}
              </span>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl shrink-0">🛡️</span>
        </div>
      </div>

      {/* 3. Main Dashboard Balanced 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 items-stretch flex-1 min-h-0 p-1">
        {/* Left Column (7/12 Width) */}
        <div className="lg:col-span-7 flex flex-col gap-2.5 h-full min-h-0">
          {/* Main Course Progress / Assessment Action Card (Iridescent Sky-Lilac-Gold Multicolor Gradient) */}
          <motion.section
            className="rounded-3xl p-4 border-2 border-[#7dd3fc]/70 flex flex-col justify-between h-full min-h-0"
            style={{
              background: 'linear-gradient(145deg, rgba(240, 249, 255, 0.96) 0%, rgba(224, 242, 254, 0.90) 30%, rgba(245, 243, 255, 0.88) 65%, rgba(254, 243, 199, 0.85) 100%)',
              boxShadow: '0 20px 42px -8px rgba(0, 0, 0, 0.14), 0 10px 24px -5px rgba(2, 132, 199, 0.22)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="flex-1 flex flex-col justify-between min-h-0 space-y-2">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#0284c7] text-white flex items-center justify-center shadow-xs shrink-0">
                    <GraduationCap size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="display text-sm sm:text-base font-black text-[#0260c8] leading-tight">
                      {user?.assessment_score == null ? t('assessment') : (t('recommendedCourse') || 'Your Recommended Course')}
                    </h2>
                    <p className="text-[10.5px] sm:text-[11px] font-bold text-gray-700 leading-none mt-0.5">
                      {user?.assessment_score == null
                        ? 'Required to unlock customized courses'
                        : `Track: ${t(`pathLabels.${user.current_path}`) || 'Advanced'}`}
                    </p>
                  </div>
                </div>

                {user?.assessment_score != null ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-3 py-0.5 text-xs font-black text-[#166534] border border-[#86efac] shadow-xs">
                    {t('score') || 'Score'}: {user.assessment_score}%
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/assessment')}
                    className="btn-primary py-1 px-3 text-xs font-black flex items-center gap-1 shadow-xs cursor-pointer text-black"
                  >
                    <span>{t('takeAssessment', 'Take Assessment')}</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>

              {/* Progress Bar / Assessment Status */}
              <div className="space-y-1 shrink-0">
                {user?.assessment_score != null ? (
                  <>
                    <div className="flex justify-between text-xs font-black text-black">
                      <span>{t('lessonsCompleted') || 'Lessons completed'}</span>
                      <span className="text-black">{lessonsDone} / 4 ({Math.round((lessonsDone / 4) * 100)}%)</span>
                    </div>
                    <div className="w-full h-3 bg-[#e0f2fe] rounded-full overflow-hidden border border-[#bae6fd]">
                      <motion.div
                        className="bg-[#0057ff] h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.round((lessonsDone / 4) * 100))}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-2.5 rounded-2xl bg-white/75 border border-sky-200/80 flex items-center justify-between gap-3 shadow-xs">
                    <p className="text-xs font-bold text-black/80 leading-snug">
                      {t('assessmentIntro', 'A short 10-question check covering vocabulary and grammar matched to your education level.')}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/assessment')}
                      className="btn-primary py-1.5 px-3.5 text-xs font-black flex items-center gap-1 shadow-md cursor-pointer shrink-0 text-black"
                    >
                      <span>{t('start', 'Start')}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Badges Showcase Section (ALWAYS DISPLAYED BY DEFAULT) */}
              <div
                className="flex-1 rounded-2xl p-2.5 sm:p-3 border-2 border-slate-200/70 flex flex-col justify-between min-h-0 space-y-1.5"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 255, 0.90) 35%, rgba(240, 253, 244, 0.85) 70%, rgba(254, 249, 195, 0.80) 100%)',
                  boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.08), 0 4px 10px -2px rgba(14, 165, 233, 0.15)',
                }}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-1 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Award size={18} className="text-[#ea580c]" />
                    <h3 className="display text-xs sm:text-sm font-black text-black leading-none">
                      {t('yourBadges', 'Your Badges')}
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fffdf8] px-2.5 py-0.5 text-[10.5px] font-black text-black border border-slate-200 shadow-xs shrink-0">
                    <Star size={11} className="text-amber-500 fill-amber-500" />
                    {unlockedBadgesCount} / {totalBadgesCount} {t('unlocked', 'Unlocked')}
                  </span>
                </div>

                {/* Badge Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 min-h-0">
                  {/* 1. Writing Master Badge (Sky Blue-to-Lavender Fill) */}
                  <div
                    className="rounded-2xl p-2.5 border-2 transition-all flex flex-col justify-between relative overflow-hidden h-full min-h-0"
                    style={{
                      background: hasWritingBadge
                        ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 60%, #e0e7ff 100%)'
                        : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #ede9fe 100%)',
                      borderColor: hasWritingBadge ? '#60a5fa' : '#93c5fd',
                      boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.10), 0 6px 14px -3px rgba(59, 130, 246, 0.22)',
                    }}
                  >
                    <div className="shrink-0">
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <div className="w-7 h-7 rounded-full bg-[#3b82f6] text-white flex items-center justify-center shadow-xs shrink-0">
                          <Pencil size={14} className="text-white" />
                        </div>

                        {hasWritingBadge ? (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#166534] border border-[#86efac]">
                            ✓ {t('earned', 'Earned')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#e2e8f0] text-[#1e293b] border border-[#cbd5e1]">
                            🔒 {t('locked', 'LOCKED')}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-black text-black leading-tight">
                        {t('badgeWritingMaster', 'Writing Master')}
                      </h4>
                    </div>

                    {/* Mascot Image in Gap */}
                    <div className="flex-1 flex items-center justify-center py-1 min-h-0">
                      <img
                        src="/assets/bird_writing.jpg"
                        alt="Writing Mascot"
                        className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-2xl border-2 border-white shadow-md ring-2 ring-[#3b82f6]/30 transition-transform hover:scale-104"
                      />
                    </div>

                    {/* CTA / Status Action */}
                    <div className="pt-1 shrink-0">
                      {hasWritingBadge ? (
                        <div className="text-[10px] font-black text-[#166534] flex items-center justify-center gap-1 bg-[#dcfce7] py-1 rounded-lg border border-[#86efac]">
                          <Star size={12} className="text-amber-500 fill-amber-500" />
                          <span>Permanent Learner Badge</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate('/writing-practice')}
                          className="btn-primary w-full py-2.5 px-3 text-xs font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:scale-101 transition-all text-black"
                        >
                          <span>{t('startWriting', 'Start Writing')}</span>
                          <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. Voice Master Badge (Mint Green-to-Sunshine Fill) */}
                  <div
                    className="rounded-2xl p-2.5 border-2 transition-all flex flex-col justify-between relative overflow-hidden h-full min-h-0"
                    style={{
                      background: hasVoiceBadge
                        ? 'linear-gradient(135deg, #bbf7d0 0%, #86efac 60%, #fef08a 100%)'
                        : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #fef9c3 100%)',
                      borderColor: hasVoiceBadge ? '#4ade80' : '#86efac',
                      boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.10), 0 6px 14px -3px rgba(34, 197, 94, 0.22)',
                    }}
                  >
                    <div className="shrink-0">
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <div className="w-7 h-7 rounded-full bg-[#22c55e] text-white flex items-center justify-center shadow-xs shrink-0">
                          <Mic size={14} className="text-white" />
                        </div>

                        {hasVoiceBadge ? (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#166534] border border-[#86efac]">
                            ✓ {t('earned', 'Earned')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#e2e8f0] text-[#1e293b] border border-[#cbd5e1]">
                            🔒 {t('locked', 'LOCKED')}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-black text-black leading-tight">
                        {t('badgeVoiceMaster', 'Voice Master')}
                      </h4>
                    </div>

                    {/* Mascot Image in Gap */}
                    <div className="flex-1 flex items-center justify-center py-1 min-h-0">
                      <img
                        src="/assets/bird_speaking.jpg"
                        alt="Voice Mascot"
                        className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-2xl border-2 border-white shadow-md ring-2 ring-[#22c55e]/30 transition-transform hover:scale-104"
                      />
                    </div>

                    {/* CTA / Status Action */}
                    <div className="pt-1 shrink-0">
                      {hasVoiceBadge ? (
                        <div className="text-[10px] font-black text-[#166534] flex items-center justify-center gap-1 bg-[#dcfce7] py-1 rounded-lg border border-[#86efac]">
                          <Star size={12} className="text-amber-500 fill-amber-500" />
                          <span>Permanent Learner Badge</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate('/voice-practice')}
                          className="btn-primary w-full py-2.5 px-3 text-xs font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:scale-101 transition-all text-black"
                        >
                          <span>{t('startVoicePractice', 'Start Voice Practice')}</span>
                          <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Navigation Buttons */}
            <div className="pt-2 flex items-center gap-2.5 border-t border-slate-200/70 mt-1.5 shrink-0">
              <button
                className="btn-primary py-2.5 px-6 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md cursor-pointer hover:scale-101 transition-all text-black"
                type="button"
                onClick={() => navigate('/courses')}
              >
                <BookOpenCheck size={16} />
                <span>{t('goCourses') || 'Go to Courses'}</span>
                <ArrowRight size={15} />
              </button>

              <button
                className="py-2.5 px-5 text-xs sm:text-sm font-black flex items-center justify-center gap-2 rounded-xl text-[#0066ff] bg-[#f8fafc]/95 border-2 border-slate-200 hover:bg-white cursor-pointer active:translate-y-0.5 transition-all"
                style={{ boxShadow: '0 10px 22px -4px rgba(0, 0, 0, 0.10), 0 4px 10px -2px rgba(0, 0, 0, 0.05)' }}
                type="button"
                onClick={() => navigate('/certificate')}
              >
                <Award size={16} className="text-amber-500" />
                <span>{t('certificate') || 'Certificate'}</span>
              </button>
            </div>
          </motion.section>
        </div>

        {/* Right Column (5/12 Width) */}
        <div className="lg:col-span-5 flex flex-col gap-2.5 h-full min-h-0 justify-between">
          {/* AI Literacy Coach Card (Cyan-Sky-Lavender Multicolor Gradient) */}
          <motion.section
            className="rounded-3xl p-4 border-2 border-[#67e8f9]/70 flex flex-col justify-between flex-1 min-h-0"
            style={{
              background: 'linear-gradient(145deg, rgba(236, 254, 255, 0.96) 0%, rgba(224, 242, 254, 0.90) 35%, rgba(237, 233, 254, 0.88) 70%, rgba(253, 244, 255, 0.85) 100%)',
              boxShadow: '0 20px 42px -8px rgba(0, 0, 0, 0.14), 0 10px 24px -5px rgba(6, 182, 212, 0.22)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200/70 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#06b6d4] text-white flex items-center justify-center shadow-xs">
                  <Bot size={18} className="text-white" />
                </div>
                <h2 className="display text-sm sm:text-base font-black text-[#0284c7]">
                  {t('coach') || 'AI Literacy Coach'}
                </h2>
              </div>
              <SpeakButton
                text={coach}
                className="!bg-[#008ba3] hover:!bg-[#007a90] !text-white !font-black !px-4 !py-1.5 !rounded-xl !shadow-sm !border-0 text-xs cursor-pointer active:translate-y-0.5 transition-all"
              />
            </div>

            <div
              className="rounded-2xl p-4 border-2 border-[#7dd3fc]/80 flex items-center justify-between gap-3 flex-1"
              style={{
                background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 50%, #dbeafe 100%)',
                boxShadow: '0 8px 18px -3px rgba(0, 0, 0, 0.08), 0 4px 10px -2px rgba(6, 182, 212, 0.18)',
              }}
            >
              <p className="text-xs sm:text-[13.5px] font-bold leading-relaxed text-black">
                {coach || t('loading')}
              </p>
              <span className="text-3xl shrink-0">🚀</span>
            </div>
          </motion.section>

          {/* Streak & Streak Goal Card (Sunset-Gold-Mint Multicolor Gradient) */}
          <motion.section
            className="rounded-3xl p-4 border-2 border-[#fcd34d]/70 flex flex-col justify-between flex-1 min-h-0"
            style={{
              background: 'linear-gradient(145deg, rgba(255, 247, 237, 0.96) 0%, rgba(254, 243, 199, 0.90) 35%, rgba(254, 252, 232, 0.88) 70%, rgba(240, 253, 244, 0.85) 100%)',
              boxShadow: '0 20px 42px -8px rgba(0, 0, 0, 0.14), 0 10px 24px -5px rgba(245, 158, 11, 0.22)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-1.5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#f97316] text-white flex items-center justify-center shadow-xs">
                  <Target size={18} className="text-white" />
                </div>
                <h3 className="display text-sm sm:text-base font-black text-[#e11d48]">
                  {t('streakAndGoal') || 'Streak & Streak goal'}
                </h3>
              </div>
              {/* Cute smiling sun */}
              <span className="text-2xl sm:text-3xl">😎☀️</span>
            </div>

            <div className="space-y-1.5 my-auto">
              <div className="flex justify-between items-center text-xs font-black text-black">
                <span>{t('currentStreak') || 'Current Streak'}</span>
                <span className="text-black font-black">
                  {user?.streak?.current ?? 0} / {user?.streak?.goal || 7} {t('days') || 'days'}
                </span>
              </div>
              {/* Vibrant Orange-to-Green Gradient Bar */}
              <div className="w-full h-3 bg-[#e2e8f0] rounded-full overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-[#ea580c] via-[#eab308] to-[#22c55e] h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(
                      100,
                      Math.round(((user?.streak?.current || 2) / (user?.streak?.goal || 7)) * 100)
                    )}%`,
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <div className="pt-0.5 shrink-0">
              <span className="block text-[10px] font-black uppercase tracking-wider text-black mb-1.5">
                {t('setStreakGoal') || 'SET STREAK GOAL'}
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[7, 14, 30, 50].map((g) => {
                  const isActive = (user?.streak?.goal || 7) === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      disabled={busy}
                      className={`rounded-xl py-2 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        isActive
                          ? 'bg-gradient-to-r from-[#f59e0b] to-[#ea580c] text-white shadow-md border-0 scale-102'
                          : 'bg-gradient-to-r from-[#f8fafc] to-[#f1f5f9] text-black hover:bg-white border-2 border-[#e2e8f0] shadow-xs'
                      }`}
                      onClick={() => setGoal(g)}
                    >
                      {isActive && <Star size={12} className="fill-white" />}
                      <span>{g}d</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
