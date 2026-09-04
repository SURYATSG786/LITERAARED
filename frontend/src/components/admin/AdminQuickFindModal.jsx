import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, User, ArrowRight, BookOpen, Flame, GraduationCap } from 'lucide-react';
import api from '../../api/client';

export default function AdminQuickFindModal({ isOpen, onClose, onSelectLearner }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    const timer = setTimeout(() => {
      api
        .quickFindLearners(query.trim())
        .then((res) => {
          if (active) {
            setResults(res.results || []);
            setSelectedIndex(0);
            setLoading(false);
          }
        })
        .catch(() => {
          if (active) {
            setResults([]);
            setLoading(false);
          }
        });
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      onSelectLearner(results[selectedIndex].id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex items-start justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#032038]/50 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-2xl rounded-3xl glass-strong border border-white/80 shadow-2xl bg-white/95 text-[#032038] overflow-hidden z-10"
        >
          {/* Search Header Bar */}
          <div className="p-4 border-b border-white/60 flex items-center gap-3 bg-white/60">
            <Search size={20} className="text-[#055f9e] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              id="admin-quick-find-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search learner by name, email, or language..."
              className="w-full text-sm font-bold bg-transparent text-[#032038] placeholder-[#032038]/50 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="w-6 h-6 rounded-lg bg-white/60 flex items-center justify-center text-[#032038]/70 hover:text-[#032038]"
              >
                <X size={14} />
              </button>
            )}
            <kbd className="hidden sm:inline-block rounded bg-white/70 px-2 py-0.5 text-[10px] font-mono font-bold text-[#032038]/70 border border-white/80">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-96 overflow-y-auto p-2">
            {loading ? (
              <div className="p-8 text-center text-xs font-bold text-[#032038]/60 space-y-2">
                <div className="w-6 h-6 border-2 border-[#055f9e]/30 border-t-[#055f9e] rounded-full animate-spin mx-auto" />
                <p>Searching SQLite database...</p>
              </div>
            ) : query && results.length === 0 ? (
              <div className="p-8 text-center text-[#032038]/60 space-y-1">
                <User size={28} className="mx-auto text-[#032038]/30 mb-1" />
                <p className="text-xs font-black text-[#032038]">No learners found</p>
                <p className="text-[11px] font-semibold">No records match &quot;{query}&quot;</p>
              </div>
            ) : !query ? (
              <div className="p-8 text-center text-[#032038]/50 text-xs font-semibold">
                Type a name or email to search learners across the entire platform.
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((learner, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={learner.id}
                      type="button"
                      onClick={() => {
                        onSelectLearner(learner.id);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl transition cursor-pointer text-left ${
                        isSelected
                          ? 'bg-[#055f9e]/10 border border-[#055f9e]/30 shadow-xs'
                          : 'hover:bg-white/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#055f9e]/15 text-[#055f9e] flex items-center justify-center font-black text-xs shrink-0">
                          {learner.name ? learner.name.charAt(0).toUpperCase() : 'L'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-xs sm:text-sm text-[#032038] truncate">
                            {learner.name}
                          </p>
                          <p className="text-[11px] font-bold text-[#032038]/60 truncate">
                            {learner.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {learner.assessment_score != null ? (
                          <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-950 border border-emerald-400/40">
                            Score: {learner.assessment_score}%
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-500/15 text-gray-800">
                            Unassessed
                          </span>
                        )}
                        <ArrowRight size={14} className={isSelected ? 'text-[#055f9e]' : 'text-[#032038]/30'} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="p-3 border-t border-white/60 bg-white/40 flex items-center justify-between text-[11px] font-bold text-[#032038]/60">
            <span>Use ↑ and ↓ to navigate</span>
            <span>Press Enter to select</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
