import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpenCheck, Award, Send, BookOpen, CheckCircle, ShieldAlert } from 'lucide-react';
import api from '../api/client';
import { useToast } from './mentor/Toast';

export default function LearnerProfileModal({ learnerId, onClose }) {
  const [learnerDetails, setLearnerDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!learnerId) {
      setLearnerDetails(null);
      return;
    }
    setLoading(true);
    api.getLearnerDetails(learnerId)
      .then((res) => setLearnerDetails(res))
      .catch((err) => {
        showToast(err.message || 'Failed to load learner details', 'error');
      })
      .finally(() => setLoading(false));
  }, [learnerId, showToast]);

  const handleSendReminder = () => {
    if (!learnerDetails?.learner) return;
    showToast(`Friendly reminder sent to ${learnerDetails.learner.name}`, 'success');
  };

  const handleAssignPractice = () => {
    if (!learnerDetails?.learner) return;
    showToast(`Practice lessons assigned to ${learnerDetails.learner.name}`, 'success');
  };

  return (
    <AnimatePresence>
      {learnerId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            className="glass-card relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border-2 border-white/70 bg-gradient-to-br from-white/95 via-sky-50/95 to-white/95 text-[#032038]"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-black/5 hover:bg-black/10 transition text-[#032038]"
            >
              <X size={20} />
            </button>

            {loading || !learnerDetails ? (
              <div className="py-16 text-center font-black text-sm animate-pulse text-[#0b6fb8]">
                Loading learner profile…
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-5">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-[#0b6fb8] bg-[#0b6fb8]/15 px-3 py-0.5 rounded-full">
                      Learner Profile
                    </div>
                    <h2 className="display text-2xl sm:text-3xl font-black text-[#032038]">
                      {learnerDetails.learner.name}
                    </h2>
                    <p className="text-xs font-bold text-[#032038]/70">
                      {learnerDetails.learner.email} · Native Language: <span className="uppercase font-black">{learnerDetails.learner.uiLanguage}</span> · Learning: <span className="uppercase font-black text-[#0b6fb8]">{learnerDetails.learner.learningLanguage}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-[#055f9e] text-white shadow-sm uppercase">
                      {(learnerDetails.learner.league || 'bronze')} League
                    </span>
                  </div>
                </div>

                {/* Top Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white/50 border border-white/70 rounded-2xl p-3 shadow-sm">
                    <span className="block text-[10px] font-black uppercase text-[#032038]/60">XP Points</span>
                    <span className="text-lg font-black text-emerald-900">⭐ {learnerDetails.learner.xp || 0} XP</span>
                  </div>
                  <div className="bg-white/50 border border-white/70 rounded-2xl p-3 shadow-sm">
                    <span className="block text-[10px] font-black uppercase text-[#032038]/60">Gems</span>
                    <span className="text-lg font-black text-blue-900">💎 {learnerDetails.learner.gems || 0}</span>
                  </div>
                  <div className="bg-white/50 border border-white/70 rounded-2xl p-3 shadow-sm">
                    <span className="block text-[10px] font-black uppercase text-[#032038]/60">Daily Streak</span>
                    <span className="text-lg font-black text-amber-900">🔥 {learnerDetails.learner.streak?.current || 0} Days</span>
                  </div>
                  <div className="bg-white/50 border border-white/70 rounded-2xl p-3 shadow-sm">
                    <span className="block text-[10px] font-black uppercase text-[#032038]/60">Education Level</span>
                    <span className="text-xs font-black text-[#032038]">{learnerDetails.learner.education_level}</span>
                  </div>
                </div>

                {/* Initial Assessment & Recommended Path */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/40 border border-white/60 rounded-2xl p-4 space-y-1 shadow-sm">
                    <h4 className="font-black text-xs uppercase tracking-wider text-[#032038]/70">Assessment Score</h4>
                    {learnerDetails.learner.assessment_score != null ? (
                      <div className="text-2xl font-black text-[#055f9e]">
                        {learnerDetails.learner.assessment_score}%
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-amber-900">Not taken yet</div>
                    )}
                  </div>

                  <div className="bg-white/40 border border-white/60 rounded-2xl p-4 space-y-1 shadow-sm">
                    <h4 className="font-black text-xs uppercase tracking-wider text-[#032038]/70">Current Course Path</h4>
                    <div className="text-sm font-black text-[#032038]">
                      {learnerDetails.learner.current_path || 'Basic Multilingual Literacy Path'}
                    </div>
                  </div>
                </div>

                {/* Course History & Lesson Progress */}
                <div className="space-y-3">
                  <h3 className="font-black text-sm uppercase tracking-wider text-[#032038] flex items-center gap-2">
                    <BookOpenCheck size={18} className="text-[#0b6fb8]" /> Lesson Progress History
                  </h3>

                  {learnerDetails.lessonProgress.length === 0 ? (
                    <div className="text-xs font-bold text-[#032038]/60 py-6 text-center bg-white/30 rounded-2xl border border-white/40">
                      No lessons completed yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white/60 bg-white/30 shadow-inner">
                      <table className="w-full text-left text-xs font-bold">
                        <thead>
                          <tr className="border-b border-black/10 bg-white/40 text-[10px] font-black uppercase text-[#032038]/60">
                            <th className="py-2.5 px-3">Course</th>
                            <th className="py-2.5 px-3">Lesson</th>
                            <th className="py-2.5 px-3 text-right">Score</th>
                            <th className="py-2.5 px-3 text-right">Correct</th>
                            <th className="py-2.5 px-3 text-right">Completed On</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                          {learnerDetails.lessonProgress.map((lp, idx) => (
                            <tr key={idx} className="hover:bg-white/40 transition">
                              <td className="py-2.5 px-3 font-mono text-[11px]">{lp.course_id || 'course_1'}</td>
                              <td className="py-2.5 px-3 font-black">Lesson {Number(lp.lesson_id) + 1}</td>
                              <td className="py-2.5 px-3 text-right font-black text-[#055f9e]">{lp.score}%</td>
                              <td className="py-2.5 px-3 text-right font-mono">{lp.correct_count} / {lp.total_questions}</td>
                              <td className="py-2.5 px-3 text-right font-mono text-[10px] text-[#032038]/70">
                                {new Date(lp.completed_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="p-4 rounded-2xl bg-white/40 border border-white/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs font-bold text-[#032038]">
                    <span className="font-black">Helpful Actions:</span> Send a friendly reminder or assign extra practice lessons to this learner.
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleSendReminder}
                      className="btn-ghost text-xs py-2 px-3 font-black flex items-center gap-1.5 rounded-xl border border-black/10 hover:bg-white/70"
                    >
                      <Send size={13} className="text-[#0b6fb8]" /> Send Reminder
                    </button>
                    <button
                      type="button"
                      onClick={handleAssignPractice}
                      className="btn-primary text-xs py-2 px-3 font-black flex items-center gap-1.5 rounded-xl shadow-sm"
                    >
                      <BookOpen size={13} /> Assign Practice
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
