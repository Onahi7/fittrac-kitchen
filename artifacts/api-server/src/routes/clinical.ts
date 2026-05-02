import { Router } from "express";
import crypto from "crypto";
import { supabase } from "../lib/supabase.js";

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

function genId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

router.get("/tests", (_req, res) => {
  return res.json(COMMON_TESTS);
});

router.post("/test-requests", async (req, res) => {
  const { consultationId, tests, doctorName } = req.body;
  const id = genId("TR");
  const requestedAt = new Date().toISOString();

  const resolvedTests = (tests as string[]).map((t: string) => {
    const found = COMMON_TESTS.find((ct) => ct.name === t);
    return found ?? { name: t, instructions: "Follow standard preparation guidelines." };
  });

  const request = { id, consultationId, doctorName, requestedAt, tests: resolvedTests, status: "pending" };

  if (supabase) {
    await supabase.from("clinical_test_requests").insert({
      id,
      consultation_id: consultationId ?? null,
      doctor_name: doctorName ?? null,
      requested_at: requestedAt,
      tests: resolvedTests,
      status: "pending",
    });
  }

  return res.json(request);
});

router.get("/test-requests/:id", async (req, res) => {
  const { id } = req.params;

  if (supabase) {
    const { data } = await supabase.from("clinical_test_requests").select("*").eq("id", id).maybeSingle();
    if (data) return res.json(data);
  }

  return res.status(404).json({ error: "Not found" });
});

router.get("/test-requests/consultation/:consultationId", async (req, res) => {
  const { consultationId } = req.params;

  if (supabase) {
    const { data } = await supabase
      .from("clinical_test_requests")
      .select("*")
      .eq("consultation_id", consultationId);
    return res.json(data ?? []);
  }

  return res.json([]);
});

router.patch("/test-requests/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, resultImageUri, doctorComment } = req.body;

  if (supabase) {
    const updates: any = { status };
    if (resultImageUri) updates.result_image_uri = resultImageUri;
    if (doctorComment) updates.doctor_comment = doctorComment;

    const { data, error } = await supabase
      .from("clinical_test_requests")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error || !data) return res.status(404).json({ error: "Not found" });
    return res.json(data);
  }

  return res.status(503).json({ error: "Database not configured" });
});

router.post("/test-results", async (req, res) => {
  const { consultationId, uploads } = req.body ?? {};
  const id = genId("RES");
  const result = {
    id,
    consultationId: consultationId ?? null,
    uploadedAt: new Date().toISOString(),
    count: Array.isArray(uploads) ? uploads.length : 0,
    status: "pending_review",
  };
  return res.status(201).json(result);
});

router.post("/prescriptions", async (req, res) => {
  const { consultationId, doctorName, doctorType, diagnosis, medications, labTests, followUpDate, notes } = req.body;
  const id = genId("RX");
  const issuedAt = new Date().toISOString();

  const prescription = {
    id, consultationId, doctorName, doctorType, issuedAt,
    diagnosis,
    medications: medications ?? [],
    labTests: labTests ?? [],
    followUpDate,
    notes: notes ?? "",
  };

  if (supabase) {
    await supabase.from("prescriptions").insert({
      id,
      consultation_id: consultationId ?? null,
      doctor_name: doctorName ?? null,
      doctor_type: doctorType ?? null,
      issued_at: issuedAt,
      diagnosis,
      medications: medications ?? [],
      lab_tests: labTests ?? [],
      follow_up_date: followUpDate ?? null,
      notes: notes ?? null,
      date: issuedAt.slice(0, 10),
    });
  }

  return res.json(prescription);
});

router.get("/prescriptions/:id", async (req, res) => {
  const { id } = req.params;

  if (supabase) {
    const { data } = await supabase.from("prescriptions").select("*").eq("id", id).maybeSingle();
    if (data) {
      return res.json({
        id: data.id,
        consultationId: data.consultation_id,
        doctorName: data.doctor_name,
        doctorType: data.doctor_type,
        issuedAt: data.issued_at ?? data.created_at,
        diagnosis: data.diagnosis,
        medications: data.medications ?? [],
        labTests: data.lab_tests ?? [],
        followUpDate: data.follow_up_date,
        notes: data.notes ?? "",
      });
    }
  }

  return res.status(404).json({ error: "Not found" });
});

router.get("/prescriptions/consultation/:consultationId", async (req, res) => {
  const { consultationId } = req.params;

  if (supabase) {
    const { data } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("consultation_id", consultationId);

    const mapped = (data ?? []).map((r: any) => ({
      id: r.id,
      consultationId: r.consultation_id,
      doctorName: r.doctor_name,
      doctorType: r.doctor_type,
      issuedAt: r.issued_at ?? r.created_at,
      diagnosis: r.diagnosis,
      medications: r.medications ?? [],
      labTests: r.lab_tests ?? [],
      followUpDate: r.follow_up_date,
      notes: r.notes ?? "",
    }));
    return res.json(mapped);
  }

  return res.json([]);
});

export default router;
