import { Router } from "express";
import crypto from "crypto";
import { supabase } from "../lib/supabase.js";

const router = Router();

const SESSION_TTL_DAYS = 30;
const CACHE_TTL_MS = 5 * 60 * 1000;

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "fittrac_salt_2026").digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function expiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_TTL_DAYS);
  return d.toISOString();
}

interface CachedSession {
  userId: string;
  email: string;
  name: string;
  cachedAt: number;
}

const sessionCache = new Map<string, CachedSession>();

async function getSession(token: string): Promise<{ userId: string; email: string; name: string } | null> {
  const cached = sessionCache.get(token);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { userId: cached.userId, email: cached.email, name: cached.name };
  }

  if (!supabase) return null;

  const { data } = await supabase
    .from("user_sessions")
    .select("user_id, email, name")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!data) {
    sessionCache.delete(token);
    return null;
  }

  const session = { userId: data.user_id, email: data.email, name: data.name };
  sessionCache.set(token, { ...session, cachedAt: Date.now() });
  return session;
}

async function createSession(token: string, userId: string, email: string, name: string): Promise<void> {
  sessionCache.set(token, { userId, email, name, cachedAt: Date.now() });
  if (supabase) {
    await supabase.from("user_sessions").insert({
      token,
      user_id: userId,
      email,
      name,
      expires_at: expiresAt(),
    });
  }
}

async function deleteSession(token: string): Promise<void> {
  sessionCache.delete(token);
  if (supabase) {
    await supabase.from("user_sessions").delete().eq("token", token);
  }
}

export async function getUserFromToken(token: string) {
  return getSession(token);
}

export async function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const session = await getSession(token);
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  req.user = session;
  req.userToken = token;
  next();
}

