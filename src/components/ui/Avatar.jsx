import React, { useState } from 'react';
import C from './colors';

const sizes = {
  xs: { width: '28px', height: '28px', fontSize: '11px' },
  sm: { width: '36px', height: '36px', fontSize: '13px' },
  md: { width: '44px', height: '44px', fontSize: '15px' },
  lg: { width: '56px', height: '56px', fontSize: '18px' },
  xl: { width: '72px', height: '72px', fontSize: '22px' },
};

const statusColors = {
  online: C.success,
  offline: C.textMuted,
  busy: C.error,
  away: C.warning,
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
    if (!name) return `linear-gradient(135deg, ${C.primary}, ${C.primaryMuted})`;
    const gradients = [
      `linear-gradient(135deg, ${C.primary}, ${C.primaryMuted})`,
      `linear-gradient(135deg, ${C.secondary}, ${C.teal})`,
      `linear-gradient(135deg, ${C.raga}, ${C.primary})`,
      `linear-gradient(135deg, ${C.warning}, ${C.error})`,
      `linear-gradient(135deg, ${C.error}, ${C.primary})`,
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
    border: bordered ? `2px solid ${C.glassBorder}` : 'none',
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
    color: C.ink,
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
    background: statusColors[status] || C.textMuted,
    border: `2px solid ${C.ink}`,
    boxShadow: `0 0 0 1px ${C.glassBorder}`,
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
