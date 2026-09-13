const colors = {
  primary: '#6C63FF',
  secondary: '#4ECDC4',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  surface: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
};

const variants = {
  primary: {
    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
    color: colors.text,
    border: 'none',
    boxShadow: `0 4px 15px ${colors.primary}40`,
  },
  secondary: {
    background: colors.surface,
    color: colors.text,
    border: `1px solid ${colors.glassBorder}`,
  },
  ghost: {
    background: 'transparent',
    color: colors.text,
    border: 'none',
  },
  danger: {
    background: `linear-gradient(135deg, ${colors.error}, #ff6b6b)`,
    color: colors.text,
    border: 'none',
    boxShadow: `0 4px 15px ${colors.error}40`,
  },
  success: {
    background: `linear-gradient(135deg, ${colors.success}, #66d98e)`,
    color: colors.text,
    border: 'none',
    boxShadow: `0 4px 15px ${colors.success}40`,
  },
  warning: {
    background: `linear-gradient(135deg, ${colors.warning}, #ffb340)`,
    color: colors.text,
    border: 'none',
    boxShadow: `0 4px 15px ${colors.warning}40`,
  },
};

const sizes = {
  sm: { padding: '6px 12px', fontSize: '12px', borderRadius: '6px', gap: '4px' },
  md: { padding: '10px 20px', fontSize: '14px', borderRadius: '8px', gap: '8px' },
  lg: { padding: '14px 28px', fontSize: '16px', borderRadius: '10px', gap: '10px' },
  xl: { padding: '18px 36px', fontSize: '18px', borderRadius: '12px', gap: '12px' },
};

let buttonStylesInjected = false;
function injectButtonStyles() {
  if (buttonStylesInjected) return;
  const style = document.createElement('style');
  style.textContent = `@keyframes button-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
  buttonStylesInjected = true;
}

function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  style = {},
  ...props
}) {
  injectButtonStyles();

  const variantStyle = variants[variant] || variants.primary;
  const sizeStyle = sizes[size] || sizes.md;

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    position: 'relative',
    overflow: 'hidden',
    outline: 'none',
    ...variantStyle,
    ...sizeStyle,
    ...style,
  };

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  const spinnerStyle = {
    width: size === 'sm' ? '12px' : size === 'lg' || size === 'xl' ? '20px' : '16px',
    height: size === 'sm' ? '12px' : size === 'lg' || size === 'xl' ? '20px' : '16px',
    border: '2px solid transparent',
    borderTopColor: 'currentColor',
    borderRadius: '50%',
    animation: 'button-spin 0.8s linear infinite',
    flexShrink: 0,
  };

  const iconStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
  };

  return (
    <button
      type={type}
      className={className}
      style={buttonStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      tabIndex={disabled ? -1 : 0}
      {...props}
    >
      {loading && <span style={spinnerStyle} aria-hidden="true" />}
      {!loading && icon && iconPosition === 'left' && (
        <span style={iconStyle}>{icon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && icon && iconPosition === 'right' && (
        <span style={iconStyle}>{icon}</span>
      )}
    </button>
  );
}

export default Button;
