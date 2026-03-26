// src/context/AuthContext.tsx
import { useState, useEffect, createContext, useContext } from "react";
import type { ReactNode } from "react";
import { api } from "../lib/api";
import type { User } from "../lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = api.loadToken();
    if (accessToken) {
      api
        .me()
        .then(setUser)
        .catch(() => api.clearTokens())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    const handleAuthLogout = () => {
      setUser(null);
      setLoading(false);
    };
    window.addEventListener("auth:logout", handleAuthLogout);
    return () => window.removeEventListener("auth:logout", handleAuthLogout);
  }, []);

  const login = async (email: string, password: string) => {
    const { accessToken, refreshToken, user } = await api.login({ email, password });
    api.setTokens(accessToken, refreshToken);
    setUser(user);
  };

  const register = async (name: string, email: string, password: string) => {
    const { accessToken, refreshToken, user } = await api.register({ name, email, password });
    api.setTokens(accessToken, refreshToken);
    setUser(user);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("fintrack_refresh_token");
    if (refreshToken) {
      await api.logout(refreshToken).catch(() => {});
    }
    api.clearTokens();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => setUser(updatedUser);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}