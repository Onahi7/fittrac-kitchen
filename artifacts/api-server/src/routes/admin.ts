import { Router } from "express";
import crypto from "crypto";
import { broadcastOrderUpdate } from "./events";
import { supabase } from "../lib/supabase.js";

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

const MENU_ITEMS = [
  { id: "m1", name: "Akara Protein Balls", price: 3200, calories: 340, mealType: "breakfast", conditions: ["weightloss", "diabetes"], glycemicIndex: "Low", sodiumLevel: "Low" },
  { id: "m2", name: "Egusi Soup + Pounded Yam", price: 5800, calories: 520, mealType: "lunch", conditions: ["hypertension", "liver"], glycemicIndex: "Medium", sodiumLevel: "Low" },
  { id: "m3", name: "Tilapia Pepper Soup", price: 6200, calories: 280, mealType: "lunch", conditions: ["diabetes", "liver", "hypertension"], glycemicIndex: "Low", sodiumLevel: "Medium" },
  { id: "m4", name: "Moi Moi Health Bowl", price: 4500, calories: 380, mealType: "dinner", conditions: ["weightloss", "hypertension"], glycemicIndex: "Low", sodiumLevel: "Low" },
  { id: "m5", name: "Jollof Brown Rice", price: 4800, calories: 420, mealType: "lunch", conditions: ["diabetes", "weightloss"], glycemicIndex: "Low", sodiumLevel: "Low" },
  { id: "m6", name: "Ogbono Light Soup", price: 5200, calories: 310, mealType: "dinner", conditions: ["liver", "hypertension"], glycemicIndex: "Low", sodiumLevel: "Low" },
  { id: "m7", name: "Zobo Detox Drink", price: 1800, calories: 45, mealType: "drink", conditions: ["hypertension", "liver"], glycemicIndex: "Low", sodiumLevel: "Low" },
  { id: "m8", name: "Moringa Power Smoothie", price: 2200, calories: 120, mealType: "drink", conditions: ["diabetes", "weightloss", "liver"], glycemicIndex: "Low", sodiumLevel: "Low" },
  { id: "m9", name: "Turmeric Ginger Elixir", price: 2000, calories: 60, mealType: "drink", conditions: ["hypertension", "liver", "allergies"], glycemicIndex: "Low", sodiumLevel: "Low" },
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

router.get("/stats", authMiddleware, async (_req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const today = new Date().toISOString().split("T")[0];
    const { data: orders } = await supabase.from("orders").select("id, total, status, fulfillment, created_at");
    const all = orders ?? [];
    const todayOrders = all.filter((o: any) => (o.created_at ?? "").startsWith(today));
    const totalRevenue = all.reduce((s: number, o: any) => s + (o.total ?? 0), 0);
    const todayRevenue = todayOrders.reduce((s: number, o: any) => s + (o.total ?? 0), 0);
    const statusBreakdown: Record<string, number> = {};
    for (const o of all) statusBreakdown[o.status] = (statusBreakdown[o.status] ?? 0) + 1;
    return res.json({
      totalOrders: all.length,
      todayOrders: todayOrders.length,
      totalRevenue,
      todayRevenue,
      totalMeals: MENU_ITEMS.length,
      conditionBreakdown: {},
      statusBreakdown,
      topMeal: MENU_ITEMS[1].name,
      avgOrderValue: all.length > 0 ? Math.round(totalRevenue / all.length) : 0,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/orders", authMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const { status, date } = req.query;
    let query = supabase
      .from("orders")
      .select("*, users(name, email, conditions)")
      .order("created_at", { ascending: false });
    if (status && typeof status === "string") query = query.eq("status", status);
    if (date && typeof date === "string") query = query.gte("created_at", `${date}T00:00:00`).lte("created_at", `${date}T23:59:59`);
    const { data, error } = await query;
    if (error) throw error;
    const mapped = (data ?? []).map((o: any) => ({
      id: o.id,
      customer: o.users?.name ?? o.user_id ?? "Unknown",
      total: o.total,
      status: o.status,
      fulfillment: o.fulfillment,
      items: Array.isArray(o.items) ? o.items.map((i: any) => i.meal?.name ?? i.name ?? "Item") : [],
      date: (o.created_at ?? "").split("T")[0],
      condition: (o.users?.conditions ?? [])[0] ?? "general",
      address: o.address ?? "",
      paymentMethod: o.payment_method ?? "",
    }));
    return res.json(mapped);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch("/orders/:id/status", authMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ["confirmed", "preparing", "ready", "delivered", "cancelled"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });
  try {
    const { data, error } = await supabase.from("orders").update({ status }).eq("id", id).select("*, users(name)").single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Order not found" });
    broadcastOrderUpdate(id, status, { customer: data.users?.name ?? "" });
    return res.json({ id: data.id, status: data.status, customer: data.users?.name ?? "" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/meals", authMiddleware, (_req, res) => {
  return res.json(MENU_ITEMS);
});

router.get("/analytics", authMiddleware, async (_req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const { data: orders } = await supabase.from("orders").select("total, created_at, status").order("created_at", { ascending: false }).limit(200);
    const all = orders ?? [];
    const now = new Date();
    const weeklyOrders = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const day = d.toISOString().split("T")[0];
      return all.filter((o: any) => (o.created_at ?? "").startsWith(day)).length;
    });
    const weeklyRevenue = weeklyOrders.map((count) => count * (all.length > 0 ? Math.round(all.reduce((s: number, o: any) => s + (o.total ?? 0), 0) / Math.max(all.length, 1)) : 7200));
    return res.json({
      weeklyOrders,
      weeklyRevenue,
      conditionTrend: [],
      topMeals: MENU_ITEMS.slice(0, 5).map((m) => ({ name: m.name, orders: 0, revenue: 0 })),
      totalOrders: all.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
