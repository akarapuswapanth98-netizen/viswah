import React, { useState, useRef, useEffect } from 'react';

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

function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'default',
  fullWidth = false,
  className = '',
  style = {},
  ...props
}) {
  const [active, setActive] = useState(activeTab || (tabs.length > 0 ? tabs[0].id : ''));
  const tabsRef = useRef([]);
  const indicatorRef = useRef(null);

  useEffect(() => {
    if (activeTab !== undefined) {
      setActive(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.id === active);
    const activeTabElement = tabsRef.current[activeIndex];
    if (activeTabElement && indicatorRef.current) {
      const container = activeTabElement.parentElement;
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTabElement.getBoundingClientRect();
      indicatorRef.current.style.left = `${tabRect.left - containerRect.left}px`;
      indicatorRef.current.style.width = `${tabRect.width}px`;
    }
  }, [active, tabs]);

  const containerStyle = {
    position: 'relative',
    display: 'flex',
    gap: '4px',
    padding: '4px',
    background: colors.surface,
    borderRadius: '12px',
    border: `1px solid ${colors.glassBorder}`,
    ...(fullWidth ? { width: '100%' } : {}),
    ...style,
  };

  const indicatorStyle = {
    position: 'absolute',
    top: '4px',
    height: 'calc(100% - 8px)',
    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
    borderRadius: '8px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: `0 4px 12px ${colors.primary}30`,
    zIndex: 0,
  };

  const getTabStyle = (isActive) => ({
    position: 'relative',
    zIndex: 1,
    flex: fullWidth ? 1 : 'none',
    padding: '10px 20px',
    background: 'transparent',
    color: isActive ? colors.text : colors.mutedText,
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: isActive ? 600 : 500,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  });

  const handleTabClick = (tab) => {
    if (!tab.disabled) {
      setActive(tab.id);
      onChange?.(tab.id);
    }
  };

  const handleKeyDown = (e, index) => {
    let newIndex = index;
    const len = tabs.length;
    if (len === 0) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      let attempts = 0;
      do {
        newIndex = (newIndex + 1) % len;
        attempts++;
      } while (tabs[newIndex]?.disabled && attempts < len);
      if (tabs[newIndex]?.disabled) return;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      let attempts = 0;
      do {
        newIndex = (newIndex - 1 + len) % len;
        attempts++;
      } while (tabs[newIndex]?.disabled && attempts < len);
      if (tabs[newIndex]?.disabled) return;
    } else if (e.key === 'Home') {
      e.preventDefault();
      newIndex = 0;
      while (tabs[newIndex]?.disabled && newIndex < len - 1) {
        newIndex++;
      }
    } else if (e.key === 'End') {
      e.preventDefault();
      newIndex = len - 1;
      while (tabs[newIndex]?.disabled && newIndex > 0) {
        newIndex--;
      }
    } else {
      return;
    }

    if (tabs[newIndex]?.disabled) return;
    setActive(tabs[newIndex].id);
    onChange?.(tabs[newIndex].id);
    tabsRef.current[newIndex]?.focus();
  };

  return (
    <div
      className={className}
      role="tablist"
      style={containerStyle}
      {...props}
    >
      <div ref={indicatorRef} style={indicatorStyle} aria-hidden="true" />
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          ref={(el) => (tabsRef.current[index] = el)}
          style={getTabStyle(active === tab.id)}
          onClick={() => handleTabClick(tab)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          disabled={tab.disabled}
          role="tab"
          aria-selected={active === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          tabIndex={active === tab.id ? 0 : -1}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
          {tab.count !== undefined && (
            <span
              style={{
                padding: '2px 8px',
                background: active === tab.id ? 'rgba(255,255,255,0.2)' : colors.glass,
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function TabPanel({ activeTab, tabId, children, className = '', style = {}, ...props }) {
  if (activeTab !== tabId) return null;

  return (
    <div
      id={`tabpanel-${tabId}`}
      role="tabpanel"
      aria-labelledby={`tab-${tabId}`}
      className={className}
      style={{
        padding: '20px 0',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

Tabs.TabPanel = TabPanel;

export default Tabs;