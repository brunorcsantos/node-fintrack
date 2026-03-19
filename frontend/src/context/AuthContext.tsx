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
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Ao carregar o app, verifica se já existe token salvo
  useEffect(() => {
    const token = api.loadToken();
    if (token) {
      api
        .me()
        .then(setUser)
        .catch(() => api.setToken(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Escuta evento de logout por token expirado
    const handleAuthLogout = () => {
      setUser(null);
      setLoading(false);
    };
    window.addEventListener("auth:logout", handleAuthLogout);
    return () => window.removeEventListener("auth:logout", handleAuthLogout);
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await api.login({ email, password });
    api.setToken(token);
    setUser(user);
  };

  const register = async (name: string, email: string, password: string) => {
    const { token, user } = await api.register({ name, email, password });
    api.setToken(token);
    setUser(user);
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

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
