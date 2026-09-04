import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownRight, Minus, AlertCircle } from 'lucide-react';
import CountUp from '../mentor/CountUp';

export default function StatTile({
  title,
  value = 0,
  unit = '',
  icon: Icon,
  trend = 0,
  trendDirection = 'neutral',
  comparisonText = 'vs 7d ago',
  subtext = '',
  tone = 'blue', // 'blue' | 'green' | 'gold' | 'red'
  isWarning = false,
  loading = false,
  onClick,
}) {
  const toneClasses = {
    blue: 'stat-blue',
    green: 'stat-green',
    gold: 'stat-gold',
    red: 'stat-red',
  };

  const iconTones = {
    blue: 'bg-[#0b6fb8]/20 text-[#042e4c] border-[#0b6fb8]/30',
    green: 'bg-[#2e9e44]/20 text-[#0f4a1f] border-[#2e9e44]/30',
    gold: 'bg-[#ffb300]/25 text-[#664000] border-[#ffb300]/40',
    red: 'bg-[#d64545]/20 text-[#661818] border-[#d64545]/30',
  };

  const isUp = trendDirection === 'up' || (typeof trend === 'number' && trend > 0);
  const isDown = trendDirection === 'down' || (typeof trend === 'number' && trend < 0);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015, transition: { duration: 0.15 } }}
      onClick={onClick}
      className={`glass-card rounded-2xl p-5 shadow-lg border transition-all ${
        toneClasses[tone] || toneClasses.blue
      } ${
        isWarning
          ? 'border-amber-400/80 ring-2 ring-amber-400/40 shadow-amber-500/10'
          : ''
      } ${onClick ? 'cursor-pointer hover:shadow-xl' : ''}`}
    >
      <div className="flex flex-col justify-between h-full gap-3.5">
        {/* Top Row: Label on Left, Icon on Right */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wide opacity-85 block">
              {title}
            </span>
            {isWarning && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/25 text-[#664000] border border-amber-400/50 text-[10px] font-black uppercase tracking-wider">
                <AlertCircle size={10} className="text-amber-700" />
                Attention
              </span>
            )}
          </div>

          {Icon && (
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs transition-transform duration-300 shrink-0 ${
                iconTones[tone] || iconTones.blue
              }`}
            >
              <Icon size={18} />
            </div>
          )}
        </div>

        {/* Primary Focal Point: Bold Number */}
        <div className="flex items-baseline gap-1 my-0.5">
          {loading ? (
            <div className="h-10 w-24 rounded-xl bg-white/40 animate-pulse my-0.5" />
          ) : (
            <div className="display text-3xl sm:text-4xl lg:text-5xl font-black text-[#032038] tracking-tight leading-none flex items-baseline">
              <CountUp end={value} duration={900} suffix={unit} />
            </div>
          )}
        </div>

        {/* Bottom Row: Trend + Comparison Text + Secondary Metric */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/40 text-[11px] font-bold">
          <div className="flex items-center gap-1.5 shrink-0">
            {loading ? (
              <div className="h-4 w-16 rounded-md bg-white/30 animate-pulse" />
            ) : isUp ? (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/20 text-[#0f4a1f] border border-emerald-400/40 px-1.5 py-0.5 font-extrabold shadow-xs">
                <ArrowUpRight size={13} className="text-[#0f4a1f]" />
                <span>+{Math.abs(trend)}%</span>
              </span>
            ) : isDown ? (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-red-500/20 text-[#661818] border border-red-400/40 px-1.5 py-0.5 font-extrabold shadow-xs">
                <ArrowDownRight size={13} className="text-[#661818]" />
                <span>{trend}%</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-white/40 text-[#032038]/70 border border-white/50 px-1.5 py-0.5 font-extrabold">
                <Minus size={11} />
                <span>0%</span>
              </span>
            )}
            <span className="text-[#032038]/65 font-bold text-[10.5px]">
              {comparisonText}
            </span>
          </div>

          {subtext && (
            <div className="text-right truncate min-w-0">
              <span
                className={`truncate font-extrabold text-[11px] ${
                  isWarning
                    ? 'text-amber-900 font-black'
                    : 'text-[#032038]/75'
                }`}
                title={subtext}
              >
                {subtext}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
