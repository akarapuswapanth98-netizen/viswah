import api from "./client";

const subscriptionApi = {
  getSubscription: () => api.get("/api/subscription"),
  getPlans: () => api.get("/api/subscription/plans"),
  getEntitlements: () => api.get("/api/subscription/entitlements"),
  getUsage: (usageType) => api.get(`/api/subscription/usage/${usageType}`),
  createCheckout: (planId) => api.post("/api/subscription/checkout", { plan_id: planId }),
  verifyPayment: (data) => api.post("/api/subscription/verify", data),
  cancelSubscription: () => api.post("/api/subscription/cancel"),
  reactivateSubscription: () => api.post("/api/subscription/reactivate"),
  getBillingHistory: () => api.get("/api/subscription/history"),
  checkFeature: (feature) => api.get(`/api/subscription/check/${feature}`),
};

export default subscriptionApi;
