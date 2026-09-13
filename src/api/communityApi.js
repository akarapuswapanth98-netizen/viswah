import api from "./client";

const communityApi = {
  getMyProfile: () => api.get("/api/community/profile/me"),
  updateProfile: (data) => api.put("/api/community/profile/me", data),
  getPublicProfile: (username) => api.get(`/api/community/profile/${username}`),

  getFeed: (limit = 20, offset = 0) =>
    api.get(`/api/community/feed?limit=${limit}&offset=${offset}`),
  createPost: (data) => api.post("/api/community/posts", data),
  likePost: (postId) => api.post(`/api/community/posts/${postId}/like`),
  addComment: (postId, content) =>
    api.post(`/api/community/posts/${postId}/comment`, { content }),
  getComments: (postId) => api.get(`/api/community/posts/${postId}/comments`),

  followUser: (userId) => api.post(`/api/community/follow/${userId}`),
  getFollowers: (userId) => api.get(`/api/community/followers/${userId}`),
  getFollowing: (userId) => api.get(`/api/community/following/${userId}`),
  getPartners: (limit = 10) => api.get(`/api/community/partners?limit=${limit}`),

  getGroups: (limit = 20, offset = 0) =>
    api.get(`/api/community/groups?limit=${limit}&offset=${offset}`),
  createGroup: (data) => api.post("/api/community/groups", data),
  getGroup: (groupId) => api.get(`/api/community/groups/${groupId}`),
  joinGroup: (groupId) => api.post(`/api/community/groups/${groupId}/join`),

  getChallenges: (limit = 20) => api.get(`/api/community/challenges?limit=${limit}`),
  joinChallenge: (challengeId) =>
    api.post(`/api/community/challenges/${challengeId}/join`),
  getChallengeParticipants: (challengeId) =>
    api.get(`/api/community/challenges/${challengeId}/participants`),

  getLeaderboard: (boardType = "weekly", limit = 20) =>
    api.get(`/api/community/leaderboard?board_type=${boardType}&limit=${limit}`),

  getNotifications: (limit = 20) =>
    api.get(`/api/community/notifications?limit=${limit}`),
  markNotificationsRead: () => api.post("/api/community/notifications/read"),
  getUnreadCount: () => api.get("/api/community/notifications/unread-count"),
};

export default communityApi;
