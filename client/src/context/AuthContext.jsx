import { useEffect, useState } from "react";
import { authApi } from "../api/auth";
import { setAuthToken } from "../api/client";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("qoldan_token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setAuthToken(null);
        setIsLoading(false);
        return;
      }

      try {
        setAuthToken(token);
        const { data } = await authApi.me();
        setUser(data.user);
      } catch {
        localStorage.removeItem("qoldan_token");
        setAuthToken(null);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, [token]);

  const saveSession = (payload) => {
    localStorage.setItem("qoldan_token", payload.token);
    setAuthToken(payload.token);
    setToken(payload.token);
    setUser(payload.user);
  };

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);
    saveSession(data);
    return data;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    saveSession(data);
    return data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network issues during local logout.
    } finally {
      localStorage.removeItem("qoldan_token");
      setAuthToken(null);
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
