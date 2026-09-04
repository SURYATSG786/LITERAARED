import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  LayoutDashboard,
  Users,
  ShieldAlert,
  Trophy,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Award,
  X,
  ArrowRight,
  User,
} from 'lucide-react';
import api from '../../api/client';
import LearnerProfileModal from '../LearnerProfileModal';

const MENTOR_PAGES = [
  { path: '/mentor-dashboard', title: 'Mentor Dashboard', icon: LayoutDashboard, category: 'Navigation' },
  { path: '/mentor/attention', title: 'Needs Attention', icon: ShieldAlert, category: 'Navigation' },
  { path: '/mentor/course-analytics', title: 'Course Progress', icon: BookOpen, category: 'Navigation' },
  { path: '/mentor/assessment-analytics', title: 'Assessment Reports', icon: GraduationCap, category: 'Navigation' },
];

export default function MentorGlobalSearch({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [learners, setLearners] = useState([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      api.getMentorDashboard()
        .then((data) => setLearners(data.learners || []))
        .catch(() => {});
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredPages = MENTOR_PAGES.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase())
  );

  const filteredLearners = learners
    .filter(
      (l) =>
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.email.toLowerCase().includes(query.toLowerCase()) ||
        l.learningLanguage.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 5);

  const handleSelectPage = (path) => {
    navigate(path);
    onClose();
  };

  const handleSelectLearner = (id) => {
    setSelectedLearnerId(id);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/60 backdrop-blur-md">
        <motion.div
          className="glass-card relative w-full max-w-2xl rounded-3xl p-6 shadow-2xl border-2 border-white/80 bg-gradient-to-br from-white/95 via-sky-50/95 to-white/95 text-[#032038] space-y-4"
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
        >
          {/* Search Input Bar */}
          <div className="flex items-center gap-3 border-b border-black/10 pb-4">
            <Search size={20} className="text-[#0b6fb8] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages or learner names (Esc to exit)…"
              className="w-full bg-transparent text-sm font-black text-[#032038] placeholder-[#032038]/40 focus:outline-none"
            />
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/5 text-[#032038]/70"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
            {/* Quick Navigation Section */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#032038]/50 px-2">
                Pages & Dashboards
              </span>
              <div className="space-y-1">
                {filteredPages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <button
                      key={page.path}
                      type="button"
                      onClick={() => handleSelectPage(page.path)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/40 hover:bg-[#0b6fb8]/15 border border-white/60 hover:border-[#0b6fb8]/40 text-left transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white/70 text-[#0b6fb8] shadow-sm group-hover:scale-110 transition">
                          <Icon size={16} />
                        </div>
                        <span className="text-xs font-black text-[#032038] group-hover:text-[#055f9e]">
                          {page.title}
                        </span>
                      </div>
                      <ArrowRight size={14} className="text-[#0b6fb8] opacity-0 group-hover:opacity-100 transition" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Learner Search Results */}
            {query.trim() && (
              <div className="space-y-1.5 pt-2 border-t border-black/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#032038]/50 px-2">
                  Matching Learners ({filteredLearners.length})
                </span>
                {filteredLearners.length === 0 ? (
                  <div className="text-xs font-bold text-[#032038]/60 p-3 bg-white/20 rounded-2xl text-center">
                    No learners match "{query}"
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredLearners.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => handleSelectLearner(l.id)}
                        className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/40 hover:bg-white/70 border border-white/60 text-left transition group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#0b6fb8]/15 text-[#0b6fb8] flex items-center justify-center font-black text-xs">
                            {l.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-black text-[#032038] group-hover:text-[#055f9e]">
                              {l.name}
                            </div>
                            <div className="text-[10px] font-semibold text-[#032038]/60">
                              {l.email} · {l.educationLevel} · {(l.league || 'bronze').toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase bg-[#0b6fb8]/15 text-[#0b6fb8] px-2.5 py-1 rounded-full">
                          View Profile
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[11px] font-bold text-[#032038]/50">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-black/10 font-mono text-[10px]">Esc</kbd> to close</span>
            <span>Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-black/10 font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-black/10 font-mono text-[10px]">K</kbd></span>
          </div>
        </motion.div>
      </div>

      <LearnerProfileModal learnerId={selectedLearnerId} onClose={() => setSelectedLearnerId(null)} />
    </>
  );
}
