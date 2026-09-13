import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Gamification from '../pages/Gamification';

const mockProfile = {
  summary: {
    level: 5,
    level_title: 'Skilled Musician',
    xp: 1500,
    xp_progress_percent: 42,
    streak: {
      current_streak: 7,
      longest_streak: 14,
      weekly_consistency: 85,
      calendar: Array.from({ length: 30 }, (_, i) => ({
        date: `2026-09-${String(30 - i).padStart(2, '0')}`,
        practiced: i < 7,
      })),
    },
    skills: [
      { id: 'pitch', label: 'Pitch', icon: '\u{1F3B5}', score: 65, trend: 'up', sessions: 12 },
    ],
    identity: {
      name: 'testuser',
      level: 5,
      total_sessions: 30,
      total_minutes: 200,
      avg_score: 82,
      primary_style: 'Piano',
      practice_focus: 'Melodic Skills',
      learning_style: 'Methodical',
    },
    achievements: { total: 25, unlocked: 5 },
  },
  journey: {
    current_stage: 'foundation',
    total_xp: 1500,
    level: 5,
    stages: [
      { id: 'beginner', title: 'Beginner', icon: '\u{1F331}', completed: true, current: false, locked: false, progress_percent: 100, milestones: ['First practice'], description: 'Start', xp_required: 0 },
      { id: 'foundation', title: 'Foundation', icon: '\u{1F3B5}', completed: false, current: true, locked: false, progress_percent: 60, milestones: ['5 lessons', '1 raga'], description: 'Build basics', xp_required: 200 },
    ],
    milestones_met: { first_practice: true, first_note: true },
  },
  leaderboard: { rank: 3, total_users: 10, weekly_xp: 250 },
};

const mockLeaderboard = {
  entries: [
    { user_id: 1, username: 'alice', score: 500, metric: 'XP', rank: 1, is_current_user: false },
    { user_id: 2, username: 'bob', score: 350, metric: 'XP', rank: 2, is_current_user: false },
    { user_id: 3, username: 'testuser', score: 250, metric: 'XP', rank: 3, is_current_user: true },
  ],
  total_users: 3,
  current_user_rank: 3,
  leaderboard_type: 'weekly_xp',
};

const mockMissions = {
  missions: [
    { id: 'm1', title: 'Pitch Training', description: 'Complete 3 intervals', xp_reward: 40, route: '/music-lab/intervals', completed: false, category: 'daily' },
  ],
};

const mockAchievements = {
  total: 25,
  unlocked: 2,
  achievements: [
    { id: 'first_practice', title: 'First Step', description: 'Complete first practice', icon: '\u{2B50}', unlocked: true, xp_reward: 50, category: 'first_steps' },
    { id: 'streak_7', title: 'On Fire', description: '7-day streak', icon: '\u{1F525}', unlocked: true, xp_reward: 100, category: 'consistency' },
    { id: 'music_master', title: 'Music Master', description: 'Reach level 10', icon: '\u{1F451}', unlocked: false, xp_reward: 500, category: 'mastery' },
  ],
};

vi.mock('../api/progressApi.js', () => ({
  default: {
    getGamificationProfile: vi.fn(),
    getLeaderboard: vi.fn(),
    getJourney: vi.fn(),
    getMissions: vi.fn(),
    getAchievements: vi.fn(),
    completeChallenge: vi.fn(),
  },
}));

import progressApi from '../api/progressApi.js';

const renderPage = () =>
  render(
    <BrowserRouter>
      <Gamification />
    </BrowserRouter>
  );

describe('Gamification Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    progressApi.getGamificationProfile.mockResolvedValue(mockProfile);
    progressApi.getLeaderboard.mockResolvedValue(mockLeaderboard);
    progressApi.getJourney.mockResolvedValue(mockProfile.journey);
    progressApi.getMissions.mockResolvedValue(mockMissions);
    progressApi.getAchievements.mockResolvedValue(mockAchievements);
  });

  it('shows loading state initially', () => {
    renderPage();
    expect(screen.getByText(/Loading gamification data/)).toBeTruthy();
  });

  it('renders overview tab after loading', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Gamification')).toBeTruthy());
    expect(screen.getByText('1,500 XP')).toBeTruthy();
    const levelElements = screen.getAllByText(/Level 5/);
    expect(levelElements.length).toBeGreaterThanOrEqual(1);
  });

  it('displays streak information', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Current')).toBeTruthy());
    expect(screen.getByText('Longest')).toBeTruthy();
  });

  it('displays identity card', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('testuser').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText('Piano')).toBeTruthy();
  });

  it('shows daily missions on overview', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Pitch Training')).toBeTruthy());
  });

  it('shows achievements preview', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('First Step')).toBeTruthy());
    expect(screen.getByText('On Fire')).toBeTruthy();
  });

  it('shows leaderboard on overview', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Leaderboard').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('alice')).toBeTruthy();
    });
  });

  it('switches to journey tab', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Gamification')).toBeTruthy());
    await act(async () => {
      screen.getByText('Journey').click();
    });
    await waitFor(() => {
      expect(screen.getByText('Music Journey')).toBeTruthy();
      expect(screen.getByText('Beginner')).toBeTruthy();
      expect(screen.getByText('Foundation')).toBeTruthy();
    });
  });

  it('switches to leaderboard tab', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Gamification')).toBeTruthy());
    const lbButtons = screen.getAllByText('Leaderboard');
    await act(async () => {
      lbButtons[0].click();
    });
    await waitFor(() => {
      expect(screen.getByText('alice')).toBeTruthy();
      expect(screen.getByText('bob')).toBeTruthy();
    });
  });

  it('switches to skills tab', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Gamification')).toBeTruthy());
    await act(async () => {
      screen.getByText('Skills').click();
    });
    await waitFor(() => {
      expect(screen.getByText('Skill Tree')).toBeTruthy();
      expect(screen.getByText('65/100')).toBeTruthy();
    });
  });

  it('switches to achievements tab', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Gamification')).toBeTruthy());
    await act(async () => {
      screen.getByText('Achievements').click();
    });
    await waitFor(() => {
      expect(screen.getByText('2 / 25 Unlocked')).toBeTruthy();
      expect(screen.getByText('Music Master')).toBeTruthy();
    });
  });

  it('shows error state on API failure', async () => {
    progressApi.getGamificationProfile.mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Network error')).toBeTruthy());
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('retry button reloads data', async () => {
    progressApi.getGamificationProfile.mockRejectedValueOnce(new Error('fail'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Retry')).toBeTruthy());
    progressApi.getGamificationProfile.mockResolvedValue(mockProfile);
    await act(async () => {
      screen.getByText('Retry').click();
    });
    await waitFor(() => expect(screen.getByText('Gamification')).toBeTruthy());
  });

  it('back button exists', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Back')).toBeTruthy());
  });
});
