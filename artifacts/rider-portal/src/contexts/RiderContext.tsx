import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  login: (phone: string, pin: string) => Promise<boolean>;
  logout: () => void;
  toggleOnline: () => void;
  acceptOrder: (order: RiderOrder) => void;
  updateStatus: (status: RiderOrder["status"]) => void;
}

const RiderContext = createContext<RiderContextValue | null>(null);

const MOCK_ORDERS: RiderOrder[] = [
  {
    id: "o1", orderId: "FK-2847", customerName: "Amaka Okonkwo",
    customerAddress: "14 Ademola Adetokunbo, Victoria Island, Lagos",
    customerPhone: "+234 803 456 7890", items: ["Moringa Jollof Rice", "Zobo Drink"],
    total: 6800, pickupAddress: "Fittrac Kitchen, Lekki Phase 1", distance: "3.2 km",
    estimatedTime: 18, status: "available", earnings: 850,
  },
  {
    id: "o2", orderId: "FK-2848", customerName: "Emeka Nwosu",
    customerAddress: "7 Bode Thomas, Surulere, Lagos",
    customerPhone: "+234 901 234 5678", items: ["Egusi Soup + Ofada Rice", "Tilapia Pepper Soup"],
    total: 9400, pickupAddress: "Fittrac Kitchen, Lekki Phase 1", distance: "5.8 km",
    estimatedTime: 28, status: "available", earnings: 1200,
  },
  {
    id: "o3", orderId: "FK-2849", customerName: "Fatima Bello",
    customerAddress: "22 Ibrahim Taiwo Road, Ikoyi, Lagos",
    customerPhone: "+234 815 678 9012", items: ["Diabetes Meal Box (3 days)", "Moringa Smoothie"],
    total: 18500, pickupAddress: "Fittrac Kitchen, Lekki Phase 1", distance: "2.1 km",
    estimatedTime: 12, status: "available", earnings: 2200,
  },
];

const MOCK_RIDER: RiderProfile = {
  id: "r1", name: "Chukwuemeka Adeyemi", phone: "+234 802 345 6789",
  vehicleType: "motorcycle", rating: 4.8, totalDeliveries: 347,
};

export function RiderProvider({ children }: { children: ReactNode }) {
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [activeOrder, setActiveOrder] = useState<RiderOrder | null>(null);
  const [availableOrders, setAvailableOrders] = useState<RiderOrder[]>([]);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayDeliveries, setTodayDeliveries] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("fk_rider");
    if (saved) {
      setRider(MOCK_RIDER);
      setTodayEarnings(4750);
      setTodayDeliveries(5);
    }
  }, []);

  useEffect(() => {
    if (isOnline && !activeOrder) {
      setAvailableOrders(MOCK_ORDERS.filter((o) => o.status === "available"));
    } else {
      setAvailableOrders([]);
    }
  }, [isOnline, activeOrder]);

  const login = async (phone: string, pin: string): Promise<boolean> => {
    if ((phone === "+234802345678" || phone === "08023456789" || phone === "rider") && pin === "1234") {
      setRider(MOCK_RIDER);
      setTodayEarnings(4750);
      setTodayDeliveries(5);
      localStorage.setItem("fk_rider", "true");
      return true;
    }
    return false;
  };

  const logout = () => {
    setRider(null);
    setIsOnline(false);
    setActiveOrder(null);
    localStorage.removeItem("fk_rider");
  };

  const toggleOnline = () => setIsOnline((v) => !v);

  const acceptOrder = (order: RiderOrder) => {
    setActiveOrder({ ...order, status: "accepted" });
    setAvailableOrders([]);
  };

  const updateStatus = (status: RiderOrder["status"]) => {
    if (!activeOrder) return;
    if (status === "delivered") {
      setTodayEarnings((e) => e + activeOrder.earnings);
      setTodayDeliveries((d) => d + 1);
      setTimeout(() => setActiveOrder(null), 2000);
    }
    setActiveOrder((o) => o ? { ...o, status } : o);
  };

  return (
    <RiderContext.Provider value={{ rider, isOnline, activeOrder, availableOrders, todayEarnings, todayDeliveries, login, logout, toggleOnline, acceptOrder, updateStatus }}>
      {children}
    </RiderContext.Provider>
  );
}

export function useRider() {
  const ctx = useContext(RiderContext);
  if (!ctx) throw new Error("useRider outside RiderProvider");
  return ctx;
}
