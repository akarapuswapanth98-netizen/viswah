import api from "./client";

export const authApi = {
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => api.post("/api/auth/login", data),
  getMe: () => api.get("/api/auth/me"),
  updateMe: (data) => api.patch("/api/auth/me", data),
};
