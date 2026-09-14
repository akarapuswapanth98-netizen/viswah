import api from './client.js';

export const progressApi = {
  getProgress: async () => {
    const res = await api.get('/api/progress');
    return res;
  },

  getSummary: async () => {
    const res = await api.get('/api/progress/summary');
    return res;
  },

  getSkills: async () => {
    const res = await api.get('/api/progress/skills');
    return res;
  },

  getAchievements: async () => {
    const res = await api.get('/api/progress/achievements');
    return res;
  },

  getMissions: async () => {
    const res = await api.get('/api/progress/missions');
    return res;
  },

  getIdentity: async () => {
    const res = await api.get('/api/progress/identity');
    return res;
  },

  getLeaderboard: async (type = 'weekly_xp') => {
    const res = await api.get(`/api/progress/leaderboard?type=${type}`);
    return res;
  },

  getJourney: async () => {
    const res = await api.get('/api/progress/journey');
    return res;
  },

  completeChallenge: async (missionId) => {
    const res = await api.post(`/api/progress/challenge/${missionId}/complete`);
    return res;
  },

  getGamificationProfile: async () => {
    const res = await api.get('/api/progress/gamification-profile');
    return res;
  },
};

export default progressApi;
