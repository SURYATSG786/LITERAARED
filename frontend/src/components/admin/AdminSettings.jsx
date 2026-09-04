import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  User,
  Shield,
  Sliders,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  Mail,
  Calendar,
  Check,
  Award,
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { setAppLanguage } from '../../i18n';

export default function AdminSettings() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states - initialized with fallback to user context
  const [adminName, setAdminName] = useState(user?.name || '');
  const [adminEmail, setAdminEmail] = useState(user?.email || '');
  const [adminRole, setAdminRole] = useState(user?.role || 'admin');
  const [adminLanguage, setAdminLanguage] = useState(user?.uiLanguage || user?.preferred_language || 'en');
  const [adminCreatedAt, setAdminCreatedAt] = useState(user?.created_at || '');

  const [platformConfig, setPlatformConfig] = useState({
    defaultStreakGoal: 14,
    assessmentPassThreshold: 40,
    inactivityAlertDays: 5,
    emailNotifications: true,
    weeklyDigest: true,
  });

  const supportedLanguagesList = [
    { code: 'ta', label: 'Tamil (தமிழ்)' },
    { code: 'te', label: 'Telugu (తెలుగు)' },
    { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
    { code: 'hi', label: 'Hindi (हिन्दी)' },
    { code: 'ml', label: 'Malayalam (മലയാളം)' },
    { code: 'en', label: 'English' },
  ];

  // Sync with user context when available
  useEffect(() => {
    if (user) {
      if (!adminName && user.name) setAdminName(user.name);
      if (!adminEmail && user.email) setAdminEmail(user.email);
      if (user.role) setAdminRole(user.role);
      if (user.uiLanguage || user.preferred_language) {
        setAdminLanguage(user.uiLanguage || user.preferred_language);
      }
      if (user.created_at) setAdminCreatedAt(user.created_at);
    }
  }, [user]);

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAdminSettings();
      if (res.admin) {
        const loadedName = res.admin.name && res.admin.name !== 'Administrator'
          ? res.admin.name
          : (user?.name || res.admin.name || (res.admin.email ? res.admin.email.split('@')[0] : 'Administrator'));
        setAdminName(loadedName);
        setAdminEmail(res.admin.email || user?.email || '');
        setAdminRole(res.admin.role || user?.role || 'admin');
        if (res.admin.ui_language || res.admin.preferred_language) {
          setAdminLanguage(res.admin.ui_language || res.admin.preferred_language);
        }
        if (res.admin.created_at) {
          setAdminCreatedAt(res.admin.created_at);
        }
      }
      if (res.settings) {
        setPlatformConfig((prev) => ({
          ...prev,
          ...res.settings,
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch settings from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveAll = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const trimmedName = adminName.trim();
      const trimmedEmail = adminEmail.trim().toLowerCase();

      if (!trimmedName) {
        setError('Administrator full name cannot be empty.');
        setSaving(false);
        return;
      }
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        setError('A valid email address is required.');
        setSaving(false);
        return;
      }

      const payload = {
        name: trimmedName,
        email: trimmedEmail,
        preferred_language: adminLanguage,
        uiLanguage: adminLanguage,
        settings: {
          defaultStreakGoal: Number(platformConfig.defaultStreakGoal) || 14,
          assessmentPassThreshold: Number(platformConfig.assessmentPassThreshold) || 40,
          inactivityAlertDays: Number(platformConfig.inactivityAlertDays) || 5,
          emailNotifications: Boolean(platformConfig.emailNotifications),
          weeklyDigest: Boolean(platformConfig.weeklyDigest),
        },
      };

      const res = await api.updateAdminSettings(payload);
      setSuccessMessage('Administrator account details & platform settings saved successfully to SQLite database!');

      // Synchronize frontend auth context immediately
      if (res.user) {
        refreshUser(res.user);
      } else if (user) {
        refreshUser({
          ...user,
          name: trimmedName,
          email: trimmedEmail,
          uiLanguage: adminLanguage,
          preferred_language: adminLanguage,
        });
      }

      // Switch language if changed
      if (adminLanguage) {
        await setAppLanguage(adminLanguage);
      }
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const initial = adminName
    ? adminName.charAt(0).toUpperCase()
    : (adminEmail ? adminEmail.charAt(0).toUpperCase() : 'A');

  const formattedDate = adminCreatedAt
    ? new Date(adminCreatedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Active Session';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="rounded-2xl glass-card border border-white/70 p-5 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-900 flex items-center justify-center border border-purple-400/40 shadow-xs">
            <Settings size={20} />
          </div>
          <div>
            <h2 className="display text-lg font-black text-[#032038] leading-tight">
              Admin & Platform Settings
            </h2>
            <p className="text-xs font-bold text-[#032038]/70">
              Manage your administrator credentials and platform-wide literacy thresholds
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchSettings}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-xl bg-white/40 hover:bg-white/60 text-[#032038] border border-white/70 transition shadow-xs cursor-pointer"
          title="Reload Settings"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-[#055f9e]' : 'text-[#055f9e]'} />
          <span className="hidden sm:inline">Reload</span>
        </button>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-400/40 text-red-950 font-bold text-xs flex items-center gap-2 shadow-xs">
          <AlertCircle size={16} className="text-red-700 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-950 font-black text-xs flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Live Admin Identity Card */}
      <div className="rounded-2xl glass-card border border-white/70 p-6 shadow-lg relative overflow-hidden bg-linear-to-r from-white/60 via-white/40 to-blue-50/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#0b6fb8] to-[#043e6b] text-white flex items-center justify-center text-xl font-black shadow-md border-2 border-white">
                {initial}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs" title="Online" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="display text-base sm:text-lg font-black text-[#032038]">
                  {adminName || 'Administrator'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[#055f9e]/15 text-[#055f9e] border border-[#055f9e]/30">
                  <Shield size={10} />
                  Super Admin
                </span>
              </div>
              <p className="text-xs font-bold text-[#032038]/70 flex items-center gap-1.5 mt-0.5">
                <Mail size={12} className="text-[#055f9e]" />
                {adminEmail || 'No email configured'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center text-xs font-bold text-[#032038]/75 bg-white/40 border border-white/60 rounded-xl px-3 py-2">
            <Calendar size={14} className="text-[#055f9e]" />
            <span>Member since: <strong className="text-[#032038] font-black">{formattedDate}</strong></span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Section 1: Administrator Account Details */}
        <div className="rounded-2xl glass-card border border-white/70 p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-white/40 pb-3">
            <div className="flex items-center gap-2">
              <User size={18} className="text-[#055f9e]" />
              <h3 className="display text-sm font-black text-[#032038]">
                Administrator Account Details
              </h3>
            </div>
            <span className="text-[11px] font-extrabold text-[#055f9e] bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-400/30">
              SQLite Auth Identity
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-[#032038]/70 mb-1.5">
                Full Name <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="admin-name-input"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Administrator"
                  required
                  className="w-full text-xs sm:text-sm font-bold p-3 rounded-xl border border-white/70 bg-white/50 text-[#032038] placeholder-[#032038]/40 focus:outline-none focus:ring-2 focus:ring-[#055f9e] shadow-xs transition"
                />
              </div>
              <span className="text-[10px] font-semibold text-[#032038]/60 mt-1 block">
                Displayed in top navigation bar, certificates, and student reminders
              </span>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-[#032038]/70 mb-1.5">
                Email Address <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="admin-email-input"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@literaai.org"
                  required
                  className="w-full text-xs sm:text-sm font-bold p-3 rounded-xl border border-white/70 bg-white/50 text-[#032038] placeholder-[#032038]/40 focus:outline-none focus:ring-2 focus:ring-[#055f9e] shadow-xs transition"
                />
              </div>
              <span className="text-[10px] font-semibold text-[#032038]/60 mt-1 block">
                Primary administrative login and digest dispatch address
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-black uppercase text-[#032038]/70 mb-1.5">
                Admin Interface Language
              </label>
              <select
                id="admin-language-select"
                value={adminLanguage}
                onChange={(e) => setAdminLanguage(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold p-3 rounded-xl border border-white/70 bg-white/50 text-[#032038] focus:outline-none focus:ring-2 focus:ring-[#055f9e] shadow-xs transition cursor-pointer"
              >
                {supportedLanguagesList.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-[#032038]/70 mb-1.5">
                Access Level & Privileges
              </label>
              <div className="p-3 rounded-xl bg-white/30 border border-white/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-emerald-700" />
                  <span className="text-xs font-black text-[#032038]">
                    Full Administrator Privileges
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/40">
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Platform Literacy Thresholds */}
        <div className="rounded-2xl glass-card border border-white/70 p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-white/40 pb-3">
            <Sliders size={18} className="text-[#055f9e]" />
            <h3 className="display text-sm font-black text-[#032038]">
              Platform Thresholds & Risk Criteria
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-[#032038]/70 mb-1">
                Default Streak Goal (Days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                id="admin-streak-goal-input"
                value={platformConfig.defaultStreakGoal}
                onChange={(e) =>
                  setPlatformConfig({ ...platformConfig, defaultStreakGoal: e.target.value })
                }
                className="w-full text-xs sm:text-sm font-bold p-3 rounded-xl border border-white/70 bg-white/50 text-[#032038] focus:outline-none focus:ring-2 focus:ring-[#055f9e] shadow-xs"
              />
              <span className="text-[10px] font-semibold text-[#032038]/60 mt-1 block">
                Target days assigned to new learners
              </span>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-[#032038]/70 mb-1">
                Diagnostic Pass Threshold (%)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                id="admin-pass-threshold-input"
                value={platformConfig.assessmentPassThreshold}
                onChange={(e) =>
                  setPlatformConfig({
                    ...platformConfig,
                    assessmentPassThreshold: e.target.value,
                  })
                }
                className="w-full text-xs sm:text-sm font-bold p-3 rounded-xl border border-white/70 bg-white/50 text-[#032038] focus:outline-none focus:ring-2 focus:ring-[#055f9e] shadow-xs"
              />
              <span className="text-[10px] font-semibold text-[#032038]/60 mt-1 block">
                Scores below this trigger foundational intervention
              </span>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-[#032038]/70 mb-1">
                Inactivity Alert (Days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                id="admin-inactivity-input"
                value={platformConfig.inactivityAlertDays}
                onChange={(e) =>
                  setPlatformConfig({
                    ...platformConfig,
                    inactivityAlertDays: e.target.value,
                  })
                }
                className="w-full text-xs sm:text-sm font-bold p-3 rounded-xl border border-white/70 bg-white/50 text-[#032038] focus:outline-none focus:ring-2 focus:ring-[#055f9e] shadow-xs"
              />
              <span className="text-[10px] font-semibold text-[#032038]/60 mt-1 block">
                Days without activity to flag on Needs Attention
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Regional Language Support Status */}
        <div className="rounded-2xl glass-card border border-white/70 p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-white/40 pb-3">
            <Globe size={18} className="text-[#055f9e]" />
            <h3 className="display text-sm font-black text-[#032038]">
              Active Regional Languages in Platform
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {supportedLanguagesList.map((lang) => (
              <div
                key={lang.code}
                className="p-3 rounded-xl bg-white/40 border border-white/60 flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-black text-[#032038]">{lang.label}</span>
                  <span className="text-[10px] font-bold text-[#055f9e] uppercase">Code: {lang.code}</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Notification Preferences */}
        <div className="rounded-2xl glass-card border border-white/70 p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-white/40 pb-3">
            <Bell size={18} className="text-[#055f9e]" />
            <h3 className="display text-sm font-black text-[#032038]">
              Admin Alerts & Notification Preferences
            </h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/40 border border-white/60 cursor-pointer hover:bg-white/60 transition">
              <input
                type="checkbox"
                id="admin-email-alerts-checkbox"
                checked={platformConfig.emailNotifications}
                onChange={(e) =>
                  setPlatformConfig({ ...platformConfig, emailNotifications: e.target.checked })
                }
                className="w-4 h-4 rounded text-[#055f9e] focus:ring-[#055f9e]"
              />
              <div>
                <p className="text-xs font-black text-[#032038]">Inactivity Email Alerts</p>
                <p className="text-[11px] font-semibold text-[#032038]/70">
                  Receive instant alerts when a learner reaches critical inactivity thresholds.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/40 border border-white/60 cursor-pointer hover:bg-white/60 transition">
              <input
                type="checkbox"
                id="admin-weekly-digest-checkbox"
                checked={platformConfig.weeklyDigest}
                onChange={(e) =>
                  setPlatformConfig({ ...platformConfig, weeklyDigest: e.target.checked })
                }
                className="w-4 h-4 rounded text-[#055f9e] focus:ring-[#055f9e]"
              />
              <div>
                <p className="text-xs font-black text-[#032038]">Weekly Cohort Analytics Digest</p>
                <p className="text-[11px] font-semibold text-[#032038]/70">
                  Send a weekly breakdown of new registrations, score distributions, and certificates.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            id="admin-save-settings-btn"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-linear-to-b from-[#fff6c4] to-[#ffd633] hover:from-[#fff9d4] hover:to-[#ffe054] text-[#4a3200] border-b-4 border-[#cf8a00] font-black text-sm shadow-xl transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 active:translate-y-0.5 active:border-b-2"
          >
            <Save size={16} className="text-[#704d00]" />
            <span>{saving ? 'Saving Changes...' : 'Save Settings to Database'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
