import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ProgressDashboard from '../pages/ProgressDashboard';

const mockSummary = {
  level: { level: 3, title: 'Melody Maker', progress_percent: 42 },
  xp: { total_xp: 320 },
  streak: {
    current_streak: 5,
    longest_streak: 12,
    weekly_consistency: 71,
    calendar: Array.from({ length: 30 }, (_, i) => ({
      date: `2026-09-${String(30 - i).padStart(2, '0')}`,
      practiced: i < 5,
    })),
  },
  skills: [],
  achievements: { total: 20, unlocked: 3 },
  missions: [],
};

const mockSkills = [
  { id: 'pitch', label: 'Pitch', icon: '\u{1F3B5}', score: 65, trend: 'up', sessions: 12 },
  { id: 'rhythm', label: 'Rhythm', icon: '\u{1F3B6}', score: 40, trend: 'steady', sessions: 8 },
];

const mockAchievements = {
  total: 25,
  unlocked: 5,
  achievements: [
    { id: 'first_practice', title: 'First Step', description: 'Complete first practice', icon: '\u{2B50}', unlocked: true, xp_reward: 50, category: 'first_steps', unlocked_at: '2026-09-01' },
    { id: 'streak_3', title: 'On Fire', description: '3-day streak', icon: '\u{1F525}', unlocked: true, xp_reward: 75, category: 'consistency', unlocked_at: '2026-09-05' },
    { id: 'streak_7', title: 'Week Warrior', description: '7-day streak', icon: '\u{1F4AA}', unlocked: false, xp_reward: 100, category: 'consistency' },
  ],
};

const mockMissions = {
  missions: [
    { id: 'm1', title: 'Pitch Training', description: 'Complete 3 intervals', xp_reward: 40, route: '/music-lab/intervals', completed: false, category: 'daily' },
    { id: 'm2', title: 'Piano Practice', description: 'Play scales', xp_reward: 30, route: '/piano', completed: true, category: 'daily' },
  ],
};

const mockIdentity = {
  name: 'testuser',
  level: 3,
  title: 'Melody Maker',
  total_sessions: 25,
  total_minutes: 180,
  avg_score: 78,
  primary_style: 'Piano',
  practice_focus: 'Melodic Skills',
  learning_style: 'Methodical Learner',
};

vi.mock('../api/progressApi.js', () => ({
  default: {
    getSummary: vi.fn(),
    getSkills: vi.fn(),
    getAchievements: vi.fn(),
    getMissions: vi.fn(),
    getIdentity: vi.fn(),
  },
}));

import progressApi from '../api/progressApi.js';

const renderDashboard = () =>
  render(
    <BrowserRouter>
      <ProgressDashboard />
    </BrowserRouter>
  );

describe('ProgressDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    progressApi.getSummary.mockResolvedValue(mockSummary);
    progressApi.getSkills.mockResolvedValue({ skills: mockSkills });
    progressApi.getAchievements.mockResolvedValue(mockAchievements);
    progressApi.getMissions.mockResolvedValue(mockMissions);
    progressApi.getIdentity.mockResolvedValue(mockIdentity);
  });

  it('shows loading state initially', () => {
    renderDashboard();
    expect(screen.getByText(/Loading your progress/)).toBeTruthy();
  });

  it('renders overview tab after loading', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Your Progress')).toBeTruthy());
    expect(screen.getByText('Level 3')).toBeTruthy();
    expect(screen.getByText('320 XP')).toBeTruthy();
    expect(screen.getAllByText('Melody Maker').length).toBeGreaterThanOrEqual(1);
  });

  it('shows streak stats', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Current')).toBeTruthy());
    expect(screen.getByText('Longest')).toBeTruthy();
    expect(screen.getByText('This Week')).toBeTruthy();
  });

  it('shows daily missions on overview', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Pitch Training')).toBeTruthy());
    expect(screen.getByText('Complete 3 intervals')).toBeTruthy();
  });

  it('shows recent achievements on overview', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('First Step')).toBeTruthy());
    expect(screen.getByText('On Fire')).toBeTruthy();
  });

  it('displays identity card', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('testuser')).toBeTruthy());
    expect(screen.getByText('Piano')).toBeTruthy();
    expect(screen.getByText('Melodic Skills')).toBeTruthy();
  });

  it('switches to skills tab', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Your Progress')).toBeTruthy());
    await act(async () => {
      screen.getByText('Skills').click();
    });
    await waitFor(() => {
      expect(screen.getByText('Skill Tree')).toBeTruthy();
      expect(screen.getByText('65/100')).toBeTruthy();
      expect(screen.getByText('40/100')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('switches to achievements tab', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Your Progress')).toBeTruthy());
    screen.getByText('Achievements').click();
    await waitFor(() => expect(screen.getByText('5 / 25 Unlocked')).toBeTruthy());
    expect(screen.getByText('Week Warrior')).toBeTruthy();
  });

  it('switches to missions tab', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Your Progress')).toBeTruthy());
    screen.getByText('Missions').click();
    await waitFor(() => expect(screen.getByText('Pitch Training')).toBeTruthy());
  });

  it('shows error state on API failure', async () => {
    progressApi.getSummary.mockRejectedValue(new Error('Network error'));
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Network error')).toBeTruthy());
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('retry button reloads data', async () => {
    progressApi.getSummary.mockRejectedValueOnce(new Error('fail'));
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Retry')).toBeTruthy());
    progressApi.getSummary.mockResolvedValue(mockSummary);
    screen.getByText('Retry').click();
    await waitFor(() => expect(screen.getByText('Your Progress')).toBeTruthy());
  });

  it('back button exists', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Back')).toBeTruthy());
  });
});
