import C from './colors';

const variantStyles = {
  primary: { background: `${C.primary}20`, color: C.primary, border: `1px solid ${C.primary}35` },
  secondary: { background: `${C.secondary}20`, color: C.secondary, border: `1px solid ${C.secondary}35` },
  success: { background: `${C.success}20`, color: C.success, border: `1px solid ${C.success}35` },
  warning: { background: `${C.warning}20`, color: C.warning, border: `1px solid ${C.warning}35` },
  error: { background: `${C.error}20`, color: C.error, border: `1px solid ${C.error}35` },
  raga: { background: `${C.raga}20`, color: C.raga, border: `1px solid ${C.raga}35` },
  neutral: { background: C.surfaceTint, color: C.textSecondary, border: `1px solid ${C.glassBorder}` },
};

const sizes = {
  sm: { padding: '2px 8px', fontSize: '11px', borderRadius: '6px' },
  md: { padding: '4px 12px', fontSize: '12px', borderRadius: '8px' },
  lg: { padding: '6px 16px', fontSize: '14px', borderRadius: '10px' },
};

let badgeStylesInjected = false;
function injectBadgeStyles() {
  if (badgeStylesInjected) return;
  const style = document.createElement('style');
  style.textContent = `@keyframes badge-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`;
  document.head.appendChild(style);
  badgeStylesInjected = true;
}

function Badge({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  removable = false,
  onRemove,
  className = '',
  style = {},
  ...props
}) {
  if (dot) injectBadgeStyles();

  const variantStyle = variantStyles[variant] || variantStyles.primary;
  const sizeStyle = sizes[size] || sizes.md;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontWeight: 600, lineHeight: 1, whiteSpace: 'nowrap', transition: 'all 0.2s ease',
        ...variantStyle, ...sizeStyle, ...style,
      }}
      {...props}
    >
      {dot && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', flexShrink: 0, animation: 'badge-pulse 2s infinite' }} aria-hidden="true" />}
      {children}
      {removable && (
        <button
          style={{ background: 'transparent', border: 'none', color: 'currentColor', cursor: 'pointer', padding: 0, marginLeft: '2px', fontSize: '14px', lineHeight: 1, opacity: 0.6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={onRemove}
          aria-label="Remove badge"
        >
          ×
        </button>
      )}
    </span>
  );
}

export default Badge;
