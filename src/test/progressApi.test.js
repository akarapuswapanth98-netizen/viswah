import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import { progressApi } from '../api/progressApi';
import api from '../api/client';

describe('progressApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getProgress exists and calls /api/progress', async () => {
    expect(typeof progressApi.getProgress).toBe('function');
    await progressApi.getProgress();
    expect(api.get).toHaveBeenCalledWith('/api/progress');
  });

  it('getSummary calls /api/progress/summary', async () => {
    await progressApi.getSummary();
    expect(api.get).toHaveBeenCalledWith('/api/progress/summary');
  });

  it('getAchievements calls /api/progress/achievements', async () => {
    await progressApi.getAchievements();
    expect(api.get).toHaveBeenCalledWith('/api/progress/achievements');
  });

  it('getMissions calls /api/progress/missions', async () => {
    await progressApi.getMissions();
    expect(api.get).toHaveBeenCalledWith('/api/progress/missions');
  });

  it('getLeaderboard calls correct endpoint', async () => {
    await progressApi.getLeaderboard('weekly_xp');
    expect(api.get).toHaveBeenCalledWith('/api/progress/leaderboard?type=weekly_xp');
  });

  it('getJourney calls /api/progress/journey', async () => {
    await progressApi.getJourney();
    expect(api.get).toHaveBeenCalledWith('/api/progress/journey');
  });

  it('getGamificationProfile calls /api/progress/gamification-profile', async () => {
    await progressApi.getGamificationProfile();
    expect(api.get).toHaveBeenCalledWith('/api/progress/gamification-profile');
  });

  it('completeChallenge posts to correct endpoint', async () => {
    await progressApi.completeChallenge('mission-123');
    expect(api.post).toHaveBeenCalledWith('/api/progress/challenge/mission-123/complete');
  });
});
