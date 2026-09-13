import React, { useState } from 'react';

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

const sizes = {
  xs: { width: '28px', height: '28px', fontSize: '11px' },
  sm: { width: '36px', height: '36px', fontSize: '13px' },
  md: { width: '44px', height: '44px', fontSize: '15px' },
  lg: { width: '56px', height: '56px', fontSize: '18px' },
  xl: { width: '72px', height: '72px', fontSize: '22px' },
};

const statusColors = {
  online: colors.success,
  offline: colors.mutedText,
  busy: colors.error,
  away: colors.warning,
};

function Avatar({
  src,
  alt = '',
  name = '',
  size = 'md',
  status,
  shape = 'circle',
  bordered = false,
  onClick,
  className = '',
  style = {},
  ...props
}) {
  const [imgError, setImgError] = useState(false);

  const sizeStyle = sizes[size] || sizes.md;

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getGradient = (name) => {
    if (!name) return `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`;
    const gradients = [
      `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
      `linear-gradient(135deg, ${colors.secondary}, ${colors.neon})`,
      `linear-gradient(135deg, ${colors.neon}, ${colors.success})`,
      `linear-gradient(135deg, ${colors.warning}, ${colors.error})`,
      `linear-gradient(135deg, ${colors.error}, ${colors.primary})`,
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  const containerStyle = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeStyle.width,
    height: sizeStyle.height,
    borderRadius: shape === 'circle' ? '50%' : shape === 'square' ? '12px' : '16px',
    overflow: 'hidden',
    flexShrink: 0,
    cursor: onClick ? 'pointer' : 'default',
    border: bordered ? `2px solid ${colors.glassBorder}` : 'none',
    transition: 'all 0.2s ease',
    ...style,
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: 'inherit',
  };

  const initialsStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: getGradient(name),
    color: colors.text,
    fontSize: sizeStyle.fontSize,
    fontWeight: 700,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    borderRadius: 'inherit',
  };

  const statusStyle = {
    position: 'absolute',
    bottom: '0',
    right: '0',
    width: size === 'xs' || size === 'sm' ? '10px' : '12px',
    height: size === 'xs' || size === 'sm' ? '10px' : '12px',
    borderRadius: '50%',
    background: statusColors[status] || colors.mutedText,
    border: `2px solid ${colors.background}`,
    boxShadow: `0 0 0 1px ${colors.glassBorder}`,
  };

  const hoverStyle = onClick ? {
    transform: 'scale(1.05)',
  } : {};

  return (
    <div
      className={className}
      style={containerStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          Object.assign(e.currentTarget.style, hoverStyle);
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
      role={onClick ? 'button' : 'img'}
      aria-label={alt || name || 'Avatar'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      } : undefined}
      {...props}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt || name}
          style={imageStyle}
          onError={() => setImgError(true)}
        />
      ) : (
        <div style={initialsStyle}>{getInitials(name)}</div>
      )}
      {status && <div style={statusStyle} aria-label={`Status: ${status}`} />}
    </div>
  );
}

export default Avatar;