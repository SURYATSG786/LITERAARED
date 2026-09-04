import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Award, CheckCircle2, RefreshCw, Clock, ShieldCheck, Sparkles, FileText, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import CountUp from '../components/mentor/CountUp';
import { PageHeaderSkeleton, TableSkeleton } from '../components/mentor/MentorSkeleton';
import { useToast } from '../components/mentor/Toast';

export default function MentorCertificates() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [certData, setCertData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const data = await api.getMentorDashboard();
        setCertData(data.certificateTracking || {});
        setLastUpdated(new Date());
        if (isManual) showToast('Certificates list updated', 'success');
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

  const { totalIssued = 0, recentCertificates = [], eligibleLearners = [] } = certData;
  const courseCertsCount = recentCertificates.filter((c) => c.type === 'Course').length;
  const leagueCertsCount = recentCertificates.filter((c) => c.type === 'League').length;

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
      <motion.section
        className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/70 space-y-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs font-black">
              <Award size={13} className="text-amber-600" /> Learner Certificates
            </div>
            <h1 className="display text-2xl sm:text-3xl font-black text-[#032038] flex items-center gap-2">
              Certificates & Achievements
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#032038]/75">
              View all certificates earned by learners for completing courses and reaching new league levels.
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
              {refreshing ? 'Refreshing…' : 'Refresh Certificates'}
            </button>
            <div className="text-[11px] font-bold text-[#032038]/60 flex items-center gap-1 bg-white/40 px-3 py-1.5 rounded-xl border border-white/50">
              <Clock size={12} /> {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Aggregate KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card bg-gradient-to-br from-amber-500/15 to-yellow-500/5 border-2 border-amber-500/30 rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-amber-800">Total Certificates Earned</span>
              <Award size={18} className="text-amber-600" />
            </div>
            <div className="text-3xl font-black text-[#032038]">
              <CountUp end={totalIssued} />
            </div>
            <div className="text-[11px] font-semibold text-[#032038]/60">Course and league certificates earned</div>
          </div>

          <div className="glass-card bg-gradient-to-br from-purple-500/15 to-indigo-500/5 border-2 border-purple-500/30 rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-purple-700">Course Certificates</span>
              <FileText size={18} className="text-purple-600" />
            </div>
            <div className="text-3xl font-black text-[#032038]">
              <CountUp end={courseCertsCount} />
            </div>
            <div className="text-[11px] font-semibold text-[#032038]/60">Completed course certificates</div>
          </div>

          <div className="glass-card bg-gradient-to-br from-emerald-500/15 to-teal-500/5 border-2 border-emerald-500/30 rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-emerald-800">Almost There</span>
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-950">
              <CountUp end={eligibleLearners.length} />
            </div>
            <div className="text-[11px] font-semibold text-emerald-900/70">Learners close to completing their course (≥75%)</div>
          </div>
        </div>

        {/* 2-Column Feed: Recent Issuance vs Near Completion */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Recent Certificates Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-wider text-[#032038] flex items-center gap-1.5">
                <Sparkles size={16} className="text-amber-600" /> Recent Certificates Earned
              </h3>
              <span className="text-xs font-black text-[#032038]/60">{recentCertificates.length} Certificates</span>
            </div>

            {recentCertificates.length === 0 ? (
              <div className="text-xs font-bold text-[#032038]/60 text-center py-12 bg-white/30 rounded-2xl border border-white/40">
                No certificates earned yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {recentCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-white/40 border-2 border-white/70 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between text-xs font-bold shadow-sm hover:shadow-md transition"
                  >
                    <div className="space-y-1">
                      <div className="font-black text-[#032038] text-sm">{cert.user_name}</div>
                      <div className="text-[11px] font-semibold text-[#032038]/70">
                        {cert.title} · <span className="font-black text-[#0b6fb8]">{cert.type}</span>
                      </div>
                      <div className="text-[10px] text-[#055f9e] font-black flex items-center gap-2">
                        <span>Score: {cert.score}%</span>
                        <span>•</span>
                        <span>{new Date(cert.date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono bg-white/70 text-[#032038] px-2.5 py-1 rounded-lg border border-white/80 font-black shadow-inner">
                        {cert.id}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-950 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Earned
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Learners Close to Completion */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-wider text-[#032038] flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-[#0b6fb8]" /> Learners Close to Earning a Certificate
              </h3>
              <span className="text-xs font-black text-[#032038]/60">{eligibleLearners.length} Learners</span>
            </div>

            {eligibleLearners.length === 0 ? (
              <div className="text-xs font-bold text-[#032038]/60 text-center py-12 bg-white/30 rounded-2xl border border-white/40">
                No learners currently close to course completion.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {eligibleLearners.map((e) => (
                  <div
                    key={e.id}
                    className="bg-white/40 border-2 border-white/70 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between text-xs font-bold shadow-sm hover:shadow-md transition"
                  >
                    <div className="space-y-1">
                      <div className="font-black text-[#032038] text-sm">{e.name}</div>
                      <div className="text-[11px] font-semibold text-[#032038]/70">
                        {e.currentCourse} · {e.lessonsCompleted}/4 Lessons
                      </div>
                      <div className="text-[10px] font-bold text-[#032038]/50">
                        Streak: {e.streak}d · XP: {e.xp}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-950 px-3 py-1 rounded-full border border-emerald-500/30 shrink-0">
                      <CheckCircle2 size={12} className="text-emerald-700" /> {e.progressPercent}% Done
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
