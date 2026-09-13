import React, { useState } from 'react';

const LEADERBOARD_TYPES = [
  { id: 'weekly_xp', label: 'Weekly XP', icon: '\u26A1' },
  { id: 'monthly_practice', label: 'Monthly Practice', icon: '\u23F1' },
  { id: 'music_lab_score', label: 'Music Lab Score', icon: '\u{1F442}' },
  { id: 'consistency', label: 'Consistency', icon: '\u{1F525}' },
];

const MEDAL_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

export default function Leaderboard({ data, onTypeChange }) {
  const [activeType, setActiveType] = useState('weekly_xp');

  const handleTypeChange = (type) => {
    setActiveType(type);
    onTypeChange?.(type);
  };

  const entries = data?.entries || [];
  const currentUserRank = data?.current_user_rank;
  const totalUsers = data?.total_users || 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Leaderboard</h3>
        <span style={styles.userCount}>{totalUsers} musicians</span>
      </div>

      <div style={styles.typeTabs}>
        {LEADERBOARD_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTypeChange(t.id)}
            style={{
              ...styles.typeTab,
              background: activeType === t.id ? 'rgba(232, 168, 56, 0.12)' : 'transparent',
              color: activeType === t.id ? '#E8A838' : '#6B6080',
              borderColor: activeType === t.id ? 'rgba(232, 168, 56, 0.2)' : 'transparent',
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={styles.list}>
        {entries.length === 0 && (
          <div style={styles.empty}>No data yet. Start practicing!</div>
        )}
        {entries.map((entry) => (
          <div
            key={entry.user_id}
            style={{
              ...styles.row,
              background: entry.is_current_user
                ? 'linear-gradient(135deg, rgba(232, 168, 56, 0.08), rgba(91, 168, 160, 0.05))'
                : 'transparent',
              border: entry.is_current_user ? '1px solid rgba(232, 168, 56, 0.15)' : '1px solid transparent',
            }}
          >
            <div style={styles.rankWrap}>
              {entry.rank <= 3 ? (
                <div style={{ ...styles.medal, background: MEDAL_COLORS[entry.rank] || '#6B6080' }}>
                  {entry.rank}
                </div>
              ) : (
                <span style={styles.rank}>{entry.rank}</span>
              )}
            </div>
            <div style={styles.avatar}>
              {entry.username?.charAt(0).toUpperCase()}
            </div>
            <div style={styles.info}>
              <span style={styles.username}>
                {entry.username}
                {entry.is_current_user && <span style={styles.youBadge}>You</span>}
              </span>
            </div>
            <div style={styles.score}>
              <span style={styles.scoreValue}>{entry.score.toLocaleString()}</span>
              <span style={styles.scoreMetric}>{entry.metric}</span>
            </div>
          </div>
        ))}
      </div>

      {currentUserRank && currentUserRank > 10 && (
        <div style={styles.yourRank}>
          Your rank: #{currentUserRank} of {totalUsers}
        </div>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    margin: 0,
  },
  userCount: {
    fontSize: '12px',
    color: '#6B6080',
  },
  typeTabs: {
    display: 'flex',
    gap: '6px',
    marginBottom: '14px',
    flexWrap: 'wrap',
  },
  typeTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  empty: {
    textAlign: 'center',
    color: '#6B6080',
    padding: '20px',
    fontSize: '13px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  rankWrap: {
    width: '24px',
    textAlign: 'center',
  },
  medal: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '700',
    color: '#0C0A14',
  },
  rank: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6B6080',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #E8A838 0%, #C77DBA 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
    color: '#fff',
  },
  info: {
    flex: 1,
  },
  username: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#F0EBE3',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  youBadge: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#E8A838',
    background: 'rgba(232, 168, 56, 0.1)',
    padding: '1px 6px',
    borderRadius: '4px',
  },
  score: {
    textAlign: 'right',
  },
  scoreValue: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#F0EBE3',
    display: 'block',
  },
  scoreMetric: {
    fontSize: '10px',
    color: '#6B6080',
  },
  yourRank: {
    textAlign: 'center',
    marginTop: '10px',
    padding: '8px',
    borderRadius: '8px',
    background: 'rgba(232, 168, 56, 0.06)',
    fontSize: '12px',
    fontWeight: '500',
    color: '#E8A838',
  },
};
