import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle, RotateCcw, Award } from 'lucide-react';

export function PronunciationFeedback({ gradedResult, labels = {} }) {
  if (!gradedResult) return null;

  const isPassed = (gradedResult.score || 0) >= 70;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-2xl border-2 border-[#032038]/20 bg-white/85 p-2.5 sm:p-3 shadow-md space-y-2"
    >
      <div className="flex items-center justify-between border-b-2 border-[#032038]/10 pb-1.5">
        <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-black">
          {labels.pronunciationScore || 'Pronunciation Accuracy'}
        </span>
        <div className="flex items-center gap-1.5">
          {isPassed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-600" />
          )}
          <span className="display text-lg sm:text-xl font-black text-black">
            {gradedResult.score}%
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center">
        {(gradedResult.words || []).map((w, idx) => (
          <span
            key={idx}
            className={`rounded-lg px-2.5 py-0.5 text-xs font-black border ${
              w.correct
                ? 'bg-emerald-500/20 text-emerald-950 border-emerald-600/40'
                : 'bg-rose-500/20 text-rose-950 border-rose-600/40'
            }`}
          >
            {w.text}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export function PracticeSummaryCard({
  sentences = [],
  results = {},
  index = 0,
  setIndex,
  totalAttempted = 0,
  avgScore = 0,
  handleResetAll,
  labels = {},
}) {
  return (
    <div className="glass-card rounded-3xl p-4 sm:p-5 border-2 border-[#032038]/20 shadow-xl flex-1 flex flex-col justify-between h-full min-h-0">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between border-b-2 border-[#032038]/12 pb-2 mb-2 shrink-0">
          <span className="text-sm sm:text-base font-black text-black">{labels.practiceSummary || 'Practice Results'}</span>
          <span className="text-xs font-black bg-black/10 text-black px-2 py-0.5 rounded-full border border-black/20">
            {totalAttempted} / {sentences.length}
          </span>
        </div>

        <div className="text-center rounded-2xl bg-black/5 p-2.5 border-2 border-black/15 shadow-inner mb-2 shrink-0">
          <div className="display text-2xl font-black text-black">{avgScore}%</div>
          <div className="text-[11px] font-bold text-black mt-0.5">
            {labels.overallScore || 'Overall Score'} ({totalAttempted}/{sentences.length} {labels.completed || 'Done'})
          </div>
        </div>

        {totalAttempted >= sentences.length && sentences.length > 0 && (
          <div className="rounded-2xl bg-amber-500/20 p-2.5 border-2 border-amber-500/40 text-center space-y-1 mb-2 shrink-0 animate-in fade-in zoom-in duration-300">
            <div className="inline-flex items-center justify-center gap-1.5 text-xs font-black text-black">
              <Award size={16} className="text-amber-600 shrink-0" />
              <span>Voice Master Unlocked! 🏅</span>
            </div>
            <p className="text-[10px] font-bold text-black/80">
              Badge added to your dashboard permanently
            </p>
          </div>
        )}

        <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0 pr-1">
          {sentences.map((sent, i) => {
            const res = results[i];
            const isSelected = i === index;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setIndex && setIndex(i)}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${
                  isSelected
                    ? 'btn-primary text-[#3b2800] shadow-md !border-b-[3px]'
                    : 'bg-white/60 text-[#032038] border-2 border-[#032038]/15 hover:bg-white/90 hover:border-[#032038]/30'
                }`}
              >
                <span className="font-extrabold truncate max-w-[180px]">
                  {i + 1}. {sent}
                </span>
                <span
                  className={`font-black ml-2 px-1.5 py-0.5 rounded-md text-[11px] ${
                    isSelected
                      ? 'text-[#3b2800] bg-white/40 border border-amber-600/30'
                      : res
                      ? res.score >= 70
                        ? 'text-emerald-700 bg-emerald-100 border border-emerald-300'
                        : 'text-amber-800 bg-amber-100 border border-amber-300'
                      : 'text-[#032038]/40'
                  }`}
                >
                  {res ? `${res.score}%` : '—'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {totalAttempted > 0 ? (
        <button
          type="button"
          onClick={handleResetAll}
          className="btn-ghost mt-3 w-full flex items-center justify-center gap-2 py-2.5 text-xs font-black text-[#032038]/80 hover:text-[#032038] border border-[#032038]/20 rounded-xl cursor-pointer"
        >
          <RotateCcw size={14} />
          <span>{labels.tryAgain || 'Reset Practice'}</span>
        </button>
      ) : null}
    </div>
  );
}
