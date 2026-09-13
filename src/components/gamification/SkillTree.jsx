import React from 'react';

const SKILL_ICONS = {
  pitch: '\u{1F3B5}',
  rhythm: '\u{1F3B6}',
  melody: '\u{1F3B9}',
  harmony: '\u{1F3BC}',
  instrument: '\u{1F3B5}',
  vocal: '\u{1F3A4}',
  listening: '\u{1F442}',
  ear: '\u{1F3B7}',
  creativity: '\u{1F3AD}',
  world_music: '\u{1F30D}',
};

const SKILL_COLORS = {
  pitch: '#8B5CF6',
  rhythm: '#3B82F6',
  melody: '#06B6D4',
  harmony: '#10B981',
  instrument: '#F59E0B',
  vocal: '#F97316',
  listening: '#EF4444',
  ear: '#EC4899',
  creativity: '#7C3AED',
  world_music: '#14B8A6',
};

export default function SkillTree({ skills = [] }) {
  return (
    <div className="skill-tree" style={styles.container}>
      <h3 style={styles.heading}>Skill Tree</h3>
      <div className="skill-grid" style={styles.grid}>
        {skills.map((skill) => {
          const color = SKILL_COLORS[skill.id] || '#8B5CF6';
          const icon = SKILL_ICONS[skill.id] || '\u{1F3B5}';
          return (
            <div key={skill.id} className="skill-node" style={styles.node}>
              <div
                className="skill-ring"
                style={{
                  ...styles.ring,
                  borderColor: color,
                  boxShadow: `0 0 12px ${color}33`,
                }}
              >
                <span style={styles.icon}>{icon}</span>
              </div>
              <span style={{ ...styles.skillLabel, color: skill.score > 0 ? '#fff' : '#64748b' }}>
                {skill.label}
              </span>
              <span style={{ ...styles.score, color }}>{skill.score}/100</span>
              {skill.trend === 'up' && <span style={{ ...styles.trend, color: '#22c55e' }}>\u2191</span>}
              {skill.trend === 'down' && <span style={{ ...styles.trend, color: '#ef4444' }}>\u2193</span>}
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '12px',
  },
  node: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  ring: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: '3px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  icon: {
    fontSize: '20px',
  },
  skillLabel: {
    fontSize: '10px',
    fontWeight: '500',
    textAlign: 'center',
  },
  score: {
    fontSize: '11px',
    fontWeight: '600',
  },
  trend: {
    fontSize: '12px',
    fontWeight: '700',
  },
};
