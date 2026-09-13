import React from 'react';

export default function MusicIdentityCard({ identity }) {
  if (!identity) return null;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.avatar}>{identity.name?.charAt(0) || '?'}</div>
        <div>
          <h3 style={styles.name}>{identity.name}</h3>
          <span style={styles.title}>{identity.title || 'Level ' + identity.level}</span>
        </div>
      </div>

      <div style={styles.stats}>
        <div style={styles.stat}>
          <span style={styles.statVal}>{identity.total_sessions}</span>
          <span style={styles.statLabel}>Sessions</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statVal}>{identity.total_minutes}m</span>
          <span style={styles.statLabel}>Played</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statVal}>{identity.avg_score}%</span>
          <span style={styles.statLabel}>Avg Score</span>
        </div>
      </div>

      <div style={styles.traits}>
        <div style={styles.trait}>
          <span style={styles.traitLabel}>Primary Style</span>
          <span style={styles.traitValue}>{identity.primary_style || 'None yet'}</span>
        </div>
        <div style={styles.trait}>
          <span style={styles.traitLabel}>Focus</span>
          <span style={styles.traitValue}>{identity.practice_focus || 'Explore everything'}</span>
        </div>
        <div style={styles.trait}>
          <span style={styles.traitLabel}>Personality</span>
          <span style={styles.traitValue}>{identity.learning_style || 'Curious Beginner'}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '12px',
    padding: '16px 20px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '14px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
  },
  name: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    margin: 0,
  },
  title: {
    fontSize: '12px',
    color: '#f97316',
  },
  stats: {
    display: 'flex',
    gap: '16px',
    marginBottom: '14px',
    paddingBottom: '14px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  statVal: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: '10px',
    color: '#64748b',
  },
  traits: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  trait: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  traitLabel: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  traitValue: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#fff',
  },
};
