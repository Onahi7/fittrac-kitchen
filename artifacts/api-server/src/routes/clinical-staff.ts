import { Router } from "express";
import crypto from "crypto";
import { supabase } from "../lib/supabase.js";

const router = Router();

function mapPatient(r: any) {
  return {
    id: r.id, name: r.name, age: r.age, gender: r.gender, dob: r.dob,
    phone: r.phone, email: r.email, conditions: r.conditions ?? [],
    primaryCondition: r.primary_condition, bmi: r.bmi, bloodType: r.blood_type,
    lastVisit: r.last_visit, nextAppointment: r.next_appointment,
    assignedDoctorId: r.assigned_doctor_id, assignedNutritionistId: r.assigned_nutritionist_id,
    fastingGlucose: r.fasting_glucose, hba1c: r.hba1c,
    bpSystolic: r.bp_systolic, bpDiastolic: r.bp_diastolic,
    cholesterol: r.cholesterol, medications: r.medications ?? [],
    notes: r.notes, adherenceScore: r.adherence_score, riskScore: r.risk_score,
  };
}

function mapConsultation(r: any, patient?: any) {
  return {
    id: r.id, patientId: r.patient_id ?? r.patientId,
    doctorId: r.doctor_id ?? r.doctorId, nutritionistId: r.nutritionist_id ?? r.nutritionistId,
    date: r.date, scheduledTime: r.scheduled_time ?? r.scheduledTime,
    duration: r.duration, status: r.status, type: r.type,
    notes: r.notes, chiefComplaint: r.chief_complaint ?? r.chiefComplaint,
    patientName: patient?.name ?? r.patientName ?? null,
    patient: patient ?? null,
  };
}

function mapLabResult(r: any, patientName?: string) {
  return {
    id: r.id, patientId: r.patient_id ?? r.patientId, orderedBy: r.ordered_by ?? r.orderedBy,
    testName: r.test_name ?? r.testName, value: r.value, unit: r.unit,
    referenceRange: r.reference_range ?? r.referenceRange,
    flag: r.flag ?? (r.status === "critical" ? "critical" : r.status === "abnormal" ? "elevated" : null),
    status: r.status, date: r.date, uploadedAt: r.uploaded_at ?? r.uploadedAt,
    notes: r.notes,
    patientName: patientName ?? r.patientName ?? null,
  };
}

function mapMealPlan(r: any, patient?: any) {
  return {
    id: r.id, patientId: r.patient_id ?? r.patientId, nutritionistId: r.nutritionist_id ?? r.nutritionistId,
    createdAt: r.created_at ?? r.createdAt, title: r.title, status: r.status,
    targetCalories: r.target_calories ?? r.targetCalories, targetProtein: r.target_protein ?? r.targetProtein,
    targetCarbs: r.target_carbs ?? r.targetCarbs, targetFat: r.target_fat ?? r.targetFat,
    targetSodium: r.target_sodium ?? r.targetSodium, adherenceScore: r.adherence_score ?? r.adherenceScore,
    meals: r.meals ?? [], patient: patient ?? null,
  };
}

function mapPrescription(r: any, patient?: any) {
  return {
    id: r.id, patientId: r.patient_id ?? r.patientId, doctorId: r.doctor_id ?? r.doctorId,
    date: r.date, diagnosis: r.diagnosis, medications: r.medications ?? [],
    notes: r.notes, validUntil: r.valid_until ?? r.validUntil,
    patient: patient ?? null,
  };
}

function mapSessionNote(r: any, patient?: any) {
  return {
    id: r.id, patientId: r.patient_id ?? r.patientId, nutritionistId: r.nutritionist_id ?? r.nutritionistId,
    date: r.date, sessionType: r.session_type ?? r.sessionType,
    summary: r.summary, actionItems: r.action_items ?? r.actionItems ?? [],
    nextSession: r.next_session ?? r.nextSession,
    patient: patient ?? null,
  };
}

const activeSessions = new Map<string, string>();

function generateToken() { return crypto.randomBytes(32).toString("hex"); }

async function resolveStaff(username: string, password: string) {
  if (!supabase) return null;
  const { data } = await supabase
    .from("clinical_staff")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .single();
  if (!data) return null;
  return { id: data.id, username: data.username, name: data.name, title: data.title, role: data.role, specialization: data.specialization, email: data.email, badge: data.badge, licenseNo: data.license_no, patientsToday: data.patients_today };
}

