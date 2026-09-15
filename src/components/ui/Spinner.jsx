import C from './colors';

let spinnerStylesInjected = false;
function injectSpinnerStyles() {
  if (spinnerStylesInjected) return;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spinner-rotate { 100% { transform: rotate(360deg); } }
    @keyframes spinner-dash { 0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; } 50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; } 100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; } }
    @keyframes spinner-fade { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  `;
  document.head.appendChild(style);
  spinnerStylesInjected = true;
}

function Spinner({
  size = 32,
  variant = 'circular',
  color = C.primary,
  label = 'Loading',
  className = '',
  style = {},
  ...props
}) {
  injectSpinnerStyles();

  const containerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div style={{ display: 'flex', gap: `${size * 0.2}px`, alignItems: 'center', justifyContent: 'center' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: `${size * 0.25}px`, height: `${size * 0.25}px`,
                borderRadius: '50%', background: color,
                animation: 'spinner-fade 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }} />
            ))}
          </div>
        );
      case 'pulse':
        return <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: color, animation: 'spinner-fade 1.4s ease-in-out infinite' }} />;
      case 'bars':
        return (
          <div style={{ display: 'flex', gap: `${size * 0.1}px`, alignItems: 'center', justifyContent: 'center', height: `${size}px` }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                width: `${size * 0.12}px`, height: `${(Math.sin((i * Math.PI) / 4) * 50 + 50)}%`,
                background: color, borderRadius: `${size * 0.06}px`,
                animation: 'spinner-fade 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`,
              }} />
            ))}
          </div>
        );
      default:
        return (
          <svg style={{ width: `${size}px`, height: `${size}px`, animation: 'spinner-rotate 1.4s linear infinite' }} viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke={C.glassBorder} strokeWidth="4" />
            <circle cx="25" cy="25" r="20" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" style={{ animation: 'spinner-dash 1.4s ease-in-out infinite' }} />
          </svg>
        );
    }
  };

  return (
    <div className={className} style={containerStyle} role="status" aria-label={label} {...props}>
      {renderSpinner()}
      <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>{label}</span>
    </div>
  );
}

export default Spinner;
