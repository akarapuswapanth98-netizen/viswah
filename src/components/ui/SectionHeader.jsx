import React from 'react';

const colors = {
  primary: '#6C63FF',
  secondary: '#4ECDC4',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  neon: '#00FF88',
  background: '#0F0F23',
  surface: 'rgba(255,255,255,0.08)',
  glass: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
  secondaryText: '#B0B0CC',
  mutedText: '#6B6B8D',
};

function SectionHeader({
  title,
  subtitle,
  action,
  actionLabel,
  onAction,
  icon,
  divider = true,
  className = '',
  style = {},
  ...props
}) {
  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: divider ? '20px' : '0',
    paddingBottom: divider ? '16px' : '0',
    borderBottom: divider ? `1px solid ${colors.glassBorder}` : 'none',
    ...style,
  };

  const leftStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    minWidth: 0,
  };

  const iconStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}20)`,
    border: `1px solid ${colors.glassBorder}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    flexShrink: 0,
    color: colors.primary,
  };

  const textContainerStyle = {
    minWidth: 0,
  };

  const titleStyle = {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    color: colors.text,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const subtitleStyle = {
    margin: '4px 0 0',
    fontSize: '13px',
    color: colors.mutedText,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const actionButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: colors.surface,
    color: colors.text,
    border: `1px solid ${colors.glassBorder}`,
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };

  return (
    <div
      className={className}
      style={containerStyle}
      {...props}
    >
      <div style={leftStyle}>
        {icon && <div style={iconStyle}>{icon}</div>}
        <div style={textContainerStyle}>
          <h2 style={titleStyle}>{title}</h2>
          {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
        </div>
      </div>
      {(action || actionLabel) && (
        <button
          style={actionButtonStyle}
          onClick={onAction || action}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              (onAction || action)?.();
            }
          }}
          onMouseEnter={(e) => {
            e.target.style.background = `${colors.surface}cc`;
            e.target.style.borderColor = `${colors.primary}60`;
          }}
          onMouseLeave={(e) => {
            e.target.style.background = colors.surface;
            e.target.style.borderColor = colors.glassBorder;
          }}
        >
          {actionLabel || 'View All'}
        </button>
      )}
    </div>
  );
}

export default SectionHeader;