import C from './colors';

let errorStylesInjected = false;
function injectErrorStyles() {
  if (errorStylesInjected) return;
  const style = document.createElement('style');
  style.textContent = `@keyframes error-glow { 0%, 100% { box-shadow: 0 0 20px ${C.error}20; } 50% { box-shadow: 0 0 30px ${C.error}40; } }`;
  document.head.appendChild(style);
  errorStylesInjected = true;
}

function ErrorState({
  icon,
  title = 'Something went wrong',
  description,
  error,
  onRetry,
  retryLabel = 'Try Again',
  compact = false,
  className = '',
  style = {},
  ...props
}) {
  injectErrorStyles();

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: compact ? '32px 24px' : '60px 24px', textAlign: 'center', ...style }} role="alert" {...props}>
      <div style={{
        width: compact ? '64px' : '80px', height: compact ? '64px' : '80px', borderRadius: '20px',
        background: `${C.error}15`, border: `1px solid ${C.error}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px',
        animation: 'error-glow 2s ease-in-out infinite', fontSize: compact ? '28px' : '36px', color: C.error,
      }}>{icon || '⚠'}</div>
      <h3 style={{ margin: 0, marginBottom: '8px', fontSize: compact ? '16px' : '18px', fontWeight: 700, color: C.text, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{title}</h3>
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: C.textMuted, maxWidth: '400px', lineHeight: 1.6 }}>
        {description || 'An unexpected error occurred. Please try again.'}
      </p>
      {onRetry && (
        <button
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: `linear-gradient(135deg, ${C.error}, #ff6b6b)`, color: C.ink, border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: `0 4px 15px ${C.error}25` }}
          onClick={onRetry}
        >
          <span aria-hidden="true">↻</span>
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export default ErrorState;
