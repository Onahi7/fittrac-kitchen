import { Router } from "express";
import crypto from "crypto";

const router = Router();

const PAYSTACK_SECRET = process.env["PAYSTACK_SECRET_KEY"] ?? "";
const TRANSACTIONS: Record<string, any> = {};

function generateRef(): string {
  return `FKT-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

router.post("/paystack/initialize", async (req, res) => {
  const { amount, email, orderId, metadata } = req.body;
  if (!amount || !email) {
    return res.status(400).json({ error: "amount and email required" });
  }

  const reference = generateRef();
  const amountInKobo = Math.round(amount * 100);

  if (!PAYSTACK_SECRET) {
    const mockRef = reference;
    TRANSACTIONS[mockRef] = { reference: mockRef, amount, email, orderId, status: "initialized", metadata };
    return res.json({
      status: true,
      message: "Authorization URL created (demo mode)",
      data: {
        authorization_url: `https://checkout.paystack.com/demo/${mockRef}`,
        access_code: `demo_${mockRef}`,
        reference: mockRef,
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
      TRANSACTIONS[reference] = { reference, amount, email, orderId, status: "initialized", metadata };
    }
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/paystack/verify/:reference", async (req, res) => {
  const { reference } = req.params;

  if (!PAYSTACK_SECRET) {
    const tx = TRANSACTIONS[reference];
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    TRANSACTIONS[reference] = { ...tx, status: "success" };
    return res.json({ status: true, data: { status: "success", reference, amount: tx.amount * 100, gateway_response: "Approved (demo)" } });
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const data = await response.json() as any;
    if (data.data?.status === "success" && TRANSACTIONS[reference]) {
      TRANSACTIONS[reference].status = "success";
    }
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/opay/initialize", (req, res) => {
  const { amount, phone, orderId, method } = req.body;
  const reference = generateRef();
  TRANSACTIONS[reference] = { reference, amount, phone, orderId, method, status: "initialized", gateway: "opay" };
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

router.get("/opay/verify/:reference", (req, res) => {
  const { reference } = req.params;
  const tx = TRANSACTIONS[reference];
  if (!tx) return res.status(404).json({ error: "Not found" });
  TRANSACTIONS[reference] = { ...tx, status: "success" };
  return res.json({ status: true, data: { status: "success", reference, amount: tx.amount } });
});

router.get("/transactions", (req, res) => {
  return res.json(Object.values(TRANSACTIONS).sort((a: any, b: any) => b.reference.localeCompare(a.reference)));
});

export default router;
