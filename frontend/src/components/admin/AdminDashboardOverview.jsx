import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Award,
  CheckCircle,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Flame,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Clock,
  Eye,
  FileSpreadsheet,
  PlusCircle,
  ShieldCheck,
  Search,
  Globe,
  Zap,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { RedBird } from '../RedBird';
import api from '../../api/client';
import StatTile from './StatTile';
import LearnerDetailDrawer from './LearnerDetailDrawer';
import AddLearnerModal from '../mentor/AddLearnerModal';

export default function AdminDashboardOverview({ onNavigateTab }) {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [needsAttentionData, setNeedsAttentionData] = useState(null);
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [error, setError] = useState('');

  // Modals & Drawers
  const [selectedLearnerId, setSelectedLearnerId] = useState(null);
  const [isAddLearnerOpen, setIsAddLearnerOpen] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [dash, attention, reports] = await Promise.allSettled([
        api.getAdminDashboard(),
        api.getAdminNeedsAttention(),
        api.getAdminReports(),
      ]);

      if (dash.status === 'fulfilled') setDashboardData(dash.value);
      if (attention.status === 'fulfilled') setNeedsAttentionData(attention.value);
      if (reports.status === 'fulfilled') setReportsData(reports.value);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const blob = await api.exportAdminLearnersCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `literaai_learners_roster_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Failed to export CSV');
    } finally {
      setExportingCsv(false);
    }
  };

  const stats = dashboardData?.stats || {};
  const overview = dashboardData?.overview || {};
  const recentRegistrations = dashboardData?.recentRegistrations || [];
  const recentCertificates = dashboardData?.recentCertificates || [];
  const attentionLearners = needsAttentionData?.learners || [];
  const attentionCount = needsAttentionData?.count || attentionLearners.length;

  const inactiveCount = attentionLearners.filter(
    (l) => l.flagType === 'inactive' || l.daysInactive >= 5
  ).length;
  const lowScoreCount = attentionLearners.filter(
    (l) => l.flagType === 'critical' || (l.assessmentScore != null && l.assessmentScore < 40)
  ).length;
  const unassessedCount = attentionLearners.filter(
    (l) => l.flagType === 'info' || l.assessmentScore == null
  ).length;

  const languages = reportsData?.languageDistribution || reportsData?.languagePopularity || [];

  const currentDateFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const avatarGradients = [
    'bg-[#055f9e]/20 text-[#055f9e] border border-[#055f9e]/30',
    'bg-[#2e9e44]/20 text-[#0f4a1f] border border-[#2e9e44]/30',
    'bg-[#ffb300]/25 text-[#664000] border border-[#ffb300]/40',
    'bg-purple-500/20 text-purple-900 border border-purple-400/30',
    'bg-[#0b6fb8]/20 text-[#042e4c] border border-[#0b6fb8]/30',
    'bg-rose-500/20 text-rose-900 border border-rose-400/30',
  ];

  return (
    <div className="space-y-6">
      {/* 🌟 1. EXECUTIVE HERO BANNER (PURE GLASS-CARD MATCHING STUDENT DASHBOARD) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-5 sm:p-7 shadow-xl border border-white/60"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          {/* Left: Greeting & Date */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#06304f]/70">
                {currentDateFormatted}
              </span>
            </div>

            <h1 className="display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#06304f] leading-tight">
              Welcome back, <span className="brand-shimmer">{user?.name || 'Administrator'}</span> 👋
            </h1>

            <p className="text-xs sm:text-sm font-semibold text-[#06304f]/75 max-w-2xl leading-relaxed">
              Real-time administrative oversight across student cohorts, foundational diagnostic
              assessments, learning path velocity, and at-risk early interventions.
            </p>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full lg:w-auto">
            {/* Add Learner (btn-primary from index.css) */}
            <button
              type="button"
              id="admin-hero-add-learner-btn"
              onClick={() => setIsAddLearnerOpen(true)}
              className="btn-primary py-2.5 px-4 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg"
            >
              <PlusCircle size={15} className="text-[#4a3200]" />
              <span>Add Learner</span>
            </button>

            {/* Export CSV (btn-ghost from index.css) */}
            <button
              type="button"
              id="admin-hero-export-csv-btn"
              disabled={exportingCsv || loading}
              onClick={handleExportCsv}
              className="btn-ghost py-2.5 px-3.5 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm"
              title="Download Full Learner Roster in CSV format"
            >
              <FileSpreadsheet size={15} className="text-[#055f9e]" />
              <span>{exportingCsv ? 'Exporting...' : 'Export CSV'}</span>
            </button>

            {/* Refresh */}
            <button
              type="button"
              id="admin-hero-refresh-btn"
              onClick={fetchAllData}
              className="btn-ghost p-2.5 text-xs font-extrabold flex items-center justify-center shadow-sm"
              title="Refresh All Metrics"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-[#055f9e]' : 'text-[#055f9e]'} />
            </button>
          </div>
        </div>

        {/* Mascot Intelligence Speech Line */}
        <div className="mt-5 pt-4 border-t border-white/40 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/40 flex items-center justify-center border border-white/60 shadow-xs shrink-0">
            <RedBird size={20} />
          </div>
          <p className="text-xs font-bold text-[#032038]/85 leading-relaxed">
            {attentionCount > 0 ? (
              <span>
                <strong className="text-red-700 font-extrabold">{attentionCount} learners</strong> need
                timely intervention (inactive &gt;5 days or low scores). Sending them a quick encouragement
                restores continuous learning!
              </span>
            ) : (
              <span>
                ✨ <strong className="text-emerald-700 font-extrabold">100% of learners</strong> are
                active or on track with foundational milestones today. Excellent cohort engagement!
              </span>
            )}
          </p>
        </div>
      </motion.div>

      {/* 🌟 2. 4 THEME-TONED KPI STAT CARDS (BLUE, GREEN, GOLD, TEAL/BLUE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Registered Students (stat-blue) */}
        <StatTile
          title="Total Registered Students"
          value={stats.totalStudents?.value ?? overview.totalStudents ?? 0}
          unit=""
          icon={Users}
          trend={stats.totalStudents?.trend ?? 0}
          trendDirection={stats.totalStudents?.trendDirection || 'up'}
          comparisonText="vs 7d ago"
          subtext={stats.totalStudents?.subtext || `${overview.totalStudents || 0} registered learners`}
          tone="blue"
          loading={loading}
          onClick={() => onNavigateTab('learners')}
        />

        {/* 2. Assessments Completed (stat-green) */}
        <StatTile
          title="Assessments Completed"
          value={stats.completedAssessments?.value ?? overview.completedAssessments ?? 0}
          unit=""
          icon={CheckCircle}
          trend={stats.completedAssessments?.trend ?? 0}
          trendDirection={stats.completedAssessments?.trendDirection || 'up'}
          comparisonText="vs 7d ago"
          subtext={stats.completedAssessments?.subtext || `${overview.completedAssessments || 0} completed`}
          tone="green"
          loading={loading}
          onClick={() => onNavigateTab('learners')}
        />

        {/* 3. Average Assessment Score (stat-gold with Warning Accent) */}
        <StatTile
          title="Cohort Avg Assessment Score"
          value={stats.avgAssessmentScore?.value ?? overview.avgScore ?? 0}
          unit="%"
          icon={Award}
          trend={stats.avgAssessmentScore?.trend ?? 0}
          trendDirection={stats.avgAssessmentScore?.trendDirection || ((stats.avgAssessmentScore?.value ?? overview.avgScore ?? 0) >= 60 ? 'up' : 'down')}
          comparisonText="vs 7d ago"
          subtext={stats.avgAssessmentScore?.subtext || ((stats.avgAssessmentScore?.value ?? overview.avgScore ?? 0) >= 60 ? 'Healthy comprehension' : 'Foundational support needed')}
          tone="gold"
          isWarning={(stats.avgAssessmentScore?.value ?? overview.avgScore ?? 0) > 0 && (stats.avgAssessmentScore?.value ?? overview.avgScore ?? 0) < 40}
          loading={loading}
          onClick={() => onNavigateTab('reports')}
        />

        {/* 4. Active Progression & Unlocked (stat-blue) */}
        <StatTile
          title="Active Progression & Unlocked"
          value={stats.unlockedCourses?.value ?? overview.unlockedCourses ?? 0}
          unit=""
          icon={BookOpen}
          trend={stats.unlockedCourses?.trend ?? 0}
          trendDirection={stats.unlockedCourses?.trendDirection || 'up'}
          comparisonText="vs 7d ago"
          subtext={stats.unlockedCourses?.subtext || `${overview.unlockedCourses || 0} active path learners`}
          tone="blue"
          loading={loading}
          onClick={() => onNavigateTab('reports')}
        />
      </div>

      {/* 🌟 3. AT-RISK BANNER (STAT-RED / TRANSLUCENT GLASS) */}
      {attentionCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl stat-red p-5 shadow-lg border backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-red-500/25 text-[#661818] flex items-center justify-center border border-red-400/50 shadow-xs shrink-0">
              <AlertTriangle size={22} className="text-red-700" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="display text-base sm:text-lg font-extrabold text-[#661818]">
                  {attentionCount} {attentionCount === 1 ? 'Learner Requires' : 'Learners Require'} Active Attention
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                  Needs Action
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#032038]/80">
                {inactiveCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-[#664000] border border-amber-400/40">
                    <Clock size={12} /> {inactiveCount} Inactive &gt;5 Days
                  </span>
                )}
                {lowScoreCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/20 text-[#661818] border border-red-400/40">
                    <AlertTriangle size={12} /> {lowScoreCount} Low Scores (&lt;40%)
                  </span>
                )}
                {unassessedCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 text-[#042e4c] border border-blue-400/40">
                    <GraduationCap size={12} /> {unassessedCount} Unassessed
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              type="button"
              id="admin-review-attention-btn"
              onClick={() => onNavigateTab('attention')}
              className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Review & Nudge At-Risk Learners</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </motion.div>
      )}

      {/* 🌟 4. COHORT HEALTH STRIP (DISTINCT THEME ACCENTS: GOLD, BLUE, GREEN) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Active Practice (stat-gold) */}
        <div className="glass-card stat-gold rounded-2xl p-4 shadow-md flex items-center justify-between border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/25 text-[#664000] flex items-center justify-center border border-amber-400/40 shadow-xs">
              <Flame size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase opacity-85">Active Practice (7d)</p>
              <p className="text-lg font-black text-[#032038]">
                {overview.activeUsersThisWeek ?? stats.totalStudents?.value ?? 0} Learners
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-[#664000] bg-amber-500/25 px-2.5 py-1 rounded-lg border border-amber-400/40">
            Continuous
          </span>
        </div>

        {/* Card 2: Platform Verification (stat-blue) */}
        <div className="glass-card stat-blue rounded-2xl p-4 shadow-md flex items-center justify-between border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0b6fb8]/20 text-[#042e4c] flex items-center justify-center border border-[#0b6fb8]/30 shadow-xs">
              <ShieldCheck size={20} className="text-[#055f9e]" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase opacity-85">Platform Verification</p>
              <p className="text-lg font-black text-[#032038]">100% Real-Time</p>
            </div>
          </div>
          <span className="text-xs font-black text-[#042e4c] bg-[#0b6fb8]/20 px-2.5 py-1 rounded-lg border border-[#0b6fb8]/30">
            SQLite Sync
          </span>
        </div>

        {/* Card 3: Credentials Issued (stat-green) */}
        <div className="glass-card stat-green rounded-2xl p-4 shadow-md flex items-center justify-between border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2e9e44]/20 text-[#0f4a1f] flex items-center justify-center border border-[#2e9e44]/30 shadow-xs">
              <Award size={20} className="text-[#0f4a1f]" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase opacity-85">Credentials Issued</p>
              <p className="text-lg font-black text-[#032038]">
                {overview.totalCerts ?? recentCertificates.length ?? 0} Certificates
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-[#0f4a1f] bg-[#2e9e44]/20 px-2.5 py-1 rounded-lg border border-[#2e9e44]/30">
            Accredited
          </span>
        </div>
      </div>

      {/* 🌟 5. TWO-PANEL CONTENT SECTION (GLASS-CARD SURFACES, ACCENTED AVATARS, CLEAN ROUNDED-XL) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Recent Student Registrations */}
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-xl border border-white/60 space-y-4">
            {/* Header Row */}
            <div className="flex items-center justify-between gap-2 border-b border-white/40 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b6fb8]/20 text-[#042e4c] flex items-center justify-center border border-[#0b6fb8]/30 shadow-xs">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="display text-base sm:text-lg font-extrabold text-[#06304f]">
                    Recent Student Registrations
                  </h3>
                  <p className="text-[11px] font-semibold text-[#06304f]/65">
                    Latest learners onboarded into LiteraAI
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('learners')}
                className="text-xs font-extrabold text-[#055f9e] hover:text-[#044c7e] flex items-center gap-1 cursor-pointer bg-white/30 hover:bg-white/50 px-3 py-1.5 rounded-xl border border-white/50 transition shadow-xs"
              >
                <span>View All ({stats.totalStudents?.value ?? overview.totalStudents ?? 0})</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* List Content */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-white/25 animate-pulse" />
                ))}
              </div>
            ) : recentRegistrations.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-[#032038]/60 rounded-2xl bg-white/20 border border-white/40">
                No recent student registrations found.
              </div>
            ) : (
              <div className="space-y-2">
                {recentRegistrations.map((learner, index) => {
                  const lang = (learner.preferred_language || 'EN').toUpperCase();
                  const hasScore = learner.assessment_score != null;
                  const isHigh = hasScore && learner.assessment_score >= 70;
                  const isMedium = hasScore && learner.assessment_score >= 40 && learner.assessment_score < 70;
                  const avatarGrad = avatarGradients[index % avatarGradients.length];
                  const initial = learner.name ? learner.name.charAt(0).toUpperCase() : 'L';
                  const dateStr = learner.created_at
                    ? new Date(learner.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <motion.div
                      key={learner.id}
                      whileHover={{ scale: 1.008 }}
                      onClick={() => setSelectedLearnerId(learner.id)}
                      className="p-3 rounded-xl bg-white/25 hover:bg-white/45 border border-white/40 shadow-xs transition flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      {/* Left: Avatar + Name & Email */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl ${avatarGrad} flex items-center justify-center font-black text-xs shadow-xs shrink-0 group-hover:scale-105 transition-transform`}
                        >
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-[#032038] truncate group-hover:text-[#055f9e] transition-colors">
                            {learner.name}
                          </p>
                          <p className="text-[11px] font-semibold text-[#032038]/65 truncate">
                            {learner.email}
                          </p>
                        </div>
                      </div>

                      {/* Right: Stacked Status Tag + Date */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[#0b6fb8]/15 text-[#055f9e] border border-[#0b6fb8]/30">
                            {lang}
                          </span>

                          {hasScore ? (
                            <span
                              className={`text-[10.5px] font-black px-2 py-0.5 rounded-md border shadow-xs ${
                                isHigh
                                  ? 'bg-emerald-500/20 text-[#0f4a1f] border-emerald-400/40'
                                  : isMedium
                                  ? 'bg-amber-500/25 text-[#664000] border-amber-400/50'
                                  : 'bg-red-500/20 text-[#661818] border-red-400/40'
                              }`}
                            >
                              {learner.assessment_score}%
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/40 text-[#032038]/70 border border-white/50">
                              Unassessed
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-bold text-[#032038]/50">
                          {dateStr}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Native Script Adoption (Language Distribution Grid) */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-xl border border-white/60 space-y-4">
            <div className="flex items-center justify-between border-b border-white/40 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-900 flex items-center justify-center border border-purple-400/30 shadow-xs">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="display text-base sm:text-lg font-extrabold text-[#06304f]">
                    Native Script Adoption
                  </h3>
                  <p className="text-[11px] font-semibold text-[#06304f]/65">
                    Bilingual language preferences across registered learners
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-black uppercase text-purple-900 bg-purple-500/20 px-2.5 py-1 rounded-lg border border-purple-400/30 shadow-xs">
                Multi-lingual
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {languages.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white/25 border border-white/40 shadow-xs flex flex-col justify-between hover:bg-white/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-[#055f9e]">
                      {item.code || 'LANG'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#055f9e]" />
                  </div>
                  <h4 className="font-extrabold text-xs text-[#032038] mt-1.5">{item.name || item.language}</h4>
                  <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-white/40">
                    <span className="text-base font-black text-[#032038]">{item.count}</span>
                    <span className="text-[10px] font-bold text-[#032038]/60">learners</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Recent Certificate Milestones & Quick Launch Actions */}
        <div className="space-y-6">
          {/* Recent Certificate Milestones */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-xl border border-white/60 space-y-4">
            {/* Header Row */}
            <div className="flex items-center justify-between gap-2 border-b border-white/40 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffb300]/25 text-[#664000] flex items-center justify-center border border-[#ffb300]/40 shadow-xs">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="display text-base sm:text-lg font-extrabold text-[#06304f]">
                    Recent Certificate Milestones
                  </h3>
                  <p className="text-[11px] font-semibold text-[#06304f]/65">
                    Course & League certificates awarded
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('reports')}
                className="text-xs font-extrabold text-[#055f9e] hover:text-[#044c7e] flex items-center gap-1 cursor-pointer bg-white/30 hover:bg-white/50 px-3 py-1.5 rounded-xl border border-white/50 transition shadow-xs"
              >
                <span>View Reports</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* List Content */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-white/25 animate-pulse" />
                ))}
              </div>
            ) : recentCertificates.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-[#032038]/60 rounded-2xl bg-white/20 border border-white/40">
                No certificate credentials recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {recentCertificates.map((cert) => {
                  const certDateStr = cert.issued_date
                    ? new Date(cert.issued_date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <motion.div
                      key={cert.credential_id}
                      whileHover={{ scale: 1.008 }}
                      onClick={() => cert.user_id && setSelectedLearnerId(cert.user_id)}
                      className="p-3 rounded-xl bg-white/25 hover:bg-white/45 border border-white/40 shadow-xs transition flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      {/* Left: Trophy Gold Badge + Learner Name & Course Title */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#ffb300]/25 text-[#664000] border border-[#ffb300]/40 flex items-center justify-center font-black text-base shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                          🏆
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-[#032038] truncate group-hover:text-[#055f9e] transition-colors">
                            {cert.user_name || 'Learner'}
                          </p>
                          <p className="text-[11px] font-bold text-[#055f9e] truncate">
                            {cert.course_title || 'Foundational Literacy Milestone'}
                          </p>
                        </div>
                      </div>

                      {/* Right: Stacked Score Tag + Date */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10.5px] font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-[#0f4a1f] border border-emerald-400/40 shadow-xs">
                          Score: {cert.score}%
                        </span>
                        <span className="text-[10px] font-bold text-[#032038]/50">
                          {certDateStr}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Admin Action Shortcuts */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-xl border border-white/60 space-y-4">
            <div className="flex items-center gap-3 border-b border-white/40 pb-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/25 text-[#664000] flex items-center justify-center border border-amber-400/40 shadow-xs">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="display text-base sm:text-lg font-extrabold text-[#06304f]">
                  Admin Quick Launch Actions
                </h3>
                <p className="text-[11px] font-semibold text-[#06304f]/65">
                  Instant administrative shortcuts
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Shortcut 1: Register Student */}
              <button
                type="button"
                onClick={() => setIsAddLearnerOpen(true)}
                className="p-3.5 rounded-2xl bg-white/25 hover:bg-white/45 border border-white/40 shadow-xs transition-all text-left space-y-1 cursor-pointer group hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-[#0b6fb8]/20 text-[#055f9e] flex items-center justify-center font-black">
                    <PlusCircle size={15} />
                  </div>
                  <ChevronRight size={14} className="text-[#032038]/40 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="font-extrabold text-xs text-[#032038]">Register Student</h4>
                <p className="text-[10.5px] font-semibold text-[#032038]/65">
                  Create new student credentials
                </p>
              </button>

              {/* Shortcut 2: Generate Report */}
              <button
                type="button"
                onClick={() => onNavigateTab('reports')}
                className="p-3.5 rounded-2xl bg-white/25 hover:bg-white/45 border border-white/40 shadow-xs transition-all text-left space-y-1 cursor-pointer group hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-[#0f4a1f] flex items-center justify-center font-black">
                    <TrendingUp size={15} />
                  </div>
                  <ChevronRight size={14} className="text-[#032038]/40 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="font-extrabold text-xs text-[#032038]">Analytics & Reports</h4>
                <p className="text-[10.5px] font-semibold text-[#032038]/65">
                  View scores and completion rates
                </p>
              </button>

              {/* Shortcut 3: Needs Attention */}
              <button
                type="button"
                onClick={() => onNavigateTab('attention')}
                className="p-3.5 rounded-2xl bg-white/25 hover:bg-white/45 border border-white/40 shadow-xs transition-all text-left space-y-1 cursor-pointer group hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-red-500/20 text-[#661818] flex items-center justify-center font-black">
                    <AlertTriangle size={15} />
                  </div>
                  <ChevronRight size={14} className="text-[#032038]/40 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="font-extrabold text-xs text-[#032038]">Needs Attention ({attentionCount})</h4>
                <p className="text-[10.5px] font-semibold text-[#032038]/65">
                  Send reminders to at-risk learners
                </p>
              </button>

              {/* Shortcut 4: Settings */}
              <button
                type="button"
                onClick={() => onNavigateTab('settings')}
                className="p-3.5 rounded-2xl bg-white/25 hover:bg-white/45 border border-white/40 shadow-xs transition-all text-left space-y-1 cursor-pointer group hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-900 flex items-center justify-center font-black">
                    <GraduationCap size={15} />
                  </div>
                  <ChevronRight size={14} className="text-[#032038]/40 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="font-extrabold text-xs text-[#032038]">Platform Settings</h4>
                <p className="text-[10.5px] font-semibold text-[#032038]/65">
                  Configure thresholds & scores
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 6. INTEGRATED ADD LEARNER MODAL */}
      <AddLearnerModal
        isOpen={isAddLearnerOpen}
        onClose={() => setIsAddLearnerOpen(false)}
        onLearnerAdded={() => fetchAllData()}
      />

      {/* 🌟 7. INTEGRATED LEARNER DETAIL DRAWER */}
      <LearnerDetailDrawer
        learnerId={selectedLearnerId}
        isOpen={Boolean(selectedLearnerId)}
        onClose={() => setSelectedLearnerId(null)}
        onReminderSent={() => fetchAllData()}
      />
    </div>
  );
}
