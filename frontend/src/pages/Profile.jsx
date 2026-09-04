import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import {
  LogOut,
  User,
  Globe,
  GraduationCap,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Flame,
  Gem,
  Star,
  BookOpenCheck,
  Trophy,
  Pencil,
  Mic,
  Award,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/client";
import { SUPPORTED_LANGS, setAppLanguage } from "../i18n";
import { GuideBird } from "../components/RedBird";

const EDU = [
  { value: "No Formal Education", key: "edu_none" },
  { value: "Primary School", key: "edu_primary" },
  { value: "Middle School", key: "edu_middle" },
  { value: "High School", key: "edu_high" },
];

export default function Profile() {
  const { t } = useTranslation();
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || "",
    uiLanguage: (user?.uiLanguage || user?.preferred_language || "en").split("-")[0],
    learningLanguage: (user?.learningLanguage || user?.preferred_language || "en").split("-")[0],
    education_level: user?.education_level || "Primary School",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lessonsDone = user?.course_progress?.lessons_completed?.length || 0;

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

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const educationChanged = form.education_level !== user.education_level;
      const { user: next } = await api.updateMe(form);
      refreshUser(next);
      await setAppLanguage(form.uiLanguage);
      setMessage(t("save"));
      if (educationChanged) {
        navigate("/assessment");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full flex-1 flex flex-col justify-between gap-2 sm:gap-2.5 p-0.5 sm:p-1 min-h-0">
      {/* Top Banner Guide (Placed exactly like in other pages) */}
      <div className="flex items-center justify-end shrink-0 mb-0.5">
        <GuideBird message={t("birdGuideProfile")} mood="think" size={42} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-stretch flex-1 h-full min-h-0">
        {/* Left Side: Learner Badge & Stats Overview (4/12) */}
        <motion.div
          className="lg:col-span-4 glass-card rounded-3xl p-4 sm:p-5 border-2 border-[#032038]/20 shadow-xl text-center flex flex-col relative overflow-hidden bg-gradient-to-b from-white/95 via-sky-50/50 to-white/95 lg:h-full min-h-0 overflow-y-auto"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-br from-sky-400/20 to-blue-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-3 relative z-10">
            {/* Avatar */}
            <div className="relative inline-block mx-auto">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden shadow-xl ring-4 ring-white/90 border-2 border-amber-400/80 bg-amber-50">
                <img
                  src="/assets/profile_bird_circle.png"
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/profile_bird_circle.png";
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white shadow-sm" title="Active Learner">
                <ShieldCheck size={16} />
              </div>
            </div>

            {/* Learner Identity */}
            <div>
              <h2 className="display text-xl sm:text-2xl font-black text-[#032038] tracking-tight">
                {user?.name || "Learner"}
              </h2>
              <p className="text-xs font-black text-[#055f9e] mt-0.5">
                {user?.current_path ? t(`pathLabels.${user.current_path}`) : "Foundation Track"}
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 text-amber-950 border border-amber-600/30 px-3.5 py-0.5 rounded-full shadow-xs">
                  🏆 {t(`${user?.league || 'bronze'}League`, `${(user?.league || 'bronze').toUpperCase()} LEAGUE`)}
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="rounded-2xl bg-white/80 border-2 border-[#032038]/15 p-2 shadow-xs backdrop-blur-sm"
              >
                <div className="text-sm sm:text-base font-black text-amber-900">🔥 {user?.streak?.current || 0}</div>
                <div className="text-[9.5px] font-black uppercase tracking-wider text-[#032038]/60 mt-0.5">{t("streak") || "Streak"}</div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                className="rounded-2xl bg-white/80 border-2 border-[#032038]/15 p-2 shadow-xs backdrop-blur-sm"
              >
                <div className="text-sm sm:text-base font-black text-sky-900">💎 {user?.gems || 0}</div>
                <div className="text-[9.5px] font-black uppercase tracking-wider text-[#032038]/60 mt-0.5">{t("gems") || "Gems"}</div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                className="rounded-2xl bg-white/80 border-2 border-[#032038]/15 p-2 shadow-xs backdrop-blur-sm"
              >
                <div className="text-sm sm:text-base font-black text-emerald-900">⭐ {user?.xp || 0}</div>
                <div className="text-[9.5px] font-black uppercase tracking-wider text-[#032038]/60 mt-0.5">{t("xp") || "XP"}</div>
              </motion.div>
            </div>
          </div>

          {/* Mascot Showcase Image */}
          <div className="mt-3 mb-2 flex flex-col items-center justify-center relative z-10 shrink-0">
            <motion.div
              className="relative w-36 h-36 sm:w-44 sm:h-44 lg:w-48 lg:h-48 rounded-full overflow-hidden p-1.5 bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 shadow-2xl ring-4 ring-white/95"
              whileHover={{ scale: 1.04 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <video
                src="/assets/profile_bird_video.mp4"
                className="w-full h-full rounded-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                aria-label="Scholar Bird Mascot animation"
              />
            </motion.div>
          </div>

          {/* Badges Showcase Section (Writing Master & Voice Master) */}
          <div className="my-2 p-2.5 sm:p-3 rounded-2xl bg-white/75 border border-[#032038]/15 shadow-xs relative z-10 space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5">
                <Award size={15} className="text-[#ea580c] shrink-0" />
                <span className="text-[11px] sm:text-xs font-black text-[#032038] uppercase tracking-wider">
                  {t('yourBadges') || 'Your Badges'}
                </span>
              </div>
              <span className="text-[10px] font-black text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300 shadow-2xs">
                ⭐ {unlockedBadgesCount} / 2 {t('unlocked') || 'Unlocked'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* 1. Writing Master Badge */}
              <div
                className="rounded-xl p-2 border-2 flex flex-col justify-between text-left transition-all relative overflow-hidden"
                style={{
                  background: hasWritingBadge
                    ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 60%, #e0e7ff 100%)'
                    : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #ede9fe 100%)',
                  borderColor: hasWritingBadge ? '#60a5fa' : '#93c5fd',
                  boxShadow: '0 4px 10px -2px rgba(59, 130, 246, 0.15)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#3b82f6] text-white flex items-center justify-center shadow-xs shrink-0">
                      <Pencil size={11} className="text-white" />
                    </div>
                    {hasWritingBadge ? (
                      <span className="text-[8.5px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-[#dcfce7] text-[#166534] border border-[#86efac]">
                        ✓ {t('earned') || 'Earned'}
                      </span>
                    ) : (
                      <span className="text-[8.5px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-[#e2e8f0] text-[#1e293b] border border-[#cbd5e1]">
                        🔒 {t('locked') || 'LOCKED'}
                      </span>
                    )}
                  </div>

                  <h4 className="text-[10.5px] sm:text-[11px] font-black text-black leading-tight line-clamp-1 mb-1" title={t('badgeWritingMaster') || 'Writing Master'}>
                    {t('badgeWritingMaster') || 'Writing Master'}
                  </h4>
                </div>

                <div className="flex items-center justify-center py-1">
                  <img
                    src="/assets/bird_writing.jpg"
                    alt="Writing Mascot"
                    className="h-9 w-9 sm:h-11 sm:w-11 object-cover rounded-xl border border-white shadow-xs ring-1 ring-[#3b82f6]/30"
                  />
                </div>

                <div className="mt-1">
                  {hasWritingBadge ? (
                    <div className="text-[8.5px] sm:text-[9px] font-black text-[#166534] text-center bg-[#dcfce7] py-0.5 rounded border border-[#86efac]">
                      ✓ {t('earned') || 'Earned'}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/writing-practice')}
                      className="btn-primary w-full py-1 px-1 text-[9.5px] sm:text-[10px] font-black flex items-center justify-center gap-1 shadow-xs cursor-pointer text-black !rounded-lg"
                    >
                      <span className="truncate">{t('startWriting') || 'Start Writing'}</span>
                      <ArrowRight size={10} className="shrink-0" />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Voice Master Badge */}
              <div
                className="rounded-xl p-2 border-2 flex flex-col justify-between text-left transition-all relative overflow-hidden"
                style={{
                  background: hasVoiceBadge
                    ? 'linear-gradient(135deg, #bbf7d0 0%, #86efac 60%, #fef08a 100%)'
                    : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #fef9c3 100%)',
                  borderColor: hasVoiceBadge ? '#4ade80' : '#86efac',
                  boxShadow: '0 4px 10px -2px rgba(34, 197, 94, 0.15)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#22c55e] text-white flex items-center justify-center shadow-xs shrink-0">
                      <Mic size={11} className="text-white" />
                    </div>
                    {hasVoiceBadge ? (
                      <span className="text-[8.5px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-[#dcfce7] text-[#166534] border border-[#86efac]">
                        ✓ {t('earned') || 'Earned'}
                      </span>
                    ) : (
                      <span className="text-[8.5px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-[#e2e8f0] text-[#1e293b] border border-[#cbd5e1]">
                        🔒 {t('locked') || 'LOCKED'}
                      </span>
                    )}
                  </div>

                  <h4 className="text-[10.5px] sm:text-[11px] font-black text-black leading-tight line-clamp-1 mb-1" title={t('badgeVoiceMaster') || 'Voice Master'}>
                    {t('badgeVoiceMaster') || 'Voice Master'}
                  </h4>
                </div>

                <div className="flex items-center justify-center py-1">
                  <img
                    src="/assets/bird_speaking.jpg"
                    alt="Voice Mascot"
                    className="h-9 w-9 sm:h-11 sm:w-11 object-cover rounded-xl border border-white shadow-xs ring-1 ring-[#22c55e]/30"
                  />
                </div>

                <div className="mt-1">
                  {hasVoiceBadge ? (
                    <div className="text-[8.5px] sm:text-[9px] font-black text-[#166534] text-center bg-[#dcfce7] py-0.5 rounded border border-[#86efac]">
                      ✓ {t('earned') || 'Earned'}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/voice-practice')}
                      className="btn-primary w-full py-1 px-1 text-[9.5px] sm:text-[10px] font-black flex items-center justify-center gap-1 shadow-xs cursor-pointer text-black !rounded-lg"
                    >
                      <span className="truncate">{t('startSpeaking') || 'Start Speaking'}</span>
                      <ArrowRight size={10} className="shrink-0" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Logout Action */}
          <div className="pt-3 mt-auto border-t-2 border-[#032038]/10 relative z-10 shrink-0">
            <button
              type="button"
              onClick={() => { logout(); navigate("/"); }}
              className="btn-primary w-full flex items-center justify-center gap-2 !rounded-2xl !py-3 text-sm font-black shadow-md cursor-pointer !border-b-[4px]"
            >
              <LogOut size={17} />
              <span>{t("logout")}</span>
            </button>
          </div>
        </motion.div>

        {/* Right Side: Profile & Language Settings Form (8/12) */}
        <motion.form
          onSubmit={onSubmit}
          className="lg:col-span-8 glass-card rounded-3xl p-5 sm:p-6 lg:p-7 border-2 border-[#032038]/20 shadow-xl flex flex-col justify-between bg-gradient-to-br from-white/95 via-sky-50/40 to-white/95 lg:h-full min-h-0 overflow-y-auto"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
        >
          <div className="space-y-4 sm:space-y-5">
            {/* Form Title Translated */}
            <div className="border-b-2 border-[#032038]/12 pb-3.5 mb-2">
              <h3 className="display text-xl sm:text-2xl font-black text-[#032038]">
                {t("accountPreferences") || "Account & Language Preferences"}
              </h3>
            </div>

            {error ? (
              <div className="banner-err rounded-2xl p-3.5 font-black border-2 text-xs sm:text-sm">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="banner-ok rounded-2xl p-3.5 font-black border-2 flex items-center gap-2 text-xs sm:text-sm">
                <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
                <span>{message}</span>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {/* Learner Performance & Activity Highlights (Streak, Gems, XP, Lessons Completed, League) */}
              <div className="sm:col-span-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3">
                  {/* Streak */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="rounded-2xl p-3 border-2 border-[#fb923c]/60 flex items-center justify-between shadow-sm"
                    style={{
                      background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 40%, #fed7aa 75%, #fef08a 100%)',
                      boxShadow: '0 10px 24px -6px rgba(234, 88, 12, 0.18)',
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#ea580c] to-[#f97316] flex items-center justify-center text-white shadow-sm shrink-0">
                        <Flame size={18} className="fill-white" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] font-black uppercase tracking-wider text-gray-700 truncate">
                          {t('streak') || 'Streak'}
                        </span>
                        <span className="text-sm sm:text-base font-black text-black leading-tight block truncate">
                          {user?.streak?.current || 0} {t('days') || 'days'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xl sm:text-2xl shrink-0 ml-1">🔥</span>
                  </motion.div>

                  {/* Gems */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="rounded-2xl p-3 border-2 border-[#38bdf8]/60 flex items-center justify-between shadow-sm"
                    style={{
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 40%, #c7d2fe 75%, #e0e7ff 100%)',
                      boxShadow: '0 10px 24px -6px rgba(2, 132, 199, 0.18)',
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] flex items-center justify-center text-white shadow-sm shrink-0">
                        <Gem size={18} className="fill-white" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] font-black uppercase tracking-wider text-[#0284c7] truncate">
                          {t('gems') || 'Gems'}
                        </span>
                        <span className="text-sm sm:text-base font-black text-black leading-tight block truncate">
                          {user?.gems || 0}
                        </span>
                      </div>
                    </div>
                    <span className="text-xl sm:text-2xl shrink-0 ml-1">💎</span>
                  </motion.div>

                  {/* XP */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="rounded-2xl p-3 border-2 border-[#4ade80]/60 flex items-center justify-between shadow-sm"
                    style={{
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #bbf7d0 75%, #fef9c3 100%)',
                      boxShadow: '0 10px 24px -6px rgba(22, 163, 74, 0.18)',
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#16a34a] to-[#4ade80] flex items-center justify-center text-white shadow-sm shrink-0">
                        <Star size={18} className="fill-white" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] font-black uppercase tracking-wider text-[#16a34a] truncate">
                          {t('xp') || 'XP'}
                        </span>
                        <span className="text-sm sm:text-base font-black text-black leading-tight block truncate">
                          {user?.xp || 0}
                        </span>
                      </div>
                    </div>
                    <span className="text-xl sm:text-2xl shrink-0 ml-1">⭐</span>
                  </motion.div>

                  {/* Lessons Completed */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="rounded-2xl p-3 border-2 border-[#fb7185]/60 flex items-center justify-between shadow-sm"
                    style={{
                      background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 40%, #fecdd3 75%, #fce7f3 100%)',
                      boxShadow: '0 10px 24px -6px rgba(225, 29, 72, 0.18)',
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#e11d48] to-[#fb7185] flex items-center justify-center text-white shadow-sm shrink-0">
                        <BookOpenCheck size={18} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] font-black uppercase tracking-wider text-[#e11d48] truncate">
                          {t('lessonsCompleted') || 'Lessons completed'}
                        </span>
                        <span className="text-sm sm:text-base font-black text-black leading-tight block truncate">
                          {lessonsDone} {t('of') || 'of'} 4
                        </span>
                      </div>
                    </div>
                    <span className="text-xl sm:text-2xl shrink-0 ml-1">📖</span>
                  </motion.div>

                  {/* League */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => navigate('/league')}
                    className="col-span-2 sm:col-span-1 xl:col-span-1 rounded-2xl p-3 border-2 border-[#f59e0b]/60 flex items-center justify-between shadow-sm cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 40%, #fde68a 75%, #fed7aa 100%)',
                      boxShadow: '0 10px 24px -6px rgba(217, 119, 6, 0.18)',
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#d97706] to-[#f59e0b] flex items-center justify-center text-white shadow-sm shrink-0">
                        <Trophy size={18} className="fill-white" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] font-black uppercase tracking-wider text-[#d97706] truncate">
                          {t('league') || 'League'}
                        </span>
                        <span className="text-sm sm:text-base font-black text-black leading-tight block truncate">
                          {t(`${user?.league || 'bronze'}League`, `${(user?.league || 'bronze').charAt(0).toUpperCase() + (user?.league || 'bronze').slice(1)} League`)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xl sm:text-2xl shrink-0 ml-1">🛡️</span>
                  </motion.div>
                </div>
              </div>

              {/* Full Name */}
              <div className="sm:col-span-2 space-y-2">
                <label className="text-xs sm:text-sm font-black text-[#032038]/90 flex items-center gap-1.5">
                  <User size={16} className="text-[#055f9e] shrink-0" />
                  <span>{t("fullName")}</span>
                </label>
                <input
                  className="input w-full font-bold shadow-inner focus:ring-2 focus:ring-[#055f9e]/30 rounded-2xl py-3 px-4 text-sm sm:text-base bg-white/90"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* Interface Language */}
              <div className="space-y-2 flex flex-col justify-between bg-white/60 p-3.5 rounded-2xl border border-[#032038]/10 shadow-xs">
                <div>
                  <label className="text-xs sm:text-sm font-black text-[#032038]/90 flex items-center gap-1.5 mb-2">
                    <Globe size={16} className="text-[#055f9e] shrink-0" />
                    <span>{t("interfaceLanguage")}</span>
                  </label>
                  <select
                    className="input w-full font-extrabold cursor-pointer shadow-inner rounded-2xl py-3 px-3.5 text-sm bg-white"
                    value={form.uiLanguage}
                    onChange={(e) => setForm({ ...form, uiLanguage: e.target.value })}
                  >
                    {SUPPORTED_LANGS.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <span className="text-[11px] font-bold text-[#032038]/65 leading-relaxed block mt-1">
                  {t("interfaceLanguageDescription")}
                </span>
              </div>

              {/* Learning Language */}
              <div className="space-y-2 flex flex-col justify-between bg-white/60 p-3.5 rounded-2xl border border-[#032038]/10 shadow-xs">
                <div>
                  <label className="text-xs sm:text-sm font-black text-[#032038]/90 flex items-center gap-1.5 mb-2">
                    <GraduationCap size={16} className="text-[#055f9e] shrink-0" />
                    <span>{t("learningLanguage")}</span>
                  </label>
                  <select
                    className="input w-full font-extrabold cursor-pointer shadow-inner rounded-2xl py-3 px-3.5 text-sm bg-white"
                    value={form.learningLanguage}
                    onChange={(e) => setForm({ ...form, learningLanguage: e.target.value })}
                  >
                    {SUPPORTED_LANGS.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <span className="text-[11px] font-bold text-[#032038]/65 leading-relaxed block mt-1">
                  {t("learningLanguageDescription")}
                </span>
              </div>

              {/* Education Level */}
              <div className="sm:col-span-2 space-y-2 bg-white/60 p-3.5 rounded-2xl border border-[#032038]/10 shadow-xs">
                <label className="text-xs sm:text-sm font-black text-[#032038]/90 flex items-center gap-1.5 mb-2">
                  <GraduationCap size={16} className="text-[#055f9e] shrink-0" />
                  <span>{t("educationLevel")}</span>
                </label>
                <select
                  className="input w-full font-extrabold cursor-pointer shadow-inner rounded-2xl py-3 px-4 text-sm sm:text-base bg-white"
                  value={form.education_level}
                  onChange={(e) => setForm({ ...form, education_level: e.target.value })}
                >
                  {EDU.map((e) => (
                    <option key={e.value} value={e.value}>{t(e.key)}</option>
                  ))}
                </select>
                <span className="text-[11px] font-bold text-[#032038]/65 leading-relaxed block mt-1">
                  {t("reassessNote")}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t-2 border-[#032038]/10 mt-auto flex justify-end shrink-0">
            <button
              className="btn-primary w-full sm:w-auto px-10 py-3.5 text-sm sm:text-base font-black shadow-xl hover:scale-102 transition-all cursor-pointer flex items-center justify-center gap-2"
              type="submit"
              disabled={busy}
            >
              {busy ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>{t("loading")}</span>
                </>
              ) : (
                <span>{t("save")}</span>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
