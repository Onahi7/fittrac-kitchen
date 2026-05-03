import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.get("/", async (_req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const { data, error } = await supabase
      .from("wellness_specialists")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return res.json({
      specialists: (data ?? []).map((s: any) => ({
        id: s.id,
        type: s.type,
        name: s.name,
        specialty: s.specialty,
        badge: s.badge ?? "",
        conditions: s.conditions ?? [],
        price: s.price,
        rating: parseFloat(s.rating ?? "5.0"),
        sessions: s.sessions ?? 0,
        availability: s.availability ?? "Today",
        color: s.color ?? "#154212",
        bg: s.bg ?? "#E8F5E9",
        icon: s.icon ?? "user",
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
