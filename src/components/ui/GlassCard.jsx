import React from 'react';
import C from './colors';

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
    background: C.surfaceGlass,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${C.glassBorder}`,
    borderRadius,
    padding,
    color: C.text,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: clickable ? 'pointer' : 'default',
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const hoverStyle = hoverable && isHovered ? {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 32px rgba(232, 168, 56, 0.1)`,
    border: `1px solid ${C.primary}35`,
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
