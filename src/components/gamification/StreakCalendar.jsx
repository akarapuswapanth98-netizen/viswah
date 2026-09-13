import React from 'react';

export default function StreakCalendar({ calendar = [], currentStreak = 0, longestStreak = 0, weeklyConsistency = 0 }) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.heading}>Streak Calendar</h3>
        <div style={styles.stats}>
          <div style={styles.stat}>
            <span style={styles.statValue}>{currentStreak}</span>
            <span style={styles.statLabel}>Current</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statValue}>{longestStreak}</span>
            <span style={styles.statLabel}>Longest</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statValue}>{weeklyConsistency}%</span>
            <span style={styles.statLabel}>This Week</span>
          </div>
        </div>
      </div>
      <div style={styles.grid}>
        {calendar.slice(0, 30).map((day, i) => (
          <div
            key={i}
            className="streak-day"
            style={{
              ...styles.day,
              backgroundColor: day.practiced ? '#22c55e' : 'rgba(255,255,255,0.04)',
              borderColor: day.practiced ? '#22c55e33' : 'rgba(255,255,255,0.06)',
            }}
            title={`${day.date}: ${day.practiced ? 'Practiced' : 'Rest'}`}
          >
            {day.date ? day.date.slice(-2) : ''}
          </div>
        ))}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  heading: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    margin: 0,
  },
  stats: {
    display: 'flex',
    gap: '16px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  statValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#22c55e',
  },
  statLabel: {
    fontSize: '10px',
    color: '#64748b',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
  },
  day: {
    aspectRatio: '1',
    borderRadius: '4px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    color: '#94a3b8',
  },
};
