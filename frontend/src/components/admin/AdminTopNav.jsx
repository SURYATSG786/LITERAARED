import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  BarChart3,
  Settings,
  Search,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Download,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { RedBird } from '../RedBird';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export default function AdminTopNav({
  activeTab,
  onTabChange,
  needsAttentionCount = 0,
  onOpenQuickFind,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { canInstall, installPWA } = usePWAInstall();

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

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'learners', label: 'Learners', icon: Users },
    {
      id: 'attention',
      label: 'Needs Attention',
      icon: AlertTriangle,
      badge: needsAttentionCount > 0 ? needsAttentionCount : null,
    },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/mentor-login');
  };

  const handleMobileNavClick = (tabId) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'A';
  const adminName = user?.name || (user?.email ? user.email.split('@')[0] : 'Administrator');

  return (
    <header className="sticky top-0 z-40 px-2 sm:px-4 pt-2">
      <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between gap-2 rounded-2xl glass-header px-3 sm:px-5 py-2.5 shadow-xl border border-white/60">
        {/* Left: Mobile Menu Toggle + Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Hamburger Menu on Phone/Tablet */}
          <button
            type="button"
            id="admin-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/30 hover:bg-white/50 text-[#032038] border border-white/60 transition shadow-sm cursor-pointer active:scale-95"
            aria-label="Open Admin Navigation Menu"
          >
            <Menu size={22} className="text-[#032038]" />
          </button>

          {/* Brand Logo */}
          <button
            type="button"
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer text-left group"
            onClick={() => onTabChange('dashboard')}
            aria-label="LiteraAI Admin Portal"
          >
            <RedBird size={32} />
            <div className="flex flex-col text-left">
              <span className="display text-lg sm:text-xl font-black brand-shimmer leading-none">
                LiteraAI
              </span>
              <span className="text-[9.5px] font-black uppercase tracking-wider text-[#055f9e] -mt-0.5">
                Admin Portal
              </span>
            </div>
          </button>
        </div>

        {/* Center Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5" aria-label="Admin Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition cursor-pointer ${
                  isActive
                    ? 'bg-white/40 text-[#032038] glass-strong border border-white/70 shadow-sm'
                    : 'text-[#032038]/75 hover:text-[#032038] hover:bg-white/20'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-[#055f9e]' : 'opacity-70'} />
                <span>{item.label}</span>

                {item.badge != null && (
                  <span className="ml-1 rounded-md bg-red-500/25 text-red-900 border border-red-400/50 px-1.5 py-0.5 text-[10px] font-black shadow-xs">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Find (⌘K) */}
          <button
            type="button"
            id="admin-nav-quick-find-btn"
            onClick={onOpenQuickFind}
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-white/30 hover:bg-white/50 text-[#032038] px-2.5 sm:px-3 py-1.5 text-xs font-extrabold border border-white/60 transition shadow-xs cursor-pointer"
            title="Quick Find Learner (⌘K)"
          >
            <Search size={14} className="text-[#055f9e]" />
            <span className="hidden sm:inline">Quick Find</span>
            <kbd className="hidden md:inline-block rounded-md bg-white/50 px-1.5 py-0.5 text-[10px] font-mono font-black text-[#032038]/70 border border-white/60">
              ⌘K
            </kbd>
          </button>

          {/* User Identity Avatar / Chip */}
          <button
            type="button"
            id="admin-nav-profile-btn"
            onClick={() => onTabChange('settings')}
            className="flex items-center gap-2 rounded-xl bg-white/30 hover:bg-white/50 border border-white/60 px-2 sm:px-3 py-1 text-xs font-bold text-[#032038] transition cursor-pointer text-left shadow-xs"
            title="Manage Administrator Profile & Settings"
          >
            <div className="w-6 h-6 rounded-lg bg-[#0b6fb8]/20 text-[#0b6fb8] flex items-center justify-center font-black text-xs">
              {initial}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block font-black text-xs leading-none text-[#032038]">
                {adminName}
              </span>
              <span className="block text-[9px] font-extrabold text-[#055f9e] uppercase tracking-wider">
                Admin
              </span>
            </div>
          </button>

          {/* Desktop Sign Out Button */}
          <button
            type="button"
            id="admin-nav-logout-btn"
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1 sm:gap-1.5 rounded-xl bg-red-500/18 hover:bg-red-500/30 text-red-900 hover:text-red-950 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-black border border-red-400/50 transition shadow-md shrink-0 cursor-pointer backdrop-blur-md"
            title="Sign Out of Admin Portal"
          >
            <LogOut size={14} className="text-red-700" />
            <span className="font-black">Log Out</span>
          </button>
        </div>
      </div>

      {/* 📱 NEAT SLIDE-OUT ADMIN MOBILE SIDEBAR */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Frosted Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-[#032038]/40 backdrop-blur-md"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-out Admin Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="absolute top-0 bottom-0 left-0 w-[85vw] max-w-[320px] bg-gradient-to-b from-white/95 via-sky-50/95 to-white/95 backdrop-blur-2xl border-r border-white/80 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 safe-area-inset"
            >
              {/* Top Section */}
              <div className="p-4 space-y-4">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-sky-200/50">
                  <div className="flex items-center gap-2.5">
                    <RedBird size={34} />
                    <div>
                      <h2 className="display text-lg font-black brand-shimmer leading-none">
                        LiteraAI
                      </h2>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#055f9e]">
                        Admin Portal
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

                {/* Administrator Profile Card */}
                <div className="rounded-2xl bg-white/60 border border-white/80 p-3 shadow-sm space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#055f9e] to-[#0284c7] text-white flex items-center justify-center font-black text-sm shadow-sm">
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-sm text-[#032038] truncate">
                        {adminName}
                      </p>
                      <div className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#055f9e] uppercase tracking-wider">
                        <ShieldCheck size={12} className="text-[#055f9e]" />
                        <span>Administrator</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Find Trigger Inside Sidebar */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenQuickFind();
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-sky-100/70 hover:bg-sky-200/70 border border-sky-200 text-xs font-bold text-[#032038] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Search size={14} className="text-[#055f9e]" />
                      <span>Search Learner...</span>
                    </div>
                    <kbd className="rounded bg-white/80 px-1.5 py-0.5 text-[9px] font-mono font-black text-[#032038]/70 border border-white/80">
                      ⌘K
                    </kbd>
                  </button>
                </div>

                {/* Navigation Items */}
                <nav className="space-y-1" aria-label="Admin Mobile Navigation">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleMobileNavClick(item.id)}
                        className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-extrabold transition cursor-pointer text-left ${
                          isActive
                            ? 'bg-[#0284c7]/15 text-[#0284c7] font-black border border-[#0284c7]/30 shadow-xs'
                            : 'text-[#032038]/80 hover:bg-white/50 hover:text-[#032038]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-white/70 flex items-center justify-center text-[#055f9e] shadow-xs">
                            <Icon size={16} />
                          </div>
                          <span>{item.label}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.badge != null && (
                            <span className="rounded-md bg-red-500/25 text-red-900 border border-red-400/50 px-1.5 py-0.5 text-[10px] font-black shadow-xs">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight size={15} className="opacity-40" />
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom Footer Controls */}
              <div className="p-4 space-y-2.5 border-t border-sky-200/50 bg-white/40">
                {/* Install PWA App */}
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

                {/* Log Out Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500/18 hover:bg-red-500/28 text-red-900 font-black px-3.5 py-2.5 text-sm border border-red-400/40 transition cursor-pointer shadow-xs"
                >
                  <LogOut size={16} className="text-red-700" />
                  <span>Log Out of Admin</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
