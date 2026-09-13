import React from 'react';

const CATEGORY_COLORS = {
  skill_focus: '#f97316',
  daily: '#3b82f6',
  challenge: '#8b5cf6',
  streak: '#22c55e',
};

export default function DailyMissionCard({ missions = [] }) {
  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Daily Missions</h3>
      <div style={styles.list}>
        {missions.map((mission) => {
          const color = CATEGORY_COLORS[mission.category] || '#3b82f6';
          return (
            <div
              key={mission.id}
              className="mission-card"
              style={{
                ...styles.mission,
                borderColor: mission.completed ? '#22c55e33' : 'rgba(255,255,255,0.06)',
                opacity: mission.completed ? 0.7 : 1,
              }}
            >
              <div style={{ ...styles.indicator, backgroundColor: mission.completed ? '#22c55e' : color }} />
              <div style={styles.info}>
                <span style={styles.title}>{mission.title}</span>
                <span style={styles.desc}>{mission.description}</span>
              </div>
              <div style={styles.right}>
                <span style={{ ...styles.xp, color: '#fbbf24' }}>+{mission.xp_reward} XP</span>
                {mission.completed && <span style={styles.done}>\u2713</span>}
              </div>
            </div>
          );
        })}
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
  heading: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    margin: '0 0 14px 0',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  mission: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid',
  },
  indicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
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
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  xp: {
    fontSize: '11px',
    fontWeight: '600',
  },
  done: {
    fontSize: '16px',
    color: '#22c55e',
    fontWeight: '700',
  },
};
