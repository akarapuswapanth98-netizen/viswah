const colors = {
  primary: '#6C63FF',
  secondary: '#4ECDC4',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  neon: '#00FF88',
  surface: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.12)',
  secondaryText: '#B0B0CC',
};

const variantStyles = {
  primary: { background: `${colors.primary}25`, color: colors.primary, border: `1px solid ${colors.primary}40` },
  secondary: { background: `${colors.secondary}25`, color: colors.secondary, border: `1px solid ${colors.secondary}40` },
  success: { background: `${colors.success}25`, color: colors.success, border: `1px solid ${colors.success}40` },
  warning: { background: `${colors.warning}25`, color: colors.warning, border: `1px solid ${colors.warning}40` },
  error: { background: `${colors.error}25`, color: colors.error, border: `1px solid ${colors.error}40` },
  neon: { background: `${colors.neon}25`, color: colors.neon, border: `1px solid ${colors.neon}40` },
  neutral: { background: colors.surface, color: colors.secondaryText, border: `1px solid ${colors.glassBorder}` },
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
