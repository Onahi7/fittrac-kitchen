import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const TOKEN_KEY = "fk_clinical_token";
const STAFF_KEY = "fk_clinical_staff";

export interface ClinicalStaff {
  id: string;
  name: string;
  role: "doctor" | "nutritionist";
  email: string;
  specialization: string;
  badge: string;
}

interface ClinicalAuthContextValue {
  clinicalStaff: ClinicalStaff | null;
  clinicalToken: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const ClinicalAuthContext = createContext<ClinicalAuthContextValue | null>(null);

export function ClinicalAuthProvider({ children }: { children: React.ReactNode }) {
  const [clinicalStaff, setClinicalStaff] = useState<ClinicalStaff | null>(null);
  const [clinicalToken, setClinicalToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [token, staffJson] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(STAFF_KEY),
        ]);
        if (token && staffJson) {
          setClinicalToken(token);
          setClinicalStaff(JSON.parse(staffJson));
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch("/api/clinical-staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Invalid credentials");
    }
    const data = await res.json();
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, data.token),
      AsyncStorage.setItem(STAFF_KEY, JSON.stringify(data.staff)),
    ]);
    setClinicalToken(data.token);
    setClinicalStaff(data.staff);
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(STAFF_KEY),
    ]);
    setClinicalToken(null);
    setClinicalStaff(null);
  }, []);

  return (
    <ClinicalAuthContext.Provider value={{ clinicalStaff, clinicalToken, isLoading, login, logout }}>
      {children}
    </ClinicalAuthContext.Provider>
  );
}

export function useClinicalAuth() {
  const ctx = useContext(ClinicalAuthContext);
  if (!ctx) throw new Error("useClinicalAuth must be used inside ClinicalAuthProvider");
  return ctx;
}
