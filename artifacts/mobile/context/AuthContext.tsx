import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  conditions: string[];
  patient_id?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, phone: string, password: string, conditions: string[]) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "fk_auth_token";
const USER_KEY = "fk_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.access_token) {
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (savedToken) return;
        try {
          const res = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: session.access_token }),
          });
          const data = await res.json();
          if (res.ok && data.token) {
            await saveSession(data.token, data.user);
          }
        } catch {}
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadSession = async () => {
    try {
      const [savedToken, savedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        const refreshed = await fetchMe(savedToken);
        if (refreshed) {
          setUser(refreshed);
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(refreshed));
        } else {
          await clearSession();
        }
      }
    } catch {
      await clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMe = async (t: string): Promise<AuthUser | null> => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user ?? null;
    } catch {
      return null;
    }
  };

  const saveSession = async (t: string, u: AuthUser) => {
    setToken(t);
    setUser(u);
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, t),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(u)),
    ]);
  };

  const clearSession = async () => {
    setToken(null);
    setUser(null);
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Login failed");
    await saveSession(data.token, data.user);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error("Auth service not configured");
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}`
        : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw new Error(error.message);
  }, []);

  const register = useCallback(async (
    name: string,
    email: string,
    phone: string,
    password: string,
    conditions: string[],
  ) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password, conditions }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Registration failed");
    await saveSession(data.token, data.user);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    if (supabase) await supabase.auth.signOut().catch(() => {});
    await clearSession();
  }, [token]);

  const updateUser = useCallback(async (updates: Partial<AuthUser>) => {
    if (!token) return;
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Update failed");
    const updated = { ...user, ...data.user } as AuthUser;
    setUser(updated);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
  }, [token, user]);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!user && !!token,
      login, loginWithGoogle, register, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
