import api from "./client";

export const vocalGuruApi = {
  getGurus: () => api.get("/api/vocal-guru/gurus"),
  getGuru: (id) => api.get(`/api/vocal-guru/gurus/${id}`),
  getTopics: () => api.get("/api/vocal-guru/topics"),
  getLesson: (topic) => api.get(`/api/vocal-guru/lesson/${topic}`),
  getExercise: (topic) => api.get(`/api/vocal-guru/exercise/${topic}`),
  greet: (guruId) => api.post(`/api/vocal-guru/greet/${guruId}`),
  teach: (topic, guruId = 1) => api.post(`/api/vocal-guru/teach/${topic}?guru_id=${guruId}`),
  speak: (text, guruId = 1) => api.post("/api/vocal-guru/speak", { text, guru_id: guruId }),
  getFeedback: (data) => api.post("/api/vocal-guru/feedback", data),
};
