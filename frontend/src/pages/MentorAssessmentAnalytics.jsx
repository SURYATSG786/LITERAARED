import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { GraduationCap, RefreshCw, Clock, BarChart3, PieChart, Award, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import CountUp from '../components/mentor/CountUp';
import {
  EducationDemographicsChart,
  ScoreDistributionChart,
} from '../components/mentor/MentorCharts';
import { PageHeaderSkeleton, TableSkeleton } from '../components/mentor/MentorSkeleton';
import { useToast } from '../components/mentor/Toast';

export default function MentorAssessmentAnalytics() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [assessmentData, setAssessmentData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const data = await api.getMentorDashboard();
        setAssessmentData(data.assessmentAnalytics || {});
        setLastUpdated(new Date());
        if (isManual) showToast('Assessment results updated', 'success');
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
        <TableSkeleton rows={4} cols={4} />
      </div>
    );
  }

  const { educationLevels = [], scoreRanges = {} } = assessmentData;
  const totalAssessed = educationLevels.reduce((a, b) => a + (b.assessedCount || 0), 0);
  const assessedGroups = educationLevels.filter((e) => e.avgScore != null);
  const globalAvg = assessedGroups.length > 0
    ? Math.round(assessedGroups.reduce((a, b) => a + b.avgScore, 0) / assessedGroups.length)
    : null;

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
      <motion.section
        className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/70 space-y-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-900 text-xs font-black">
              <GraduationCap size={13} className="text-indigo-600" /> Assessment Overview
            </div>
            <h1 className="display text-2xl sm:text-3xl font-black text-[#032038] flex items-center gap-2">
              Assessment Results & Class Overview
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#032038]/75">
              See how learners performed on their placement assessments across different education backgrounds.
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
              {refreshing ? 'Refreshing…' : 'Refresh Results'}
            </button>
            <div className="text-[11px] font-bold text-[#032038]/60 flex items-center gap-1 bg-white/40 px-3 py-1.5 rounded-xl border border-white/50">
              <Clock size={12} /> {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Global Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card bg-gradient-to-br from-indigo-500/15 to-purple-500/5 border-2 border-indigo-500/30 rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-indigo-700">Learners Assessed</span>
              <Award size={18} className="text-indigo-600" />
            </div>
            <div className="text-3xl font-black text-[#032038]">
              <CountUp end={totalAssessed} />
            </div>
            <div className="text-[11px] font-semibold text-[#032038]/60">Students who completed their assessment</div>
          </div>

          <div className="glass-card bg-gradient-to-br from-emerald-500/15 to-teal-500/5 border-2 border-emerald-500/30 rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-emerald-800">Overall Average Score</span>
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-950">
              {globalAvg != null ? <CountUp end={globalAvg} suffix="%" /> : 'No data yet'}
            </div>
            <div className="text-[11px] font-semibold text-emerald-900/70">Average across all learners</div>
          </div>

          <div className="glass-card bg-gradient-to-br from-[#0b6fb8]/15 to-cyan-500/5 border-2 border-[#0b6fb8]/30 rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#0b6fb8]">Score Ranges</span>
              <BarChart3 size={18} className="text-[#0b6fb8]" />
            </div>
            <div className="text-3xl font-black text-[#032038]">
              <CountUp end={Object.keys(scoreRanges).length} />
            </div>
            <div className="text-[11px] font-semibold text-[#032038]/60">Score categories (0% - 100%)</div>
          </div>
        </div>

        {/* 2-Column Visual Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Chart 1: Education Demographics */}
          <div className="glass-card rounded-2xl p-6 border border-white/60 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-[#032038]">Performance by Education Level</h3>
                <p className="text-xs font-bold text-[#032038]/60">Learners and average scores by education level</p>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-900 border border-indigo-500/30">
                Education
              </span>
            </div>
            <EducationDemographicsChart educationLevels={educationLevels} />
          </div>

          {/* Chart 2: Score Distribution */}
          <div className="glass-card rounded-2xl p-6 border border-white/60 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-[#032038]">Score Distribution</h3>
                <p className="text-xs font-bold text-[#032038]/60">Number of learners in each score range</p>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-950 border border-emerald-500/30">
                Scores
              </span>
            </div>
            <ScoreDistributionChart scoreRanges={scoreRanges} />
          </div>
        </div>

        {/* Detailed Education Demographics Cards */}
        <div className="space-y-3 pt-2">
          <h3 className="font-black text-sm uppercase tracking-wider text-[#032038] flex items-center gap-2">
            <PieChart size={16} className="text-[#0b6fb8]" /> Education Background Breakdown
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {educationLevels.map((ed) => (
              <div
                key={ed.educationLevel}
                className="bg-white/40 border-2 border-white/70 backdrop-blur-md rounded-2xl p-5 space-y-3 shadow-md hover:shadow-lg transition-all"
              >
                <div className="text-sm font-black text-[#032038]">{ed.educationLevel}</div>
                <div className="space-y-1.5 pt-2 border-t border-black/5 text-xs font-bold">
                  <div className="flex items-center justify-between text-[#032038]/75">
                    <span>Total Learners:</span>
                    <span className="font-black text-[#032038]">{ed.totalCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#032038]/75">
                    <span>Assessed:</span>
                    <span className="font-black text-[#032038]">{ed.assessedCount}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-sm font-black text-[#055f9e]">
                    <span>Average Score:</span>
                    <span>{ed.avgScore != null ? `${ed.avgScore}%` : 'No data yet'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
