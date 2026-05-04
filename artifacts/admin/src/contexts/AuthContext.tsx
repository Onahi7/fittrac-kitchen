import React, { createContext, useContext, useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";

interface AdminUser {
  username: string;
  role: string;
  token: string;
}

interface AuthContextValue {
  user: AdminUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "fk_admin_token";
const USER_KEY = "fk_admin_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (token && userStr) {
      try {
        setUser({ ...JSON.parse(userStr), token });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch(apiUrl("/api/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        return { success: false, error: data.error ?? "Login failed" };
      }
      const data = await res.json();
      const adminUser: AdminUser = { username: data.username, role: data.role, token: data.token };
      setUser(adminUser);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify({ username: data.username, role: data.role }));
      return { success: true };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const logout = async () => {
    if (user) {
      try {
        await fetch(apiUrl("/api/admin/logout"), {
          method: "POST",
          headers: { Authorization: `Bearer ${user.token}` },
        });
      } catch {}
    }
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useAdminFetch() {
  const { user, logout } = useAuth();
  return async (url: string, options: RequestInit = {}) => {
    const res = await fetch(apiUrl(url), {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${user?.token ?? ""}`,
        "Content-Type": "application/json",
      },
    });
    if (res.status === 401) {
      logout();
      throw new Error("Session expired");
    }
    return res;
  };
}
