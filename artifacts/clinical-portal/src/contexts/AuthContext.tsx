import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

export type StaffRole = "doctor" | "nutritionist";

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  title: string;
  speciality: string;
  avatar?: string;
}

interface AuthContextType {
  staff: Staff | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, staff: Staff) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedToken = localStorage.getItem("fk_clinical_token");
    const storedStaff = localStorage.getItem("fk_clinical_staff");
    if (storedToken && storedStaff) {
      setToken(storedToken);
      try {
        setStaff(JSON.parse(storedStaff));
      } catch (e) {
        console.error("Failed to parse stored staff", e);
      }
    }
  }, []);

  const login = (newToken: string, newStaff: Staff) => {
    setToken(newToken);
    setStaff(newStaff);
    localStorage.setItem("fk_clinical_token", newToken);
    localStorage.setItem("fk_clinical_staff", JSON.stringify(newStaff));
    setLocation("/dashboard");
  };

  const logout = () => {
    setToken(null);
    setStaff(null);
    localStorage.removeItem("fk_clinical_token");
    localStorage.removeItem("fk_clinical_staff");
    setLocation("/");
  };

  return (
    <AuthContext.Provider value={{ staff, token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
