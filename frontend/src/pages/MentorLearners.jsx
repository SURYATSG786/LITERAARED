import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Users, Search, Filter, Trophy, AlertTriangle, Eye, CheckCircle2, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { ProgressBar } from '../components/ui';
import LearnerProfileModal from '../components/LearnerProfileModal';
import CountUp from '../components/mentor/CountUp';
import { PageHeaderSkeleton, TableSkeleton } from '../components/mentor/MentorSkeleton';
import { useToast } from '../components/mentor/Toast';

const LEAGUE_BADGES = {
  bronze: { name: 'Bronze', icon: '🥉', bg: 'bg-amber-700/15 text-amber-950 border-amber-700/30' },
  silver: { name: 'Silver', icon: '🥈', bg: 'bg-slate-400/20 text-slate-950 border-slate-400/40' },
  gold: { name: 'Gold', icon: '🥇', bg: 'bg-yellow-500/20 text-yellow-950 border-yellow-500/50' },
};

export default function MentorLearners() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [learners, setLearners] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [excludeTest, setExcludeTest] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [searchTerm, setSearchTerm] = useState('');
  const [educationFilter, setEducationFilter] = useState('ALL');
  const [leagueFilter, setLeagueFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const [selectedLearnerId, setSelectedLearnerId] = useState(null);

  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const data = await api.getMentorDashboard({ excludeTest: excludeTest ? 'true' : 'false' });
        setLearners(data.learners || []);
        setMeta(data.meta || {});
        setLastUpdated(new Date());
        if (isManual) showToast('Learner directory updated', 'success');
      } catch (err) {
        if (isManual) showToast(err.message || 'Update failed', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [excludeTest, showToast]
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
        <TableSkeleton rows={8} cols={7} />
      </div>
    );
  }

  const filteredLearners = learners.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.learningLanguage.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEducation = educationFilter === 'ALL' || l.educationLevel === educationFilter;
    const matchesLeague = leagueFilter === 'ALL' || l.league === leagueFilter;
    const matchesRisk = riskFilter === 'ALL' || (riskFilter === 'RISK' ? l.riskLevel !== 'none' : l.riskLevel === riskFilter);

    return matchesSearch && matchesEducation && matchesLeague && matchesRisk;
  });

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
      <motion.section
        className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/70 space-y-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-black/5 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0b6fb8]/15 border border-[#0b6fb8]/30 text-[#032038] text-xs font-black">
              <Users size={13} className="text-[#0b6fb8]" /> Student Directory
            </div>
            <h1 className="display text-2xl sm:text-3xl font-black text-[#032038] flex items-center gap-2">
              Learner Directory
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#032038]/75">
              Browse profiles of registered learners, filter by education level or league, and follow lesson progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="btn-primary text-xs py-2.5 px-4 font-black flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh Directory'}
            </button>

            <div className="text-[11px] font-bold text-[#032038]/60 flex items-center gap-1 bg-white/40 px-3.5 py-1.5 rounded-xl border border-white/50">
              <Clock size={12} /> {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3 text-[#032038]/50" />
            <input
              type="text"
              placeholder="Search learner name, email, language…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/50 border border-white/70 text-xs font-bold text-[#032038] placeholder-[#032038]/40 focus:outline-none focus:ring-2 focus:ring-[#0b6fb8]"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white/40 rounded-2xl px-3 py-2 border border-white/60 shadow-sm">
            <Filter size={14} className="text-[#0b6fb8] shrink-0" />
            <select
              value={educationFilter}
              onChange={(e) => setEducationFilter(e.target.value)}
              className="bg-transparent text-xs font-black text-[#032038] w-full focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Education Levels</option>
              <option value="No Formal Education">No Formal Education</option>
              <option value="Primary School">Primary School</option>
              <option value="Middle School">Middle School</option>
              <option value="High School">High School</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white/40 rounded-2xl px-3 py-2 border border-white/60 shadow-sm">
            <Trophy size={14} className="text-amber-600 shrink-0" />
            <select
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
              className="bg-transparent text-xs font-black text-[#032038] w-full focus:outline-none cursor-pointer"
            >
              <option value="ALL">All League Tiers</option>
              <option value="bronze">🥉 Bronze League</option>
              <option value="silver">🥈 Silver League</option>
              <option value="gold">🥇 Gold League</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white/40 rounded-2xl px-3 py-2 border border-white/60 shadow-sm">
            <AlertTriangle size={14} className="text-red-600 shrink-0" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-transparent text-xs font-black text-[#032038] w-full focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="RISK">⚠️ Needs Attention Only</option>
              <option value="high">🔴 Needs Help Only</option>
              <option value="medium">🟡 Making Progress Only</option>
              <option value="none">🟢 Doing Well Only</option>
            </select>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/60 bg-white/20 backdrop-blur-md shadow-inner">
          <table className="w-full text-left text-xs font-bold text-[#032038]">
            <thead>
              <tr className="border-b border-[#032038]/15 bg-white/40 text-[11px] font-black uppercase text-[#032038]/70 tracking-wider">
                <th className="py-3.5 px-4">Learner</th>
                <th className="py-3.5 px-3">Languages</th>
                <th className="py-3.5 px-3">Education</th>
                <th className="py-3.5 px-3">League</th>
                <th className="py-3.5 px-3">Curriculum Progress</th>
                <th className="py-3.5 px-3">Assessment Score</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredLearners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs font-black text-[#032038]/60">
                    No learners match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLearners.map((l) => {
                  const leagueBadge = LEAGUE_BADGES[l.league] || LEAGUE_BADGES.bronze;
                  return (
                    <tr key={l.id} className="hover:bg-white/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-black text-sm text-[#032038]">{l.name}</div>
                        <div className="text-[10px] text-[#032038]/60 font-mono">{l.email}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="uppercase text-[10px] bg-[#0b6fb8]/15 text-[#0b6fb8] font-black px-2.5 py-1 rounded-full border border-[#0b6fb8]/30">
                          {l.learningLanguage}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-[11px] font-bold">{l.educationLevel}</td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border shadow-sm ${leagueBadge.bg}`}>
                          {leagueBadge.icon} {leagueBadge.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-[10px] font-black">
                            <span>{l.lessonsCompleted}/4 Lessons</span>
                            <span>{l.progressPercent}%</span>
                          </div>
                          <ProgressBar value={l.progressPercent} max={100} label="Progress" />
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        {l.assessmentScore != null ? (
                          <div>
                            <span className="font-black text-xs text-[#032038]">{l.assessmentScore}%</span>
                            <div className="text-[10px] font-bold text-[#032038]/60">{l.assessmentLevel.split(' ')[0]}</div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-900 font-black bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {l.riskLevel !== 'none' ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-sm ${
                              l.riskLevel === 'high' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                            }`}
                          >
                            <AlertTriangle size={11} /> {l.riskLevel === 'high' ? 'Needs Help' : 'Making Progress'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-950 border border-emerald-500/30">
                            <CheckCircle2 size={11} className="text-emerald-700" /> Doing Well
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLearnerId(l.id)}
                          className="btn-primary text-[11px] py-1.5 px-3 font-black inline-flex items-center gap-1 shadow-sm hover:scale-105 active:scale-95"
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.section>

      <LearnerProfileModal learnerId={selectedLearnerId} onClose={() => setSelectedLearnerId(null)} />
    </div>
  );
}
