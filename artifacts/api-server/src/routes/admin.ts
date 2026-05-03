import { Router } from "express";
import crypto from "crypto";
import { broadcastOrderUpdate } from "./events.js";
import { supabase } from "../lib/supabase.js";
import { hashAdminPassword } from "../lib/seed.js";

const router = Router();

const SESSION_TTL_DAYS = 1;
const CACHE_TTL_MS = 5 * 60 * 1000;

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function expiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_TTL_DAYS);
  return d.toISOString();
}

interface CachedAdminSession {
  adminId: string;
  username: string;
  displayName: string;
  cachedAt: number;
}

const adminSessionCache = new Map<string, CachedAdminSession>();

async function getAdminSession(token: string): Promise<CachedAdminSession | null> {
  const cached = adminSessionCache.get(token);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) return cached;

  if (!supabase) return null;

  const { data } = await supabase
    .from("admin_sessions")
    .select("admin_id, username, admin_users(display_name)")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!data) {
    adminSessionCache.delete(token);
    return null;
  }

  const session: CachedAdminSession = {
    adminId: data.admin_id,
    username: data.username,
    displayName: (data as any).admin_users?.display_name ?? "Administrator",
    cachedAt: Date.now(),
  };
  adminSessionCache.set(token, session);
  return session;
}

function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  getAdminSession(token).then((session) => {
    if (!session) return res.status(401).json({ error: "Unauthorized" });
    req.adminSession = session;
    req.adminToken = token;
    next();
  }).catch(() => res.status(401).json({ error: "Unauthorized" }));
}

