import api from "./client";

export const courseApi = {
  getCourses: () => api.get("/api/courses"),
  getCourse: (id) => api.get(`/api/courses/${id}`),
  getLessons: (courseId) => api.get(`/api/courses/${courseId}/lessons`),
  getLesson: (id) => api.get(`/api/lessons/${id}`),
  enroll: (courseId) => api.post(`/api/enroll/${courseId}`),
  getEnrolled: () => api.get("/api/enrolled"),
};
