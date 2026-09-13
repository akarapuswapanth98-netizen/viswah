import { cachedFetch, invalidateCache, invalidateExact } from "../utils/cache";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8003").trim();

class ApiClient {
  constructor() {
    this.baseUrl = API_URL;
  }

  getToken() {
    return localStorage.getItem("viswah_token");
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers = {
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        localStorage.removeItem("viswah_token");
        invalidateCache(null);
        window.dispatchEvent(new CustomEvent("auth:expired"));
        throw new ApiError("Session expired. Please log in again.", 401);
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = {};
        }
        const message = errorData.detail || errorData.message || `Request failed (${response.status})`;
        throw new ApiError(message, response.status);
      }

      if (response.status === 204) return null;
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("Network error. Please check your connection.", 0);
    }
  }

  get(endpoint, { ttl = 30000, useCache = true } = {}) {
    if (!useCache) return this.request(endpoint, { method: "GET" });
    return cachedFetch(
      `get:${endpoint}`,
      () => this.request(endpoint, { method: "GET" }),
      ttl
    );
  }

  post(endpoint, body) {
    if (endpoint.startsWith("/api/enroll/")) {
      const courseId = endpoint.split("/api/enroll/")[1];
      invalidateExact("get:/api/enrolled", "get:/api/courses", `get:/api/courses/${courseId}`);
    } else if (endpoint === "/api/progress") {
      invalidateExact("get:/api/progress");
    } else {
      invalidateCache(endpoint.split("/").slice(0, 4).join("/"));
    }
    if (body instanceof FormData) {
      return this.request(endpoint, { method: "POST", body });
    }
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body) {
    if (endpoint.startsWith("/api/progress/")) {
      invalidateExact("get:/api/progress");
    } else {
      invalidateCache(endpoint.split("/").slice(0, 4).join("/"));
    }
    if (body instanceof FormData) {
      return this.request(endpoint, { method: "PUT", body });
    }
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  patch(endpoint, body) {
    if (endpoint.startsWith("/api/progress/")) {
      invalidateExact("get:/api/progress");
    } else {
      invalidateCache(endpoint.split("/").slice(0, 4).join("/"));
    }
    if (body instanceof FormData) {
      return this.request(endpoint, { method: "PATCH", body });
    }
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  delete(endpoint) {
    invalidateCache(endpoint.split("/").slice(0, 4).join("/"));
    return this.request(endpoint, { method: "DELETE" });
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

const api = new ApiClient();
export default api;
