import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  AlertTriangle,
  Eye,
  RefreshCw,
  Clock,
  Send,
  BookOpen,
  CheckCircle,
  Search,
  HeartHandshake,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import LearnerProfileModal from '../components/LearnerProfileModal';
import CountUp from '../components/mentor/CountUp';
import { PageHeaderSkeleton } from '../components/mentor/MentorSkeleton';
import { useToast } from '../components/mentor/Toast';

export default function MentorAttention() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [needsAttention, setNeedsAttention] = useState([]);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLearnerId, setSelectedLearnerId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const data = await api.getMentorDashboard();
        setNeedsAttention(data.needsAttention || []);
        setLastUpdated(new Date());
        if (isManual) showToast('Learner attention list refreshed', 'success');
      } catch (err) {
        if (isManual) showToast(err.message || 'Sync failed', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (user?.role === 'mentor') {
      fetchData();
    }
  }, [user, fetchData]);

  if (user?.role !== 'mentor') return <Navigate to="/dashboard" replace />;

  if (loading) {
    return (
      <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
        <PageHeaderSkeleton />
      </div>
    );
  }

  const handleSendReminder = (learner) => {
    showToast(`Friendly reminder sent to ${learner.name}`, 'success');
  };

  const handleAssignPractice = (learner) => {
    showToast(`Personalized practice lessons assigned to ${learner.name}`, 'success');
  };

  const handleMarkReviewed = (learnerId, name) => {
    setReviewedIds((prev) => new Set([...prev, learnerId]));
    showToast(`Marked ${name} as checked`, 'info');
  };

  const activeAtRisk = needsAttention.filter((l) => !reviewedIds.has(l.id));
  const filteredList = activeAtRisk.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
      <motion.section
        className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-red-400/40 bg-gradient-to-br from-red-500/10 via-amber-500/5 to-transparent space-y-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-red-500/20 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-red-600 text-white shadow-lg shrink-0">
              <HeartHandshake size={28} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="display text-2xl sm:text-3xl font-black text-[#032038]">
                  Needs Your Attention
                </h1>
                <span className="text-xs bg-red-600 text-white font-black px-3 py-1 rounded-full shadow-sm">
                  {activeAtRisk.length} Learners Needing Help
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#032038]/75">
                Learners who haven't practiced recently, need help with lessons, or could use a friendly check-in.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="btn-primary text-xs py-2 px-4 font-black flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh List'}
            </button>
            <div className="text-[11px] font-bold text-[#032038]/60 flex items-center gap-1 bg-white/40 px-3 py-1.5 rounded-xl border border-white/50">
              <Clock size={12} /> {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Search Bar for learners */}
        {needsAttention.length > 0 && (
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#032038]/50" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search learners by name or email…"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/50 border border-white/70 text-xs font-bold text-[#032038] placeholder-[#032038]/40 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
        )}

        {filteredList.length === 0 ? (
          <div className="text-center py-16 font-bold text-emerald-950 text-sm sm:text-base bg-emerald-500/15 rounded-3xl border-2 border-emerald-500/40 p-6 space-y-2">
            <div className="text-3xl">🎉</div>
            <div className="font-black text-lg">All Learners Are Doing Great!</div>
            <p className="text-xs font-semibold text-emerald-900/80 max-w-md mx-auto">
              No learners currently require attention. All students are maintaining active streaks and making steady literacy progress.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredList.map((l) => (
              <motion.div
                key={l.id}
                whileHover={{ y: -4 }}
                className="bg-white/50 border-2 border-red-400/50 backdrop-blur-md rounded-3xl p-5 space-y-4 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-black text-base text-[#032038]">{l.name}</h3>
                      <p className="text-xs text-[#032038]/60 font-semibold">{l.email}</p>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shrink-0 shadow-sm ${
                        l.riskLevel === 'high' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                      }`}
                    >
                      {l.riskLevel === 'high' ? 'Needs Help' : 'Making Progress'}
                    </span>
                  </div>

                  {/* What to look out for */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#032038]/60">
                      What to Look Out For
                    </span>
                    {l.riskReasons.map((r, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs font-extrabold text-red-950 bg-red-500/15 border border-red-500/25 px-3 py-1.5 rounded-xl"
                      >
                        <AlertTriangle size={14} className="shrink-0 text-red-700" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>

                  {/* Micro Metric Trio */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/5 text-xs font-bold text-[#032038] text-center">
                    <div className="bg-white/40 rounded-xl p-2 border border-white/50">
                      <span className="block text-[9px] uppercase text-[#032038]/60 font-black">Score</span>
                      <span className="font-black">{l.assessmentScore != null ? `${l.assessmentScore}%` : 'N/A'}</span>
                    </div>
                    <div className="bg-white/40 rounded-xl p-2 border border-white/50">
                      <span className="block text-[9px] uppercase text-[#032038]/60 font-black">Progress</span>
                      <span className="font-black">{l.progressPercent}%</span>
                    </div>
                    <div className="bg-white/40 rounded-xl p-2 border border-white/50">
                      <span className="block text-[9px] uppercase text-[#032038]/60 font-black">Streak</span>
                      <span className="font-black">🔥 {l.streak}d</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-black/5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendReminder(l)}
                      className="btn-ghost py-2 text-[11px] font-black flex items-center justify-center gap-1.5 rounded-xl border border-black/10 hover:bg-white/70 text-[#032038]"
                    >
                      <Send size={12} className="text-[#0b6fb8]" /> Send Reminder
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAssignPractice(l)}
                      className="btn-ghost py-2 text-[11px] font-black flex items-center justify-center gap-1.5 rounded-xl border border-black/10 hover:bg-white/70 text-[#032038]"
                    >
                      <BookOpen size={12} className="text-purple-600" /> Assign Practice
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleMarkReviewed(l.id, l.name)}
                      className="py-2 text-[11px] font-black flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-950 hover:bg-emerald-500/25 transition"
                    >
                      <CheckCircle size={12} className="text-emerald-700" /> Mark Checked
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedLearnerId(l.id)}
                      className="btn-primary py-2 text-[11px] font-black flex items-center justify-center gap-1.5 rounded-xl shadow-sm"
                    >
                      <Eye size={12} /> View Profile
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      <LearnerProfileModal learnerId={selectedLearnerId} onClose={() => setSelectedLearnerId(null)} />
    </div>
  );
}
