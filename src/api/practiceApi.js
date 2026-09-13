import api from "./client";

export const practiceApi = {
  createSession(data) {
    return api.post("/api/practice/sessions", data);
  },

  getSessions(activity, limit = 50) {
    const params = new URLSearchParams();
    if (activity) params.set("activity", activity);
    if (limit) params.set("limit", String(limit));
    const qs = params.toString();
    return api.get(`/api/practice/sessions${qs ? "?" + qs : ""}`);
  },

  getHistory(filters = {}) {
    const params = new URLSearchParams();
    if (filters.activity) params.set("activity", filters.activity);
    if (filters.topic) params.set("topic", filters.topic);
    if (filters.limit) params.set("limit", String(filters.limit));
    if (filters.offset) params.set("offset", String(filters.offset));
    const qs = params.toString();
    return api.get(`/api/practice/history${qs ? "?" + qs : ""}`);
  },

  getSummary() {
    return api.get("/api/practice/summary");
  },

  getStats() {
    return api.get("/api/practice/stats");
  },

  getAchievements() {
    return api.get("/api/practice/achievements");
  },
};

export const dashboardApi = {
  getDashboard() {
    return api.get("/api/dashboard");
  },
};
