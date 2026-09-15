import { useEffect, useState } from 'react';
import C from './colors';

let progressStylesInjected = false;
function injectProgressStyles() {
  if (progressStylesInjected) return;
  const style = document.createElement('style');
  style.textContent = `@keyframes progress-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }`;
  document.head.appendChild(style);
  progressStylesInjected = true;
}

function ProgressBar({
  value = 0,
  max = 100,
  height = '8px',
  variant = 'primary',
  showLabel = false,
  animated = true,
  striped = false,
  className = '',
  style = {},
  ...props
}) {
  injectProgressStyles();

  const [displayValue, setDisplayValue] = useState(0);
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayValue(percentage), 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(percentage);
    }
  }, [percentage, animated]);

  const gradientMap = {
    primary: `linear-gradient(90deg, ${C.primary}, ${C.primaryMuted})`,
    success: `linear-gradient(90deg, ${C.success}, #66d98e)`,
    warning: `linear-gradient(90deg, ${C.warning}, #ffb340)`,
    error: `linear-gradient(90deg, ${C.error}, #ff6b6b)`,
    raga: `linear-gradient(90deg, ${C.raga}, ${C.secondary})`,
    secondary: `linear-gradient(90deg, ${C.secondary}, ${C.primary})`,
  };

  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px', color: C.textSecondary }}>
          <span>Progress</span>
          <span style={{ color: C.text, fontWeight: 600 }}>{Math.round(displayValue)}%</span>
        </div>
      )}
      <div
        style={{ width: '100%', background: C.surfaceTint, borderRadius: height, overflow: 'hidden', position: 'relative', ...style }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`Progress: ${Math.round(percentage)}%`}
        {...props}
      >
        <div style={{
          height: '100%', borderRadius: height,
          background: gradientMap[variant] || gradientMap.primary,
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          width: `${displayValue}%`, position: 'relative', overflow: 'hidden',
          minWidth: displayValue > 0 ? '4px' : '0',
        }}>
          {striped && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', animation: animated ? 'progress-shimmer 2s infinite' : 'none' }} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;
