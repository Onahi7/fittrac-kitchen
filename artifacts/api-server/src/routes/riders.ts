import { Router } from "express";
import crypto from "crypto";
import { supabase } from "../lib/supabase.js";

const router = Router();

const SESSION_TTL_HOURS = 12;

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

function expiresAt(): string {
  const d = new Date();
  d.setHours(d.getHours() + SESSION_TTL_HOURS);
  return d.toISOString();
}

async function getRiderSession(token: string) {
  if (!supabase) return null;
  const { data } = await supabase
    .from("rider_sessions")
    .select("rider_id, riders(id, name, phone, vehicle_type, rating, total_deliveries)")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!data) return null;
  return { riderId: data.rider_id, rider: (data as any).riders };
}

function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  getRiderSession(token).then((session) => {
    if (!session) return res.status(401).json({ error: "Unauthorized" });
    req.riderSession = session;
    req.riderToken = token;
    next();
  }).catch(() => res.status(401).json({ error: "Unauthorized" }));
}

// Normalize phone to +234...
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) return `+234${digits.slice(1)}`;
  if (digits.startsWith("234") && digits.length === 13) return `+${digits}`;
  if (digits.length === 10) return `+234${digits}`;
  return `+${digits}`;
}

router.post("/login", async (req, res) => {
  const { phone, pin } = req.body;
  if (!phone || !pin) return res.status(400).json({ error: "phone and pin required" });
  if (!supabase) return res.status(503).json({ error: "Database not configured" });

  try {
    const rawIdentifier = String(phone).trim();
    const normalizedPhone = normalizePhone(rawIdentifier);
    const pinHash = hashPin(String(pin));

    const query = supabase
      .from("riders")
      .select("id, name, phone, vehicle_type, rating, total_deliveries, is_active")
      .eq("pin_hash", pinHash)
      .eq("is_active", true);

    const { data: rider } = await (
      rawIdentifier.toLowerCase().startsWith("rid-")
        ? query.eq("id", rawIdentifier.toLowerCase())
        : query.eq("phone", normalizedPhone)
    )
      .maybeSingle();

    if (!rider) return res.status(401).json({ error: "Invalid phone or PIN" });

    const token = generateToken();
    await supabase.from("rider_sessions").insert({
      token,
      rider_id: rider.id,
      expires_at: expiresAt(),
    });

    return res.json({
      token,
      rider: {
        id: rider.id,
        name: rider.name,
        phone: rider.phone,
        vehicleType: rider.vehicle_type,
        rating: rider.rating,
        totalDeliveries: rider.total_deliveries,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/logout", authMiddleware, async (req: any, res) => {
  if (supabase) {
    await supabase.from("rider_sessions").delete().eq("token", req.riderToken);
  }
  return res.json({ success: true });
});

router.get("/me", authMiddleware, async (req: any, res) => {
  const { rider } = req.riderSession;
  return res.json({
    id: rider.id,
    name: rider.name,
    phone: rider.phone,
    vehicleType: rider.vehicle_type,
    rating: rider.rating,
    totalDeliveries: rider.total_deliveries,
  });
});

// Get today's earnings and delivery count for rider
router.get("/stats", authMiddleware, async (req: any, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const { riderId } = req.riderSession;
  const today = new Date().toISOString().split("T")[0];
  try {
    const { data } = await supabase
      .from("rider_deliveries")
      .select("earnings, status, delivered_at")
      .eq("rider_id", riderId)
      .eq("status", "delivered");

    const todayDeliveries = (data ?? []).filter((d: any) =>
      d.delivered_at && d.delivered_at.startsWith(today)
    );

    return res.json({
      todayEarnings: todayDeliveries.reduce((s: number, d: any) => s + (d.earnings ?? 0), 0),
      todayDeliveries: todayDeliveries.length,
      totalDeliveries: (data ?? []).length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Available orders (status = 'ready', not yet assigned to a rider)
router.get("/available-orders", authMiddleware, async (_req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const { data: orders } = await supabase
      .from("orders")
      .select("id, total, address, items, fulfillment, users(name, phone), created_at")
      .eq("status", "ready")
      .is("rider_id", null)
      .eq("fulfillment", "delivery")
      .order("created_at", { ascending: true });

    return res.json({
      orders: (orders ?? []).map((o: any, idx: number) => ({
        id: `delivery-${o.id}`,
        orderId: o.id,
        customerName: o.users?.name ?? "Customer",
        customerAddress: o.address ?? "Address not provided",
        customerPhone: o.users?.phone ?? "",
        items: Array.isArray(o.items) ? o.items.map((i: any) => i.meal?.name ?? i.name ?? "Item") : [],
        total: o.total,
        pickupAddress: "Fittrac Kitchen, Lekki Phase 1",
        distance: `${(2 + idx * 1.5).toFixed(1)} km`,
        estimatedTime: 12 + idx * 8,
        status: "available",
        earnings: Math.round(o.total * 0.1),
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Accept an order
router.post("/accept-order", authMiddleware, async (req: any, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const { orderId } = req.body;
  const { riderId } = req.riderSession;
  if (!orderId) return res.status(400).json({ error: "orderId required" });

  try {
    // Mark order with rider
    const { error: orderErr } = await supabase
      .from("orders")
      .update({ rider_id: riderId, status: "preparing" })
      .eq("id", orderId)
      .is("rider_id", null);

    if (orderErr) throw orderErr;

    // Create delivery record
    const earnings = 0; // will be updated on delivery
    const { data: delivery, error: delivErr } = await supabase
      .from("rider_deliveries")
      .insert({
        id: `del-${Date.now()}`,
        order_id: orderId,
        rider_id: riderId,
        status: "accepted",
        earnings,
        accepted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (delivErr) throw delivErr;
    return res.json({ success: true, deliveryId: delivery.id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Update delivery status
router.patch("/delivery/:deliveryId/status", authMiddleware, async (req: any, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const { deliveryId } = req.params;
  const { status } = req.body;
  const { riderId } = req.riderSession;
  const allowed = ["accepted", "picked_up", "delivered", "cancelled"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });

  try {
    const updates: any = { status };
    if (status === "picked_up") updates.picked_up_at = new Date().toISOString();
    if (status === "delivered") updates.delivered_at = new Date().toISOString();

    const { data: delivery, error } = await supabase
      .from("rider_deliveries")
      .update(updates)
      .eq("id", deliveryId)
      .eq("rider_id", riderId)
      .select("order_id, earnings")
      .single();

    if (error) throw error;

    // Update the order status accordingly
    const orderStatus = status === "picked_up" ? "preparing" : status === "delivered" ? "delivered" : "ready";
    if (delivery?.order_id) {
      await supabase.from("orders").update({ status: orderStatus }).eq("id", delivery.order_id);
    }

    // Update rider total deliveries if delivered
    if (status === "delivered") {
      const { error: incrementError } = await supabase.rpc(
        "increment_rider_deliveries" as any,
        { rider_id: riderId } as any,
      );
      if (incrementError) req.log?.warn({ err: incrementError }, "Failed to increment rider deliveries");
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
