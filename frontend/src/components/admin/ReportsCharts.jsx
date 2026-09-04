import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Download,
  BarChart3,
  TrendingUp,
  Award,
  Globe,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import api from '../../api/client';

export default function ReportsCharts() {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportingCsv, setExportingCsv] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAdminReports();
      setReportsData(data);
    } catch (err) {
      setError(err.message || 'Failed to load platform reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
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

  const scoreBucketColors = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#10b981'];

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl glass-strong border border-white/80 p-3 shadow-xl bg-white/90 text-xs font-bold text-[#032038]">
          <p className="font-black text-[#055f9e] mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="capitalize">{entry.name}:</span>
              <span className="font-black">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const timelineData = reportsData?.registrationsTimeline || [];
  const scoreData = reportsData?.scoreDistribution || [];
  const courseData = reportsData?.courseCompletionRates || [];
  const languageData = reportsData?.languagePopularity || [];

  return (
    <div className="space-y-6">
      {/* Header & CSV Export Bar */}
      <div className="rounded-2xl glass-card border border-white/70 p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-800 flex items-center justify-center border border-blue-400/40 shadow-xs">
            <BarChart3 size={20} />
          </div>
          <div>
            <h2 className="display text-lg font-black text-[#032038] leading-tight">
              Aggregate Learning Analytics & Reports
            </h2>
            <p className="text-xs font-bold text-[#032038]/70">
              Live SQLite database metrics, cohort growth, and completion rates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            type="button"
            onClick={fetchReports}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-xl bg-white/40 hover:bg-white/60 text-[#032038] border border-white/70 transition shadow-xs cursor-pointer"
            title="Refresh Reports"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#055f9e]' : 'text-[#055f9e]'} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            id="admin-export-csv-btn"
            disabled={exportingCsv || loading}
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl bg-linear-to-b from-[#fff6c4] to-[#ffd633] hover:from-[#fff9d4] hover:to-[#ffe054] text-[#4a3200] border-b-3 border-[#cf8a00] shadow-md transition disabled:opacity-50 cursor-pointer active:translate-y-0.5"
          >
            <FileSpreadsheet size={15} className="text-[#704d00]" />
            <span>{exportingCsv ? 'Exporting CSV...' : 'Export CSV (Full Roster)'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-500/15 border border-red-400/40 p-4 text-center text-red-950 font-bold text-xs flex items-center justify-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Grid of 4 Core Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Registrations Over Time (Line / Area) */}
        <div className="rounded-2xl glass-card border border-white/70 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-[#055f9e]" />
              <h3 className="display text-sm font-black text-[#032038]">
                New Learner Registrations Over Time
              </h3>
            </div>
            <span className="text-[10px] font-black uppercase text-[#032038]/60 px-2.5 py-0.5 rounded-lg bg-white/40 border border-white/60">
              Daily Cohorts
            </span>
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full w-full rounded-xl bg-white/30 animate-pulse" />
            ) : timelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-bold text-[#032038]/60">
                No registration history recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#055f9e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#055f9e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.4)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#032038', fontSize: 10, fontWeight: 700 }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#032038', fontSize: 10, fontWeight: 700 }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Registrations"
                    stroke="#055f9e"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#regGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Assessment Score Distribution (Histogram Bar) */}
        <div className="rounded-2xl glass-card border border-white/70 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-emerald-700" />
              <h3 className="display text-sm font-black text-[#032038]">
                Assessment Score Distribution (Histogram)
              </h3>
            </div>
            <span className="text-[10px] font-black uppercase text-[#032038]/60 px-2.5 py-0.5 rounded-lg bg-white/40 border border-white/60">
              Proficiency Buckets
            </span>
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full w-full rounded-xl bg-white/30 animate-pulse" />
            ) : scoreData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-bold text-[#032038]/60">
                No assessment scores recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.4)" />
                  <XAxis
                    dataKey="bucket"
                    tick={{ fill: '#032038', fontSize: 10, fontWeight: 700 }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#032038', fontSize: 10, fontWeight: 700 }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Learners" radius={[6, 6, 0, 0]}>
                    {scoreData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={scoreBucketColors[index % scoreBucketColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 3: Course Completion Rates (Horizontal Bar Chart) */}
        <div className="rounded-2xl glass-card border border-white/70 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-amber-700" />
              <h3 className="display text-sm font-black text-[#032038]">
                Course Completion Rates (%)
              </h3>
            </div>
            <span className="text-[10px] font-black uppercase text-[#032038]/60 px-2.5 py-0.5 rounded-lg bg-white/40 border border-white/60">
              Completed vs Enrolled
            </span>
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full w-full rounded-xl bg-white/30 animate-pulse" />
            ) : courseData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-bold text-[#032038]/60">
                No course enrollments or completions recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={courseData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.4)" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    unit="%"
                    tick={{ fill: '#032038', fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="course_title"
                    width={110}
                    tick={{ fill: '#032038', fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="completion_rate"
                    name="Completion Rate (%)"
                    fill="#ffb300"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 4: Language-Pair & Regional Popularity */}
        <div className="rounded-2xl glass-card border border-white/70 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-purple-700" />
              <h3 className="display text-sm font-black text-[#032038]">
                Language Adoption & Diversity
              </h3>
            </div>
            <span className="text-[10px] font-black uppercase text-[#032038]/60 px-2.5 py-0.5 rounded-lg bg-white/40 border border-white/60">
              Supported Native Scripts
            </span>
          </div>

          <div className="h-64 w-full flex flex-col justify-center">
            {loading ? (
              <div className="h-full w-full rounded-xl bg-white/30 animate-pulse" />
            ) : languageData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-bold text-[#032038]/60">
                No language preferences registered yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {languageData.map((lang, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white/40 border border-white/60 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#055f9e]">
                        {lang.code || 'IN'}
                      </span>
                      <h4 className="font-black text-xs text-[#032038] mt-0.5">{lang.language}</h4>
                    </div>
                    <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-white/50">
                      <span className="text-base font-black text-[#032038]">{lang.count}</span>
                      <span className="text-[10px] font-bold text-[#032038]/60">learners</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
