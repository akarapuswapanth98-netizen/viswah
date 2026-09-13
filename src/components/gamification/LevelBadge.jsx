import React from 'react';

const LEVELS = [
  { level: 1, color: '#8B5CF6' },
  { level: 2, color: '#3B82F6' },
  { level: 3, color: '#06B6D4' },
  { level: 4, color: '#10B981' },
  { level: 5, color: '#F59E0B' },
  { level: 6, color: '#F97316' },
  { level: 7, color: '#EF4444' },
  { level: 8, color: '#DC2626' },
  { level: 9, color: '#7C3AED' },
  { level: 10, color: '#C026D3' },
  { level: 11, color: '#DB2777' },
  { level: 12, color: '#EA580C' },
  { level: 13, color: '#16A34A' },
  { level: 14, color: '#FBBF24' },
];

export default function LevelBadge({ level = 1, size = 'medium' }) {
  const lvl = LEVELS[level - 1] || LEVELS[0];
  const sizes = {
    small: { width: 32, height: 32, fontSize: '12px' },
    medium: { width: 48, height: 48, fontSize: '16px' },
    large: { width: 72, height: 72, fontSize: '24px' },
  };
  const s = sizes[size] || sizes.medium;

  return (
    <div
      className="level-badge"
      style={{
        width: s.width,
        height: s.height,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${lvl.color}, ${lvl.color}88)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: s.fontSize,
        fontWeight: '800',
        color: '#fff',
        boxShadow: `0 0 16px ${lvl.color}44`,
        border: `2px solid ${lvl.color}`,
      }}
    >
      {level}
    </div>
  );
}
