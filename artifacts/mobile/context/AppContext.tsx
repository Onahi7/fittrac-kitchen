import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type {
  BasketItem,
  Condition,
  Consultation,
  ExerciseLog,
  NutritionLog,
  Order,
  Prescription,
  TestRequest,
  UserProfile,
  WaterLog,
  WeightLog,
} from "@/constants/types";
import { useAuth } from "@/context/AuthContext";

interface AppContextValue {
  profile: UserProfile;
  basket: BasketItem[];
  orders: Order[];
  weightLogs: WeightLog[];
  nutritionLogs: NutritionLog[];
  exerciseLogs: ExerciseLog[];
  waterLogs: WaterLog[];
  consultations: Consultation[];
  prescriptions: Prescription[];
  testRequests: TestRequest[];
  isLoading: boolean;
  isOnboarded: boolean;
  sseConnected: boolean;
  setConditions: (conditions: Condition[]) => Promise<void>;
  setDietaryRestrictions: (restrictions: string[]) => Promise<void>;
  completeOnboarding: (conditions: Condition[]) => Promise<void>;
  addToBasket: (item: BasketItem) => void;
  removeFromBasket: (mealId: string) => void;
  clearBasket: () => void;
  placeOrder: (fulfillment: "delivery" | "pickup", address: string, paymentMethod: string) => Order;
  logWeight: (weight: number) => Promise<void>;
  logNutrition: (log: Omit<NutritionLog, "date">) => Promise<void>;
  logExercise: (log: Omit<ExerciseLog, "id" | "date">) => Promise<void>;
  logWater: (glasses: number) => Promise<void>;
  bookConsultation: (c: Omit<Consultation, "id" | "status">) => Promise<void>;
  addPrescription: (rx: Prescription) => void;
  addTestRequest: (tr: TestRequest) => void;
  updateTestRequest: (id: string, updates: Partial<TestRequest>) => void;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
  basketTotal: number;
  basketCount: number;
  todayNutrition: NutritionLog | null;
  currentWeight: number | null;
  todayWater: number;
  todayExercise: { minutes: number; calories: number; workouts: number };
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEYS = {
  profile: "fk_user_profile",
  orders: "fk_orders",
  weightLogs: "fk_weight_logs",
  nutritionLogs: "fk_nutrition_logs",
  exerciseLogs: "fk_exercise_logs",
  waterLogs: "fk_water_logs",
  consultations: "fk_consultations",
  prescriptions: "fk_prescriptions",
  testRequests: "fk_test_requests",
};

const defaultProfile: UserProfile = {
  isOnboarded: false,
  conditions: [],
  dietaryRestrictions: [],
};

function seedWeightLogs(): WeightLog[] {
  const logs: WeightLog[] = [];
  const base = 78.4;
  for (let i = 6; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    logs.push({
      date: d.toISOString().split("T")[0],
      weight: parseFloat((base - (6 - i) * 0.3 + Math.random() * 0.4).toFixed(1)),
    });
  }
  return logs;
}

function seedNutritionLogs(): NutritionLog[] {
  const logs: NutritionLog[] = [];
  for (let i = 5; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    logs.push({
      date: d.toISOString().split("T")[0],
      calories: 1600 + Math.floor(Math.random() * 400),
      protein: 85 + Math.floor(Math.random() * 30),
      carbs: 160 + Math.floor(Math.random() * 60),
      fat: 55 + Math.floor(Math.random() * 20),
      fiber: 22 + Math.floor(Math.random() * 12),
      source: "order",
      label: "Daily Total",
    });
  }
  return logs;
}

const EXERCISE_TYPES = ["Walking", "Jogging", "Cycling", "Swimming", "Strength Training", "Yoga", "HIIT", "Dance"];
const INTENSITIES: Array<"Low" | "Medium" | "High"> = ["Low", "Medium", "High"];
const CAL_PER_MIN: Record<string, number> = {
  Walking: 4, Jogging: 8, Cycling: 7, Swimming: 8.5,
  "Strength Training": 6, Yoga: 3, HIIT: 10, Dance: 5,
};
const INTENSITY_MULT: Record<string, number> = { Low: 0.7, Medium: 1.0, High: 1.3 };

function seedExerciseLogs(): ExerciseLog[] {
  const logs: ExerciseLog[] = [];
  for (let i = 6; i >= 1; i--) {
    if (Math.random() > 0.3) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const type = EXERCISE_TYPES[Math.floor(Math.random() * EXERCISE_TYPES.length)];
      const duration = [20, 30, 45, 60][Math.floor(Math.random() * 4)];
      const intensity = INTENSITIES[Math.floor(Math.random() * 3)];
      logs.push({
        id: `ex-${d.getTime()}`,
        date: d.toISOString().split("T")[0],
        type,
        duration,
        intensity,
        caloriesBurned: Math.round((CAL_PER_MIN[type] ?? 5) * duration * INTENSITY_MULT[intensity]),
      });
    }
  }
  return logs;
}

