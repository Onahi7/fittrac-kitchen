import { Router } from "express";
import crypto from "crypto";
import { broadcastOrderUpdate } from "./events";

const router = Router();

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "fittrac2026";

const activeSessions = new Set<string>();

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

const MOCK_ORDERS = [
  { id: "VIT-1021", customer: "Amaka O.", total: 8700, status: "confirmed", fulfillment: "delivery", items: ["Egusi Soup + Pounded Yam", "Zobo Detox"], date: "2026-05-02", condition: "hypertension" },
  { id: "VIT-1020", customer: "Emeka N.", total: 6200, status: "preparing", fulfillment: "pickup", items: ["Tilapia Pepper Soup"], date: "2026-05-02", condition: "diabetes" },
  { id: "VIT-1019", customer: "Fatima A.", total: 11400, status: "ready", fulfillment: "delivery", items: ["Akara Protein Balls x2", "Turmeric Ginger Elixir"], date: "2026-05-02", condition: "weightloss" },
  { id: "VIT-1018", customer: "Bola F.", total: 7500, status: "delivered", fulfillment: "delivery", items: ["Moi Moi Health Bowl"], date: "2026-05-01", condition: "liver" },
  { id: "VIT-1017", customer: "Chidi U.", total: 9100, status: "delivered", fulfillment: "pickup", items: ["Jollof Brown Rice", "Moringa Power Smoothie"], date: "2026-05-01", condition: "diabetes" },
  { id: "VIT-1016", customer: "Ngozi E.", total: 5800, status: "delivered", fulfillment: "delivery", items: ["Ogbono Light Soup"], date: "2026-05-01", condition: "hypertension" },
  { id: "VIT-1015", customer: "Seun A.", total: 13200, status: "confirmed", fulfillment: "delivery", items: ["Akara x2", "Tilapia Pepper Soup", "Zobo Detox"], date: "2026-05-02", condition: "weightloss" },
  { id: "VIT-1014", customer: "Kemi B.", total: 7900, status: "confirmed", fulfillment: "pickup", items: ["Egusi Soup + Pounded Yam"], date: "2026-05-02", condition: "liver" },
];

const mockOrderStore = [...MOCK_ORDERS];

const MOCK_MEALS = [
  { id: "m1", name: "Akara Protein Balls", price: 3200, calories: 340, mealType: "breakfast", conditions: ["weightloss", "diabetes"], glycemicIndex: "Low", sodiumLevel: "Low", orders: 47 },
  { id: "m2", name: "Egusi Soup + Pounded Yam", price: 5800, calories: 520, mealType: "lunch", conditions: ["hypertension", "liver"], glycemicIndex: "Medium", sodiumLevel: "Low", orders: 89 },
  { id: "m3", name: "Tilapia Pepper Soup", price: 6200, calories: 280, mealType: "lunch", conditions: ["diabetes", "liver", "hypertension"], glycemicIndex: "Low", sodiumLevel: "Medium", orders: 62 },
  { id: "m4", name: "Moi Moi Health Bowl", price: 4500, calories: 380, mealType: "dinner", conditions: ["weightloss", "hypertension"], glycemicIndex: "Low", sodiumLevel: "Low", orders: 54 },
  { id: "m5", name: "Jollof Brown Rice", price: 4800, calories: 420, mealType: "lunch", conditions: ["diabetes", "weightloss"], glycemicIndex: "Low", sodiumLevel: "Low", orders: 71 },
  { id: "m6", name: "Ogbono Light Soup", price: 5200, calories: 310, mealType: "dinner", conditions: ["liver", "hypertension"], glycemicIndex: "Low", sodiumLevel: "Low", orders: 38 },
  { id: "m7", name: "Zobo Detox Drink", price: 1800, calories: 45, mealType: "drink", conditions: ["hypertension", "liver"], glycemicIndex: "Low", sodiumLevel: "Low", orders: 95 },
  { id: "m8", name: "Moringa Power Smoothie", price: 2200, calories: 120, mealType: "drink", conditions: ["diabetes", "weightloss", "liver"], glycemicIndex: "Low", sodiumLevel: "Low", orders: 78 },
  { id: "m9", name: "Turmeric Ginger Elixir", price: 2000, calories: 60, mealType: "drink", conditions: ["hypertension", "liver", "allergies"], glycemicIndex: "Low", sodiumLevel: "Low", orders: 63 },
];

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = generateToken();
    activeSessions.add(token);
    return res.json({ token, username: "Administrator", role: "admin" });
  }
  return res.status(401).json({ error: "Invalid credentials" });
});

