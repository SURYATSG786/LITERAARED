import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Clock,
  Flame,
  Send,
  CheckCircle2,
  Filter,
  RefreshCw,
  UserX,
  AlertCircle,
  Eye,
  Sparkles,
} from 'lucide-react';
import api from '../../api/client';
import LearnerDetailDrawer from './LearnerDetailDrawer';

export default function NeedsAttentionList({ onBadgeUpdate }) {
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterReason, setFilterReason] = useState('all');

  // Reminder state modal / prompt
  const [activeReminderLearner, setActiveReminderLearner] = useState(null);
  const [reminderNote, setReminderNote] = useState('');
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderSuccessMap, setReminderSuccessMap] = useState({});

  // Detail drawer
  const [selectedLearnerId, setSelectedLearnerId] = useState(null);

  const fetchAttentionList = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAdminNeedsAttention();
      const list = res.learners || [];
      setLearners(list);
      if (onBadgeUpdate) onBadgeUpdate(list.length);
    } catch (err) {
      setError(err.message || 'Failed to load at-risk learners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttentionList();
  }, []);

  const handleSendReminderSubmit = async (e) => {
    e.preventDefault();
    if (!activeReminderLearner) return;

    setSendingReminder(true);
    try {
      await api.sendAdminReminder(
        activeReminderLearner.id,
        reminderNote.trim() || `Daily reminder: Keep your literacy journey going!`,
        'in_app'
      );
      setReminderSuccessMap((prev) => ({
        ...prev,
        [activeReminderLearner.id]: 'Reminder sent successfully!',
      }));
      setActiveReminderLearner(null);
      setReminderNote('');
    } catch (err) {
      alert(err.message || 'Failed to send reminder');
    } finally {
      setSendingReminder(false);
    }
  };

  const filteredLearners = learners.filter((learner) => {
    if (filterReason === 'all') return true;
    if (filterReason === 'inactive') return learner.flagType === 'inactive' || learner.inactivityDays >= 5;
    if (filterReason === 'low_score') return learner.flagType === 'low_score' || (learner.assessment_score != null && learner.assessment_score < 40);
    if (filterReason === 'unassessed') return learner.flagType === 'unassessed' || learner.assessment_score == null;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="rounded-2xl glass-card border border-white/70 p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-700 flex items-center justify-center border border-red-400/40 shadow-xs">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="display text-lg font-black text-[#032038] leading-tight">
              Learners Needing Attention
            </h2>
            <p className="text-xs font-bold text-[#032038]/70">
              {learners.length} {learners.length === 1 ? 'learner flagged' : 'learners flagged'} by automated risk criteria
            </p>
          </div>
        </div>

        {/* Filter Pills & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white/40 p-1 rounded-xl border border-white/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilterReason('all')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                filterReason === 'all'
                  ? 'bg-white text-[#032038] shadow-xs font-black'
                  : 'text-[#032038]/70 hover:text-[#032038]'
              }`}
            >
              All ({learners.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterReason('inactive')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                filterReason === 'inactive'
                  ? 'bg-white text-[#032038] shadow-xs font-black'
                  : 'text-[#032038]/70 hover:text-[#032038]'
              }`}
            >
              Inactive
            </button>
            <button
              type="button"
              onClick={() => setFilterReason('low_score')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                filterReason === 'low_score'
                  ? 'bg-white text-[#032038] shadow-xs font-black'
                  : 'text-[#032038]/70 hover:text-[#032038]'
              }`}
            >
              Low Score
            </button>
            <button
              type="button"
              onClick={() => setFilterReason('unassessed')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                filterReason === 'unassessed'
                  ? 'bg-white text-[#032038] shadow-xs font-black'
                  : 'text-[#032038]/70 hover:text-[#032038]'
              }`}
            >
              Unassessed
            </button>
          </div>

          <button
            type="button"
            onClick={fetchAttentionList}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-xl bg-white/40 hover:bg-white/60 text-[#032038] border border-white/70 transition shadow-xs cursor-pointer"
            title="Refresh Attention List"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#055f9e]' : 'text-[#055f9e]'} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Attention Grid */}
      {error ? (
        <div className="rounded-2xl bg-red-500/15 border border-red-400/40 p-4 text-center text-red-950 font-bold text-xs flex items-center justify-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      ) : loading && learners.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl glass-card p-5 border border-white/60 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/40" />
                <div className="space-y-1 flex-1">
                  <div className="h-4 w-28 rounded bg-white/40" />
                  <div className="h-3 w-40 rounded bg-white/30" />
                </div>
              </div>
              <div className="h-10 rounded-xl bg-white/30" />
              <div className="h-8 rounded-xl bg-white/40" />
            </div>
          ))}
        </div>
      ) : filteredLearners.length === 0 ? (
        <div className="rounded-2xl glass-card border border-white/70 p-12 text-center shadow-lg space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-800 flex items-center justify-center mx-auto text-2xl font-black border border-emerald-400/40 shadow-sm">
            ✨
          </div>
          <h3 className="display text-xl font-black text-[#032038]">
            {filterReason === 'all'
              ? 'All Learners Active & On Track!'
              : 'No Learners Match This Risk Filter'}
          </h3>
          <p className="text-xs font-semibold text-[#032038]/70 max-w-md mx-auto">
            {filterReason === 'all'
              ? 'None of your registered learners meet the critical risk criteria (inactive >5 days, low scores, or unassessed delays).'
              : 'Try selecting a different filter category above.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLearners.map((learner) => {
            const isInactive = learner.flagType === 'inactive' || learner.inactivityDays >= 5;
            const isLowScore = learner.flagType === 'low_score' || (learner.assessment_score != null && learner.assessment_score < 40);
            const isUnassessed = learner.flagType === 'unassessed' || learner.assessment_score == null;

            const cardBorder = isLowScore
              ? 'border-red-400/60 bg-linear-to-br from-red-500/10 via-white/50 to-white/70'
              : isInactive
              ? 'border-amber-400/60 bg-linear-to-br from-amber-500/10 via-white/50 to-white/70'
              : 'border-blue-400/60 bg-linear-to-br from-blue-500/10 via-white/50 to-white/70';

            const reasonBadge = isLowScore
              ? 'bg-red-500/20 text-red-950 border-red-400/40'
              : isInactive
              ? 'bg-amber-500/20 text-amber-950 border-amber-400/40'
              : 'bg-blue-500/20 text-blue-950 border-blue-400/40';

            return (
              <motion.div
                key={learner.id}
                whileHover={{ y: -2 }}
                className={`rounded-2xl glass-card p-5 border shadow-lg backdrop-blur-xl flex flex-col justify-between gap-4 ${cardBorder}`}
              >
                {/* Top: Avatar, Name, Email */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/70 border border-white/80 text-[#055f9e] flex items-center justify-center font-black text-base shadow-xs shrink-0">
                        {learner.name ? learner.name.charAt(0).toUpperCase() : 'L'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-sm text-[#032038] truncate">
                          {learner.name}
                        </h4>
                        <p className="text-[11px] font-bold text-[#032038]/60 truncate">
                          {learner.email}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedLearnerId(learner.id)}
                      className="p-1.5 rounded-lg bg-white/50 hover:bg-white/80 text-[#055f9e] border border-white/70 shadow-xs cursor-pointer"
                      title="Inspect Learner History"
                    >
                      <Eye size={14} />
                    </button>
                  </div>

                  {/* Flag Reason Pill */}
                  <div className={`p-2.5 rounded-xl border text-xs font-black flex items-start gap-2 ${reasonBadge}`}>
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="leading-tight">{learner.reason || learner.flagReason || 'Requires Attention'}</p>
                      <p className="text-[10px] font-bold opacity-80 mt-0.5">
                        {isInactive
                          ? `Inactive for ${learner.inactivityDays || 5}+ days`
                          : isLowScore
                          ? `Diagnostic score: ${learner.assessment_score}% (Needs foundational retake)`
                          : 'Registered without completing initial assessment'}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#032038]/70 pt-3 mt-3 border-t border-white/40">
                    <div className="flex items-center gap-1">
                      <Flame size={12} className="text-amber-500 fill-amber-500" />
                      <span>{learner.streak_days || 0}d streak</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-[#055f9e]" />
                      <span>
                        {learner.last_active_at
                          ? `Active ${new Date(learner.last_active_at).toLocaleDateString()}`
                          : 'Never active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action: Send Reminder */}
                <div className="pt-2">
                  {reminderSuccessMap[learner.id] ? (
                    <div className="w-full py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-950 text-xs font-black flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-700" />
                      <span>{reminderSuccessMap[learner.id]}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReminderLearner(learner);
                        setReminderNote(
                          isLowScore
                            ? `Hi ${learner.name.split(' ')[0]}, let's review foundational vocabulary together! Log in to retry your skill test.`
                            : isInactive
                            ? `Hi ${learner.name.split(' ')[0]}, we miss you! Jump back in today to keep your daily streak alive.`
                            : `Hi ${learner.name.split(' ')[0]}, complete your 5-minute skill assessment to unlock your literacy courses!`
                        );
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-linear-to-b from-[#fff6c4] to-[#ffd633] hover:from-[#fff9d4] hover:to-[#ffe054] text-[#4a3200] border-b-3 border-[#cf8a00] font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-0.5 active:border-b"
                    >
                      <Send size={13} className="text-[#704d00]" />
                      <span>Send Reminder</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Reminder Custom Note Modal */}
      <AnimatePresence>
        {activeReminderLearner && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveReminderLearner(null)}
              className="fixed inset-0 bg-[#032038]/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-3xl glass-strong border border-white/80 p-6 shadow-2xl bg-white/90 text-[#032038] z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center font-black">
                    <Send size={15} />
                  </div>
                  <div>
                    <h3 className="display text-base font-black text-[#032038]">
                      Send Learner Reminder
                    </h3>
                    <p className="text-[11px] font-bold text-[#055f9e]">
                      To: {activeReminderLearner.name} ({activeReminderLearner.email})
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSendReminderSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-[#032038]/70 mb-1">
                    Reminder Message
                  </label>
                  <textarea
                    rows={3}
                    value={reminderNote}
                    onChange={(e) => setReminderNote(e.target.value)}
                    required
                    className="w-full text-xs font-bold p-3 rounded-xl border border-white/80 bg-white/80 text-[#032038] focus:outline-none focus:ring-2 focus:ring-[#055f9e]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveReminderLearner(null)}
                    className="px-4 py-2 rounded-xl bg-white/50 hover:bg-white/80 text-[#032038] font-bold text-xs border border-white/60 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingReminder}
                    className="px-4 py-2 rounded-xl bg-[#055f9e] hover:bg-[#044c7e] text-white font-black text-xs shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    {sendingReminder ? 'Sending...' : 'Send Reminder'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Drawer */}
      <LearnerDetailDrawer
        learnerId={selectedLearnerId}
        isOpen={Boolean(selectedLearnerId)}
        onClose={() => setSelectedLearnerId(null)}
        onReminderSent={() => fetchAttentionList()}
      />
    </div>
  );
}
