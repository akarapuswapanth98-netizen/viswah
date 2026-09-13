import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../api/authApi";
import { invalidateCache } from "../utils/cache";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("viswah_token"));
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(() => !localStorage.getItem("viswah_token"));

  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem("viswah_token");
    if (!storedToken) {
      setLoading(false);
      setIsGuest(true);
      return;
    }
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      setIsGuest(false);
    } catch {
      localStorage.removeItem("viswah_token");
      setToken(null);
      setUser(null);
      setIsGuest(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    const handleExpired = () => {
      setToken(null);
      setUser(null);
      setIsGuest(true);
      localStorage.removeItem("viswah_token");
      invalidateCache(null);
    };
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authApi.login({ email, password });
      localStorage.setItem("viswah_token", response.access_token);
      setToken(response.access_token);
      setIsGuest(false);
      await loadUser();
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await authApi.register({ username, email, password });
      const loginResponse = await authApi.login({ email, password });
      localStorage.setItem("viswah_token", loginResponse.access_token);
      setToken(loginResponse.access_token);
      setIsGuest(false);
      await loadUser();
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("viswah_token");
    setToken(null);
    setUser(null);
    setIsGuest(true);
    invalidateCache(null);
  };

  const continueAsGuest = () => {
    setIsGuest(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isGuest,
        login,
        register,
        logout,
        continueAsGuest,
        refreshUser: loadUser,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
