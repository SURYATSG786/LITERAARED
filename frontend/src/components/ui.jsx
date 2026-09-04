import { motion } from 'motion/react';
import { getLessonImage } from './LessonImages';

export function ProgressBar({ value, max = 100, label }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="progress-track">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </div>
    </div>
  );
}

export function StatChip({ icon: Icon, label, value, tone = 'green', onClick }) {
  const tones = {
    green: 'stat-green',
    blue: 'stat-blue',
    gold: 'stat-gold',
    red: 'stat-red',
  };
  return (
    <motion.div
      className={`glass-card rounded-2xl p-3.5 sm:p-4 border-2 shadow-md ${tones[tone]} ${onClick ? 'cursor-pointer' : ''}`}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
      onClick={onClick}
    >
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider opacity-90 truncate">
        {Icon ? <Icon size={15} className="shrink-0" /> : null}
        <span className="truncate">{label}</span>
      </div>
      <div className="display text-base sm:text-lg md:text-xl font-extrabold truncate text-[#032038]" title={String(value)}>
        {value}
      </div>
    </motion.div>
  );
}

export function PageTitle({ eyebrow, title, subtitle }) {
  return (
    <motion.div
      className="mb-3 sm:mb-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {eyebrow ? (
        <div className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#055f9e]">{eyebrow}</div>
      ) : null}
      <h1 className="display text-2xl font-black text-[#032038] sm:text-3xl md:text-4xl leading-tight">{title}</h1>
      {subtitle ? <p className="mt-1 max-w-3xl text-xs font-bold text-[#032038]/75 sm:text-sm">{subtitle}</p> : null}
    </motion.div>
  );
}

/** Image only — no description / prompt text */
export function LessonArt({ lessonId, title }) {
  const Art = getLessonImage(lessonId);
  return (
    <motion.div
      className="glass-card relative overflow-hidden rounded-[28px] p-2.5 border-2 border-[#032038]/20 shadow-md"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45 }}
      aria-label={title}
    >
      <div className="lesson-art-frame floaty overflow-hidden rounded-[22px] border border-white/60">
        <Art />
      </div>
    </motion.div>
  );
}

export function FeedbackBanner({ correct, explanation, t }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-4 rounded-2xl border-2 px-4 py-3 font-bold backdrop-blur-xl shadow-md ${
        correct ? 'banner-ok' : 'banner-err'
      }`}
      role="status"
    >
      <div className="text-lg font-black">{correct ? t('correct') : t('incorrect')}</div>
      <div className="mt-1 text-sm font-bold opacity-95">{t('explanation')}: {explanation}</div>
    </motion.div>
  );
}
