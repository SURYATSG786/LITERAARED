import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Mail,
  BookOpen,
  Trophy,
  Flame,
  Gem,
  Award,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import api from '../../api/client';

export default function LearnerDetailDrawer({
  learnerId,
  isOpen,
  onClose,
  onReminderSent,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reminderNote, setReminderNote] = useState('');
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderSuccess, setReminderSuccess] = useState('');

  useEffect(() => {
    if (!learnerId || !isOpen) return;

    let active = true;
    setLoading(true);
    setError('');
    setReminderSuccess('');

    api
      .getAdminLearnerDetails(learnerId)
      .then((res) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Failed to load learner details');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [learnerId, isOpen]);

  const handleSendReminder = async (e) => {
    e.preventDefault();
    if (!learnerId) return;

    setSendingReminder(true);
    setError('');
    setReminderSuccess('');

    try {
      await api.sendAdminReminder(
        learnerId,
        reminderNote.trim() || 'Please log in to continue your daily literacy practice.',
        'in_app'
      );
      setReminderSuccess('Reminder sent successfully!');
      setReminderNote('');
      if (onReminderSent) onReminderSent(learnerId);

      // Refresh drawer data to show new reminder in logs
      const updated = await api.getAdminLearnerDetails(learnerId);
      setData(updated);
    } catch (err) {
      setError(err.message || 'Failed to send reminder');
    } finally {
      setSendingReminder(false);
    }
  };

  if (!isOpen) return null;

  const learner = data?.learner;
  const diagnostic = data?.diagnostic;
  const courseProgress = data?.courseProgress || [];
  const certificates = data?.certificates || [];
  const reminders = data?.reminders || [];

  const getScoreBadge = (score) => {
    if (score == null) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-gray-500/20 text-gray-800 border border-gray-400/40">
          Not Assessed
        </span>
      );
    }
    if (score < 40) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-red-500/20 text-red-900 border border-red-400/50">
          {score}% (Needs Help)
        </span>
      );
    }
    if (score <= 70) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-amber-500/20 text-amber-900 border border-amber-400/50">
          {score}% (Developing)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-emerald-500/20 text-emerald-900 border border-emerald-400/50">
        {score}% (Mastered)
      </span>
    );
  };

  const getEducationLabel = (level) => {
    const map = {
      none: 'No Formal Education',
      primary: 'Primary School',
      middle: 'Middle School',
      high: 'High School',
    };
    return map[level] || level || 'Primary';
  };

  const getLangName = (code) => {
    const map = {
      en: 'English',
      ta: 'Tamil (தமிழ்)',
      te: 'Telugu (తెలుగు)',
      kn: 'Kannada (ಕನ್ನಡ)',
      hi: 'Hindi (हिन्दी)',
      ml: 'Malayalam (മലയാളം)',
    };
    return map[code] || code || 'English';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#032038]/40 backdrop-blur-xs transition-opacity"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="w-screen max-w-xl glass-strong border-l border-white/80 shadow-2xl flex flex-col overflow-y-auto bg-white/85 text-[#032038]"
          >
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 px-6 py-4 border-b border-white/60 bg-white/70 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-[#055f9e] to-[#008be3] text-white flex items-center justify-center font-black text-lg shadow-md">
                  {learner?.name ? learner.name.charAt(0).toUpperCase() : 'L'}
                </div>
                <div>
                  <h2 className="display text-lg font-black text-[#032038] leading-tight">
                    {learner?.name || 'Learner Profile'}
                  </h2>
                  <p className="text-xs font-bold text-[#055f9e]">
                    ID: {learner?.id?.slice(0, 16)}...
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/50 hover:bg-white/80 flex items-center justify-center text-[#032038] border border-white/60 transition cursor-pointer"
                aria-label="Close drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 flex-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
                  <div className="w-10 h-10 rounded-full border-3 border-[#055f9e]/30 border-t-[#055f9e] animate-spin" />
                  <p className="text-xs font-bold text-[#032038]/70">Loading learner records from SQLite...</p>
                </div>
              ) : error && !learner ? (
                <div className="rounded-2xl bg-red-500/15 border border-red-400/40 p-4 text-center text-red-950 font-bold text-xs">
                  {error}
                </div>
              ) : learner ? (
                <>
                  {/* Overview Card */}
                  <div className="rounded-2xl bg-white/60 border border-white/80 p-5 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="display text-xl font-black text-[#032038]">{learner.name}</h3>
                          {getScoreBadge(learner.assessment_score)}
                        </div>
                        <p className="text-xs font-bold text-[#032038]/70 flex items-center gap-1.5 mt-1">
                          <Mail size={13} className="text-[#055f9e]" />
                          {learner.email}
                        </p>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-900 border border-blue-400/40">
                        {learner.league || 'Bronze'} League
                      </span>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/60">
                      <div className="p-2.5 rounded-xl bg-white/40 border border-white/50">
                        <span className="text-[10px] font-extrabold uppercase text-[#032038]/60 block">Streak</span>
                        <div className="flex items-center gap-1 mt-0.5 font-black text-amber-900 text-sm">
                          <Flame size={14} className="text-amber-500 fill-amber-500" />
                          {learner.streak_days || 0}d
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/40 border border-white/50">
                        <span className="text-[10px] font-extrabold uppercase text-[#032038]/60 block">XP</span>
                        <div className="flex items-center gap-1 mt-0.5 font-black text-purple-900 text-sm">
                          <Sparkles size={14} className="text-purple-600" />
                          {learner.xp || 0}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/40 border border-white/50">
                        <span className="text-[10px] font-extrabold uppercase text-[#032038]/60 block">Gems</span>
                        <div className="flex items-center gap-1 mt-0.5 font-black text-cyan-900 text-sm">
                          <Gem size={14} className="text-cyan-600" />
                          {learner.gems || 0}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/40 border border-white/50">
                        <span className="text-[10px] font-extrabold uppercase text-[#032038]/60 block">Certificates</span>
                        <div className="flex items-center gap-1 mt-0.5 font-black text-emerald-900 text-sm">
                          <Award size={14} className="text-emerald-600" />
                          {certificates.length}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-[#032038]/80 pt-1">
                      <div>
                        <span className="text-[10px] font-black uppercase text-[#032038]/50 block">Education Level</span>
                        <span>{getEducationLabel(learner.education_level)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-[#032038]/50 block">Interface Language</span>
                        <span>{getLangName(learner.ui_language || learner.preferred_language)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic Assessment Section */}
                  <div className="rounded-2xl bg-white/60 border border-white/80 p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#032038] flex items-center gap-1.5">
                        <BookOpen size={15} className="text-[#055f9e]" />
                        Initial Diagnostic Assessment
                      </h4>
                      {diagnostic ? (
                        <span className="text-[11px] font-black text-emerald-800 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                          Completed
                        </span>
                      ) : (
                        <span className="text-[11px] font-black text-amber-800 bg-amber-500/20 px-2 py-0.5 rounded-md">
                          Pending
                        </span>
                      )}
                    </div>

                    {diagnostic ? (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between bg-white/40 p-2.5 rounded-xl">
                          <span className="font-bold text-[#032038]/70">Score Achieved</span>
                          <span className="font-black text-[#032038] text-sm">{diagnostic.score}%</span>
                        </div>
                        <div className="flex items-center justify-between bg-white/40 p-2.5 rounded-xl">
                          <span className="font-bold text-[#032038]/70">Learning Path Assigned</span>
                          <span className="font-black text-[#055f9e] capitalize">{diagnostic.assigned_level || learner.current_path || 'Foundation'}</span>
                        </div>
                        {diagnostic.completed_at && (
                          <div className="flex items-center justify-between bg-white/40 p-2.5 rounded-xl">
                            <span className="font-bold text-[#032038]/70">Completed Date</span>
                            <span className="font-bold text-[#032038]">{new Date(diagnostic.completed_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-950 text-xs font-bold">
                        Learner has registered but not yet submitted their foundational skill assessment test.
                      </div>
                    )}
                  </div>

                  {/* Course Lesson History */}
                  <div className="rounded-2xl bg-white/60 border border-white/80 p-5 shadow-sm space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#032038] flex items-center gap-1.5">
                      <Trophy size={15} className="text-amber-600" />
                      Lesson Progress ({courseProgress.length})
                    </h4>

                    {courseProgress.length === 0 ? (
                      <p className="text-xs font-bold text-[#032038]/60 text-center py-4">
                        No individual course lessons completed yet.
                      </p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {courseProgress.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white/40 border border-white/50 text-xs"
                          >
                            <div>
                              <p className="font-black text-[#032038]">
                                Course: {item.course_id || 'Foundation'} — Lesson {item.lesson_id || idx + 1}
                              </p>
                              <p className="text-[10px] font-bold text-[#032038]/60">
                                {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : 'Completed'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-emerald-800 bg-emerald-500/20 px-2 py-0.5 rounded text-[11px]">
                                {item.score != null ? `${item.score}%` : `${item.correct_count || 0}/${item.total_questions || 0}`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Certificates Earned */}
                  {certificates.length > 0 && (
                    <div className="rounded-2xl bg-white/60 border border-white/80 p-5 shadow-sm space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#032038] flex items-center gap-1.5">
                        <Award size={15} className="text-emerald-600" />
                        Credentials & Certificates ({certificates.length})
                      </h4>
                      <div className="space-y-1.5">
                        {certificates.map((cert) => (
                          <div
                            key={cert.credential_id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white/40 border border-white/50 text-xs"
                          >
                            <div>
                              <p className="font-black text-[#032038]">{cert.course_title || 'LiteraAI Literacy Certificate'}</p>
                              <p className="text-[10px] font-mono text-[#055f9e]">
                                ID: {cert.credential_id}
                              </p>
                            </div>
                            <span className="text-[11px] font-black text-emerald-900 bg-emerald-500/20 px-2 py-0.5 rounded">
                              Score: {cert.score}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Reminder & Intervention Tool */}
                  <div className="rounded-2xl bg-linear-to-br from-amber-500/10 via-white/50 to-white/60 border border-amber-400/50 p-5 shadow-sm space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#032038] flex items-center gap-1.5">
                      <Send size={15} className="text-amber-600" />
                      Send Admin Reminder / Encouragement
                    </h4>

                    {reminderSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-950 text-xs font-black flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-700" />
                        {reminderSuccess}
                      </div>
                    )}

                    <form onSubmit={handleSendReminder} className="space-y-2">
                      <textarea
                        rows={2}
                        value={reminderNote}
                        onChange={(e) => setReminderNote(e.target.value)}
                        placeholder="Write an encouraging note or leave blank for default literacy reminder..."
                        className="w-full text-xs font-bold p-3 rounded-xl border border-white/80 bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#055f9e] text-[#032038]"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={sendingReminder}
                          className="px-4 py-2 rounded-xl bg-[#055f9e] hover:bg-[#044c7e] text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                        >
                          <Send size={13} />
                          {sendingReminder ? 'Sending...' : 'Log & Send Reminder'}
                        </button>
                      </div>
                    </form>

                    {/* Past Reminders Log */}
                    {reminders.length > 0 && (
                      <div className="pt-2 border-t border-white/60 space-y-1">
                        <p className="text-[10px] font-black uppercase text-[#032038]/60">Previous Intervention Logs</p>
                        <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                          {reminders.map((rem) => (
                            <div
                              key={rem.id}
                              className="text-[11px] p-2 rounded-lg bg-white/30 border border-white/40 flex items-start justify-between gap-2"
                            >
                              <span className="font-bold text-[#032038]/80">{rem.note}</span>
                              <span className="text-[9px] font-bold text-[#032038]/50 shrink-0">
                                {new Date(rem.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
