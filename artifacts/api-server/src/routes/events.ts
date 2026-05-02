import { Router, type Request, type Response } from "express";

const router = Router();
const clients = new Set<Response>();

export function broadcastOrderUpdate(orderId: string, status: string, extra?: object) {
  const payload = JSON.stringify({ type: "ORDER_UPDATE", orderId, status, ...extra, ts: Date.now() });
  for (const client of clients) {
    try { client.write(`data: ${payload}\n\n`); } catch {}
  }
}

router.get("/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.write(`data: ${JSON.stringify({ type: "CONNECTED", ts: Date.now() })}\n\n`);

  clients.add(res);

  const heartbeat = setInterval(() => {
    try { res.write(`: heartbeat\n\n`); } catch {}
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
});

router.post("/broadcast", (req, res) => {
  const { orderId, status } = req.body;
  broadcastOrderUpdate(orderId, status);
  return res.json({ sent: clients.size });
});

export default router;
