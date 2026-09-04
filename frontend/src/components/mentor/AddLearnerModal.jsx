import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Mail, Lock, User, Globe, GraduationCap, CheckCircle } from 'lucide-react';
import api from '../../api/client';
import { useToast } from './Toast';

export default function AddLearnerModal({ isOpen, onClose, onLearnerAdded }) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [uiLanguage, setUiLanguage] = useState('en');
  const [learningLanguage, setLearningLanguage] = useState('en');
  const [educationLevel, setEducationLevel] = useState('Primary School');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.addLearnerDirect({
        name,
        email,
        password: password || 'Litera123!',
        uiLanguage,
        learningLanguage,
        educationLevel,
      });
      showToast(`Learner ${name} added successfully!`, 'success');
      if (onLearnerAdded) onLearnerAdded();
      onClose();
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Failed to add learner');
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
              <div className="p-3 rounded-2xl bg-[#0b6fb8]/15 text-[#0b6fb8]">
                <UserPlus size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#032038]">Add New Learner</h3>
                <p className="text-xs font-bold text-[#032038]/60">Add a new student to your class</p>
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
                Full Name *
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-3.5 text-[#032038]/40" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-black/10 bg-slate-50 focus:bg-white focus:border-[#0b6fb8] text-xs font-black text-[#032038] outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[#032038] uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-[#032038]/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. priya@literacy.org"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-black/10 bg-slate-50 focus:bg-white focus:border-[#0b6fb8] text-xs font-black text-[#032038] outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-[#032038] uppercase tracking-wider mb-1.5">
                  App Language
                </label>
                <select
                  value={uiLanguage}
                  onChange={(e) => setUiLanguage(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl border border-black/10 bg-slate-50 text-xs font-black text-[#032038] outline-none"
                >
                  <option value="en">English</option>
                  <option value="te">Telugu (తెలుగు)</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="kn">Kannada (ಕನ್ನಡ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-[#032038] uppercase tracking-wider mb-1.5">
                  Language to Learn
                </label>
                <select
                  value={learningLanguage}
                  onChange={(e) => setLearningLanguage(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl border border-black/10 bg-slate-50 text-xs font-black text-[#032038] outline-none"
                >
                  <option value="en">English</option>
                  <option value="te">Telugu (తెలుగు)</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="kn">Kannada (ಕನ್ನಡ)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[#032038] uppercase tracking-wider mb-1.5">
                Education Level
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-black/10 bg-slate-50 text-xs font-black text-[#032038] outline-none"
              >
                <option value="No Formal Education">No Formal Education</option>
                <option value="Primary School">Primary School</option>
                <option value="Middle School">Middle School</option>
                <option value="High School">High School</option>
              </select>
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
                {submitting ? 'Adding…' : 'Add Learner'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
