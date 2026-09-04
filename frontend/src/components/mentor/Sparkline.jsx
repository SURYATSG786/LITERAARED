import { useId } from 'react';

/**
 * Mini 7-day sparkline trend chart.
 * Renders a lightweight SVG path with gradient area fill.
 */
export default function Sparkline({
  data = [12, 14, 13, 17, 19, 21, 24],
  color = '#0b6fb8',
  width = 90,
  height = 28,
  trend = '+12%',
  showPill = true,
}) {
  const gradientId = useId();

  if (!data || data.length < 2) {
    data = [10, 12, 14, 15, 18, 20, 22];
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 3;
  const usableHeight = height - padding * 2;
  const usableWidth = width - padding * 2;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * usableWidth;
    const y = height - padding - ((val - min) / range) * usableHeight;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width - padding},${height} L ${padding},${height} Z`;

  return (
    <div className="flex items-center gap-1.5 shrink-0" title={`Last 7 days velocity (${trend})`}>
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gradientId})`} />
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End pulsing dot */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].split(',')[0]}
            cy={points[points.length - 1].split(',')[1]}
            r="2.5"
            fill={color}
            className="animate-pulse"
          />
        )}
      </svg>
      {showPill && trend && (
        <span className="text-[10px] font-black tracking-tight px-1.5 py-0.5 rounded-md bg-white/40 border border-white/60 text-[#032038] whitespace-nowrap">
          {trend}
        </span>
      )}
    </div>
  );
}
