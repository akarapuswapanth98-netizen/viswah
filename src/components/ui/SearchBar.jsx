import React, { useState, useRef } from 'react';
import C from './colors';

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
    background: isFocused ? C.surfaceHover : C.surfaceTint,
    border: `1px solid ${isFocused ? `${C.primary}50` : C.glassBorder}`,
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    boxShadow: isFocused ? `0 0 0 3px ${C.primary}12` : 'none',
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
    color: isFocused ? C.primary : C.textMuted,
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
    color: C.text,
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
    background: C.surfaceGlass,
    border: `1px solid ${C.glassBorder}`,
    borderRadius: '6px',
    color: C.textMuted,
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
            e.target.style.background = C.surfaceTint;
          }}
          onMouseLeave={(e) => {
            e.target.style.background = C.surfaceGlass;
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

export default SearchBar;
