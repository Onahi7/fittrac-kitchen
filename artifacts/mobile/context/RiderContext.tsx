import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface RiderOrder {
  id: string;
  orderId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: string[];
  total: number;
  pickupAddress: string;
  distance: string;
  estimatedTime: number;
  status: "available" | "accepted" | "picked_up" | "delivered";
  earnings: number;
}

export interface RiderProfile {
  id: string;
  name: string;
  phone: string;
  vehicleType: "motorcycle" | "bicycle" | "car";
  rating: number;
  totalDeliveries: number;
}

interface RiderContextValue {
  rider: RiderProfile | null;
  riderToken: string | null;
  isLoading: boolean;
  isOnline: boolean;
  activeOrder: RiderOrder | null;
  availableOrders: RiderOrder[];
  todayEarnings: number;
  todayDeliveries: number;
  login: (phone: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleOnline: () => void;
  refresh: () => Promise<void>;
  acceptOrder: (order: RiderOrder) => Promise<void>;
  updateStatus: (status: RiderOrder["status"]) => Promise<void>;
}

const RiderContext = createContext<RiderContextValue | null>(null);

const TOKEN_KEY = "fk_rider_token";
const RIDER_KEY = "fk_rider_profile";

export function RiderProvider({ children }: { children: React.ReactNode }) {
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [riderToken, setRiderToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [activeOrder, setActiveOrder] = useState<RiderOrder | null>(null);
  const [availableOrders, setAvailableOrders] = useState<RiderOrder[]>([]);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayDeliveries, setTodayDeliveries] = useState(0);
  const [activeDeliveryId, setActiveDeliveryId] = useState<string | null>(null);

  const authHeaders = useCallback((token = riderToken) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token ?? ""}`,
  }), [riderToken]);

  const saveSession = async (token: string, profile: RiderProfile) => {
    setRiderToken(token);
    setRider(profile);
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, token),
      AsyncStorage.setItem(RIDER_KEY, JSON.stringify(profile)),
    ]);
  };

  const clearSession = async () => {
    setRiderToken(null);
    setRider(null);
    setIsOnline(false);
    setActiveOrder(null);
    setAvailableOrders([]);
    setTodayEarnings(0);
    setTodayDeliveries(0);
    setActiveDeliveryId(null);
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(RIDER_KEY),
    ]);
  };

  const loadStats = useCallback(async (token = riderToken) => {
    if (!token) return;
    try {
      const res = await fetch("/api/riders/stats", { headers: authHeaders(token) });
      if (!res.ok) return;
      const data = await res.json();
      setTodayEarnings(data.todayEarnings ?? 0);
      setTodayDeliveries(data.todayDeliveries ?? 0);
    } catch {}
  }, [authHeaders, riderToken]);

  const loadAvailableOrders = useCallback(async (token = riderToken) => {
    if (!token || activeOrder || !isOnline) return;
    try {
      const res = await fetch("/api/riders/available-orders", { headers: authHeaders(token) });
      if (!res.ok) {
        setAvailableOrders([]);
        return;
      }
      const data = await res.json();
      setAvailableOrders(data.orders ?? []);
    } catch {
      setAvailableOrders([]);
    }
  }, [activeOrder, authHeaders, isOnline, riderToken]);

  const refresh = useCallback(async () => {
    await Promise.all([loadStats(), loadAvailableOrders()]);
  }, [loadAvailableOrders, loadStats]);

  useEffect(() => {
    (async () => {
      try {
        const [token, riderJson] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(RIDER_KEY),
        ]);
        if (!token || !riderJson) return;
        const res = await fetch("/api/riders/me", { headers: authHeaders(token) });
        if (!res.ok) {
          await clearSession();
          return;
        }
        const profile = await res.json();
        await saveSession(token, profile);
        await loadStats(token);
      } catch {
        await clearSession();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!riderToken || !isOnline || activeOrder) {
      setAvailableOrders([]);
      return;
    }
    loadAvailableOrders();
    const timer = setInterval(loadAvailableOrders, 15000);
    return () => clearInterval(timer);
  }, [activeOrder, isOnline, loadAvailableOrders, riderToken]);

  const login = useCallback(async (phone: string, pin: string) => {
    const res = await fetch("/api/riders/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, pin }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.token || !data.rider) {
      throw new Error(data.error ?? "Invalid rider credentials");
    }
    await saveSession(data.token, data.rider);
    await loadStats(data.token);
  }, [loadStats]);

  const logout = useCallback(async () => {
    if (riderToken) {
      fetch("/api/riders/logout", { method: "POST", headers: authHeaders() }).catch(() => {});
    }
    await clearSession();
  }, [authHeaders, riderToken]);

  const toggleOnline = useCallback(() => setIsOnline((v) => !v), []);

  const acceptOrder = useCallback(async (order: RiderOrder) => {
    if (!riderToken) return;
    const res = await fetch("/api/riders/accept-order", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ orderId: order.orderId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Could not accept order");
    setActiveDeliveryId(data.deliveryId ?? null);
    setActiveOrder({ ...order, status: "accepted" });
    setAvailableOrders([]);
  }, [authHeaders, riderToken]);

  const updateStatus = useCallback(async (status: RiderOrder["status"]) => {
    if (!activeOrder || !riderToken) return;
    if (activeDeliveryId) {
      await fetch(`/api/riders/delivery/${activeDeliveryId}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      }).catch(() => {});
    }
    setActiveOrder((order) => order ? { ...order, status } : order);
    if (status === "delivered") {
      setTodayEarnings((value) => value + activeOrder.earnings);
      setTodayDeliveries((value) => value + 1);
      setActiveDeliveryId(null);
      setTimeout(() => setActiveOrder(null), 1800);
    }
  }, [activeDeliveryId, activeOrder, authHeaders, riderToken]);

  return (
    <RiderContext.Provider value={{
      rider, riderToken, isLoading, isOnline, activeOrder, availableOrders,
      todayEarnings, todayDeliveries, login, logout, toggleOnline, refresh,
      acceptOrder, updateStatus,
    }}>
      {children}
    </RiderContext.Provider>
  );
}

export function useRider() {
  const ctx = useContext(RiderContext);
  if (!ctx) throw new Error("useRider must be used within RiderProvider");
  return ctx;
}
