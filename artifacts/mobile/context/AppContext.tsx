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
  NutritionLog,
  Order,
  UserProfile,
  WeightLog,
} from "@/constants/types";

interface AppContextValue {
  profile: UserProfile;
  basket: BasketItem[];
  orders: Order[];
  weightLogs: WeightLog[];
  nutritionLogs: NutritionLog[];
  consultations: Consultation[];
  isLoading: boolean;
  isOnboarded: boolean;
  setConditions: (conditions: Condition[]) => Promise<void>;
  setDietaryRestrictions: (restrictions: string[]) => Promise<void>;
  completeOnboarding: (conditions: Condition[]) => Promise<void>;
  addToBasket: (item: BasketItem) => void;
  removeFromBasket: (mealId: string) => void;
  clearBasket: () => void;
  placeOrder: (
    fulfillment: "delivery" | "pickup",
    address: string,
    paymentMethod: string
  ) => Order;
  logWeight: (weight: number) => Promise<void>;
  logNutrition: (log: Omit<NutritionLog, "date">) => Promise<void>;
  bookConsultation: (c: Omit<Consultation, "id" | "status">) => Promise<void>;
  basketTotal: number;
  basketCount: number;
  todayNutrition: NutritionLog | null;
  currentWeight: number | null;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEYS = {
  profile: "fk_user_profile",
  orders: "fk_orders",
  weightLogs: "fk_weight_logs",
  nutritionLogs: "fk_nutrition_logs",
  consultations: "fk_consultations",
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileStr, ordersStr, weightStr, nutritionStr, consultStr] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.profile),
          AsyncStorage.getItem(STORAGE_KEYS.orders),
          AsyncStorage.getItem(STORAGE_KEYS.weightLogs),
          AsyncStorage.getItem(STORAGE_KEYS.nutritionLogs),
          AsyncStorage.getItem(STORAGE_KEYS.consultations),
        ]);
      if (profileStr) setProfile(JSON.parse(profileStr));
      if (ordersStr) setOrders(JSON.parse(ordersStr));
      if (weightStr) {
        setWeightLogs(JSON.parse(weightStr));
      } else {
        const seed = seedWeightLogs();
        setWeightLogs(seed);
        await AsyncStorage.setItem(STORAGE_KEYS.weightLogs, JSON.stringify(seed));
      }
      if (nutritionStr) {
        setNutritionLogs(JSON.parse(nutritionStr));
      } else {
        const seed = seedNutritionLogs();
        setNutritionLogs(seed);
        await AsyncStorage.setItem(STORAGE_KEYS.nutritionLogs, JSON.stringify(seed));
      }
      if (consultStr) setConsultations(JSON.parse(consultStr));
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async (p: UserProfile) => {
    setProfile(p);
    await AsyncStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(p));
  };

  const saveOrders = async (o: Order[]) => {
    setOrders(o);
    await AsyncStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(o));
  };

  const saveWeightLogs = async (logs: WeightLog[]) => {
    setWeightLogs(logs);
    await AsyncStorage.setItem(STORAGE_KEYS.weightLogs, JSON.stringify(logs));
  };

  const saveNutritionLogs = async (logs: NutritionLog[]) => {
    setNutritionLogs(logs);
    await AsyncStorage.setItem(STORAGE_KEYS.nutritionLogs, JSON.stringify(logs));
  };

  const saveConsultations = async (cons: Consultation[]) => {
    setConsultations(cons);
    await AsyncStorage.setItem(STORAGE_KEYS.consultations, JSON.stringify(cons));
  };

  const completeOnboarding = useCallback(
    async (conditions: Condition[]) => {
      const newProfile: UserProfile = {
        ...profile,
        isOnboarded: true,
        conditions,
      };
      await saveProfile(newProfile);
    },
    [profile]
  );

  const setConditions = useCallback(
    async (conditions: Condition[]) => {
      await saveProfile({ ...profile, conditions });
    },
    [profile]
  );

  const setDietaryRestrictions = useCallback(
    async (restrictions: string[]) => {
      await saveProfile({ ...profile, dietaryRestrictions: restrictions });
    },
    [profile]
  );

  const addToBasket = useCallback((item: BasketItem) => {
    setBasket((prev) => {
      const existing = prev.find(
        (i) => i.meal.id === item.meal.id && i.mealType === item.mealType
      );
      if (existing) {
        return prev.map((i) =>
          i.meal.id === item.meal.id && i.mealType === item.mealType
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, item];
    });
  }, []);

  const removeFromBasket = useCallback((mealId: string) => {
    setBasket((prev) => prev.filter((i) => i.meal.id !== mealId));
  }, []);

  const clearBasket = useCallback(() => {
    setBasket([]);
  }, []);

  const placeOrder = useCallback(
    (
      fulfillment: "delivery" | "pickup",
      address: string,
      paymentMethod: string
    ): Order => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const deliveryDate = tomorrow.toLocaleDateString("en-NG", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });

      const total =
        basket.reduce((sum, i) => sum + i.meal.price * i.quantity, 0) +
        (fulfillment === "delivery" ? 1200 : 0);

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
      return order;
    },
    [basket, orders]
  );

  const logWeight = useCallback(
    async (weight: number) => {
      const today = new Date().toISOString().split("T")[0];
      const existing = weightLogs.find((l) => l.date === today);
      let updated: WeightLog[];
      if (existing) {
        updated = weightLogs.map((l) => (l.date === today ? { ...l, weight } : l));
      } else {
        updated = [...weightLogs, { date: today, weight }];
      }
      await saveWeightLogs(updated);
    },
    [weightLogs]
  );

  const logNutrition = useCallback(
    async (log: Omit<NutritionLog, "date">) => {
      const today = new Date().toISOString().split("T")[0];
      const existing = nutritionLogs.find((l) => l.date === today && l.source === log.source);
      let updated: NutritionLog[];
      if (existing) {
        updated = nutritionLogs.map((l) =>
          l.date === today && l.source === log.source ? { ...l, ...log, date: today } : l
        );
      } else {
        updated = [...nutritionLogs, { ...log, date: today }];
      }
      await saveNutritionLogs(updated);
    },
    [nutritionLogs]
  );

  const bookConsultation = useCallback(
    async (c: Omit<Consultation, "id" | "status">) => {
      const consultation: Consultation = {
        ...c,
        id: `CON-${Date.now().toString().slice(-4)}`,
        status: "upcoming",
      };
      const updated = [consultation, ...consultations];
      await saveConsultations(updated);
    },
    [consultations]
  );

  const basketTotal = basket.reduce(
    (sum, i) => sum + i.meal.price * i.quantity,
    0
  );
  const basketCount = basket.reduce((sum, i) => sum + i.quantity, 0);

  const today = new Date().toISOString().split("T")[0];
  const todayNutrition = nutritionLogs.find((l) => l.date === today) ?? null;
  const sortedWeights = [...weightLogs].sort((a, b) => b.date.localeCompare(a.date));
  const currentWeight = sortedWeights[0]?.weight ?? null;

  return (
    <AppContext.Provider
      value={{
        profile,
        basket,
        orders,
        weightLogs,
        nutritionLogs,
        consultations,
        isLoading,
        isOnboarded: profile.isOnboarded,
        setConditions,
        setDietaryRestrictions,
        completeOnboarding,
        addToBasket,
        removeFromBasket,
        clearBasket,
        placeOrder,
        logWeight,
        logNutrition,
        bookConsultation,
        basketTotal,
        basketCount,
        todayNutrition,
        currentWeight,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
