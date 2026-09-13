import api from "./client";

export const aiApi = {
  generateLesson: (data) => api.post("/api/ai/generate-lesson", data),
  generateExercise: (data) => api.post("/api/ai/generate-exercise", data),
  getTopics: (instrument, difficulty) => api.get(`/api/ai/topics/${instrument}/${difficulty}`),
};
