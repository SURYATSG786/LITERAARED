import { motion } from 'motion/react';

export function StatCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-4 border border-white/50 animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl bg-white/40" />
        <div className="w-16 h-5 rounded-md bg-white/30" />
      </div>
      <div className="space-y-1.5">
        <div className="w-20 h-7 rounded-lg bg-white/50" />
        <div className="w-24 h-3.5 rounded bg-white/30" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="glass-card rounded-3xl p-6 border border-white/60 space-y-4 animate-pulse">
      <div className="flex justify-between items-center pb-4 border-b border-white/30">
        <div className="w-48 h-7 bg-white/50 rounded-xl" />
        <div className="w-32 h-6 bg-white/30 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center gap-4 py-2.5 px-3 bg-white/20 rounded-xl">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-4 bg-white/40 rounded"
                style={{ width: `${Math.max(12, 100 / cols - 2)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass-card rounded-3xl p-6 border border-white/60 animate-pulse space-y-4">
      <div className="flex justify-between items-center">
        <div className="w-40 h-6 bg-white/50 rounded-lg" />
        <div className="w-20 h-5 bg-white/30 rounded-md" />
      </div>
      <div className="h-64 w-full bg-white/20 rounded-2xl flex items-end justify-between p-6 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="w-full bg-white/40 rounded-t-xl"
            style={{ height: `${30 + (i * 12) % 65}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/60 animate-pulse space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="w-32 h-5 bg-white/40 rounded-full" />
          <div className="w-64 h-9 bg-white/60 rounded-xl" />
          <div className="w-96 h-4 bg-white/30 rounded" />
        </div>
        <div className="w-16 h-16 bg-white/40 rounded-2xl" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-white/30">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 bg-white/25 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
