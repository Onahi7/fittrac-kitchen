import { Router } from "express";
import crypto from "crypto";
import { supabase } from "../lib/supabase.js";

const router = Router();

const PAYSTACK_SECRET = process.env["PAYSTACK_SECRET_KEY"] ?? "";

function generateRef(): string {
  return `FKT-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

async function savePayment(data: {
  reference: string; amount: number; email?: string; phone?: string;
  orderId?: string; gateway: string; method?: string; status: string; metadata?: any;
}) {
  if (!supabase) return;
  try {
    await supabase.from("payments").upsert({
      reference: data.reference,
      amount: Math.round(data.amount),
      email: data.email ?? null,
      phone: data.phone ?? null,
      order_id: data.orderId ?? null,
      gateway: data.gateway,
      method: data.method ?? null,
      status: data.status,
      metadata: data.metadata ?? {},
      updated_at: new Date().toISOString(),
    }, { onConflict: "reference" });
  } catch { /* non-critical */ }
}

async function updatePaymentStatus(reference: string, status: string) {
  if (!supabase) return;
  try {
    await supabase.from("payments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("reference", reference);
  } catch { /* non-critical */ }
}

router.post("/paystack/initialize", async (req, res) => {
  const { amount, email, orderId, metadata } = req.body;
  if (!amount || !email) {
    return res.status(400).json({ error: "amount and email required" });
  }

  const reference = generateRef();
  const amountInKobo = Math.round(amount * 100);

  if (!PAYSTACK_SECRET) {
    await savePayment({ reference, amount, email, orderId, gateway: "demo", status: "initialized", metadata });
    return res.json({
      status: true,
      message: "Authorization URL created (demo mode)",
      data: {
        authorization_url: `https://checkout.paystack.com/demo/${reference}`,
        access_code: `demo_${reference}`,
        reference,
      },
      demo: true,
    });
  }

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: amountInKobo, email, reference, metadata }),
    });
    const data = await response.json() as any;
    if (data.status) {
      await savePayment({ reference, amount, email, orderId, gateway: "paystack", status: "initialized", metadata });
    }
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/paystack/verify/:reference", async (req, res) => {
  const { reference } = req.params;

  if (!PAYSTACK_SECRET) {
    if (!supabase) return res.status(404).json({ error: "Transaction not found" });
    const { data } = await supabase.from("payments").select("*").eq("reference", reference).maybeSingle();
    if (!data) return res.status(404).json({ error: "Transaction not found" });
    await updatePaymentStatus(reference, "success");
    return res.json({ status: true, data: { status: "success", reference, amount: data.amount * 100, gateway_response: "Approved (demo)" } });
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const data = await response.json() as any;
    if (data.data?.status === "success") {
      await updatePaymentStatus(reference, "success");
    }
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/opay/initialize", async (req, res) => {
  const { amount, phone, orderId, method } = req.body;
  const reference = generateRef();
  await savePayment({ reference, amount, phone, orderId, gateway: "opay", method: method ?? "bank_transfer", status: "initialized" });
  return res.json({
    status: true,
    message: "OPay payment initialized",
    data: {
      reference,
      checkoutUrl: `https://opaycheckout.com/demo/${reference}`,
      amount,
      method: method ?? "bank_transfer",
    },
    demo: true,
  });
});

router.get("/opay/verify/:reference", async (req, res) => {
  const { reference } = req.params;
  if (!supabase) return res.status(404).json({ error: "Not found" });
  const { data } = await supabase.from("payments").select("*").eq("reference", reference).maybeSingle();
  if (!data) return res.status(404).json({ error: "Not found" });
  await updatePaymentStatus(reference, "success");
  return res.json({ status: true, data: { status: "success", reference, amount: data.amount } });
});

router.get("/transactions", async (_req, res) => {
  if (!supabase) return res.json([]);
  try {
    const { data } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    return res.json(data ?? []);
  } catch {
    return res.json([]);
  }
});

export default router;
