import api from "./client";

export const speechApi = {
  getExercises: () => api.get("/api/speech/exercises"),
  getExercise: (id) => api.get(`/api/speech/exercises/${id}`),
  analyzePitch: (data) => api.post("/api/speech/analyze-pitch", data),
  analyzeVolume: (data) => api.post("/api/speech/analyze-volume", data),
  score: (data) => api.post("/api/speech/score", data),
  analyzeSession: (data) => api.post("/api/speech/analyze-session", data),
  uploadAudio: (formData) => api.post("/api/speech/upload-audio", formData),
};
