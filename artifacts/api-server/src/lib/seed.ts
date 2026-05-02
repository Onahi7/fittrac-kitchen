import crypto from "crypto";
import { supabase } from "./supabase.js";
import { logger } from "./logger.js";

const SALT = "fk_admin_salt_2026";

export function hashAdminPassword(password: string): string {
  return crypto.createHash("sha256").update(password + SALT).digest("hex");
}

export async function seedAdminUser(): Promise<void> {
  if (!supabase) {
    logger.warn("Supabase not configured — skipping admin seed");
    return;
  }

  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "fittrac2026";
  const displayName = process.env.ADMIN_DISPLAY_NAME ?? "Administrator";

  try {
    const { data: existing } = await supabase
      .from("admin_users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (!existing) {
      const hash = hashAdminPassword(password);
      const { error } = await supabase.from("admin_users").insert({
        id: `adm-${Date.now()}`,
        username,
        password_hash: hash,
        display_name: displayName,
        role: "admin",
      });
      if (error) throw error;
      logger.info({ username }, "Admin user seeded successfully");
    } else {
      logger.info({ username }, "Admin user already exists — skipping seed");
    }

    const now = new Date().toISOString();
    await Promise.all([
      supabase.from("admin_sessions").delete().lt("expires_at", now),
      supabase.from("user_sessions").delete().lt("expires_at", now),
    ]);
    logger.info("Expired sessions cleaned up");
  } catch (err: any) {
    logger.error({ err: err.message }, "Admin seed error");
  }
}
