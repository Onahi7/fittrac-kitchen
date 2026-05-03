import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

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

interface RiderProfile {
  id: string;
  name: string;
  phone: string;
  vehicleType: "motorcycle" | "bicycle" | "car";
  rating: number;
  totalDeliveries: number;
}

interface RiderContextValue {
  rider: RiderProfile | null;
  isOnline: boolean;
  activeOrder: RiderOrder | null;
  availableOrders: RiderOrder[];
  todayEarnings: number;
  todayDeliveries: number;
  isLoading: boolean;
  login: (phone: string, pin: string) => Promise<boolean>;
  logout: () => void;
  toggleOnline: () => void;
  acceptOrder: (order: RiderOrder) => Promise<void>;
  updateStatus: (status: RiderOrder["status"]) => Promise<void>;
}

const RiderContext = createContext<RiderContextValue | null>(null);

const TOKEN_KEY = "fk_rider_token";

export function RiderProvider({ children }: { children: ReactNode }) {
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isOnline, setIsOnline] = useState(false);
  const [activeOrder, setActiveOrder] = useState<RiderOrder | null>(null);
  const [availableOrders, setAvailableOrders] = useState<RiderOrder[]>([]);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayDeliveries, setTodayDeliveries] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDeliveryId, setActiveDeliveryId] = useState<string | null>(null);

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) { setIsLoading(false); return; }
    setToken(savedToken);
    fetch("/api/riders/me", { headers: { Authorization: `Bearer ${savedToken}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.id) setRider(data as RiderProfile);
        else { localStorage.removeItem(TOKEN_KEY); setToken(null); }
      })
      .catch(() => { localStorage.removeItem(TOKEN_KEY); setToken(null); })
      .finally(() => setIsLoading(false));
  }, []);

  // Load stats when rider is set
  useEffect(() => {
    if (!token || !rider) return;
    fetch("/api/riders/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setTodayEarnings(data.todayEarnings ?? 0);
          setTodayDeliveries(data.todayDeliveries ?? 0);
        }
      })
      .catch(() => {});
  }, [token, rider]);

  // Poll available orders when online and no active order
  useEffect(() => {
    if (!isOnline || activeOrder || !token) {
      setAvailableOrders([]);
      return;
    }
    const fetchOrders = () => {
      fetch("/api/riders/available-orders", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : { orders: [] })
        .then((data) => setAvailableOrders(data.orders ?? []))
        .catch(() => {});
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [isOnline, activeOrder, token]);

  const login = async (phone: string, pin: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/riders/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (!data.token || !data.rider) return false;
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setRider(data.rider as RiderProfile);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    if (token) {
      await fetch("/api/riders/logout", { method: "POST", headers: authHeaders() }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setRider(null);
    setIsOnline(false);
    setActiveOrder(null);
    setAvailableOrders([]);
    setTodayEarnings(0);
    setTodayDeliveries(0);
    setActiveDeliveryId(null);
  };

  const toggleOnline = () => setIsOnline((v) => !v);

  const acceptOrder = async (order: RiderOrder) => {
    if (!token) return;
    try {
      const res = await fetch("/api/riders/accept-order", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ orderId: order.orderId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.deliveryId) setActiveDeliveryId(data.deliveryId);
      setActiveOrder({ ...order, status: "accepted" });
      setAvailableOrders([]);
    } catch { /* optimistic — set order anyway */ }
  };

  const updateStatus = async (status: RiderOrder["status"]) => {
    if (!activeOrder || !token) return;

    if (activeDeliveryId) {
      await fetch(`/api/riders/delivery/${activeDeliveryId}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      }).catch(() => {});
    }

    if (status === "delivered") {
      setTodayEarnings((e) => e + activeOrder.earnings);
      setTodayDeliveries((d) => d + 1);
      setActiveDeliveryId(null);
      setTimeout(() => setActiveOrder(null), 2000);
    }
    setActiveOrder((o) => o ? { ...o, status } : o);
  };

  return (
    <RiderContext.Provider value={{
      rider, isOnline, activeOrder, availableOrders,
      todayEarnings, todayDeliveries, isLoading,
      login, logout, toggleOnline, acceptOrder, updateStatus,
    }}>
      {children}
    </RiderContext.Provider>
  );
}

export function useRider() {
  const ctx = useContext(RiderContext);
  if (!ctx) throw new Error("useRider outside RiderProvider");
  return ctx;
}
