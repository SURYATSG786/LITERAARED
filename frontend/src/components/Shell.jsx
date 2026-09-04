import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  Gem,
  BookOpen,
  Home,
  User,
  Award,
  LogOut,
  Mic,
  Trophy,
  Users,
  Pencil,
  Menu,
  X,
  Sparkles,
  Download,
  Globe,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RedBird, LoginWelcomeToast } from './RedBird';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { SUPPORTED_LANGS, setAppLanguage } from '../i18n';

export default function Shell({ children }) {
  const { t, i18n } = useTranslation();
  const { user, logout, justLoggedIn, clearJustLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { canInstall, installPWA } = usePWAInstall();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (justLoggedIn) {
      setShowWelcome(true);
      clearJustLoggedIn();
    }
  }, [justLoggedIn, clearJustLoggedIn]);

  const isMentor = user?.role === 'mentor';
  const homePath = isMentor ? '/mentor-dashboard' : '/dashboard';

  const studentLinks = [
    { to: '/dashboard', label: t('dashboard'), icon: Home, iconColor: 'text-amber-700' },
    { to: '/courses', label: t('courses'), icon: BookOpen, iconColor: 'text-sky-500' },
    { to: '/league', label: t('league'), icon: Trophy, iconColor: 'text-emerald-500' },
    { to: '/community', label: t('community'), icon: Users, iconColor: 'text-rose-500' },
    { to: '/writing-practice', label: t('writingPractice'), icon: Pencil, iconColor: 'text-purple-500' },
    { to: '/voice-practice', label: t('voicePractice'), icon: Mic, iconColor: 'text-pink-500' },
    { to: '/shop', label: t('shop', 'Shop'), icon: ShoppingBag, iconColor: 'text-amber-500' },
    { to: '/certificate', label: t('certificate'), icon: Award, iconColor: 'text-amber-500' },
    { to: '/profile', label: t('profile'), icon: User, iconColor: 'text-teal-500' },
  ];

  const links = studentLinks;
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'L';
  const lessonsCount = user?.course_progress?.lessons_completed?.length || 0;

  return (
    <div className="min-h-[100dvh] flex flex-col text-[#032038] relative">
      {/* 🌟 PURE GLASS TOP HEADERBAR */}
      <header className="sticky top-0 z-40 px-2 sm:px-4 pt-2">
        <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between gap-1.5 sm:gap-2 rounded-2xl glass-header px-2.5 sm:px-4 py-2">
          {/* Left: Mobile Menu Button + Brand Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Hamburger Button on Mobile / Tablet */}
            <button
              type="button"
              id="student-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(true)}
              className="xl:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-white/30 hover:bg-white/50 text-[#032038] border-2 border-[#032038]/30 transition shadow-sm cursor-pointer active:scale-95"
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} className="text-[#032038]" />
            </button>

            {/* Logo & Brand */}
            <button
              type="button"
              className="flex items-center gap-1.5 cursor-pointer group text-left"
              onClick={() => navigate(homePath)}
              aria-label={t('appName')}
            >
              <RedBird size={28} mood="idle" />
              <div className="flex flex-col text-left">
                <span className="display text-base sm:text-lg font-black brand-shimmer leading-none">
                  LiteraAI
                </span>
                <span className="text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider text-black -mt-0.5">
                  Learner Portal
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links with Exact btn-primary Active Style */}
          <nav className="hidden xl:flex items-center gap-1 2xl:gap-1.5 min-w-0" aria-label="Main">
            {links.map(({ to, label, icon: Icon, iconColor }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  isActive
                    ? 'btn-primary flex items-center gap-1 2xl:gap-1.5 !px-2.5 2xl:!px-3 !py-1.5 text-[11px] 2xl:text-xs font-black shadow-md !rounded-xl cursor-pointer whitespace-nowrap !border-b-[3px]'
                    : 'flex items-center gap-1 2xl:gap-1.5 rounded-xl px-2 2xl:px-2.5 py-1.5 text-[11px] 2xl:text-xs font-black text-[#032038]/85 hover:text-[#032038] hover:bg-white/40 transition whitespace-nowrap'
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={14} className={`shrink-0 ${isActive ? 'text-[#3b2800]' : (iconColor || 'text-[#032038]')}`} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Streak & Gems Chips */}
            <motion.div
              className="flex items-center gap-1 rounded-full bg-white/30 px-2 sm:px-2.5 py-0.5 text-xs font-black text-[#7a4d00] border border-white/60 shadow-xs backdrop-blur-md"
              whileHover={{ scale: 1.05 }}
              title={t('streak')}
            >
              <Flame size={13} className="text-amber-600 fill-amber-500 shrink-0" />
              <span>{user?.streak?.current || 0}</span>
            </motion.div>

            <motion.div
              className="flex items-center gap-1 rounded-full bg-white/30 px-2 sm:px-2.5 py-0.5 text-xs font-black text-[#042e4c] border border-white/60 shadow-xs backdrop-blur-md"
              whileHover={{ scale: 1.05 }}
              title={t('gems')}
            >
              <Gem size={13} className="text-sky-600 fill-sky-400 shrink-0" />
              <span>{user?.gems || 0}</span>
            </motion.div>

            {/* Profile Avatar Trigger (Mobile/Desktop) */}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border-2 border-amber-400 shadow-xs hover:scale-105 transition cursor-pointer bg-amber-50"
              title="Go to Profile"
            >
              <video
                src="/assets/profile_bird_video.mp4"
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                aria-label="Profile animation"
              />
            </button>

            {/* Desktop Log Out button with exact btn-primary style */}
            <button
              type="button"
              className="hidden sm:flex items-center gap-1 btn-primary !px-2.5 !py-1 text-xs font-black !rounded-xl shadow-md shrink-0 cursor-pointer !border-b-[3px]"
              onClick={() => {
                logout();
                navigate('/');
              }}
              aria-label={t('logout')}
              title={t('logout')}
            >
              <LogOut size={13} className="text-[#3b2800] shrink-0" />
              <span className="font-black">{t('logout')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 📱 NEAT SLIDE-OUT MOBILE SIDEBAR DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 xl:hidden">
            {/* Frosted Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-[#032038]/40 backdrop-blur-md"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-out Sidebar Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="absolute top-0 bottom-0 left-0 w-[85vw] max-w-[320px] bg-gradient-to-b from-white/95 via-sky-50/95 to-white/95 backdrop-blur-2xl border-r border-white/80 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 safe-area-inset"
            >
              {/* Top Section: Brand + User Info */}
              <div className="p-4 space-y-4">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-sky-200/50">
                  <div className="flex items-center gap-2.5">
                    <RedBird size={34} mood="idle" />
                    <div>
                      <h2 className="display text-lg font-black brand-shimmer leading-none">
                        LiteraAI
                      </h2>
                      <span className="text-[10px] font-black uppercase tracking-wider text-black">
                        Learner Portal
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-9 h-9 rounded-xl bg-sky-100/80 hover:bg-sky-200/80 text-[#032038] flex items-center justify-center border border-white/80 transition cursor-pointer"
                    aria-label="Close Navigation"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Learner Profile Card */}
                <div className="rounded-2xl bg-white/60 border border-white/80 p-3 shadow-sm space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0b6fb8] to-[#0284c7] text-white flex items-center justify-center font-black text-sm shadow-sm">
                      {userInitial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-sm text-[#032038] truncate">
                        {user?.name || 'Learner'}
                      </p>
                      <p className="text-[11px] font-bold text-[#055f9e] truncate">
                        {user?.current_path ? t(`pathLabels.${user.current_path}`) : 'Foundation Track'}
                      </p>
                    </div>
                  </div>

                  {/* 3-Pill Stats Overview */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                    <div className="rounded-xl bg-amber-500/15 border border-amber-400/30 py-1 px-1">
                      <div className="flex items-center justify-center gap-1 text-amber-700 font-black text-xs">
                        <Flame size={12} className="fill-amber-500" />
                        <span>{user?.streak?.current || 0}</span>
                      </div>
                      <span className="text-[9px] font-extrabold text-amber-900/70 uppercase">Streak</span>
                    </div>
                    <div className="rounded-xl bg-sky-500/15 border border-sky-400/30 py-1 px-1">
                      <div className="flex items-center justify-center gap-1 text-sky-700 font-black text-xs">
                        <Gem size={12} className="fill-sky-400" />
                        <span>{user?.gems || 0}</span>
                      </div>
                      <span className="text-[9px] font-extrabold text-sky-900/70 uppercase">Gems</span>
                    </div>
                    <div className="rounded-xl bg-emerald-500/15 border border-emerald-400/30 py-1 px-1">
                      <div className="flex items-center justify-center gap-1 text-emerald-700 font-black text-xs">
                        <Sparkles size={12} className="text-emerald-600" />
                        <span>{lessonsCount}</span>
                      </div>
                      <span className="text-[9px] font-extrabold text-emerald-900/70 uppercase">Lessons</span>
                    </div>
                  </div>
                </div>

                {/* Sidebar Navigation Items */}
                <nav className="space-y-1" aria-label="Mobile Sidebar">
                  {links.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-extrabold transition cursor-pointer ${
                          isActive
                            ? 'bg-[#0284c7]/15 text-[#0284c7] font-black border border-[#0284c7]/30 shadow-xs'
                            : 'text-[#032038]/80 hover:bg-white/50 hover:text-[#032038]'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-white/70 flex items-center justify-center text-[#055f9e] shadow-xs">
                          <Icon size={16} />
                        </div>
                        <span>{label}</span>
                      </div>
                      <ChevronRight size={15} className="opacity-40" />
                    </NavLink>
                  ))}
                </nav>
              </div>

              {/* Bottom Footer Controls */}
              <div className="p-4 space-y-2.5 border-t border-sky-200/50 bg-white/40">
                {/* Install PWA Button (if available) */}
                {canInstall && (
                  <button
                    type="button"
                    onClick={installPWA}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black px-3 py-2 text-xs border border-amber-300 shadow-sm cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Install LiteraAI App</span>
                  </button>
                )}

                {/* Language Selector */}
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-white/60 border border-white/80 text-xs font-bold text-[#032038]">
                  <div className="flex items-center gap-1.5 text-[#055f9e]">
                    <Globe size={14} />
                    <span>Language</span>
                  </div>
                  <select
                    value={i18n.language}
                    onChange={(e) => setAppLanguage(e.target.value)}
                    className="bg-transparent text-xs font-black text-[#032038] outline-none cursor-pointer"
                  >
                    {SUPPORTED_LANGS.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mobile Log Out Button */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    navigate('/');
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500/18 hover:bg-red-500/28 text-red-900 font-black px-3.5 py-2.5 text-sm border border-red-400/40 transition cursor-pointer shadow-xs"
                >
                  <LogOut size={16} className="text-red-700" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Page Container (Fills the whole page, no overlapping elements) */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto px-3 sm:px-6 pt-2 pb-3">
        {children}
      </main>

      {/* Login Welcome Toast */}
      <AnimatePresence>
        {showWelcome ? (
          <LoginWelcomeToast
            key="login-welcome"
            message={t('birdLoginWelcome', {
              name: user?.name?.split(' ')[0] || (isMentor ? 'Admin' : 'Learner'),
            })}
            lang={i18n.language}
            onDone={() => setShowWelcome(false)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
