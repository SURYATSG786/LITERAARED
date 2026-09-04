import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Flame,
  Sparkles,
  RefreshCw,
  Eye,
  UserCheck,
  Calendar,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import api from '../../api/client';
import LearnerDetailDrawer from './LearnerDetailDrawer';

export default function LearnerTable() {
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Filters & Sorting state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [educationFilter, setEducationFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Selected learner for Detail Drawer
  const [selectedLearnerId, setSelectedLearnerId] = useState(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch learners from API
  const fetchLearners = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError('');
      try {
        const params = {
          page,
          limit: pagination.limit,
          search: debouncedSearch,
          sortBy,
          sortOrder,
        };
        if (educationFilter !== 'all') params.education = educationFilter;
        if (scoreFilter !== 'all') params.scoreTier = scoreFilter;

        const res = await api.getAdminLearners(params);
        setLearners(res.learners || []);
        setPagination(res.pagination || { page, limit: 10, total: 0, totalPages: 1 });
      } catch (err) {
        setError(err.message || 'Failed to load learner records');
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, educationFilter, scoreFilter, sortBy, sortOrder, pagination.limit]
  );

  // Re-fetch on filter/sort change
  useEffect(() => {
    fetchLearners(1);
  }, [fetchLearners]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getScoreBadge = (score) => {
    if (score == null) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-gray-500/15 text-gray-800 border border-gray-400/30">
          Unassessed
        </span>
      );
    }
    if (score < 40) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-black bg-red-500/20 text-red-950 border border-red-400/40">
          {score}%
        </span>
      );
    }
    if (score <= 70) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-black bg-amber-500/20 text-amber-950 border border-amber-400/40">
          {score}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-black bg-emerald-500/20 text-emerald-950 border border-emerald-400/40">
        {score}%
      </span>
    );
  };

  const getEducationLabel = (level) => {
    const map = {
      none: 'No Formal',
      primary: 'Primary',
      middle: 'Middle',
      high: 'High School',
    };
    return map[level] || level || 'Primary';
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar */}
      <div className="rounded-2xl glass-card border border-white/70 p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Debounced Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#055f9e]" size={16} />
            <input
              type="text"
              id="learner-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search learners by name or email..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm font-bold rounded-xl border border-white/70 bg-white/40 placeholder-[#032038]/50 text-[#032038] focus:outline-none focus:ring-2 focus:ring-[#055f9e] shadow-xs"
            />
          </div>

          {/* Filter Dropdowns & Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Education Filter */}
            <select
              id="learner-education-filter"
              value={educationFilter}
              onChange={(e) => setEducationFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-white/70 bg-white/40 text-[#032038] focus:outline-none focus:ring-2 focus:ring-[#055f9e] cursor-pointer shadow-xs"
            >
              <option value="all">All Education</option>
              <option value="none">No Formal Education</option>
              <option value="primary">Primary School</option>
              <option value="middle">Middle School</option>
              <option value="high">High School</option>
            </select>

            {/* Score Tier Filter */}
            <select
              id="learner-score-filter"
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-white/70 bg-white/40 text-[#032038] focus:outline-none focus:ring-2 focus:ring-[#055f9e] cursor-pointer shadow-xs"
            >
              <option value="all">All Scores</option>
              <option value="high">High Score (&gt;70%)</option>
              <option value="medium">Medium (40-70%)</option>
              <option value="low">Needs Help (&lt;40%)</option>
              <option value="unassessed">Unassessed</option>
            </select>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchLearners(pagination.page)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-xl bg-white/40 hover:bg-white/60 text-[#032038] border border-white/70 transition shadow-xs cursor-pointer"
              title="Refresh Roster"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-[#055f9e]' : 'text-[#055f9e]'} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Active Filter Summary */}
        <div className="flex items-center justify-between text-xs font-bold text-[#032038]/70 pt-1 border-t border-white/40">
          <span>
            Showing {learners.length} of {pagination.total} registered learners
          </span>
          {(debouncedSearch || educationFilter !== 'all' || scoreFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setEducationFilter('all');
                setScoreFilter('all');
              }}
              className="text-[#055f9e] hover:underline font-extrabold cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Roster Data Table Card */}
      <div className="rounded-2xl glass-card border border-white/70 shadow-xl overflow-hidden">
        {error && (
          <div className="p-4 bg-red-500/15 border-b border-red-400/40 text-red-950 font-bold text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-red-700" />
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-white/30 border-b border-white/50 text-[#032038]/80 font-black uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-[#055f9e] cursor-pointer"
                  >
                    <span>Learner</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="py-3.5 px-4 hidden md:table-cell">
                  <span>Education</span>
                </th>
                <th className="py-3.5 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('assessment_score')}
                    className="flex items-center gap-1 hover:text-[#055f9e] cursor-pointer"
                  >
                    <span>Diagnostic Score</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="py-3.5 px-4 hidden sm:table-cell">
                  <button
                    type="button"
                    onClick={() => handleSort('streak_days')}
                    className="flex items-center gap-1 hover:text-[#055f9e] cursor-pointer"
                  >
                    <span>Streak</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="py-3.5 px-4 hidden lg:table-cell">
                  <button
                    type="button"
                    onClick={() => handleSort('xp')}
                    className="flex items-center gap-1 hover:text-[#055f9e] cursor-pointer"
                  >
                    <span>XP</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="py-3.5 px-4 hidden sm:table-cell">
                  <button
                    type="button"
                    onClick={() => handleSort('last_active_at')}
                    className="flex items-center gap-1 hover:text-[#055f9e] cursor-pointer"
                  >
                    <span>Last Active</span>
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {loading && learners.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/40" />
                        <div className="space-y-1">
                          <div className="h-3.5 w-28 rounded bg-white/40" />
                          <div className="h-2.5 w-36 rounded bg-white/30" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">
                      <div className="h-3 w-20 rounded bg-white/40" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-12 rounded-md bg-white/40" />
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <div className="h-3 w-10 rounded bg-white/40" />
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell">
                      <div className="h-3 w-10 rounded bg-white/40" />
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <div className="h-3 w-16 rounded bg-white/40" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-6 w-14 rounded-lg bg-white/40 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : learners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#032038]/70">
                    <GraduationCap size={36} className="mx-auto mb-2 text-[#055f9e]/60" />
                    <p className="font-black text-sm">No learners found</p>
                    <p className="text-xs font-semibold mt-0.5">
                      Try adjusting your search query or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                learners.map((learner) => (
                  <tr
                    key={learner.id}
                    onClick={() => setSelectedLearnerId(learner.id)}
                    className="hover:bg-white/40 transition cursor-pointer group"
                  >
                    {/* Learner Name & Email */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-[#055f9e]/20 to-[#008be3]/20 text-[#055f9e] border border-[#055f9e]/30 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                          {learner.name ? learner.name.charAt(0).toUpperCase() : 'L'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-[#032038] truncate group-hover:text-[#055f9e] transition">
                            {learner.name}
                          </p>
                          <p className="text-[11px] font-bold text-[#032038]/60 truncate">
                            {learner.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Education Level */}
                    <td className="py-3 px-4 hidden md:table-cell font-bold text-[#032038]/80">
                      {getEducationLabel(learner.education_level)}
                    </td>

                    {/* Diagnostic Score */}
                    <td className="py-3 px-4">
                      {getScoreBadge(learner.assessment_score)}
                    </td>

                    {/* Current Streak */}
                    <td className="py-3 px-4 hidden sm:table-cell font-black text-amber-900">
                      <div className="flex items-center gap-1">
                        <Flame size={13} className="text-amber-500 fill-amber-500" />
                        <span>{learner.streak_days || 0}d</span>
                      </div>
                    </td>

                    {/* XP */}
                    <td className="py-3 px-4 hidden lg:table-cell font-black text-purple-900">
                      <div className="flex items-center gap-1">
                        <Sparkles size={13} className="text-purple-600" />
                        <span>{learner.xp || 0}</span>
                      </div>
                    </td>

                    {/* Last Active */}
                    <td className="py-3 px-4 hidden sm:table-cell font-bold text-[#032038]/70 text-xs">
                      {learner.last_active_at ? (
                        <span>{new Date(learner.last_active_at).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-[#032038]/40">Never</span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLearnerId(learner.id);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/60 hover:bg-[#055f9e] hover:text-white text-[#055f9e] text-xs font-black border border-white/80 transition shadow-xs cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-white/30 border-t border-white/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-[#032038]">
          <span>
            Page {pagination.page} of {pagination.totalPages || 1} ({pagination.total} total learners)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1 || loading}
              onClick={() => fetchLearners(pagination.page - 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/50 hover:bg-white/80 border border-white/70 text-[#032038] font-black transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => fetchLearners(pagination.page + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/50 hover:bg-white/80 border border-white/70 text-[#032038] font-black transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Learner Detail History Drawer */}
      <LearnerDetailDrawer
        learnerId={selectedLearnerId}
        isOpen={Boolean(selectedLearnerId)}
        onClose={() => setSelectedLearnerId(null)}
        onReminderSent={() => fetchLearners(pagination.page)}
      />
    </div>
  );
}
