import api from "./client";

export const lyricsApi = {
  getGenres: () => api.get("/api/lyrics/genres"),
  getMoods: () => api.get("/api/lyrics/moods"),
  generate: (data) => api.post("/api/lyrics/generate", data),
  improve: (data) => api.post("/api/lyrics/improve", data),
  analyze: (data) => api.post("/api/lyrics/analyze", data),
  format: (data) => api.post("/api/lyrics/format", data),
};
