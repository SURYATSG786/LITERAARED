import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Trophy, Sparkles, RefreshCw, Clock, Award, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import CountUp from '../components/mentor/CountUp';
import { LeagueDonutChart } from '../components/mentor/MentorCharts';
import { PageHeaderSkeleton, TableSkeleton } from '../components/mentor/MentorSkeleton';
import { useToast } from '../components/mentor/Toast';

export default function MentorLeagues() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [leagueData, setLeagueData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const data = await api.getMentorDashboard();
        setLeagueData(data.leagueMonitoring || {});
        setLastUpdated(new Date());
        if (isManual) showToast('League progress updated', 'success');
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
        <TableSkeleton rows={4} cols={3} />
      </div>
    );
  }

  const { counts = { bronze: 0, silver: 0, gold: 0 }, recentPromotions = [], upcomingEligible = [] } = leagueData;
  const totalRanked = (counts.bronze || 0) + (counts.silver || 0) + (counts.gold || 0);

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <motion.section
        className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/70 space-y-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs font-black">
              <Trophy size={13} className="text-amber-600" /> League Tiers
            </div>
            <h1 className="display text-2xl sm:text-3xl font-black text-[#032038] flex items-center gap-2">
              Literacy League Progress
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#032038]/75">
              Track learners advancing through Bronze, Silver, and Gold leagues and preparing for their next level.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="btn-primary text-xs py-2 px-4 font-black flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh Leagues'}
            </button>
            <div className="text-[11px] font-bold text-[#032038]/60 flex items-center gap-1 bg-white/40 px-3 py-1.5 rounded-xl border border-white/50">
              <Clock size={12} /> {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Tier Distribution Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card bg-gradient-to-br from-amber-700/15 to-amber-900/5 border-2 border-amber-700/30 rounded-2xl p-5 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="text-3xl">🥉</div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-700/20 text-amber-950 px-2 py-0.5 rounded-full border border-amber-700/30">
                Beginner
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-950">
              <CountUp end={counts.bronze || 0} />
            </div>
            <div className="text-xs font-black text-amber-900 uppercase tracking-wider">
              Bronze League Learners
            </div>
            <div className="text-[11px] font-semibold text-amber-900/70">
              {totalRanked > 0 ? Math.round(((counts.bronze || 0) / totalRanked) * 100) : 0}% of learners
            </div>
          </div>

          <div className="glass-card bg-gradient-to-br from-slate-400/20 to-slate-600/5 border-2 border-slate-400/40 rounded-2xl p-5 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="text-3xl">🥈</div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-400/30 text-slate-950 px-2 py-0.5 rounded-full border border-slate-400/40">
                Intermediate
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900">
              <CountUp end={counts.silver || 0} />
            </div>
            <div className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Silver League Learners
            </div>
            <div className="text-[11px] font-semibold text-slate-800/70">
              {totalRanked > 0 ? Math.round(((counts.silver || 0) / totalRanked) * 100) : 0}% of learners
            </div>
          </div>

          <div className="glass-card bg-gradient-to-br from-yellow-500/20 to-amber-500/5 border-2 border-yellow-500/40 rounded-2xl p-5 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="text-3xl">🥇</div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-yellow-500/30 text-yellow-950 px-2 py-0.5 rounded-full border border-yellow-500/50">
                Advanced
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-yellow-950">
              <CountUp end={counts.gold || 0} />
            </div>
            <div className="text-xs font-black text-yellow-950 uppercase tracking-wider">
              Gold League Champions
            </div>
            <div className="text-[11px] font-semibold text-yellow-900/70">
              {totalRanked > 0 ? Math.round(((counts.gold || 0) / totalRanked) * 100) : 0}% of learners
            </div>
          </div>
        </div>

        {/* Visual Chart & Readiness Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          <div className="glass-card rounded-2xl p-5 border border-white/60 shadow-md flex flex-col justify-between">
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-[#032038] flex items-center gap-1.5">
                <Trophy size={16} className="text-amber-600" /> Learners in Each League
              </h3>
              <p className="text-xs font-bold text-[#032038]/60 mt-0.5">Overview of learners across Bronze, Silver, and Gold</p>
            </div>
            <LeagueDonutChart counts={counts} />
          </div>

          {/* Promotion Pipeline */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-white/60 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-[#032038] flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-[#0b6fb8]" /> Learners Ready for the Next League
                </h3>
                <p className="text-xs font-bold text-[#032038]/60">Learners nearing or eligible for promotion</p>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-[#0b6fb8]/15 text-[#0b6fb8] border border-[#0b6fb8]/30">
                {upcomingEligible.length} Learners
              </span>
            </div>

            {upcomingEligible.length === 0 ? (
              <div className="text-xs font-bold text-[#032038]/60 text-center py-10 bg-white/30 rounded-2xl border border-white/40">
                No learners currently preparing for next level promotion.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {upcomingEligible.map((u) => (
                  <div
                    key={u.id}
                    className="bg-white/40 border border-white/60 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs font-bold hover:bg-white/60 transition shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#0b6fb8]/15 text-[#0b6fb8] flex items-center justify-center font-black">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-black text-[#032038] text-sm">{u.name}</div>
                        <div className="text-[11px] font-semibold text-[#032038]/70">
                          Current League: <span className="font-black uppercase">{u.league}</span> · XP: {u.xp} · Progress: {u.progressPercent}%
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-[#0b6fb8]/20 text-[#0b6fb8] px-3 py-1 rounded-full border border-[#0b6fb8]/30 shrink-0">
                      Ready for Next Level
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent League Promotion Records Feed */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm uppercase tracking-wider text-[#032038] flex items-center gap-1.5">
              <Sparkles size={16} className="text-[#0b6fb8]" /> Recent League Celebrations
            </h3>
            <span className="text-xs font-black text-[#032038]/60">{recentPromotions.length} Learners Promoted</span>
          </div>

          {recentPromotions.length === 0 ? (
            <div className="text-xs font-bold text-[#032038]/60 text-center py-10 bg-white/30 rounded-2xl border border-white/40">
              No promotions recorded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {recentPromotions.map((p) => (
                <div
                  key={p.credential_id}
                  className="bg-white/40 border border-white/60 rounded-2xl p-4 flex items-center justify-between text-xs font-bold hover:bg-white/60 transition shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-700">
                      <Award size={20} />
                    </div>
                    <div>
                      <div className="font-black text-[#032038] text-sm">{p.user_name}</div>
                      <div className="text-[11px] font-semibold text-[#032038]/70">
                        {p.league_title} · Score: <span className="font-black text-emerald-800">{p.score}%</span>
                      </div>
                      <div className="text-[10px] font-bold text-[#032038]/50">
                        Earned: {new Date(p.issued_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-950 px-3 py-1 rounded-full border border-emerald-500/30 shrink-0">
                    Promoted
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
