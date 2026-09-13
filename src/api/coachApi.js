import api from "./client";

export const coachApi = {
  getSummary: () => api.get("/api/ai-coach/summary"),
  getRecommendation: () => api.get("/api/ai-coach/recommendation"),
  getPlan: (duration = 10) => api.post(`/api/ai-coach/plan?duration_minutes=${duration}`),
  sendMessage: (message) => api.post("/api/ai-coach/message", { message }),
};
