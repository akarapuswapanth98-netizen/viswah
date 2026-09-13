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

function GlassCard({
  children,
  padding = '24px',
  borderRadius = '16px',
  hoverable = false,
  clickable = false,
  onClick,
  className = '',
  style = {},
  ...props
}) {
  const cardStyle = {
    background: colors.glass,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${colors.glassBorder}`,
    borderRadius,
    padding,
    color: colors.text,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: clickable ? 'pointer' : 'default',
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const hoverStyle = hoverable && isHovered ? {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 32px rgba(108, 99, 255, 0.15)',
    border: `1px solid ${colors.primary}40`,
  } : {};

  const clickStyle = clickable ? {
    cursor: 'pointer',
  } : {};

  return (
    <div
      className={className}
      style={{ ...cardStyle, ...hoverStyle, ...clickStyle }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e);
        }
      } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

export default GlassCard;