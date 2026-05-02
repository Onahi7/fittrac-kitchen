import { Router } from "express";
import crypto from "crypto";

const router = Router();

const COMMON_TESTS = [
  { name: "Fasting Blood Sugar (FBS)", instructions: "Fast for 8-12 hours before collecting. No food or drink except water." },
  { name: "HbA1c", instructions: "No special preparation needed. Shows 3-month blood sugar average." },
  { name: "Lipid Profile (Cholesterol)", instructions: "Fast for 9-12 hours. Avoid fatty meals the day before." },
  { name: "Liver Function Test (LFT)", instructions: "Fast for 8 hours. Avoid alcohol for 24 hours prior." },
  { name: "Complete Blood Count (CBC)", instructions: "No special preparation. Morning collection preferred." },
  { name: "Kidney Function Test (KFT / RFT)", instructions: "Stay well hydrated. No NSAIDs (ibuprofen) 24 hours before." },
  { name: "Blood Pressure Monitoring (24hr)", instructions: "Wear the monitor for 24 hours and log activities." },
  { name: "Thyroid Function (TSH, T3, T4)", instructions: "Take thyroid medication AFTER the test if applicable." },
  { name: "Urine Analysis (Urinalysis)", instructions: "Collect midstream urine sample in sterile container." },
  { name: "Electrolytes (Na, K, Cl)", instructions: "No special preparation needed." },
];

const PRESCRIPTIONS: Record<string, any> = {};
const TEST_REQUESTS: Record<string, any> = {};

router.get("/tests", (_req, res) => {
  return res.json(COMMON_TESTS);
});

router.post("/test-requests", (req, res) => {
  const { consultationId, tests, doctorName } = req.body;
  const id = `TR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const request = {
    id,
    consultationId,
    doctorName,
    requestedAt: new Date().toISOString(),
    tests: tests.map((t: string) => {
      const test = COMMON_TESTS.find((ct) => ct.name === t);
      return test ?? { name: t, instructions: "Follow standard preparation guidelines." };
    }),
    status: "pending",
  };
  TEST_REQUESTS[id] = request;
  return res.json(request);
});

router.get("/test-requests/:id", (req, res) => {
  const { id } = req.params;
  const request = TEST_REQUESTS[id];
  if (!request) return res.status(404).json({ error: "Not found" });
  return res.json(request);
});

router.get("/test-requests/consultation/:consultationId", (req, res) => {
  const { consultationId } = req.params;
  const requests = Object.values(TEST_REQUESTS).filter((r: any) => r.consultationId === consultationId);
  return res.json(requests);
});

router.patch("/test-requests/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, resultImageUri, doctorComment } = req.body;
  if (!TEST_REQUESTS[id]) return res.status(404).json({ error: "Not found" });
  TEST_REQUESTS[id] = { ...TEST_REQUESTS[id], status, resultImageUri, doctorComment };
  return res.json(TEST_REQUESTS[id]);
});

router.post("/prescriptions", (req, res) => {
  const { consultationId, doctorName, doctorType, diagnosis, medications, labTests, followUpDate, notes } = req.body;
  const id = `RX-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const prescription = {
    id,
    consultationId,
    doctorName,
    doctorType,
    issuedAt: new Date().toISOString(),
    diagnosis,
    medications: medications ?? [],
    labTests: labTests ?? [],
    followUpDate,
    notes: notes ?? "",
  };
  PRESCRIPTIONS[id] = prescription;
  return res.json(prescription);
});

router.get("/prescriptions/:id", (req, res) => {
  const { id } = req.params;
  const rx = PRESCRIPTIONS[id];
  if (!rx) return res.status(404).json({ error: "Not found" });
  return res.json(rx);
});

router.get("/prescriptions/consultation/:consultationId", (req, res) => {
  const { consultationId } = req.params;
  const rxs = Object.values(PRESCRIPTIONS).filter((r: any) => r.consultationId === consultationId);
  return res.json(rxs);
});

export default router;
