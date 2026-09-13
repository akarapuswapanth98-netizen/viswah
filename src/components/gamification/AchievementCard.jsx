import React from 'react';

export default function AchievementCard({ achievement }) {
  const { title, description, icon, unlocked, xp_reward, category, unlocked_at } = achievement;

  return (
    <div
      className="achievement-card"
      style={{
        ...styles.card,
        opacity: unlocked ? 1 : 0.4,
        borderColor: unlocked ? '#fbbf24' : 'rgba(255,255,255,0.08)',
      }}
    >
      <div style={styles.iconWrap}>
        <span style={styles.icon}>{icon}</span>
        {unlocked && <div style={styles.glow} />}
      </div>
      <div style={styles.info}>
        <span style={styles.title}>{title}</span>
        <span style={styles.desc}>{description}</span>
        <div style={styles.meta}>
          <span style={styles.xp}>+{xp_reward} XP</span>
          <span style={styles.category}>{category}</span>
        </div>
      </div>
      {unlocked && (
        <span style={styles.checkmark}>\u2713</span>
      )}
    </div>
  );
}

const styles = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '10px',
    padding: '12px 14px',
    border: '1px solid',
    transition: 'all 0.3s ease',
  },
  iconWrap: {
    position: 'relative',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: '24px',
  },
  glow: {
    position: 'absolute',
    inset: '-4px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(251,191,36,0.15), transparent)',
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  title: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
  },
  desc: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  meta: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  xp: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#fbbf24',
  },
  category: {
    fontSize: '10px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  checkmark: {
    fontSize: '18px',
    color: '#22c55e',
    fontWeight: '700',
  },
};
