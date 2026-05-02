import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { BasketItem, Condition, Order, UserProfile } from "@/constants/types";

interface AppContextValue {
  profile: UserProfile;
  basket: BasketItem[];
  orders: Order[];
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
  basketTotal: number;
  basketCount: number;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEYS = {
  profile: "fk_user_profile",
  orders: "fk_orders",
};

const defaultProfile: UserProfile = {
  isOnboarded: false,
  conditions: [],
  dietaryRestrictions: [],
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileStr, ordersStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.profile),
        AsyncStorage.getItem(STORAGE_KEYS.orders),
      ]);
      if (profileStr) setProfile(JSON.parse(profileStr));
      if (ordersStr) setOrders(JSON.parse(ordersStr));
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

  const basketTotal = basket.reduce(
    (sum, i) => sum + i.meal.price * i.quantity,
    0
  );
  const basketCount = basket.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        profile,
        basket,
        orders,
        isLoading,
        isOnboarded: profile.isOnboarded,
        setConditions,
        setDietaryRestrictions,
        completeOnboarding,
        addToBasket,
        removeFromBasket,
        clearBasket,
        placeOrder,
        basketTotal,
        basketCount,
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
