import api from "./client";

export const indianMusicApi = {
  getRagas: () => api.get("/api/v1/indian-music/ragas"),
  getRaga: (id) => api.get(`/api/v1/indian-music/ragas/${id}`),
  getTalas: () => api.get("/api/v1/indian-music/talas"),
  getSargam: () => api.get("/api/v1/indian-music/sargam"),
};
