import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import progressApi from '../api/progressApi.js';
import XPBar from '../components/gamification/XPBar.jsx';
import LevelBadge from '../components/gamification/LevelBadge.jsx';
import SkillTree from '../components/gamification/SkillTree.jsx';
import AchievementCard from '../components/gamification/AchievementCard.jsx';
import StreakCalendar from '../components/gamification/StreakCalendar.jsx';
import MusicIdentityCard from '../components/gamification/MusicIdentityCard.jsx';
import DailyMissionCard from '../components/gamification/DailyMissionCard.jsx';

export default function ProgressDashboard() {
  const [summary, setSummary] = useState(null);
  const [skills, setSkills] = useState([]);
  const [achievements, setAchievements] = useState({ achievements: [], unlocked: 0, total: 0 });
  const [missions, setMissions] = useState([]);
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, skillsData, achieveData, missionData, identityData] = await Promise.all([
        progressApi.getSummary(),
        progressApi.getSkills(),
        progressApi.getAchievements(),
        progressApi.getMissions(),
        progressApi.getIdentity(),
      ]);
      setSummary(summaryData);
      setSkills(skillsData.skills || []);
      setAchievements(achieveData);
      setMissions(missionData.missions || []);
      setIdentity(identityData);
    } catch (err) {
      setError(err.message || 'Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Loading your progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <p>{error}</p>
        <button onClick={loadProgress} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  const tabs = ['overview', 'skills', 'achievements', 'missions'];
  const streak = summary?.streak || {};

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Your Progress</h1>
        <button onClick={() => navigate('/')} style={styles.backBtn}>Back</button>
      </div>

      <div style={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              borderBottomColor: activeTab === tab ? '#f97316' : 'transparent',
              color: activeTab === tab ? '#fff' : '#64748b',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={styles.overview}>
          <div style={styles.xpRow}>
            <LevelBadge level={summary?.level?.level || 1} size="large" />
            <div style={{ flex: 1 }}>
              <XPBar
                currentXP={summary?.xp?.total_xp || 0}
                level={summary?.level?.level || 1}
                title={summary?.level?.title || 'Music Explorer'}
                progressPercent={summary?.level?.progress_percent || 0}
              />
            </div>
          </div>

          <div style={styles.row2}>
            <StreakCalendar
              calendar={streak.calendar || []}
              currentStreak={streak.current_streak || 0}
              longestStreak={streak.longest_streak || 0}
              weeklyConsistency={streak.weekly_consistency || 0}
            />
            <MusicIdentityCard identity={identity} />
          </div>

          <DailyMissionCard missions={missions} />

          <div style={styles.achievementsPreview}>
            <h3 style={styles.sectionTitle}>Recent Achievements</h3>
            <div style={styles.achievementList}>
              {(achievements.achievements || [])
                .filter((a) => a.unlocked)
                .slice(0, 3)
                .map((ach) => (
                  <AchievementCard key={ach.id} achievement={ach} />
                ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <SkillTree skills={skills} />
      )}

      {activeTab === 'achievements' && (
        <div>
          <div style={styles.achievementStats}>
            <span style={styles.achievementCount}>{achievements.unlocked} / {achievements.total} Unlocked</span>
          </div>
          <div style={styles.achievementGrid}>
            {(achievements.achievements || []).map((ach) => (
              <AchievementCard key={ach.id} achievement={ach} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'missions' && (
        <DailyMissionCard missions={missions} />
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
  },
  backBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  tabBar: {
    display: 'flex',
    gap: '4px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '20px',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid',
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    color: '#94a3b8',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTopColor: '#f97316',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    color: '#ef4444',
  },
  retryBtn: {
    marginTop: '12px',
    background: '#f97316',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    padding: '8px 20px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  overview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  xpRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  achievementsPreview: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '12px',
    padding: '16px 20px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    margin: '0 0 12px 0',
  },
  achievementList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  achievementStats: {
    marginBottom: '12px',
  },
  achievementCount: {
    fontSize: '14px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  achievementGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
};
