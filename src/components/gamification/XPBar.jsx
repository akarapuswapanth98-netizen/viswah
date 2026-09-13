import React from 'react';

const LEVELS = [
  { level: 1, xp: 0, title: 'Music Explorer', color: '#8B5CF6' },
  { level: 2, xp: 100, title: 'Rhythm Seeker', color: '#3B82F6' },
  { level: 3, xp: 250, title: 'Melody Maker', color: '#06B6D4' },
  { level: 4, xp: 500, title: 'Harmony Hunter', color: '#10B981' },
  { level: 5, xp: 1000, title: 'Note Navigator', color: '#F59E0B' },
  { level: 6, xp: 1750, title: 'Sound Sculptor', color: '#F97316' },
  { level: 7, xp: 2750, title: 'Beat Architect', color: '#EF4444' },
  { level: 8, xp: 4000, title: 'Scale Master', color: '#DC2626' },
  { level: 9, xp: 6000, title: 'Tune Tactician', color: '#7C3AED' },
  { level: 10, xp: 8500, title: 'Virtuoso Rising', color: '#C026D3' },
  { level: 11, xp: 11500, title: 'Studio Virtuoso', color: '#DB2777' },
  { level: 12, xp: 15000, title: 'Sound Guru', color: '#EA580C' },
  { level: 13, xp: 20000, title: 'Music Master', color: '#16A34A' },
  { level: 14, xp: 30000, title: 'Legendary Musician', color: '#FBBF24' },
];

export default function XPBar({ currentXP = 0, level = 1, title = 'Music Explorer', progressPercent = 0 }) {
  const currentLevelIdx = level - 1;
  const nextLevel = LEVELS[currentLevelIdx] || LEVELS[LEVELS.length - 1];

  return (
    <div className="xp-bar-container" style={styles.container}>
      <div className="xp-header" style={styles.header}>
        <span style={styles.level}>Level {level}</span>
        <span style={styles.title}>{title}</span>
        <span style={styles.xpText}>{currentXP.toLocaleString()} XP</span>
      </div>
      <div className="xp-track" style={styles.track}>
        <div
          className="xp-fill"
          style={{
            ...styles.fill,
            width: `${Math.min(progressPercent, 100)}%`,
            backgroundColor: nextLevel.color,
          }}
        />
      </div>
      <div className="xp-labels" style={styles.labels}>
        <span>{currentLevelIdx + 1}</span>
        {currentLevelIdx < LEVELS.length - 1 && (
          <span>{currentLevelIdx + 2} — {(nextLevel.xp + 0).toLocaleString()} XP</span>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '12px',
    padding: '16px 20px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '10px',
  },
  level: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff',
  },
  title: {
    fontSize: '13px',
    color: '#94a3b8',
    flex: 1,
  },
  xpText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fbbf24',
  },
  track: {
    height: '10px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: '5px',
    transition: 'width 0.6s ease',
  },
  labels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '6px',
    fontSize: '11px',
    color: '#64748b',
  },
};
