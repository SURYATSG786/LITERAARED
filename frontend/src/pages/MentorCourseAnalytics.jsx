import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, RefreshCw, Clock, CheckCircle2, Users, Layers, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { ProgressBar } from '../components/ui';
import CountUp from '../components/mentor/CountUp';
import { CourseComparisonChart } from '../components/mentor/MentorCharts';
import { PageHeaderSkeleton, TableSkeleton } from '../components/mentor/MentorSkeleton';
import { useToast } from '../components/mentor/Toast';

export default function MentorCourseAnalytics() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const data = await api.getMentorDashboard();
        setCourses(data.courseAnalytics || []);
        setLastUpdated(new Date());
        if (isManual) showToast('Course progress updated', 'success');
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

  const totalEnrolled = courses.reduce((a, b) => a + (b.enrolledCount || 0), 0);
  const totalCompleted = courses.reduce((a, b) => a + (b.completedCount || 0), 0);
  const avgCompletionRate = courses.length > 0 ? Math.round(courses.reduce((a, b) => a + (b.completionRate || 0), 0) / courses.length) : 0;

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
      <motion.section
        className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/70 space-y-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-900 text-xs font-black">
              <BookOpen size={13} className="text-purple-600" /> Curriculum Overview
            </div>
            <h1 className="display text-2xl sm:text-3xl font-black text-[#032038] flex items-center gap-2">
              Course Progress & Curriculum
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#032038]/75">
              See how your learners are progressing across lessons and courses.
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
              {refreshing ? 'Refreshing…' : 'Refresh Progress'}
            </button>
            <div className="text-[11px] font-bold text-[#032038]/60 flex items-center gap-1 bg-white/40 px-3 py-1.5 rounded-xl border border-white/50">
              <Clock size={12} /> {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Aggregate Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card bg-gradient-to-br from-[#0b6fb8]/15 to-blue-500/5 border-2 border-[#0b6fb8]/30 rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#0b6fb8]">Active Courses</span>
              <Layers size={18} className="text-[#0b6fb8]" />
            </div>
            <div className="text-3xl font-black text-[#032038]">
              <CountUp end={courses.length} />
            </div>
            <div className="text-[11px] font-semibold text-[#032038]/60">Language learning courses</div>
          </div>

          <div className="glass-card bg-gradient-to-br from-purple-500/15 to-indigo-500/5 border-2 border-purple-500/30 rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-purple-700">Course Enrollments</span>
              <Users size={18} className="text-purple-600" />
            </div>
            <div className="text-3xl font-black text-[#032038]">
              <CountUp end={totalEnrolled} />
            </div>
            <div className="text-[11px] font-semibold text-[#032038]/60">Active student course enrollments</div>
          </div>

          <div className="glass-card bg-gradient-to-br from-emerald-500/15 to-teal-500/5 border-2 border-emerald-500/30 rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-emerald-800">Avg Completion Rate</span>
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-950">
              <CountUp end={avgCompletionRate} suffix="%" />
            </div>
            <div className="text-[11px] font-semibold text-emerald-900/70">{totalCompleted} total course completions</div>
          </div>
        </div>

        {/* Grouped Bar Chart Visual */}
        <div className="glass-card rounded-2xl p-6 border border-white/60 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-base text-[#032038]">Learners Started vs Finished</h3>
              <p className="text-xs font-bold text-[#032038]/60">See how many learners started each course and how many completed all lessons</p>
            </div>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-purple-500/15 text-purple-900 border border-purple-500/30">
              Overview Chart
            </span>
          </div>
          <CourseComparisonChart courses={courses} />
        </div>

        {/* Detailed Course Cards Grid */}
        <div className="space-y-3 pt-2">
          <h3 className="font-black text-sm uppercase tracking-wider text-[#032038] flex items-center gap-2">
            <BookOpen size={16} className="text-[#0b6fb8]" /> Course Breakdown & Learner Progress
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((c) => (
              <div
                key={c.courseId}
                className="bg-white/40 border-2 border-white/70 backdrop-blur-md rounded-2xl p-5 space-y-4 shadow-md hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-black text-base text-[#032038]">{c.title}</h4>
                    <p className="text-xs font-bold text-[#032038]/60">Language: {c.path}</p>
                  </div>
                  <span className="text-xs font-black bg-[#0b6fb8]/15 text-[#0b6fb8] px-3 py-1 rounded-full border border-[#0b6fb8]/30 shrink-0">
                    {c.enrolledCount} Enrolled
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-black text-[#032038]">
                    <span>Class Average Progress</span>
                    <span>{c.avgProgress}%</span>
                  </div>
                  <ProgressBar value={c.avgProgress} max={100} label="Course Progress" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-center text-xs font-bold pt-3 border-t border-black/5">
                  <div className="bg-white/50 rounded-xl p-3 border border-white/60">
                    <span className="block text-[10px] font-black text-[#032038]/60 uppercase">Completion Rate</span>
                    <span className="text-lg font-black text-emerald-900">{c.completionRate}%</span>
                  </div>
                  <div className="bg-white/50 rounded-xl p-3 border border-white/60">
                    <span className="block text-[10px] font-black text-[#032038]/60 uppercase">Learners Completed</span>
                    <span className="text-lg font-black text-[#055f9e]">
                      {c.completedCount} / {c.enrolledCount}
                    </span>
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
