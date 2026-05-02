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

const FALLBACK_MENU = [
  { id: "m1", name: "Akara Protein Balls", price: 3200, calories: 340, mealType: "breakfast", conditions: ["weightloss", "diabetes"], glycemicIndex: "Low", sodiumLevel: "Low", description: "", imageUrl: null, isAvailable: true },
  { id: "m2", name: "Egusi Soup + Pounded Yam", price: 5800, calories: 520, mealType: "lunch", conditions: ["hypertension", "liver"], glycemicIndex: "Medium", sodiumLevel: "Low", description: "", imageUrl: null, isAvailable: true },
  { id: "m3", name: "Tilapia Pepper Soup", price: 6200, calories: 280, mealType: "lunch", conditions: ["diabetes", "liver", "hypertension"], glycemicIndex: "Low", sodiumLevel: "Medium", description: "", imageUrl: null, isAvailable: true },
  { id: "m4", name: "Moi Moi Health Bowl", price: 4500, calories: 380, mealType: "dinner", conditions: ["weightloss", "hypertension"], glycemicIndex: "Low", sodiumLevel: "Low", description: "", imageUrl: null, isAvailable: true },
  { id: "m5", name: "Jollof Brown Rice", price: 4800, calories: 420, mealType: "lunch", conditions: ["diabetes", "weightloss"], glycemicIndex: "Low", sodiumLevel: "Low", description: "", imageUrl: null, isAvailable: true },
  { id: "m6", name: "Ogbono Light Soup", price: 5200, calories: 310, mealType: "dinner", conditions: ["liver", "hypertension"], glycemicIndex: "Low", sodiumLevel: "Low", description: "", imageUrl: null, isAvailable: true },
  { id: "m7", name: "Zobo Detox Drink", price: 1800, calories: 45, mealType: "drink", conditions: ["hypertension", "liver"], glycemicIndex: "Low", sodiumLevel: "Low", description: "", imageUrl: null, isAvailable: true },
  { id: "m8", name: "Moringa Power Smoothie", price: 2200, calories: 120, mealType: "drink", conditions: ["diabetes", "weightloss", "liver"], glycemicIndex: "Low", sodiumLevel: "Low", description: "", imageUrl: null, isAvailable: true },
  { id: "m9", name: "Turmeric Ginger Elixir", price: 2000, calories: 60, mealType: "drink", conditions: ["hypertension", "liver", "allergies"], glycemicIndex: "Low", sodiumLevel: "Low", description: "", imageUrl: null, isAvailable: true },
];

