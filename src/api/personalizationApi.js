import api from "./client";

export const personalizationApi = {
  getSummary() {
    return api.get("/api/personalization/summary");
  },

  getSkillMap() {
    return api.get("/api/personalization/skill-map");
  },

  getRecommendations() {
    return api.get("/api/personalization/recommendations");
  },

  getMission() {
    return api.get("/api/personalization/mission");
  },

  getStreak() {
    return api.get("/api/personalization/streak");
  },
};
