import React, { useState, useRef } from 'react';

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

function SearchBar({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder = 'Search...',
  icon,
  size = 'md',
  disabled = false,
  autoFocus = false,
  showClearButton = true,
  className = '',
  style = {},
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const sizes = {
    sm: { height: '36px', padding: '8px 12px', fontSize: '13px', iconSize: '14px' },
    md: { height: '44px', padding: '10px 16px', fontSize: '14px', iconSize: '16px' },
    lg: { height: '52px', padding: '12px 20px', fontSize: '16px', iconSize: '20px' },
  };

  const sizeStyle = sizes[size] || sizes.md;

  const containerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    ...style,
  };

  const inputContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: sizeStyle.height,
    padding: sizeStyle.padding,
    paddingLeft: icon ? sizeStyle.height : sizeStyle.padding,
    paddingRight: value && showClearButton ? sizeStyle.height : sizeStyle.padding,
    background: isFocused
      ? `${colors.surface}cc`
      : colors.surface,
    border: `1px solid ${isFocused ? `${colors.primary}60` : colors.glassBorder}`,
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    boxShadow: isFocused
      ? `0 0 0 3px ${colors.primary}15`
      : 'none',
    cursor: disabled ? 'not-allowed' : 'text',
  };

  const iconStyle = {
    position: 'absolute',
    left: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeStyle.iconSize,
    height: sizeStyle.iconSize,
    color: isFocused ? colors.primary : colors.mutedText,
    transition: 'color 0.2s ease',
    pointerEvents: 'none',
    fontSize: sizeStyle.iconSize,
  };

  const inputStyle = {
    width: '100%',
    height: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: colors.text,
    fontSize: sizeStyle.fontSize,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: 0,
  };

  const clearButtonStyle = {
    position: 'absolute',
    right: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    background: colors.glass,
    border: `1px solid ${colors.glassBorder}`,
    borderRadius: '6px',
    color: colors.mutedText,
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s ease',
  };

  const handleChange = (e) => {
    onChange?.(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch?.(e.target.value);
    }
  };

  const handleClear = () => {
    onChange?.('');
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div className={className} style={containerStyle}>
      {icon && <div style={iconStyle}>{icon}</div>}
      <div style={inputContainerStyle}>
        <input
          ref={inputRef}
          type="text"
          value={value || ''}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          style={inputStyle}
          aria-label={placeholder}
          role="searchbox"
          {...props}
        />
      </div>
      {value && showClearButton && (
        <button
          style={clearButtonStyle}
          onClick={handleClear}
          aria-label="Clear search"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClear();
            }
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = colors.glass;
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

export default SearchBar;