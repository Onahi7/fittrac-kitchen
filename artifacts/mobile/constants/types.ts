export type Condition = "hypertension" | "diabetes" | "weightloss" | "liver" | "allergies";

export type MealType = "breakfast" | "lunch" | "dinner" | "drink";

export interface Meal {
  id: string;
  name: string;
  description: string;
  price: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  glycemicIndex: "Low" | "Medium" | "High";
  sodiumLevel: "Low" | "Medium" | "High";
  tags: string[];
  conditions: Condition[];
  mealType: MealType;
  image: ReturnType<typeof require>;
  healingIngredients: string[];
  healthImpact: string;
  chefNote?: string;
}

export interface DayMenu {
  day: string;
  theme: string;
  themeDescription: string;
  meals: Meal[];
}

export interface BasketItem {
  meal: Meal;
  mealType: "breakfast" | "lunch" | "dinner";
  quantity: number;
}

export interface Order {
  id: string;
  items: BasketItem[];
  createdAt: string;
  deliveryDate: string;
  status: "confirmed" | "preparing" | "ready" | "delivered";
  fulfillment: "delivery" | "pickup";
  address: string;
  total: number;
  paymentMethod: string;
}

export interface UserProfile {
  isOnboarded: boolean;
  conditions: Condition[];
  dietaryRestrictions: string[];
}

export interface WeightLog {
  date: string;
  weight: number;
}

export interface NutritionLog {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  source: "order" | "manual";
  label?: string;
}

export interface Consultation {
  id: string;
  specialistType: string;
  specialistName: string;
  date: string;
  time: string;
  status: "upcoming" | "completed" | "cancelled";
  price: number;
  notes?: string;
}
