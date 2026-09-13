import api from "./client";

export const worldMusicApi = {
  getOverview: () => api.get("/api/world-music"),
  getTraditions: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.region) qs.set("region", params.region);
    if (params.difficulty) qs.set("difficulty", params.difficulty);
    if (params.search) qs.set("search", params.search);
    const query = qs.toString();
    return api.get(`/api/world-music/traditions${query ? "?" + query : ""}`);
  },
  getTradition: (id) => api.get(`/api/world-music/traditions/${id}`),
  getRegions: () => api.get("/api/world-music/regions"),
  getInstruments: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.tradition) qs.set("tradition", params.tradition);
    if (params.region) qs.set("region", params.region);
    if (params.family) qs.set("family", params.family);
    const query = qs.toString();
    return api.get(`/api/world-music/instruments${query ? "?" + query : ""}`);
  },
  getScales: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.tradition) qs.set("tradition", params.tradition);
    if (params.search) qs.set("search", params.search);
    const query = qs.toString();
    return api.get(`/api/world-music/scales${query ? "?" + query : ""}`);
  },
  getRhythms: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.tradition) qs.set("tradition", params.tradition);
    const query = qs.toString();
    return api.get(`/api/world-music/rhythms${query ? "?" + query : ""}`);
  },
  getLearningPaths: () => api.get("/api/world-music/learning-paths"),
  getLearningPath: (id) => api.get(`/api/world-music/learning-paths/${id}`),
  compare: (ids) => api.get(`/api/world-music/compare?ids=${ids.join(",")}`),
};