async function resolveStaffById(id: string) {
  if (!supabase) return null;
  const { data } = await supabase.from("clinical_staff").select("*").eq("id", id).single();
  if (!data) return null;
  return { id: data.id, name: data.name, title: data.title, role: data.role, specialization: data.specialization, email: data.email, badge: data.badge, licenseNo: data.license_no, patientsToday: data.patients_today };
}

function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const staffId = activeSessions.get(token);
  if (!token || !staffId) return res.status(401).json({ error: "Unauthorized" });
  req.staffId = staffId;
  next();
}

async function loadStaffMiddleware(req: any, res: any, next: any) {
  const staff = await resolveStaffById(req.staffId);
  if (!staff) return res.status(401).json({ error: "Unauthorized" });
  req.clinicalStaff = staff;
  next();
}

router.post("/login", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const { username, password } = req.body ?? {};
  const staff = await resolveStaff(username, password);
  if (!staff) return res.status(401).json({ error: "Invalid credentials" });
  const token = generateToken();
  activeSessions.set(token, staff.id);
  return res.json({ token, staff });
});

router.post("/logout", authMiddleware, (req: any, res) => {
  const token = (req.headers.authorization ?? "").slice(7);
  activeSessions.delete(token);
  return res.json({ success: true });
});

router.get("/me", authMiddleware, loadStaffMiddleware, (req: any, res) => {
  return res.json(req.clinicalStaff);
});

