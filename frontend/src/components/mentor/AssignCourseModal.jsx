import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, User, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import { useToast } from './Toast';

export default function AssignCourseModal({
  isOpen,
  onClose,
  learners = [],
  defaultLearnerId = null,
  onCourseAssigned,
}) {
  const { showToast } = useToast();
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('course_1');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const courses = [
    { id: 'course_1', title: 'Foundational Literacy Path (Letters & Sounds)' },
    { id: 'course_2', title: 'Intermediate Words & Sentence Construction' },
    { id: 'course_3', title: 'Advanced Fluency & Paragraph Reading' },
    { id: 'course_4', title: 'Multilingual Conversational Literacy' },
  ];

  useEffect(() => {
    if (defaultLearnerId) {
      setSelectedLearnerId(defaultLearnerId);
    } else if (learners.length > 0 && !selectedLearnerId) {
      setSelectedLearnerId(learners[0].id);
    }
  }, [learners, defaultLearnerId, selectedLearnerId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLearnerId || !selectedCourseId) return;
    setError('');
    setSubmitting(true);
    try {
      await api.assignCourseToLearner(selectedLearnerId, selectedCourseId);
      const learner = learners.find((l) => l.id === selectedLearnerId);
      showToast(`Assigned course to ${learner?.name || 'Learner'}`, 'success');
      if (onCourseAssigned) onCourseAssigned();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to assign course');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-[#032038]/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          className="relative z-10 w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-white/80 space-y-6"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
        >
          <div className="flex items-center justify-between border-b border-black/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-purple-500/15 text-purple-700">
                <BookOpen size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#032038]">Assign Course</h3>
                <p className="text-xs font-bold text-[#032038]/60">Choose a course for your learner</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 text-[#032038]/60 hover:text-[#032038] transition"
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 text-xs font-black">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-[#032038] uppercase tracking-wider mb-1.5">
                Select Learner *
              </label>
              <select
                value={selectedLearnerId}
                onChange={(e) => setSelectedLearnerId(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-2xl border border-black/10 bg-slate-50 text-xs font-black text-[#032038] outline-none"
              >
                {learners.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.email}) · Progress: {l.progressPercent}%
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-[#032038] uppercase tracking-wider mb-1.5">
                Select Course *
              </label>
              <div className="space-y-2">
                {courses.map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                      selectedCourseId === c.id
                        ? 'border-[#0b6fb8] bg-[#0b6fb8]/5 shadow-sm'
                        : 'border-black/5 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="courseId"
                        value={c.id}
                        checked={selectedCourseId === c.id}
                        onChange={() => setSelectedCourseId(c.id)}
                        className="text-[#0b6fb8] focus:ring-0"
                      />
                      <span className="text-xs font-black text-[#032038]">{c.title}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-black/5">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl text-xs font-black text-[#032038]/70 hover:bg-black/5 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-xs py-2.5 px-6 font-black shadow-md hover:scale-105 transition disabled:opacity-50"
              >
                {submitting ? 'Assigning…' : 'Assign Course'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
