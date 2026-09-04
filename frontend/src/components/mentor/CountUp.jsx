import { useState, useEffect } from 'react';

/**
 * Smooth numerical count-up animation component.
 * Animates from 0 (or start) to end value with customizable duration.
 */
export default function CountUp({ end, start = 0, duration = 900, suffix = '', prefix = '', decimals = 0 }) {
  const [count, setCount] = useState(start);

  useEffect(() => {
    const endVal = Number(end);
    if (isNaN(endVal)) {
      setCount(end);
      return;
    }

    let startTime = null;
    let animationFrameId;

    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const current = start + (endVal - start) * easedProgress;

      setCount(decimals > 0 ? current.toFixed(decimals) : Math.round(current));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCount(decimals > 0 ? endVal.toFixed(decimals) : endVal);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [end, start, duration, decimals]);

  if (typeof end === 'string' && isNaN(Number(end))) {
    return <span>{end}</span>;
  }

  return (
    <span>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}