router.get("/dashboard", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const staff = req.clinicalStaff;
  const today = new Date().toISOString().slice(0, 10);
  try {
    if (staff.role === "doctor") {
      const [{ data: consults }, { data: patients }, { data: labs }, { data: rxs }] = await Promise.all([
        supabase.from("consultations").select("*").eq("doctor_id", staff.id).eq("date", today),
        supabase.from("patients").select("id, name").eq("assigned_doctor_id", staff.id),
        supabase.from("lab_results").select("*").eq("flag", "critical"),
        supabase.from("prescriptions").select("id").eq("doctor_id", staff.id),
      ]);
      const myPatientIds = new Set((patients ?? []).map((p: any) => p.id));
      const criticalAlerts = (labs ?? []).filter((l: any) => myPatientIds.has(l.patient_id)).length;
      const upcoming = (consults ?? []).filter((c: any) => c.status === "scheduled")[0] ?? null;
      const upcomingPatient = upcoming ? (patients ?? []).find((p: any) => p.id === upcoming.patient_id) : null;
      return res.json({
        role: "doctor",
        todayConsultations: (consults ?? []).length,
        completed: (consults ?? []).filter((c: any) => c.status === "completed").length,
        inProgress: (consults ?? []).filter((c: any) => c.status === "in-progress").length,
        scheduled: (consults ?? []).filter((c: any) => c.status === "scheduled").length,
        totalPatients: (patients ?? []).length,
        criticalAlerts,
        pendingPrescriptions: (rxs ?? []).length,
        upcomingConsultation: upcoming ? { ...upcoming, patientName: upcomingPatient?.name ?? null } : null,
        recentActivity: [],
      });
    } else {
      const [{ data: clients }, { data: plans }, { data: consults }] = await Promise.all([
        supabase.from("patients").select("id, name, adherence_score").eq("assigned_nutritionist_id", staff.id),
        supabase.from("meal_plans").select("*").eq("nutritionist_id", staff.id),
        supabase.from("consultations").select("*").eq("nutritionist_id", staff.id).eq("date", today),
      ]);
      const activePlans = (plans ?? []).filter((p: any) => p.status === "active");
      const avgAdherence = activePlans.length
        ? Math.round(activePlans.reduce((s: number, p: any) => s + (p.adherence_score ?? 0), 0) / activePlans.length)
        : 0;
      const attention = (clients ?? []).filter((c: any) => {
        const plan = (plans ?? []).find((p: any) => p.patient_id === c.id);
        return plan && (plan.adherence_score ?? 0) < 60;
      }).map((c: any) => ({ id: c.id, name: c.name, adherenceScore: (plans ?? []).find((p: any) => p.patient_id === c.id)?.adherence_score ?? 0, reason: "Low meal plan adherence" }));
      return res.json({
        role: "nutritionist",
        totalClients: (clients ?? []).length,
        activePlans: activePlans.length,
        averageAdherence: avgAdherence,
        highAdherence: activePlans.filter((p: any) => (p.adherence_score ?? 0) >= 80).length,
        lowAdherence: activePlans.filter((p: any) => (p.adherence_score ?? 0) < 60).length,
        todaySessions: (consults ?? []).length,
        clientsNeedingAttention: attention,
        recentActivity: [],
      });
    }
  } catch (err) {
    req.log?.error(err, "dashboard error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/patients", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const staff = req.clinicalStaff;
  try {
    const col = staff.role === "doctor" ? "assigned_doctor_id" : "assigned_nutritionist_id";
    const { data, error } = await supabase.from("patients").select("*").eq(col, staff.id);
    if (error) throw error;
    return res.json({ patients: (data ?? []).map(mapPatient) });
  } catch (err) {
    req.log?.error(err, "patients error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/patients/:id", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const { data: patient, error } = await supabase.from("patients").select("*").eq("id", req.params.id).single();
    if (error || !patient) return res.status(404).json({ error: "Patient not found" });
    const [{ data: labs }, { data: rxs }, { data: consults }, { data: plans }, { data: notes }] = await Promise.all([
      supabase.from("lab_results").select("*").eq("patient_id", patient.id),
      supabase.from("prescriptions").select("*").eq("patient_id", patient.id),
      supabase.from("consultations").select("*").eq("patient_id", patient.id).order("date", { ascending: false }).limit(5),
      supabase.from("meal_plans").select("*").eq("patient_id", patient.id),
      supabase.from("session_notes").select("*").eq("patient_id", patient.id),
    ]);
    return res.json({ ...mapPatient(patient), labs: (labs ?? []).map((l) => mapLabResult(l)), prescriptions: (rxs ?? []).map((r) => mapPrescription(r)), consultations: (consults ?? []).map((c) => mapConsultation(c)), mealPlans: (plans ?? []).map((m) => mapMealPlan(m)), sessionNotes: (notes ?? []).map((n) => mapSessionNote(n)) });
  } catch (err) {
    req.log?.error(err, "patient detail error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/consultations", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const staff = req.clinicalStaff;
  const date = (req.query.date as string) ?? new Date().toISOString().slice(0, 10);
  try {
    const col = staff.role === "doctor" ? "doctor_id" : "nutritionist_id";
    const { data: consults, error } = await supabase.from("consultations").select("*, patients(id, name)").eq(col, staff.id).eq("date", date);
    if (error) throw error;
    return res.json({ consultations: (consults ?? []).map((c: any) => mapConsultation(c, c.patients)) });
  } catch (err) {
    req.log?.error(err, "consultations error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/consultations/:id", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const { data: c, error } = await supabase.from("consultations").select("*, patients(*)").eq("id", req.params.id).single();
    if (error || !c) return res.status(404).json({ error: "Not found" });
    const [{ data: labs }, { data: plan }] = await Promise.all([
      supabase.from("lab_results").select("*").eq("patient_id", c.patient_id).limit(3),
      supabase.from("meal_plans").select("*").eq("patient_id", c.patient_id).eq("status", "active").limit(1),
    ]);
    return res.json({ ...mapConsultation(c, c.patients), patient: mapPatient(c.patients), recentLabs: (labs ?? []).map((l) => mapLabResult(l)), activeMealPlan: plan?.[0] ? mapMealPlan(plan[0]) : null });
  } catch (err) {
    req.log?.error(err, "consultation detail error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/consultations/:id", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  try {
    const updates: any = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    const { data, error } = await supabase.from("consultations").update(updates).eq("id", req.params.id).select().single();
    if (error) throw error;
    return res.json(mapConsultation(data));
  } catch (err) {
    req.log?.error(err, "update consultation error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/lab-results", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const staff = req.clinicalStaff;
  try {
    const { data: patients } = await supabase.from("patients").select("id, name").eq("assigned_doctor_id", staff.id);
    const patientIds = (patients ?? []).map((p: any) => p.id);
    if (patientIds.length === 0) return res.json({ labResults: [] });
    const { data: labs, error } = await supabase.from("lab_results").select("*").in("patient_id", patientIds).order("date", { ascending: false });
    if (error) throw error;
    const pMap = new Map((patients ?? []).map((p: any) => [p.id, p.name]));
    return res.json({ labResults: (labs ?? []).map((l: any) => mapLabResult(l, pMap.get(l.patient_id))) });
  } catch (err) {
    req.log?.error(err, "lab-results error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/prescriptions", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const staff = req.clinicalStaff;
  try {
    const { data, error } = await supabase.from("prescriptions").select("*, patients(id, name, conditions)").eq("doctor_id", staff.id).order("date", { ascending: false });
    if (error) throw error;
    return res.json({ prescriptions: (data ?? []).map((r: any) => mapPrescription(r, r.patients)) });
  } catch (err) {
    req.log?.error(err, "prescriptions error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/prescriptions", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const staff = req.clinicalStaff;
  if (staff.role !== "doctor") return res.status(403).json({ error: "Doctors only" });
  try {
    const id = `rx-${Date.now()}`;
    const date = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase.from("prescriptions").insert({ id, doctor_id: staff.id, date, patient_id: req.body.patientId, diagnosis: req.body.diagnosis, medications: req.body.medications ?? [], notes: req.body.notes, valid_until: req.body.validUntil }).select().single();
    if (error) throw error;
    return res.status(201).json(mapPrescription(data));
  } catch (err) {
    req.log?.error(err, "create prescription error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/meal-plans", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const staff = req.clinicalStaff;
  try {
    const { data, error } = await supabase.from("meal_plans").select("*, patients(id, name, conditions)").eq("nutritionist_id", staff.id);
    if (error) throw error;
    return res.json({ mealPlans: (data ?? []).map((m: any) => mapMealPlan(m, m.patients)) });
  } catch (err) {
    req.log?.error(err, "meal-plans error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/meal-plans", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const staff = req.clinicalStaff;
  if (staff.role !== "nutritionist") return res.status(403).json({ error: "Nutritionists only" });
  try {
    const id = `mp-${Date.now()}`;
    const { data, error } = await supabase.from("meal_plans").insert({ id, nutritionist_id: staff.id, patient_id: req.body.patientId, title: req.body.title, status: "active", target_calories: req.body.targetCalories, target_protein: req.body.targetProtein, target_carbs: req.body.targetCarbs, target_fat: req.body.targetFat, target_sodium: req.body.targetSodium, adherence_score: 0, meals: req.body.meals ?? [] }).select().single();
    if (error) throw error;
    return res.status(201).json(mapMealPlan(data));
  } catch (err) {
    req.log?.error(err, "create meal-plan error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/session-notes", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const staff = req.clinicalStaff;
  try {
    const { data, error } = await supabase.from("session_notes").select("*, patients(id, name)").eq("nutritionist_id", staff.id).order("date", { ascending: false });
    if (error) throw error;
    return res.json({ sessionNotes: (data ?? []).map((n: any) => mapSessionNote(n, n.patients)) });
  } catch (err) {
    req.log?.error(err, "session-notes error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/session-notes", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const staff = req.clinicalStaff;
  try {
    const id = `sn-${Date.now()}`;
    const date = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase.from("session_notes").insert({ id, nutritionist_id: staff.id, patient_id: req.body.patientId, date, session_type: req.body.sessionType, summary: req.body.summary, action_items: req.body.actionItems ?? [], next_session: req.body.nextSession }).select().single();
    if (error) throw error;
    return res.status(201).json(mapSessionNote(data));
  } catch (err) {
    req.log?.error(err, "create session-note error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/nutrition-analytics", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });
  const staff = req.clinicalStaff;
  try {
    const { data: plans, error } = await supabase.from("meal_plans").select("*, patients(id, name, conditions)").eq("nutritionist_id", staff.id);
    if (error) throw error;
    const activePlans = (plans ?? []).filter((p: any) => p.status === "active");
    const avgAdherence = activePlans.length
      ? Math.round(activePlans.reduce((s: number, p: any) => s + (p.adherence_score ?? 0), 0) / activePlans.length)
      : 0;
    return res.json({
      totalClients: (plans ?? []).length,
      activePlans: activePlans.length,
      averageAdherence: avgAdherence,
      planAdherenceData: activePlans.map((p: any) => ({
        patientName: p.patients?.name ?? "Unknown",
        adherenceScore: p.adherence_score ?? 0,
        title: p.title,
      })),
    });
  } catch (err) {
    req.log?.error(err, "nutrition analytics error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
