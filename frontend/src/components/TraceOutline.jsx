import { useLayoutEffect, useRef, useState } from 'react';

const FONT_FAMILY = '"Noto Sans", "Noto Sans Tamil", "Noto Sans Telugu", "Noto Sans Devanagari", "Noto Sans Kannada", "Noto Sans Malayalam", sans-serif';

/** Fit the whole shaped word, including script marks, inside the drawing area. */
export default function TraceOutline({ text }) {
  const frameRef = useRef(null);
  const [fontSize, setFontSize] = useState(1);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const context = document.createElement('canvas').getContext('2d');
    let active = true;
    function fit() {
      if (!active || !frame || !context) return;
      context.font = `900 100px ${FONT_FAMILY}`;
      const metrics = context.measureText(text);
      const textWidth = Math.max(metrics.width, metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight, 1);
      const width = Math.max(1, frame.clientWidth - 32);
      const height = Math.max(1, frame.clientHeight - 32);
      setFontSize(Math.floor(Math.min(200, width * 100 / textWidth, height / 1.5)));
    }
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    document.fonts?.ready.then(fit);
    document.fonts?.addEventListener('loadingdone', fit);
    return () => {
      active = false;
      observer.disconnect();
      document.fonts?.removeEventListener('loadingdone', fit);
    };
  }, [text]);

  return (
    <div ref={frameRef} className="trace-outline absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
      <span data-testid="trace-outline-text" style={{ fontFamily: FONT_FAMILY, fontSize, fontWeight: 900, lineHeight: 1.5, whiteSpace: 'nowrap', color: 'transparent', WebkitTextFillColor: 'transparent', WebkitTextStroke: '2px rgba(100, 116, 139, .65)' }}>{text}</span>
    </div>
  );
}
