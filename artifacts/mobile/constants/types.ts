export type Condition = "hypertension" | "diabetes" | "weightloss" | "liver" | "allergies";
export type MealType = "breakfast" | "lunch" | "dinner" | "drink";

export interface Meal {
  id: string; name: string; description: string; price: number;
  calories: number; protein: number; carbs: number; fat: number; fiber: number;
  glycemicIndex: "Low" | "Medium" | "High"; sodiumLevel: "Low" | "Medium" | "High";
  tags: string[]; conditions: Condition[]; mealType: MealType;
  image: ReturnType<typeof require>; healingIngredients: string[];
  healthImpact: string; chefNote?: string;
}

export interface DayMenu {
  day: string; theme: string; themeDescription: string; meals: Meal[];
}

export interface BasketItem {
  meal: Meal; mealType: "breakfast" | "lunch" | "dinner"; quantity: number;
}

export interface Order {
  id: string; items: BasketItem[]; createdAt: string; deliveryDate: string;
  status: "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"; fulfillment: "delivery" | "pickup";
  address: string; total: number; paymentMethod: string;
}

export interface UserProfile {
  isOnboarded: boolean; conditions: Condition[]; dietaryRestrictions: string[];
}

export interface WeightLog { date: string; weight: number; }
export interface NutritionLog {
  date: string; calories: number; protein: number; carbs: number;
  fat: number; fiber: number; source: "order" | "manual"; label?: string;
}
export interface ExerciseLog {
  id: string; date: string; type: string; duration: number;
  intensity: "Low" | "Medium" | "High"; caloriesBurned: number;
}
export interface WaterLog { date: string; glasses: number; }

export interface Consultation {
  id: string; specialistType: string; specialistName: string;
  date: string; time: string; status: "upcoming" | "completed" | "cancelled";
  price: number; notes?: string; specialistId?: string;
}

export interface Medication {
  name: string; dosage: string; frequency: string; duration: string; instructions: string;
}

export interface Prescription {
  id: string; consultationId: string; doctorName: string; doctorType: string;
  issuedAt: string; diagnosis: string; medications: Medication[];
  labTests: string[]; followUpDate: string; notes: string;
}

export interface TestRequest {
  id: string; consultationId: string; requestedAt: string;
  tests: Array<{ name: string; instructions: string }>;
  status: "pending" | "collected" | "uploaded" | "reviewed";
  resultImageUri?: string; doctorComment?: string;
}

export interface Achievement {
  id: string; title: string; description: string; emoji: string;
  category: "health" | "nutrition" | "fitness" | "social" | "order";
  earnedAt?: string; requirement: string;
}

export interface CommunityPost {
  id: string; userAlias: string; conditionTag: string; content: string;
  type: "milestone" | "meal" | "insight" | "question";
  date: string; likes: number; liked: boolean; replies: number;
}

export interface AIMessage {
  role: "user" | "assistant"; content: string; timestamp: string;
}

export interface NotificationSetting {
  id: string; label: string; enabled: boolean; time?: string;
}
