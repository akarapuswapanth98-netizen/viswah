const colors = {
  primary: '#6C63FF',
  secondary: '#4ECDC4',
  surface: 'rgba(255,255,255,0.08)',
  glass: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
  mutedText: '#6B6B8D',
};

let emptyStylesInjected = false;
function injectEmptyStyles() {
  if (emptyStylesInjected) return;
  const style = document.createElement('style');
  style.textContent = `@keyframes empty-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }`;
  document.head.appendChild(style);
  emptyStylesInjected = true;
}

function EmptyState({
  icon,
  title = 'No data found',
  description,
  action,
  actionLabel,
  onAction,
  compact = false,
  className = '',
  style = {},
  ...props
}) {
  injectEmptyStyles();

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: compact ? '32px 24px' : '60px 24px', textAlign: 'center', ...style }}
      role="status"
      {...props}
    >
      {icon && (
        <div style={{
          width: compact ? '64px' : '80px', height: compact ? '64px' : '80px', borderRadius: '20px',
          background: `linear-gradient(135deg, ${colors.surface}, ${colors.glass})`, border: `1px solid ${colors.glassBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px',
          animation: 'empty-float 3s ease-in-out infinite', fontSize: compact ? '28px' : '36px', color: colors.mutedText,
        }}>{icon}</div>
      )}
      <h3 style={{ margin: 0, marginBottom: '8px', fontSize: compact ? '16px' : '18px', fontWeight: 700, color: colors.text }}>{title}</h3>
      {description && <p style={{ margin: 0, marginBottom: action || actionLabel ? '24px' : '0', fontSize: '14px', color: colors.mutedText, maxWidth: '320px', lineHeight: 1.6 }}>{description}</p>}
      {(action || actionLabel) && (
        <button
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, color: colors.text, border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: `0 4px 15px ${colors.primary}40` }}
          onClick={onAction || action}
        >
          {actionLabel || 'Get Started'}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