function mapMealItem(row: any) {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    calories: row.calories ?? 0,
    mealType: row.meal_type ?? row.mealType,
    conditions: row.conditions ?? [],
    glycemicIndex: row.glycemic_index ?? row.glycemicIndex ?? "Low",
    sodiumLevel: row.sodium_level ?? row.sodiumLevel ?? "Low",
    description: row.description ?? "",
    imageUrl: row.image_url ?? row.imageUrl ?? null,
    isAvailable: row.is_available ?? row.isAvailable ?? true,
    orders: row.orders ?? 0,
  };
}

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

    const { data: menuItems } = await supabase.from("menu_items").select("id, name").eq("is_available", true);
    const totalMeals = (menuItems ?? FALLBACK_MENU).length;
    const topMeal = (menuItems ?? FALLBACK_MENU)[0]?.name ?? "Egusi Soup";

    return res.json({
      totalOrders: all.length,
      todayOrders: todayOrders.length,
      totalRevenue,
      todayRevenue,
      totalMeals,
      conditionBreakdown: {},
      statusBreakdown,
      topMeal,
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

router.get("/meals", authMiddleware, async (_req, res) => {
  if (!supabase) return res.json(FALLBACK_MENU);
  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return res.json((data ?? FALLBACK_MENU).map(mapMealItem));
  } catch {
    return res.json(FALLBACK_MENU);
  }
});

router.post("/menu-items", authMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const { name, price, calories, mealType, conditions, glycemicIndex, sodiumLevel, description, imageUrl } = req.body;
    if (!name || !price || !mealType) return res.status(400).json({ error: "name, price, and mealType are required" });
    const id = `m-${Date.now()}`;
    const { data, error } = await supabase
      .from("menu_items")
      .insert({
        id,
        name,
        price: Number(price),
        calories: Number(calories ?? 0),
        meal_type: mealType,
        conditions: conditions ?? [],
        glycemic_index: glycemicIndex ?? "Low",
        sodium_level: sodiumLevel ?? "Low",
        description: description ?? "",
        image_url: imageUrl ?? null,
        is_available: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json(mapMealItem(data));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put("/menu-items/:id", authMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const { id } = req.params;
  try {
    const { name, price, calories, mealType, conditions, glycemicIndex, sodiumLevel, description, imageUrl, isAvailable } = req.body;
    const updates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = Number(price);
    if (calories !== undefined) updates.calories = Number(calories);
    if (mealType !== undefined) updates.meal_type = mealType;
    if (conditions !== undefined) updates.conditions = conditions;
    if (glycemicIndex !== undefined) updates.glycemic_index = glycemicIndex;
    if (sodiumLevel !== undefined) updates.sodium_level = sodiumLevel;
    if (description !== undefined) updates.description = description;
    if (imageUrl !== undefined) updates.image_url = imageUrl;
    if (isAvailable !== undefined) updates.is_available = isAvailable;
    const { data, error } = await supabase
      .from("menu_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Item not found" });
    return res.json(mapMealItem(data));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete("/menu-items/:id", authMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const { id } = req.params;
  try {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/upload-image", authMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const { base64, filename, contentType } = req.body;
    if (!base64 || !filename) return res.status(400).json({ error: "base64 and filename required" });
    const buffer = Buffer.from(base64, "base64");
    await supabase.storage.createBucket("meal-images", { public: true }).catch(() => {});
    const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage
      .from("meal-images")
      .upload(safeName, buffer, { contentType: contentType ?? "image/jpeg", upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("meal-images").getPublicUrl(safeName);
    return res.json({ url: urlData.publicUrl });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/settings", authMiddleware, async (_req, res) => {
  if (!supabase) {
    return res.json({
      app_tagline: "The Earth's Apothecary",
      hero_title: "Nigerian Wellness Cuisine",
      hero_subtitle: "Food as Medicine, Culture as Cure",
      primary_color: "#154212",
      secondary_color: "#8b500a",
      logo_url: "",
      banner_url: "",
      announcement: "",
    });
  }
  try {
    const { data, error } = await supabase.from("app_settings").select("key, value");
    if (error) throw error;
    const settings: Record<string, string> = {};
    for (const row of data ?? []) settings[row.key] = row.value ?? "";
    return res.json(settings);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put("/settings", authMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const entries = Object.entries(req.body as Record<string, string>);
    const upserts = entries.map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("app_settings").upsert(upserts, { onConflict: "key" });
    if (error) throw error;
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/clinical-staff", authMiddleware, async (_req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const [{ data: staff }, { data: consults }, { data: patients }] = await Promise.all([
      supabase.from("clinical_staff").select("*"),
      supabase.from("consultations").select("doctor_id, nutritionist_id"),
      supabase.from("patients").select("assigned_doctor_id, assigned_nutritionist_id"),
    ]);
    const consultMap: Record<string, number> = {};
    for (const c of consults ?? []) {
      if (c.doctor_id) consultMap[c.doctor_id] = (consultMap[c.doctor_id] ?? 0) + 1;
      if (c.nutritionist_id) consultMap[c.nutritionist_id] = (consultMap[c.nutritionist_id] ?? 0) + 1;
    }
    const patMap: Record<string, number> = {};
    for (const p of patients ?? []) {
      if (p.assigned_doctor_id) patMap[p.assigned_doctor_id] = (patMap[p.assigned_doctor_id] ?? 0) + 1;
      if (p.assigned_nutritionist_id) patMap[p.assigned_nutritionist_id] = (patMap[p.assigned_nutritionist_id] ?? 0) + 1;
    }
    return res.json({
      staff: (staff ?? []).map((s: any) => ({
        id: s.id, name: s.name, title: s.title, role: s.role,
        specialization: s.specialization, email: s.email, badge: s.badge,
        sessions: consultMap[s.id] ?? 0,
        patients: patMap[s.id] ?? 0,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/consultations", authMiddleware, async (_req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data: consults, error } = await supabase
      .from("consultations")
      .select("*, patients(id, name)")
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(20);
    if (error) throw error;
    const staffIds = [...new Set((consults ?? []).flatMap((c: any) => [c.doctor_id, c.nutritionist_id].filter(Boolean)))];
    const { data: staffData } = staffIds.length
      ? await supabase.from("clinical_staff").select("id, name, role").in("id", staffIds)
      : { data: [] };
    const staffMap = new Map((staffData ?? []).map((s: any) => [s.id, s]));
    return res.json({
      consultations: (consults ?? []).map((c: any) => ({
        id: c.id,
        patientId: c.patient_id,
        patientName: c.patients?.name ?? "Unknown",
        doctorId: c.doctor_id ?? null,
        nutritionistId: c.nutritionist_id ?? null,
        staffId: c.doctor_id ?? c.nutritionist_id ?? null,
        staffName: (staffMap.get(c.doctor_id) ?? staffMap.get(c.nutritionist_id))?.name ?? "Unknown",
        staffRole: c.doctor_id ? "doctor" : "nutritionist",
        date: c.date,
        time: c.scheduled_time,
        duration: c.duration,
        status: c.status,
        type: c.type,
        chiefComplaint: c.chief_complaint,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/test-requests", authMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const { patientId, tests } = req.body as { patientId: string; tests: string[] };
    const date = new Date().toISOString().slice(0, 10);
    const inserts = tests.map((testName: string, i: number) => ({
      id: `tr-${Date.now()}-${i}`,
      patient_id: patientId,
      test_name: testName,
      status: "pending",
      date,
    }));
    const { error } = await supabase.from("lab_results").insert(inserts);
    if (error) throw error;
    return res.status(201).json({ success: true, count: inserts.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/prescriptions", authMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const id = `rx-${Date.now()}`;
    const date = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("prescriptions")
      .insert({
        id, date,
        patient_id: req.body.patientId,
        doctor_id: req.body.doctorId ?? null,
        diagnosis: req.body.diagnosis,
        medications: req.body.medications ?? [],
        notes: req.body.notes ?? null,
        valid_until: req.body.validUntil ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ id: data.id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/analytics", authMiddleware, async (_req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const [{ data: orders }, { data: menuItems }] = await Promise.all([
      supabase.from("orders").select("total, created_at, status").order("created_at", { ascending: false }).limit(200),
      supabase.from("menu_items").select("id, name").limit(5),
    ]);
    const all = orders ?? [];
    const now = new Date();
    const weeklyOrders = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const day = d.toISOString().split("T")[0];
      return all.filter((o: any) => (o.created_at ?? "").startsWith(day)).length;
    });
    const avgOrder = all.length > 0 ? Math.round(all.reduce((s: number, o: any) => s + (o.total ?? 0), 0) / all.length) : 7200;
    const weeklyRevenue = weeklyOrders.map((count) => count * avgOrder);
    const topItems = (menuItems ?? FALLBACK_MENU.slice(0, 5)).map((m: any) => ({
      name: m.name,
      orders: 0,
      revenue: 0,
    }));
    return res.json({
      weeklyOrders,
      weeklyRevenue,
      conditionTrend: [],
      topMeals: topItems,
      totalOrders: all.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