function seedWaterLogs(): WaterLog[] {
  const logs: WaterLog[] = [];
  for (let i = 6; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    logs.push({ date: d.toISOString().split("T")[0], glasses: 4 + Math.floor(Math.random() * 5) });
  }
  return logs;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [testRequests, setTestRequests] = useState<TestRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sseConnected, setSseConnected] = useState(false);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (user && user.conditions && user.conditions.length > 0) {
      setProfile((prev) => {
        if (JSON.stringify(prev.conditions) !== JSON.stringify(user.conditions)) {
          const updated = { ...prev, isOnboarded: true, conditions: user.conditions as Condition[] };
          AsyncStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(updated)).catch(() => {});
          return updated;
        }
        return { ...prev, isOnboarded: true };
      });
    } else if (user) {
      setProfile((prev) => ({ ...prev, isOnboarded: true }));
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      fetch("/api/auth/orders", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => {
          if (data.orders && data.orders.length > 0) {
            const mapped: Order[] = data.orders.map((o: any) => ({
              id: o.id,
              items: o.items ?? [],
              createdAt: o.created_at,
              deliveryDate: o.delivery_date ?? "",
              status: o.status,
              fulfillment: o.fulfillment,
              address: o.address ?? "",
              total: o.total,
              paymentMethod: o.payment_method ?? "",
            }));
            setOrders(mapped);
            AsyncStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(mapped)).catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [token]);

  useEffect(() => {
    let active = true;
    let retryTimer: ReturnType<typeof setTimeout>;

    const connect = async () => {
      try {
        const res = await fetch("/api/events/stream", {
          headers: { Accept: "text/event-stream" },
        });
        if (!res.ok || !res.body) throw new Error("SSE unavailable");
        if (active) setSseConnected(true);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (active) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const evt = JSON.parse(line.slice(6));
              if (evt.type === "ORDER_UPDATE" && evt.orderId) {
                setOrders((prev) => {
                  const updated = prev.map((o) =>
                    o.id === evt.orderId ? { ...o, status: evt.status as Order["status"] } : o
                  );
                  AsyncStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(updated)).catch(() => {});
                  return updated;
                });
              }
            } catch {}
          }
        }
      } catch {
        // connection failed or dropped — retry
      } finally {
        if (active) {
          setSseConnected(false);
          retryTimer = setTimeout(connect, 6000);
        }
      }
    };

    connect();
    return () => {
      active = false;
      clearTimeout(retryTimer);
      setSseConnected(false);
    };
  }, []);

  const loadData = async () => {
    try {
      const results = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.profile),
        AsyncStorage.getItem(STORAGE_KEYS.orders),
        AsyncStorage.getItem(STORAGE_KEYS.weightLogs),
        AsyncStorage.getItem(STORAGE_KEYS.nutritionLogs),
        AsyncStorage.getItem(STORAGE_KEYS.exerciseLogs),
        AsyncStorage.getItem(STORAGE_KEYS.waterLogs),
        AsyncStorage.getItem(STORAGE_KEYS.consultations),
        AsyncStorage.getItem(STORAGE_KEYS.prescriptions),
        AsyncStorage.getItem(STORAGE_KEYS.testRequests),
      ]);
      const [profileStr, ordersStr, weightStr, nutritionStr, exerciseStr, waterStr, consultStr, rxStr, trStr] = results;

      if (profileStr) setProfile(JSON.parse(profileStr));
      if (ordersStr) setOrders(JSON.parse(ordersStr));
      if (weightStr) { setWeightLogs(JSON.parse(weightStr)); } else {
        const seed = seedWeightLogs(); setWeightLogs(seed);
        await AsyncStorage.setItem(STORAGE_KEYS.weightLogs, JSON.stringify(seed));
      }
      if (nutritionStr) { setNutritionLogs(JSON.parse(nutritionStr)); } else {
        const seed = seedNutritionLogs(); setNutritionLogs(seed);
        await AsyncStorage.setItem(STORAGE_KEYS.nutritionLogs, JSON.stringify(seed));
      }
      if (exerciseStr) { setExerciseLogs(JSON.parse(exerciseStr)); } else {
        const seed = seedExerciseLogs(); setExerciseLogs(seed);
        await AsyncStorage.setItem(STORAGE_KEYS.exerciseLogs, JSON.stringify(seed));
      }
      if (waterStr) { setWaterLogs(JSON.parse(waterStr)); } else {
        const seed = seedWaterLogs(); setWaterLogs(seed);
        await AsyncStorage.setItem(STORAGE_KEYS.waterLogs, JSON.stringify(seed));
      }
      if (consultStr) setConsultations(JSON.parse(consultStr));
      if (rxStr) setPrescriptions(JSON.parse(rxStr));
      if (trStr) setTestRequests(JSON.parse(trStr));
    } catch {} finally { setIsLoading(false); }
  };

  const saveProfile = async (p: UserProfile) => { setProfile(p); await AsyncStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(p)); };
  const saveOrders = async (o: Order[]) => { setOrders(o); await AsyncStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(o)); };
  const saveWeightLogs = async (logs: WeightLog[]) => { setWeightLogs(logs); await AsyncStorage.setItem(STORAGE_KEYS.weightLogs, JSON.stringify(logs)); };
  const saveNutritionLogs = async (logs: NutritionLog[]) => { setNutritionLogs(logs); await AsyncStorage.setItem(STORAGE_KEYS.nutritionLogs, JSON.stringify(logs)); };
  const saveExerciseLogs = async (logs: ExerciseLog[]) => { setExerciseLogs(logs); await AsyncStorage.setItem(STORAGE_KEYS.exerciseLogs, JSON.stringify(logs)); };
  const saveWaterLogs = async (logs: WaterLog[]) => { setWaterLogs(logs); await AsyncStorage.setItem(STORAGE_KEYS.waterLogs, JSON.stringify(logs)); };
  const saveConsultations = async (cons: Consultation[]) => { setConsultations(cons); await AsyncStorage.setItem(STORAGE_KEYS.consultations, JSON.stringify(cons)); };
  const savePrescriptions = async (rxs: Prescription[]) => { setPrescriptions(rxs); await AsyncStorage.setItem(STORAGE_KEYS.prescriptions, JSON.stringify(rxs)); };
  const saveTestRequests = async (trs: TestRequest[]) => { setTestRequests(trs); await AsyncStorage.setItem(STORAGE_KEYS.testRequests, JSON.stringify(trs)); };

  const completeOnboarding = useCallback(async (conditions: Condition[]) => {
    await saveProfile({ ...profile, isOnboarded: true, conditions });
  }, [profile]);

  const setConditions = useCallback(async (conditions: Condition[]) => {
    await saveProfile({ ...profile, conditions });
  }, [profile]);

  const setDietaryRestrictions = useCallback(async (restrictions: string[]) => {
    await saveProfile({ ...profile, dietaryRestrictions: restrictions });
  }, [profile]);

  const addToBasket = useCallback((item: BasketItem) => {
    setBasket((prev) => {
      const existing = prev.find((i) => i.meal.id === item.meal.id && i.mealType === item.mealType);
      if (existing) return prev.map((i) => i.meal.id === item.meal.id && i.mealType === item.mealType ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, item];
    });
  }, []);

  const removeFromBasket = useCallback((mealId: string) => {
    setBasket((prev) => prev.filter((i) => i.meal.id !== mealId));
  }, []);

  const clearBasket = useCallback(() => setBasket([]), []);

  const placeOrder = useCallback((fulfillment: "delivery" | "pickup", address: string, paymentMethod: string): Order => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const deliveryDate = tomorrow.toLocaleDateString("en-NG", { weekday: "long", month: "short", day: "numeric" });
    const total = basket.reduce((sum, i) => sum + i.meal.price * i.quantity, 0) + (fulfillment === "delivery" ? 1200 : 0);
    const order: Order = {
      id: `VIT-${Date.now().toString().slice(-4)}`,
      items: [...basket],
      createdAt: new Date().toISOString(),
      deliveryDate,
      status: "confirmed",
      fulfillment,
      address,
      total,
      paymentMethod,
    };
    const newOrders = [order, ...orders];
    saveOrders(newOrders);
    setBasket([]);
    if (token) {
      fetch("/api/auth/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: order.items, fulfillment, address, total, paymentMethod, deliveryDate }),
      }).catch(() => {});
    }
    return order;
  }, [basket, orders, token]);

  const logWeight = useCallback(async (weight: number) => {
    const today = new Date().toISOString().split("T")[0];
    const existing = weightLogs.find((l) => l.date === today);
    const updated = existing
      ? weightLogs.map((l) => (l.date === today ? { ...l, weight } : l))
      : [...weightLogs, { date: today, weight }];
    await saveWeightLogs(updated);
  }, [weightLogs]);

  const logNutrition = useCallback(async (log: Omit<NutritionLog, "date">) => {
    const today = new Date().toISOString().split("T")[0];
    const existing = nutritionLogs.find((l) => l.date === today && l.source === log.source);
    const updated = existing
      ? nutritionLogs.map((l) => l.date === today && l.source === log.source ? { ...l, ...log, date: today } : l)
      : [...nutritionLogs, { ...log, date: today }];
    await saveNutritionLogs(updated);
  }, [nutritionLogs]);

  const logExercise = useCallback(async (log: Omit<ExerciseLog, "id" | "date">) => {
    const today = new Date().toISOString().split("T")[0];
    const newLog: ExerciseLog = { ...log, id: `ex-${Date.now()}`, date: today };
    await saveExerciseLogs([...exerciseLogs, newLog]);
  }, [exerciseLogs]);

  const logWater = useCallback(async (glasses: number) => {
    const today = new Date().toISOString().split("T")[0];
    const existing = waterLogs.find((l) => l.date === today);
    const updated = existing
      ? waterLogs.map((l) => (l.date === today ? { ...l, glasses } : l))
      : [...waterLogs, { date: today, glasses }];
    await saveWaterLogs(updated);
  }, [waterLogs]);

  const bookConsultation = useCallback(async (c: Omit<Consultation, "id" | "status">) => {
    const consultation: Consultation = { ...c, id: `CON-${Date.now().toString().slice(-4)}`, status: "upcoming" };
    await saveConsultations([consultation, ...consultations]);
  }, [consultations]);

  const addPrescription = useCallback((rx: Prescription) => {
    savePrescriptions([rx, ...prescriptions]);
  }, [prescriptions]);

  const addTestRequest = useCallback((tr: TestRequest) => {
    saveTestRequests([tr, ...testRequests]);
  }, [testRequests]);

  const updateTestRequest = useCallback((id: string, updates: Partial<TestRequest>) => {
    const updated = testRequests.map((tr) => tr.id === id ? { ...tr, ...updates } : tr);
    saveTestRequests(updated);
  }, [testRequests]);

  const updateOrderStatus = useCallback((orderId: string, status: Order["status"]) => {
    setOrders((prev) => {
      const updated = prev.map((o) => o.id === orderId ? { ...o, status } : o);
      AsyncStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const basketTotal = basket.reduce((sum, i) => sum + i.meal.price * i.quantity, 0);
  const basketCount = basket.reduce((sum, i) => sum + i.quantity, 0);
  const today = new Date().toISOString().split("T")[0];
  const todayNutrition = nutritionLogs.find((l) => l.date === today) ?? null;
  const sortedWeights = [...weightLogs].sort((a, b) => b.date.localeCompare(a.date));
  const currentWeight = sortedWeights[0]?.weight ?? null;
  const todayWater = waterLogs.find((l) => l.date === today)?.glasses ?? 0;
  const todayExerciseLogs = exerciseLogs.filter((l) => l.date === today);
  const todayExercise = {
    minutes: todayExerciseLogs.reduce((s, l) => s + l.duration, 0),
    calories: todayExerciseLogs.reduce((s, l) => s + l.caloriesBurned, 0),
    workouts: todayExerciseLogs.length,
  };

  return (
    <AppContext.Provider value={{
      profile, basket, orders, weightLogs, nutritionLogs, exerciseLogs,
      waterLogs, consultations, prescriptions, testRequests,
      isLoading, isOnboarded: profile.isOnboarded, sseConnected,
      setConditions, setDietaryRestrictions, completeOnboarding,
      addToBasket, removeFromBasket, clearBasket, placeOrder,
      logWeight, logNutrition, logExercise, logWater, bookConsultation,
      addPrescription, addTestRequest, updateTestRequest, updateOrderStatus,
      basketTotal, basketCount, todayNutrition, currentWeight,
      todayWater, todayExercise,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
