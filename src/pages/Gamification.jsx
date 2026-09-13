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
import Leaderboard from '../components/gamification/Leaderboard.jsx';
import JourneyMap from '../components/gamification/JourneyMap.jsx';

export default function Gamification() {
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [journey, setJourney] = useState(null);
  const [missions, setMissions] = useState([]);
  const [achievements, setAchievements] = useState({ achievements: [], unlocked: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileData, lbData, journeyData, missionData, achieveData] = await Promise.all([
        progressApi.getGamificationProfile(),
        progressApi.getLeaderboard('weekly_xp'),
        progressApi.getJourney(),
        progressApi.getMissions(),
        progressApi.getAchievements(),
      ]);
      setProfile(profileData);
      setLeaderboard(lbData);
      setJourney(journeyData);
      setMissions(missionData.missions || []);
      setAchievements(achieveData);
    } catch (err) {
      setError(err.message || 'Failed to load gamification data');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaderboardType = async (type) => {
    try {
      const lb = await progressApi.getLeaderboard(type);
      setLeaderboard(lb);
    } catch {}
  };

  const handleChallengeComplete = async (missionId) => {
    try {
      const result = await progressApi.completeChallenge(missionId);
      if (result.success) {
        setMissions((prev) =>
          prev.map((m) => (m.id === missionId ? { ...m, completed: true } : m))
        );
      }
    } catch {}
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Loading gamification data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <p>{error}</p>
        <button onClick={loadAll} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  const summary = profile?.summary || {};
  const streak = summary.streak || {};
  const identity = summary.identity || {};
  const skills = summary.skills || [];
  const leaderboardData = profile?.leaderboard || {};

  const tabs = ['overview', 'journey', 'leaderboard', 'skills', 'achievements'];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Gamification</h1>
        <button onClick={() => navigate('/')} style={styles.backBtn}>Back</button>
      </div>

      <div style={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              borderBottomColor: activeTab === tab ? '#E8A838' : 'transparent',
              color: activeTab === tab ? '#F0EBE3' : '#6B6080',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={styles.section}>
          <div style={styles.xpRow}>
            <LevelBadge level={summary.level || 1} size="large" />
            <div style={{ flex: 1 }}>
              <XPBar
                currentXP={summary.xp || 0}
                level={summary.level || 1}
                title={summary.level_title || 'Music Explorer'}
                progressPercent={summary.xp_progress_percent || 0}
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

          <DailyMissionCard
            missions={missions}
            onComplete={handleChallengeComplete}
          />

          <div style={styles.achievementsPreview}>
            <h3 style={styles.sectionTitle}>Recent Achievements</h3>
            <div style={styles.achievementList}>
              {(achievements.achievements || [])
                .filter((a) => a.unlocked)
                .slice(0, 3)
                .map((ach) => (
                  <AchievementCard key={ach.id} achievement={ach} />
                ))}
              {achievements.achievements?.filter((a) => a.unlocked).length === 0 && (
                <div style={styles.empty}>No achievements yet. Start practicing!</div>
              )}
            </div>
          </div>

          <div style={styles.leaderboardPreview}>
            <Leaderboard
              data={leaderboard}
              onTypeChange={handleLeaderboardType}
            />
          </div>
        </div>
      )}

      {activeTab === 'journey' && (
        <JourneyMap journey={journey} />
      )}

      {activeTab === 'leaderboard' && (
        <Leaderboard
          data={leaderboard}
          onTypeChange={handleLeaderboardType}
        />
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
    color: '#F0EBE3',
    margin: 0,
  },
  backBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#F0EBE3',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  tabBar: {
    display: 'flex',
    gap: '4px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '20px',
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
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    color: '#A89FB8',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTopColor: '#E8A838',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    color: '#EF4444',
  },
  retryBtn: {
    marginTop: '12px',
    background: '#E8A838',
    border: 'none',
    borderRadius: '8px',
    color: '#0C0A14',
    padding: '8px 20px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  xpRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
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
    color: '#F0EBE3',
    margin: '0 0 12px 0',
  },
  achievementList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  empty: {
    textAlign: 'center',
    color: '#6B6080',
    padding: '16px',
    fontSize: '13px',
  },
  leaderboardPreview: {
    marginTop: '0',
  },
  achievementStats: {
    marginBottom: '12px',
  },
  achievementCount: {
    fontSize: '14px',
    color: '#A89FB8',
    fontWeight: '500',
  },
  achievementGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
};
