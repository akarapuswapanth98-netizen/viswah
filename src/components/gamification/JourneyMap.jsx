import React from 'react';

export default function JourneyMap({ journey }) {
  if (!journey || !journey.stages) return null;

  const { stages, current_stage, total_xp, level } = journey;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Music Journey</h3>
        <span style={styles.level}>Level {level}</span>
      </div>

      <div style={styles.path}>
        {stages.map((stage, i) => (
          <div key={stage.id} style={styles.stageWrap}>
            {/* Connector line */}
            {i > 0 && (
              <div style={{
                ...styles.connector,
                background: stage.completed || stage.current
                  ? 'linear-gradient(180deg, #E8A838, #5BA8A0)'
                  : 'rgba(255,255,255,0.06)',
              }} />
            )}

            <div style={{
              ...styles.stage,
              opacity: stage.locked ? 0.4 : 1,
              borderColor: stage.current
                ? '#E8A838'
                : stage.completed
                  ? 'rgba(91, 168, 160, 0.3)'
                  : 'rgba(255,255,255,0.06)',
              background: stage.current
                ? 'linear-gradient(135deg, rgba(232, 168, 56, 0.08), rgba(91, 168, 160, 0.04))'
                : 'rgba(255,255,255,0.02)',
            }}>
              <div style={styles.stageHeader}>
                <span style={styles.stageIcon}>{stage.icon}</span>
                <div style={styles.stageInfo}>
                  <span style={styles.stageTitle}>{stage.title}</span>
                  <span style={styles.stageDesc}>{stage.description}</span>
                </div>
                {stage.completed && <span style={styles.check}>\u2713</span>}
                {stage.current && <span style={styles.currentBadge}>Current</span>}
              </div>

              {/* Progress bar */}
              <div style={styles.progressTrack}>
                <div style={{
                  ...styles.progressFill,
                  width: `${stage.progress_percent}%`,
                  background: stage.completed
                    ? '#5BA8A0'
                    : stage.current
                      ? 'linear-gradient(90deg, #E8A838, #5BA8A0)'
                      : 'rgba(255,255,255,0.06)',
                }} />
              </div>

              {/* Milestones */}
              {stage.current && (
                <div style={styles.milestones}>
                  {stage.milestones.map((m, j) => (
                    <div key={j} style={styles.milestone}>
                      <span style={styles.milestoneDot}>\u2022</span>
                      <span style={styles.milestoneText}>{m}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
    marginBottom: '16px',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    margin: 0,
  },
  level: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#E8A838',
  },
  path: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  stageWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  connector: {
    width: '2px',
    height: '12px',
    marginLeft: '20px',
    borderRadius: '1px',
  },
  stage: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid',
    transition: 'all 0.3s ease',
  },
  stageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  stageIcon: {
    fontSize: '20px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)',
  },
  stageInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  stageTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#F0EBE3',
  },
  stageDesc: {
    fontSize: '11px',
    color: '#6B6080',
  },
  check: {
    fontSize: '16px',
    color: '#5BA8A0',
    fontWeight: '700',
  },
  currentBadge: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#E8A838',
    background: 'rgba(232, 168, 56, 0.1)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  progressTrack: {
    height: '4px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.6s ease',
  },
  milestones: {
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  milestone: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  milestoneDot: {
    color: '#E8A838',
    fontSize: '12px',
  },
  milestoneText: {
    fontSize: '11px',
    color: '#A89FB8',
  },
};