function mapMealItem(row: any) {
  return {
    id: row.id, name: row.name, price: row.price, calories: row.calories ?? 0,
    mealType: row.meal_type ?? row.mealType, conditions: row.conditions ?? [],
    glycemicIndex: row.glycemic_index ?? row.glycemicIndex ?? "Low",
    sodiumLevel: row.sodium_level ?? row.sodiumLevel ?? "Low",
    description: row.description ?? "", imageUrl: row.image_url ?? row.imageUrl ?? null,
    isAvailable: row.is_available ?? row.isAvailable ?? true, orders: row.orders ?? 0,
  };
}

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "username and password required" });

  try {
    const hash = hashAdminPassword(password);

    if (supabase) {
      const { data: admin } = await supabase
        .from("admin_users")
        .select("id, username, display_name, role")
        .eq("username", username)
        .eq("password_hash", hash)
        .maybeSingle();

      if (!admin) return res.status(401).json({ error: "Invalid credentials" });

      const token = generateToken();
      await supabase.from("admin_sessions").insert({
        token,
        admin_id: admin.id,
        username: admin.username,
        expires_at: expiresAt(),
      });

      adminSessionCache.set(token, {
        adminId: admin.id,
        username: admin.username,
        displayName: admin.display_name,
        cachedAt: Date.now(),
      });

      return res.json({ token, username: admin.display_name, role: admin.role });
    }

    return res.status(503).json({ error: "Database not configured" });
  } catch (err: any) {
    req.log?.error(err, "admin login error");
    return res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", authMiddleware, async (req: any, res) => {
  adminSessionCache.delete(req.adminToken);
  if (supabase) {
    await supabase.from("admin_sessions").delete().eq("token", req.adminToken);
  }
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
    const items = menuItems ?? [];
    return res.json({
      totalOrders: all.length, todayOrders: todayOrders.length, totalRevenue, todayRevenue,
      totalMeals: items.length, conditionBreakdown: {}, statusBreakdown,
      topMeal: items[0]?.name ?? "",
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
    let query = supabase.from("orders").select("*, users(name, email, conditions)").order("created_at", { ascending: false });
    if (status && typeof status === "string") query = query.eq("status", status);
    if (date && typeof date === "string") query = query.gte("created_at", `${date}T00:00:00`).lte("created_at", `${date}T23:59:59`);
    const { data, error } = await query;
    if (error) throw error;
    return res.json((data ?? []).map((o: any) => ({
      id: o.id, customer: o.users?.name ?? o.user_id ?? "Unknown", total: o.total, status: o.status,
      fulfillment: o.fulfillment, items: Array.isArray(o.items) ? o.items.map((i: any) => i.meal?.name ?? i.name ?? "Item") : [],
      date: (o.created_at ?? "").split("T")[0], condition: (o.users?.conditions ?? [])[0] ?? "general",
      address: o.address ?? "", paymentMethod: o.payment_method ?? "",
    })));
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
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const { data, error } = await supabase.from("menu_items").select("*").order("display_order", { ascending: true }).order("created_at", { ascending: true });
    if (error) throw error;
    return res.json((data ?? []).map(mapMealItem));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/menu-items", authMiddleware, async (_req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const { data, error } = await supabase.from("menu_items").select("*").order("display_order", { ascending: true }).order("created_at", { ascending: true });
    if (error) throw error;
    return res.json((data ?? []).map(mapMealItem));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/menu-items", authMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const { name, price, calories, mealType, conditions, glycemicIndex, sodiumLevel, description, imageUrl } = req.body;
    if (!name || !price || !mealType) return res.status(400).json({ error: "name, price, and mealType are required" });
    const id = `m-${Date.now()}`;
    const { data, error } = await supabase.from("menu_items").insert({
      id, name, price: Number(price), calories: Number(calories ?? 0), meal_type: mealType,
      conditions: conditions ?? [], glycemic_index: glycemicIndex ?? "Low", sodium_level: sodiumLevel ?? "Low",
      description: description ?? "", image_url: imageUrl ?? null, is_available: true,
      updated_at: new Date().toISOString(),
    }).select().single();
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
    const { data, error } = await supabase.from("menu_items").update(updates).eq("id", id).select().single();
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
    const { error } = await supabase.storage.from("meal-images").upload(safeName, buffer, { contentType: contentType ?? "image/jpeg", upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("meal-images").getPublicUrl(safeName);
    return res.json({ url: urlData.publicUrl });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/settings", authMiddleware, async (_req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
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
    const upserts = entries.map(([key, value]) => ({ key, value: String(value), updated_at: new Date().toISOString() }));
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
        id: s.id, name: s.name, title: s.title, role: s.role, specialization: s.specialization,
        email: s.email, badge: s.badge, sessions: consultMap[s.id] ?? 0, patients: patMap[s.id] ?? 0,
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
      .from("consultations").select("*, patients(id, name)").gte("date", today).order("date", { ascending: true }).limit(20);
    if (error) throw error;
    const staffIds = [...new Set((consults ?? []).flatMap((c: any) => [c.doctor_id, c.nutritionist_id].filter(Boolean)))];
    const { data: staffData } = staffIds.length
      ? await supabase.from("clinical_staff").select("id, name, role").in("id", staffIds)
      : { data: [] };
    const staffMap = new Map((staffData ?? []).map((s: any) => [s.id, s]));
    return res.json({
      consultations: (consults ?? []).map((c: any) => ({
        id: c.id, patientId: c.patient_id, patientName: c.patients?.name ?? "Unknown",
        doctorId: c.doctor_id ?? null, nutritionistId: c.nutritionist_id ?? null,
        staffId: c.doctor_id ?? c.nutritionist_id ?? null,
        staffName: (staffMap.get(c.doctor_id) ?? staffMap.get(c.nutritionist_id))?.name ?? "Unknown",
        staffRole: c.doctor_id ? "doctor" : "nutritionist",
        date: c.date, time: c.scheduled_time, duration: c.duration,
        status: c.status, type: c.type, chiefComplaint: c.chief_complaint,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/test-requests", authMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const { patientId, consultationId, doctorName, tests } = req.body as {
      patientId: string; consultationId?: string; doctorName?: string; tests: string[];
    };
    const now = new Date().toISOString();
    const date = now.slice(0, 10);
    const labInserts = tests.map((testName: string, i: number) => ({
      id: `tr-${Date.now()}-${i}`, patient_id: patientId, test_name: testName, status: "pending", date,
    }));
    const { error: labErr } = await supabase.from("lab_results").insert(labInserts);
    if (labErr) throw labErr;
    if (consultationId) {
      const resolvedTests = tests.map((t) => ({ name: t, instructions: "Follow standard preparation guidelines." }));
      await supabase.from("clinical_test_requests").insert({
        id: `ctr-${Date.now()}`,
        consultation_id: consultationId,
        doctor_name: doctorName ?? null,
        requested_at: now,
        tests: resolvedTests,
        status: "pending",
      });
    }
    return res.status(201).json({ success: true, count: labInserts.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/prescriptions", authMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const id = `rx-${Date.now()}`;
    const issuedAt = new Date().toISOString();
    const {
      patientId, consultationId, doctorId, doctorName, doctorType,
      diagnosis, medications, labTests, notes, validUntil, followUpDate,
    } = req.body;
    const { data, error } = await supabase.from("prescriptions").insert({
      id,
      date: issuedAt.slice(0, 10),
      issued_at: issuedAt,
      patient_id: patientId ?? null,
      consultation_id: consultationId ?? null,
      doctor_id: doctorId ?? null,
      doctor_name: doctorName ?? null,
      doctor_type: doctorType ?? null,
      diagnosis,
      medications: medications ?? [],
      lab_tests: labTests ?? [],
      notes: notes ?? null,
      follow_up_date: followUpDate ?? validUntil ?? null,
      valid_until: validUntil ?? null,
    }).select().single();
    if (error) throw error;
    return res.status(201).json({ id: data.id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── JSON key-value helpers (auto-seed defaults into DB on first access) ────────

const DEFAULT_QUOTES = [
  { id: "q1", text: "Let food be thy medicine and medicine be thy food.", author: "Hippocrates", category: "health", active: true, daily: true },
  { id: "q2", text: "Your body hears everything your mind says.", author: "Naomi Judd", category: "wellness", active: true, daily: false },
  { id: "q3", text: "The food you eat can be either the safest and most powerful form of medicine or the slowest form of poison.", author: "Ann Wigmore", category: "nutrition", active: true, daily: false },
  { id: "q4", text: "A healthy outside starts from the inside.", author: "Robert Urich", category: "wellness", active: true, daily: false },
  { id: "q5", text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn", category: "motivation", active: true, daily: false },
  { id: "q6", text: "Moringa oleifera is considered one of the most nutritious plants on earth.", author: "World Health Organization", category: "nutrition", active: true, daily: false },
];

const DEFAULT_CONTENT = [
  { id: "c1", title: "Why Moringa is Called the Miracle Tree", type: "food_fact", body: "Moringa contains 7× more vitamin C than oranges, 4× more vitamin A than carrots, and 4× more calcium than milk. Used in Nigerian traditional medicine for centuries to treat inflammation and nutrient deficiency.", active: true, imageUrl: "" },
  { id: "c2", title: "The Power of Egusi Seeds", type: "food_fact", body: "Egusi (melon seeds) are packed with essential amino acids, healthy fats, zinc, and magnesium. They support heart health, provide sustained energy, and help manage blood sugar — ideal for diabetic patients.", active: true, imageUrl: "" },
  { id: "c3", title: "5 Tips for Managing Hypertension Through Diet", type: "health_tip", body: "1. Reduce sodium to 2,300mg/day. 2. Increase potassium via plantain and leafy greens. 3. Choose lean proteins like tilapia. 4. Drink unsweetened Zobo tea — lowers systolic BP by 7–10 mmHg. 5. Avoid excess processed foods and palm oil.", active: true, imageUrl: "" },
  { id: "c4", title: "Zobo: Nigeria's Natural Blood Pressure Solution", type: "meal_spotlight", body: "Hibiscus sabdariffa (Zobo) has proven antihypertensive and antidiabetic properties. Rich in anthocyanins and vitamin C, a daily unsweetened cup can reduce systolic blood pressure significantly. Order it cold at Fittrac Kitchen.", active: true, imageUrl: "" },
  { id: "c5", title: "Understanding Glycemic Index in Nigerian Foods", type: "wellness_guide", body: "Fonio GI ~25 (very low), white rice GI ~73, Ofada rice ~55, unripe plantain ~40, garri/eba ~56. Choosing lower-GI options maintains stable blood sugar — essential for managing Type 2 Diabetes.", active: true, imageUrl: "" },
  { id: "c6", title: "Bitter Leaf & Liver Health", type: "food_fact", body: "Vernonia amygdalina (Bitter Leaf) contains vernonioside and other compounds that support liver detoxification and reduce inflammation. Modern research confirms hepatoprotective effects. Available in Ofe Onugbu.", active: true, imageUrl: "" },
];

async function getSettingJson(key: string, defaults: any): Promise<any> {
  if (!supabase) return defaults;
  try {
    const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
    if (data?.value) return JSON.parse(data.value);
    // Auto-seed defaults into DB on first access
    await supabase.from("app_settings").upsert(
      { key, value: JSON.stringify(defaults), updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    return defaults;
  } catch { return defaults; }
}

async function setSettingJson(key: string, value: any): Promise<void> {
  if (!supabase) return;
  await supabase.from("app_settings").upsert(
    { key, value: JSON.stringify(value), updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
}

// ── Quotes ────────────────────────────────────────────────────────────────────
router.get("/quotes", authMiddleware, async (_req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  return res.json({ quotes: await getSettingJson("quotes", DEFAULT_QUOTES) });
});

router.put("/quotes", authMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    await setSettingJson("quotes", req.body.quotes);
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

router.get("/public/daily-quote", async (_req, res) => {
  const quotes: any[] = await getSettingJson("quotes", DEFAULT_QUOTES);
  const active = quotes.filter((q) => q.active);
  const daily = active.find((q) => q.daily) ?? active[Math.floor(Date.now() / 86400000) % Math.max(active.length, 1)];
  return res.json(daily ?? DEFAULT_QUOTES[0]);
});

// ── Health Content ────────────────────────────────────────────────────────────
router.get("/content", authMiddleware, async (_req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  return res.json({ items: await getSettingJson("health_content", DEFAULT_CONTENT) });
});

router.put("/content", authMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    await setSettingJson("health_content", req.body.items);
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

router.get("/public/content", async (_req, res) => {
  const items: any[] = await getSettingJson("health_content", DEFAULT_CONTENT);
  return res.json({ items: items.filter((i) => i.active) });
});

// ── Users ─────────────────────────────────────────────────────────────────────
router.get("/users", authMiddleware, async (_req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const [{ data: users }, { data: orders }] = await Promise.all([
      supabase.from("users").select("id, name, email, phone, conditions, created_at"),
      supabase.from("orders").select("user_id, total"),
    ]);
    const orderMap: Record<string, { count: number; total: number }> = {};
    for (const o of orders ?? []) {
      const uid = (o as any).user_id;
      if (!orderMap[uid]) orderMap[uid] = { count: 0, total: 0 };
      orderMap[uid].count++;
      orderMap[uid].total += (o as any).total ?? 0;
    }
    return res.json({
      users: (users ?? []).map((u: any) => ({
        id: u.id, name: u.name ?? "Unknown", email: u.email, phone: u.phone ?? "",
        conditions: u.conditions ?? [], allergies: [],
        joinedAt: u.created_at,
        orderCount: orderMap[u.id]?.count ?? 0,
        totalSpent: orderMap[u.id]?.total ?? 0,
      })),
    });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ── Community (Featured / Pinned Posts) ──────────────────────────────────────
router.get("/community-posts", authMiddleware, async (_req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  return res.json({ posts: await getSettingJson("community_featured", []) });
});

router.put("/community-posts", authMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    await setSettingJson("community_featured", req.body.posts);
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

router.get("/public/community-posts", async (_req, res) => {
  const posts: any[] = await getSettingJson("community_featured", []);
  return res.json({ posts: posts.filter((p) => p.active) });
});

// ── Notifications ─────────────────────────────────────────────────────────────
router.get("/notifications", authMiddleware, async (_req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  return res.json({ notifications: await getSettingJson("notifications_log", []) });
});

router.post("/notifications", authMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const { title, message, type, audience } = req.body;
    if (!title || !message) return res.status(400).json({ error: "title and message required" });
    const existing: any[] = await getSettingJson("notifications_log", []);
    const n = { id: `n-${Date.now()}`, title, message, type: type ?? "announcement", audience: audience ?? "all", sentAt: new Date().toISOString() };
    await setSettingJson("notifications_log", [n, ...existing].slice(0, 100));
    return res.status(201).json(n);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

router.delete("/notifications/:id", authMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const existing: any[] = await getSettingJson("notifications_log", []);
    await setSettingJson("notifications_log", existing.filter((n) => n.id !== req.params.id));
    return res.json({ success: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

router.get("/public/latest-notification", async (_req, res) => {
  const notifs: any[] = await getSettingJson("notifications_log", []);
  return res.json(notifs[0] ?? null);
});

// ── Analytics ─────────────────────────────────────────────────────────────────
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
    const avgOrder = all.length > 0 ? Math.round(all.reduce((s: number, o: any) => s + (o.total ?? 0), 0) / all.length) : 0;
    const weeklyRevenue = weeklyOrders.map((count) => count * avgOrder);
    const topItems = (menuItems ?? []).map((m: any) => ({ name: m.name, orders: 0, revenue: 0 }));
    return res.json({ weeklyOrders, weeklyRevenue, conditionTrend: [], topMeals: topItems, totalOrders: all.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