router.post("/register", async (req, res) => {
  const { name, email, phone, password, conditions } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "name, email and password are required" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

  try {
    const hashedPw = hashPassword(password);
    const userId = `usr-${Date.now()}`;

    if (supabase) {
      const { data: existing } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
      if (existing) return res.status(409).json({ error: "Email already registered" });

      const { data, error } = await supabase.from("users").insert({
        id: userId, name, email,
        phone: phone ?? null,
        password_hash: hashedPw,
        conditions: conditions ?? [],
        created_at: new Date().toISOString(),
      }).select("id,name,email,phone,conditions").single();
      if (error) throw error;

      if (conditions && conditions.length > 0) {
        const patientId = `pat-${userId}`;
        await supabase.from("patients").upsert({
          id: patientId, name, email, phone: phone ?? null, conditions,
          primary_condition: conditions[0], adherence_score: 0, risk_score: 1,
          created_at: new Date().toISOString(),
        }, { onConflict: "id" });
        await supabase.from("users").update({ patient_id: patientId }).eq("id", userId);
        (data as any).patientId = patientId;
      }

      const token = generateToken();
      await createSession(token, data.id, data.email, data.name);
      return res.status(201).json({ token, user: data });
    }

    const token = generateToken();
    const user = { id: userId, name, email, phone: phone ?? null, conditions: conditions ?? [] };
    await createSession(token, userId, email, name);
    return res.status(201).json({ token, user });
  } catch (err: any) {
    req.log?.error(err, "register error");
    return res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  try {
    const hashedPw = hashPassword(password);

    if (supabase) {
      const { data: user, error } = await supabase
        .from("users")
        .select("id,name,email,phone,conditions,patient_id")
        .eq("email", email)
        .eq("password_hash", hashedPw)
        .maybeSingle();
      if (error) throw error;
      if (!user) return res.status(401).json({ error: "Invalid email or password" });

      const token = generateToken();
      await createSession(token, user.id, user.email, user.name);
      return res.json({ token, user });
    }

    return res.status(401).json({ error: "Invalid email or password" });
  } catch (err: any) {
    req.log?.error(err, "login error");
    return res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", authMiddleware, async (req: any, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("users")
        .select("id,name,email,phone,conditions,patient_id,created_at")
        .eq("id", req.user.userId)
        .single();
      if (error || !data) return res.status(404).json({ error: "User not found" });
      return res.json({ user: data });
    }
    return res.json({ user: req.user });
  } catch (err: any) {
    req.log?.error(err, "me error");
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.post("/logout", authMiddleware, async (req: any, res) => {
  await deleteSession(req.userToken);
  return res.json({ success: true });
});

router.patch("/me", authMiddleware, async (req: any, res) => {
  const { name, phone, conditions } = req.body;
  try {
    if (supabase) {
      const updates: any = {};
      if (name) updates.name = name;
      if (phone) updates.phone = phone;
      if (conditions) updates.conditions = conditions;

      const { data, error } = await supabase
        .from("users").update(updates).eq("id", req.user.userId)
        .select("id,name,email,phone,conditions,patient_id").single();
      if (error) throw error;

      if (conditions && data.patient_id) {
        await supabase.from("patients").update({ conditions, primary_condition: conditions[0] }).eq("id", data.patient_id);
      }
      if (name) {
        const cached = sessionCache.get(req.userToken);
        if (cached) sessionCache.set(req.userToken, { ...cached, name });
      }
      return res.json({ user: data });
    }
    return res.json({ user: req.user });
  } catch (err: any) {
    req.log?.error(err, "patch me error");
    return res.status(500).json({ error: "Update failed" });
  }
});

router.post("/google", async (req, res) => {
  const { access_token } = req.body ?? {};
  if (!access_token) return res.status(400).json({ error: "access_token required" });
  try {
    if (!supabase) return res.status(503).json({ error: "Auth service unavailable" });
    const { data: { user: supaUser }, error: verifyErr } = await supabase.auth.getUser(access_token);
    if (verifyErr || !supaUser) return res.status(401).json({ error: "Invalid token" });

    const email = supaUser.email!;
    const name = (supaUser.user_metadata?.full_name as string | undefined)
      ?? (supaUser.user_metadata?.name as string | undefined)
      ?? email.split("@")[0];
    const googleId = supaUser.id;

    let { data: existingUser } = await supabase
      .from("users").select("id,name,email,phone,conditions,patient_id")
      .eq("email", email).maybeSingle();

    if (!existingUser) {
      const userId = `usr-g-${Date.now()}`;
      const { data: newUser, error: createErr } = await supabase
        .from("users")
        .insert({ id: userId, name, email, google_id: googleId, conditions: [], created_at: new Date().toISOString() })
        .select("id,name,email,phone,conditions,patient_id").single();
      if (createErr) throw createErr;
      existingUser = newUser;
    } else {
      await supabase.from("users").update({ google_id: googleId }).eq("id", existingUser.id);
    }

    const token = generateToken();
    await createSession(token, existingUser.id, existingUser.email, existingUser.name);
    return res.json({ token, user: existingUser });
  } catch (err: any) {
    req.log?.error(err, "google auth error");
    return res.status(500).json({ error: "Google auth failed" });
  }
});

router.post("/book-consultation", authMiddleware, async (req: any, res) => {
  const { specialistType, specialistName, specialistId, date, time, price, notes } = req.body;
  try {
    if (supabase) {
      const { data: user } = await supabase.from("users").select("patient_id,name,email,phone,conditions").eq("id", req.user.userId).single();
      let patientId = user?.patient_id;
      if (!patientId) {
        patientId = `pat-${req.user.userId}`;
        await supabase.from("patients").upsert({
          id: patientId, name: user?.name ?? req.user.name, email: user?.email ?? req.user.email,
          phone: user?.phone ?? null, conditions: user?.conditions ?? [], primary_condition: user?.conditions?.[0] ?? null,
          adherence_score: 0, risk_score: 1,
        }, { onConflict: "id" });
        await supabase.from("users").update({ patient_id: patientId }).eq("id", req.user.userId);
      }

      const consId = `cons-${Date.now()}`;
      const doctorId = specialistType === "doctor" ? (specialistId ?? "doc-001") : null;
      const nutritionistId = specialistType === "nutritionist" ? (specialistId ?? "nut-001") : null;

      const { data: cons, error } = await supabase.from("consultations").insert({
        id: consId, patient_id: patientId, doctor_id: doctorId, nutritionist_id: nutritionistId,
        date, scheduled_time: time, status: "scheduled", type: "initial",
        chief_complaint: notes ?? `${specialistType} consultation`, duration: 30,
      }).select().single();
      if (error) throw error;
      return res.status(201).json({ consultation: { id: cons.id, patientId, date, time, specialistType, specialistName, status: "upcoming", price } });
    }

    return res.status(201).json({
      consultation: {
        id: `CON-${Date.now().toString().slice(-4)}`,
        patientId: `pat-${req.user.userId}`, date, time, specialistType, specialistName, status: "upcoming", price,
      },
    });
  } catch (err: any) {
    req.log?.error(err, "book-consultation error");
    return res.status(500).json({ error: "Booking failed" });
  }
});

router.post("/orders", authMiddleware, async (req: any, res) => {
  const { items, fulfillment, address, total, paymentMethod, deliveryDate } = req.body;
  try {
    const orderId = `VIT-${Date.now().toString().slice(-4)}`;
    if (supabase) {
      const { data, error } = await supabase.from("orders").insert({
        id: orderId, user_id: req.user.userId, items, fulfillment,
        address: address ?? null, total, payment_method: paymentMethod,
        delivery_date: deliveryDate, status: "confirmed", created_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return res.status(201).json({ order: data });
    }
    return res.status(201).json({ order: { id: orderId, userId: req.user.userId, items, fulfillment, address, total, paymentMethod, status: "confirmed", createdAt: new Date().toISOString() } });
  } catch (err: any) {
    req.log?.error(err, "create order error");
    return res.status(500).json({ error: "Failed to save order" });
  }
});

router.get("/orders", authMiddleware, async (req: any, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from("orders").select("*").eq("user_id", req.user.userId).order("created_at", { ascending: false });
      if (error) throw error;
      return res.json({ orders: data ?? [] });
    }
    return res.json({ orders: [] });
  } catch (err: any) {
    req.log?.error(err, "get orders error");
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
});

export default router;
