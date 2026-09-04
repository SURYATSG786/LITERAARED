import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Trophy, Star, Flame, BookOpenCheck, Award, TrendingUp, ArrowUpRight, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import LearnerProfileModal from '../components/LearnerProfileModal';
import CountUp from '../components/mentor/CountUp';
import { PageHeaderSkeleton, TableSkeleton } from '../components/mentor/MentorSkeleton';
import { useToast } from '../components/mentor/Toast';

export default function MentorPerformers() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [topPerformers, setTopPerformers] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topTab, setTopTab] = useState('xp');
  const [selectedLearnerId, setSelectedLearnerId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const data = await api.getMentorDashboard();
        setTopPerformers(data.topPerformers || {});
        setLastUpdated(new Date());
        if (isManual) showToast('Student achievements updated', 'success');
      } catch (err) {
        if (isManual) showToast(err.message || 'Update failed', 'error');
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
        <TableSkeleton rows={5} cols={4} />
      </div>
    );
  }

  const currentList = topPerformers[topTab] || [];

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
      <motion.section
        className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/70 space-y-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-black/5 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs font-black">
              <Trophy size={13} className="text-amber-600" /> Student Achievements
            </div>
            <h1 className="display text-2xl sm:text-3xl font-black text-[#032038] flex items-center gap-2">
              Top Learners & Highlights
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#032038]/75">
              Celebrate learner progress across points, daily practice streaks, lessons finished, and assessment scores.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="btn-primary text-xs py-2 px-4 font-black flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh Highlights'}
            </button>
            <div className="text-[11px] font-bold text-[#032038]/60 flex items-center gap-1 bg-white/40 px-3 py-1.5 rounded-xl border border-white/50">
              <Clock size={12} /> {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white/30 rounded-2xl p-1.5 border border-white/50 overflow-x-auto">
          {[
            { id: 'xp', label: 'Most XP Points', icon: Star },
            { id: 'streak', label: 'Longest Daily Streaks', icon: Flame },
            { id: 'courses', label: 'Lesson Progress', icon: BookOpenCheck },
            { id: 'certificates', label: 'Certificates Earned', icon: Award },
            { id: 'assessment', label: 'Assessment Scores', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = topTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTopTab(tab.id)}
                className={`flex items-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#055f9e] text-white shadow-lg scale-102'
                    : 'text-[#032038]/70 hover:bg-white/40 hover:text-[#032038]'
                }`}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Leaderboard Cards Grid */}
        {currentList.length === 0 ? (
          <div className="text-xs font-bold text-[#032038]/60 text-center py-16 bg-white/30 rounded-3xl border border-white/40">
            No highlights available for this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {currentList.map((l, rankIdx) => {
              const isGold = rankIdx === 0;
              const isSilver = rankIdx === 1;
              const isBronze = rankIdx === 2;

              const cardBorder = isGold
                ? 'border-yellow-400/80 bg-gradient-to-br from-yellow-300/20 via-amber-200/10 to-transparent'
                : isSilver
                ? 'border-slate-300/80 bg-gradient-to-br from-slate-200/25 via-slate-100/10 to-transparent'
                : isBronze
                ? 'border-amber-700/60 bg-gradient-to-br from-amber-600/20 via-amber-700/5 to-transparent'
                : 'border-white/70 bg-white/40';

              const rankBadge = isGold ? '🥇' : isSilver ? '🥈' : isBronze ? '🥉' : `#${rankIdx + 1}`;

              return (
                <motion.div
                  key={l.id}
                  whileHover={{ y: -6, scale: 1.03 }}
                  onClick={() => setSelectedLearnerId(l.id)}
                  className={`glass-card border-2 ${cardBorder} rounded-3xl p-5 space-y-4 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-200 flex flex-col justify-between`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-black">{rankBadge}</span>
                      <span className="text-[10px] uppercase font-black bg-white/60 text-[#032038] px-2.5 py-1 rounded-full border border-white/70 shadow-sm">
                        {l.learningLanguage.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black text-base text-[#032038] truncate">{l.name}</h3>
                      <p className="text-xs text-[#032038]/60 font-semibold truncate mt-0.5">{l.email}</p>
                    </div>
                  </div>

                  <div className="border-t border-black/5 pt-3 flex items-center justify-between text-sm font-black text-[#055f9e]">
                    <span>
                      {topTab === 'xp' && <CountUp end={l.xp} suffix=" XP" />}
                      {topTab === 'streak' && `🔥 ${l.streak} Days`}
                      {topTab === 'courses' && `📚 ${l.lessonsCompleted}/4 Lessons`}
                      {topTab === 'certificates' && `🎓 ${l.certificatesCount} Certs`}
                      {topTab === 'assessment' && `📈 ${l.assessmentScore}%`}
                    </span>
                    <ArrowUpRight size={16} className="text-[#055f9e]" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>

      <LearnerProfileModal learnerId={selectedLearnerId} onClose={() => setSelectedLearnerId(null)} />
    </div>
  );
}