router.post("/logout", authMiddleware, (req, res) => {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  activeSessions.delete(token);
  return res.json({ success: true });
});

router.get("/stats", authMiddleware, (_req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const todayOrders = mockOrderStore.filter((o) => o.date === today);
  const totalRevenue = mockOrderStore.reduce((s, o) => s + o.total, 0);
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const conditionBreakdown = {
    hypertension: mockOrderStore.filter((o) => o.condition === "hypertension").length,
    diabetes: mockOrderStore.filter((o) => o.condition === "diabetes").length,
    weightloss: mockOrderStore.filter((o) => o.condition === "weightloss").length,
    liver: mockOrderStore.filter((o) => o.condition === "liver").length,
  };
  const statusBreakdown = {
    confirmed: mockOrderStore.filter((o) => o.status === "confirmed").length,
    preparing: mockOrderStore.filter((o) => o.status === "preparing").length,
    ready: mockOrderStore.filter((o) => o.status === "ready").length,
    delivered: mockOrderStore.filter((o) => o.status === "delivered").length,
  };

  return res.json({
    totalOrders: mockOrderStore.length,
    todayOrders: todayOrders.length,
    totalRevenue,
    todayRevenue,
    totalMeals: MOCK_MEALS.length,
    conditionBreakdown,
    statusBreakdown,
    topMeal: "Egusi Soup + Pounded Yam",
    avgOrderValue: Math.round(totalRevenue / mockOrderStore.length),
  });
});

router.get("/orders", authMiddleware, (req, res) => {
  const { status, date } = req.query;
  let filtered = [...mockOrderStore];
  if (status && typeof status === "string") filtered = filtered.filter((o) => o.status === status);
  if (date && typeof date === "string") filtered = filtered.filter((o) => o.date === date);
  return res.json(filtered.sort((a, b) => b.id.localeCompare(a.id)));
});

router.patch("/orders/:id/status", authMiddleware, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ["confirmed", "preparing", "ready", "delivered", "cancelled"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });
  const idx = mockOrderStore.findIndex((o) => o.id === id);
  if (idx === -1) return res.status(404).json({ error: "Order not found" });
  mockOrderStore[idx] = { ...mockOrderStore[idx], status };
  broadcastOrderUpdate(id, status, { customer: mockOrderStore[idx].customer });
  return res.json(mockOrderStore[idx]);
});

router.get("/meals", authMiddleware, (_req, res) => {
  return res.json(MOCK_MEALS.sort((a, b) => b.orders - a.orders));
});

router.get("/analytics", authMiddleware, (_req, res) => {
  const weeklyOrders = [12, 18, 15, 22, 19, 25, 17];
  const weeklyRevenue = weeklyOrders.map((o) => o * 7200);
  const conditionTrend = [
    { condition: "Hypertension", count: 38, pct: 35 },
    { condition: "Weight Loss", count: 31, pct: 29 },
    { condition: "Diabetes", count: 24, pct: 22 },
    { condition: "Liver Health", count: 15, pct: 14 },
  ];
  const topMeals = MOCK_MEALS.sort((a, b) => b.orders - a.orders).slice(0, 5).map((m) => ({
    name: m.name, orders: m.orders, revenue: m.orders * m.price,
  }));
  return res.json({ weeklyOrders, weeklyRevenue, conditionTrend, topMeals });
});

export default router;
