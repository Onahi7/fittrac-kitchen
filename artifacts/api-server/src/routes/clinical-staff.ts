import { Router } from "express";
import crypto from "crypto";
import { supabase } from "../lib/supabase.js";

const router = Router();

// ─── Fallback mock data (used when Supabase is not configured) ─────────────────
const MOCK_STAFF = [
  { id: "doc-001", username: "dr.amara", password: "doctor2026", name: "Dr. Amara Osei", title: "MD, Internal Medicine", role: "doctor", specialization: "Internal Medicine & Metabolic Health", email: "dr.amara@fittrac.ng", badge: "MD, FMCP", licenseNo: "MDCN/2019/04821", patientsToday: 8 },
  { id: "doc-002", username: "dr.ifiok", password: "doctor2026", name: "Dr. Ifiok Bassey", title: "MD, Endocrinology", role: "doctor", specialization: "Endocrinology & Diabetes Care", email: "dr.ifiok@fittrac.ng", badge: "MD, FMCP, FACE", licenseNo: "MDCN/2017/03912", patientsToday: 6 },
  { id: "nut-001", username: "nutri.kezia", password: "nutri2026", name: "Kezia Aderemi", title: "RDN, Registered Dietitian", role: "nutritionist", specialization: "Clinical Nutrition & Meal Planning", email: "kezia@fittrac.ng", badge: "RDN, MSc", licenseNo: "NDN/2021/00714", patientsToday: 11 },
  { id: "nut-002", username: "nutri.chika", password: "nutri2026", name: "Chika Eze", title: "MSc, Sports Nutrition", role: "nutritionist", specialization: "Sports Nutrition & Weight Management", email: "chika@fittrac.ng", badge: "MSc, PGDip", licenseNo: "NDN/2020/00588", patientsToday: 9 },
];

const MOCK_PATIENTS = [
  { id: "pat-001", name: "Amaka Okonkwo", age: 42, gender: "female", dob: "1982-03-14", phone: "08031234567", email: "amaka@example.com", conditions: ["hypertension","diabetes"], primaryCondition: "Hypertension", bmi: 28.4, bloodType: "O+", lastVisit: "2026-04-28", nextAppointment: "2026-05-03", assignedDoctorId: "doc-001", assignedNutritionistId: "nut-001", fastingGlucose: 118, hba1c: 7.2, bpSystolic: 142, bpDiastolic: 91, cholesterol: 205, medications: ["Metformin 500mg","Lisinopril 10mg"], notes: "Patient responding well to dietary changes. BP trending down.", adherenceScore: 74, riskScore: 6 },
  { id: "pat-002", name: "Emeka Nwosu", age: 35, gender: "male", dob: "1990-11-08", phone: "07051234567", email: "emeka@example.com", conditions: ["diabetes"], primaryCondition: "Diabetes", bmi: 31.2, bloodType: "A+", lastVisit: "2026-04-25", nextAppointment: "2026-05-04", assignedDoctorId: "doc-001", assignedNutritionistId: "nut-001", fastingGlucose: 134, hba1c: 8.1, bpSystolic: 128, bpDiastolic: 82, cholesterol: 188, medications: ["Metformin 1000mg","Glipizide 5mg"], notes: "HbA1c still elevated. Reviewing meal plan and medication dosage.", adherenceScore: 62, riskScore: 7 },
  { id: "pat-003", name: "Fatima Abubakar", age: 29, gender: "female", dob: "1996-07-22", phone: "09021234567", email: "fatima@example.com", conditions: ["weightloss"], primaryCondition: "Weight Loss", bmi: 34.7, bloodType: "B+", lastVisit: "2026-05-01", nextAppointment: "2026-05-08", assignedDoctorId: "doc-001", assignedNutritionistId: "nut-001", fastingGlucose: 88, hba1c: 5.4, bpSystolic: 118, bpDiastolic: 76, cholesterol: 172, medications: [], notes: "Motivated patient. Meal log compliance excellent.", adherenceScore: 91, riskScore: 2 },
  { id: "pat-004", name: "Babatunde Fashola", age: 56, gender: "male", dob: "1969-01-30", phone: "08021234567", email: "baba@example.com", conditions: ["hypertension","liver"], primaryCondition: "Hypertension", bmi: 27.1, bloodType: "O-", lastVisit: "2026-04-20", nextAppointment: "2026-05-05", assignedDoctorId: "doc-002", assignedNutritionistId: "nut-001", fastingGlucose: 95, hba1c: 5.7, bpSystolic: 158, bpDiastolic: 98, cholesterol: 231, medications: ["Amlodipine 5mg","Atorvastatin 20mg"], notes: "LFT results pending. Sodium restriction critical.", adherenceScore: 55, riskScore: 8 },
  { id: "pat-005", name: "Ngozi Eze", age: 38, gender: "female", dob: "1987-09-11", phone: "08041234567", email: "ngozi@example.com", conditions: ["diabetes","weightloss"], primaryCondition: "Diabetes", bmi: 30.1, bloodType: "AB+", lastVisit: "2026-04-29", nextAppointment: "2026-05-06", assignedDoctorId: "doc-002", assignedNutritionistId: "nut-002", fastingGlucose: 111, hba1c: 6.9, bpSystolic: 124, bpDiastolic: 80, cholesterol: 196, medications: ["Metformin 500mg"], notes: "Started low-GI meal plan 3 weeks ago. Progress steady.", adherenceScore: 82, riskScore: 5 },
  { id: "pat-006", name: "Chidi Umeh", age: 45, gender: "male", dob: "1980-05-17", phone: "07041234567", email: "chidi@example.com", conditions: ["hypertension"], primaryCondition: "Hypertension", bmi: 25.6, bloodType: "A-", lastVisit: "2026-04-15", nextAppointment: "2026-05-10", assignedDoctorId: "doc-001", assignedNutritionistId: "nut-002", fastingGlucose: 91, hba1c: 5.2, bpSystolic: 148, bpDiastolic: 95, cholesterol: 210, medications: ["Lisinopril 20mg","Hydrochlorothiazide 12.5mg"], notes: "Dietary compliance improved after counselling.", adherenceScore: 68, riskScore: 5 },
  { id: "pat-007", name: "Seun Adeyemi", age: 32, gender: "female", dob: "1993-12-03", phone: "09041234567", email: "seun@example.com", conditions: ["weightloss","allergies"], primaryCondition: "Weight Loss", bmi: 29.3, bloodType: "B-", lastVisit: "2026-05-01", nextAppointment: "2026-05-07", assignedDoctorId: "doc-001", assignedNutritionistId: "nut-002", fastingGlucose: 84, hba1c: 5.1, bpSystolic: 116, bpDiastolic: 74, cholesterol: 165, medications: ["Cetirizine 10mg"], notes: "Gluten-free Nigerian alternatives working well.", adherenceScore: 88, riskScore: 2 },
  { id: "pat-008", name: "Kemi Bello", age: 51, gender: "female", dob: "1974-08-25", phone: "08091234567", email: "kemi@example.com", conditions: ["liver","hypertension","diabetes"], primaryCondition: "Liver Disease", bmi: 26.8, bloodType: "O+", lastVisit: "2026-04-18", nextAppointment: "2026-05-02", assignedDoctorId: "doc-002", assignedNutritionistId: "nut-001", fastingGlucose: 128, hba1c: 7.8, bpSystolic: 152, bpDiastolic: 96, cholesterol: 248, medications: ["Metformin 1000mg","Lisinopril 10mg","Ursodeoxycholic acid 500mg"], notes: "Complex case. Liver enzymes elevated last check.", adherenceScore: 47, riskScore: 9 },
];

const MOCK_CONSULTATIONS = [
  { id: "cons-001", patientId: "pat-001", doctorId: "doc-001", nutritionistId: "nut-001", date: "2026-05-02", scheduledTime: "09:00", duration: 30, status: "completed", type: "follow-up", notes: "BP reviewed. Medication adjusted.", chiefComplaint: "Hypertension review" },
  { id: "cons-002", patientId: "pat-002", doctorId: "doc-001", nutritionistId: "nut-001", date: "2026-05-02", scheduledTime: "10:00", duration: 45, status: "in-progress", type: "follow-up", notes: "", chiefComplaint: "Diabetes management" },
  { id: "cons-003", patientId: "pat-003", doctorId: "doc-001", nutritionistId: "nut-001", date: "2026-05-02", scheduledTime: "11:30", duration: 30, status: "scheduled", type: "review", notes: "", chiefComplaint: "Weight loss check-in" },
  { id: "cons-004", patientId: "pat-007", doctorId: "doc-001", nutritionistId: "nut-002", date: "2026-05-02", scheduledTime: "14:00", duration: 30, status: "scheduled", type: "initial", notes: "", chiefComplaint: "Allergy management" },
  { id: "cons-005", patientId: "pat-006", doctorId: "doc-001", nutritionistId: "nut-002", date: "2026-05-02", scheduledTime: "15:30", duration: 45, status: "scheduled", type: "follow-up", notes: "", chiefComplaint: "BP review + meal plan update" },
  { id: "cons-006", patientId: "pat-004", doctorId: "doc-002", nutritionistId: "nut-001", date: "2026-05-02", scheduledTime: "09:30", duration: 30, status: "completed", type: "urgent", notes: "LFT reviewed. Sodium restriction reinforced.", chiefComplaint: "Liver function concern" },
  { id: "cons-007", patientId: "pat-005", doctorId: "doc-002", nutritionistId: "nut-002", date: "2026-05-02", scheduledTime: "11:00", duration: 30, status: "scheduled", type: "follow-up", notes: "", chiefComplaint: "Glucose control" },
  { id: "cons-008", patientId: "pat-008", doctorId: "doc-002", nutritionistId: "nut-001", date: "2026-05-02", scheduledTime: "13:00", duration: 60, status: "scheduled", type: "comprehensive", notes: "", chiefComplaint: "Complex multi-condition review" },
];

const MOCK_LAB_RESULTS: any[] = [
  { id: "lab-001", patientId: "pat-001", orderedBy: "doc-001", testName: "HbA1c", value: "7.2%", referenceRange: "< 5.7% normal, 5.7-6.4% pre-diabetic", flag: "elevated", status: "abnormal", date: "2026-04-26", uploadedAt: "2026-04-28", notes: "Slight improvement from 7.6% last quarter" },
  { id: "lab-002", patientId: "pat-001", orderedBy: "doc-001", testName: "Fasting Blood Sugar", value: "118 mg/dL", referenceRange: "70-99 mg/dL", flag: "elevated", status: "abnormal", date: "2026-04-26", uploadedAt: "2026-04-28", notes: "" },
  { id: "lab-003", patientId: "pat-001", orderedBy: "doc-001", testName: "Lipid Profile", value: "TC: 205, LDL: 130, HDL: 48, TG: 185 mg/dL", referenceRange: "TC < 200, LDL < 100, HDL > 60, TG < 150", flag: "elevated", status: "abnormal", date: "2026-04-26", uploadedAt: "2026-04-28", notes: "" },
  { id: "lab-004", patientId: "pat-002", orderedBy: "doc-001", testName: "HbA1c", value: "8.1%", referenceRange: "< 5.7%", flag: "critical", status: "critical", date: "2026-04-23", uploadedAt: "2026-04-25", notes: "Increased from 7.8%. Review medication and diet" },
  { id: "lab-005", patientId: "pat-004", orderedBy: "doc-002", testName: "Liver Function Test", value: "ALT: 68 U/L, AST: 54 U/L, ALP: 112 U/L", referenceRange: "ALT < 40, AST < 40, ALP 44-147", flag: "elevated", status: "abnormal", date: "2026-04-18", uploadedAt: "2026-04-20", notes: "Elevated transaminases. Alcohol cessation counselled" },
  { id: "lab-006", patientId: "pat-008", orderedBy: "doc-002", testName: "Complete Blood Count", value: "WBC: 7.2, Hgb: 11.8 g/dL, Hct: 36%, Plt: 198", referenceRange: "Hgb: 12-16 g/dL (F)", flag: "elevated", status: "abnormal", date: "2026-04-16", uploadedAt: "2026-04-18", notes: "Mild anaemia. Iron supplementation considered" },
  { id: "lab-007", patientId: "pat-005", orderedBy: "doc-002", testName: "Fasting Blood Sugar", value: "111 mg/dL", referenceRange: "70-99 mg/dL", flag: "elevated", status: "abnormal", date: "2026-04-27", uploadedAt: "2026-04-29", notes: "" },
  { id: "lab-008", patientId: "pat-006", orderedBy: "doc-001", testName: "Blood Pressure 24hr", value: "Avg: 148/95, Peak: 167/102 mmHg", referenceRange: "< 130/80 mmHg", flag: "elevated", status: "abnormal", date: "2026-04-14", uploadedAt: "2026-04-15", notes: "Sustained hypertension. Dose escalation recommended" },
];

const MOCK_PRESCRIPTIONS: any[] = [
  { id: "rx-001", patientId: "pat-001", doctorId: "doc-001", date: "2026-04-28", diagnosis: "Type 2 Diabetes Mellitus with Hypertension", medications: [{ name: "Metformin", dose: "500mg", frequency: "Twice daily", duration: "90 days", instructions: "Take with meals" }, { name: "Lisinopril", dose: "10mg", frequency: "Once daily", duration: "90 days", instructions: "Take in morning" }], notes: "Low-sodium, low-GI diet reinforced. Follow up in 4 weeks.", validUntil: "2026-07-28" },
  { id: "rx-002", patientId: "pat-002", doctorId: "doc-001", date: "2026-04-25", diagnosis: "Type 2 Diabetes Mellitus — Poor Control", medications: [{ name: "Metformin", dose: "1000mg", frequency: "Twice daily", duration: "60 days", instructions: "Take with meals" }, { name: "Glipizide", dose: "5mg", frequency: "Once daily before breakfast", duration: "60 days", instructions: "Monitor for hypoglycaemia" }], notes: "Increase physical activity. Fasting glucose monitoring daily.", validUntil: "2026-06-25" },
  { id: "rx-003", patientId: "pat-004", doctorId: "doc-002", date: "2026-04-20", diagnosis: "Essential Hypertension with Hyperlipidaemia", medications: [{ name: "Amlodipine", dose: "5mg", frequency: "Once daily", duration: "90 days", instructions: "Take in evening" }, { name: "Atorvastatin", dose: "20mg", frequency: "Once at night", duration: "90 days", instructions: "Avoid grapefruit" }], notes: "Strict low-sodium diet. Alcohol cessation mandatory. LFT repeat in 8 weeks.", validUntil: "2026-07-20" },
];

const MOCK_MEAL_PLANS: any[] = [
  { id: "mp-001", patientId: "pat-001", nutritionistId: "nut-001", createdAt: "2026-04-20", title: "Low-GI Hypertension Plan — Week 3", status: "active", targetCalories: 1800, targetProtein: 75, targetCarbs: 200, targetFat: 55, targetSodium: 1500, adherenceScore: 74, meals: [] },
  { id: "mp-002", patientId: "pat-002", nutritionistId: "nut-001", createdAt: "2026-04-18", title: "Glycemic Control Plan — High Compliance Target", status: "active", targetCalories: 1600, targetProtein: 85, targetCarbs: 160, targetFat: 50, targetSodium: 2000, adherenceScore: 62, meals: [] },
  { id: "mp-003", patientId: "pat-003", nutritionistId: "nut-001", createdAt: "2026-05-01", title: "Caloric Deficit + High Protein", status: "active", targetCalories: 1400, targetProtein: 95, targetCarbs: 130, targetFat: 45, targetSodium: 2000, adherenceScore: 91, meals: [] },
  { id: "mp-004", patientId: "pat-005", nutritionistId: "nut-002", createdAt: "2026-04-22", title: "Low-GI Diabetes + Weight Loss", status: "active", targetCalories: 1500, targetProtein: 90, targetCarbs: 145, targetFat: 48, targetSodium: 1800, adherenceScore: 82, meals: [] },
  { id: "mp-005", patientId: "pat-006", nutritionistId: "nut-002", createdAt: "2026-04-10", title: "DASH Diet Adaptation (Nigerian)", status: "active", targetCalories: 1900, targetProtein: 80, targetCarbs: 220, targetFat: 60, targetSodium: 1200, adherenceScore: 68, meals: [] },
  { id: "mp-006", patientId: "pat-007", nutritionistId: "nut-002", createdAt: "2026-05-01", title: "Gluten-Free Nigerian Plan", status: "active", targetCalories: 1650, targetProtein: 88, targetCarbs: 175, targetFat: 52, targetSodium: 2000, adherenceScore: 88, meals: [] },
];

const MOCK_SESSION_NOTES: any[] = [
  { id: "sn-001", patientId: "pat-001", nutritionistId: "nut-001", date: "2026-04-28", sessionType: "follow-up", summary: "Patient showed improved meal log compliance. Sodium intake down to avg 1800mg/day.", actionItems: ["Increase leafy greens intake","Try sugarless akamu for breakfast"], nextSession: "2026-05-12" },
  { id: "sn-002", patientId: "pat-002", nutritionistId: "nut-001", date: "2026-04-25", sessionType: "counselling", summary: "Reviewed food diary. Evening snacking identified as major issue.", actionItems: ["Replace chin-chin with groundnut","No food after 8pm"], nextSession: "2026-05-09" },
  { id: "sn-003", patientId: "pat-003", nutritionistId: "nut-001", date: "2026-05-01", sessionType: "check-in", summary: "Patient reports feeling energetic. Lost 2.1kg this month.", actionItems: ["Maintain current plan","Add resistance training"], nextSession: "2026-05-15" },
  { id: "sn-004", patientId: "pat-007", nutritionistId: "nut-002", date: "2026-05-01", sessionType: "initial", summary: "First nutritional assessment. Gluten sensitivity confirmed.", actionItems: ["Avoid all wheat-based foods","Focus on yam, plantain, oats"], nextSession: "2026-05-08" },
];

// ─── Helper: convert Supabase snake_case rows to camelCase API shape ──────────

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

// ─── Auth (token-based in memory; tokens are stateless JWTs in real prod) ─────
const activeSessions = new Map<string, string>();

function generateToken() { return crypto.randomBytes(32).toString("hex"); }

async function resolveStaff(username: string, password: string) {
  if (supabase) {
    const { data } = await supabase
      .from("clinical_staff")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();
    if (!data) return null;
    return { id: data.id, username: data.username, name: data.name, title: data.title, role: data.role, specialization: data.specialization, email: data.email, badge: data.badge, licenseNo: data.license_no, patientsToday: data.patients_today };
  }
  return MOCK_STAFF.find((s) => s.username === username && s.password === password) ?? null;
}

async function resolveStaffById(id: string) {
  if (supabase) {
    const { data } = await supabase.from("clinical_staff").select("*").eq("id", id).single();
    if (!data) return null;
    return { id: data.id, name: data.name, title: data.title, role: data.role, specialization: data.specialization, email: data.email, badge: data.badge, licenseNo: data.license_no, patientsToday: data.patients_today };
  }
  const s = MOCK_STAFF.find((s) => s.id === id);
  return s ? (({ password: _, ...rest }) => rest)(s as any) : null;
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

// ─── Auth Routes ───────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
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

// ─── Dashboard ─────────────────────────────────────────────────────────────────
router.get("/dashboard", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  const staff = req.clinicalStaff;
  const today = new Date().toISOString().slice(0, 10);

  try {
    if (supabase) {
      if (staff.role === "doctor") {
        const [{ data: consults }, { data: patients }, { data: labs }, { data: rxs }] = await Promise.all([
          supabase.from("consultations").select("*").eq("doctor_id", staff.id).eq("date", today),
          supabase.from("patients").select("id, name").eq("assigned_doctor_id", staff.id),
          supabase.from("lab_results").select("*").eq("flag", "critical"),
          supabase.from("prescriptions").select("id").eq("doctor_id", staff.id),
        ]);
        const myPatientIds = new Set((patients ?? []).map((p: any) => p.id));
        const criticalAlerts = (labs ?? []).filter((l: any) => myPatientIds.has(l.patient_id)).length;
        const upcoming = (consults ?? []).filter((c: any) => c.status === "scheduled")[0];
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
          recentActivity: [
            { time: "09:15", event: "Completed consultation with Amaka Okonkwo" },
            { time: "10:42", event: "Lab result flagged: Emeka Nwosu HbA1c critical" },
            { time: "11:00", event: "Prescription issued: Amaka Okonkwo" },
          ],
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
        const clientIds = new Set((clients ?? []).map((c: any) => c.id));
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
          recentActivity: [
            { time: "09:30", event: "Session notes added: Amaka Okonkwo" },
            { time: "10:15", event: "Meal plan updated: Emeka Nwosu" },
            { time: "11:00", event: "New client assigned: Seun Adeyemi" },
          ],
        });
      }
    }

    // ── Mock fallback ─────────────────────────────────────────────────────────
    const today2 = "2026-05-02";
    if (staff.role === "doctor") {
      const consults = MOCK_CONSULTATIONS.filter((c) => c.doctorId === staff.id && c.date === today2);
      const myPatients = MOCK_PATIENTS.filter((p) => p.assignedDoctorId === staff.id);
      const criticalLabs = MOCK_LAB_RESULTS.filter((l) => l.flag === "critical" && myPatients.some((p) => p.id === l.patientId));
      const upcoming = consults.find((c) => c.status === "scheduled");
      const upPatient = upcoming ? MOCK_PATIENTS.find((p) => p.id === upcoming.patientId) : null;
      return res.json({ role: "doctor", todayConsultations: consults.length, completed: consults.filter((c) => c.status === "completed").length, inProgress: consults.filter((c) => c.status === "in-progress").length, scheduled: consults.filter((c) => c.status === "scheduled").length, totalPatients: myPatients.length, criticalAlerts: criticalLabs.length, pendingPrescriptions: MOCK_PRESCRIPTIONS.filter((rx) => rx.doctorId === staff.id).length, upcomingConsultation: upcoming ? { ...upcoming, patientName: upPatient?.name ?? null } : null, recentActivity: [{ time: "09:15", event: "Completed consultation with Amaka Okonkwo" }, { time: "10:42", event: "Lab result flagged: Emeka Nwosu HbA1c critical" }, { time: "11:00", event: "Prescription issued: Amaka Okonkwo" }] });
    } else {
      const myClients = MOCK_PATIENTS.filter((p) => p.assignedNutritionistId === staff.id);
      const myPlans = MOCK_MEAL_PLANS.filter((m) => m.nutritionistId === staff.id);
      const avgAdherence = myPlans.length ? Math.round(myPlans.reduce((s, p) => s + p.adherenceScore, 0) / myPlans.length) : 0;
      const consults = MOCK_CONSULTATIONS.filter((c) => c.nutritionistId === staff.id && c.date === today2);
      return res.json({ role: "nutritionist", totalClients: myClients.length, activePlans: myPlans.filter((p) => p.status === "active").length, averageAdherence: avgAdherence, highAdherence: myPlans.filter((p) => p.adherenceScore >= 80).length, lowAdherence: myPlans.filter((p) => p.adherenceScore < 60).length, todaySessions: consults.length, clientsNeedingAttention: myClients.filter((c) => { const plan = myPlans.find((p) => p.patientId === c.id); return plan && plan.adherenceScore < 60; }).map((c) => ({ id: c.id, name: c.name, adherenceScore: myPlans.find((p) => p.patientId === c.id)?.adherenceScore ?? 0, reason: "Low meal plan adherence" })), recentActivity: [{ time: "09:30", event: "Session notes added: Amaka Okonkwo" }, { time: "10:15", event: "Meal plan updated: Emeka Nwosu" }, { time: "11:00", event: "New client assigned: Seun Adeyemi" }] });
    }
  } catch (err) {
    req.log?.error(err, "dashboard error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Patients ─────────────────────────────────────────────────────────────────
router.get("/patients", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  const staff = req.clinicalStaff;
  try {
    if (supabase) {
      const col = staff.role === "doctor" ? "assigned_doctor_id" : "assigned_nutritionist_id";
      const { data, error } = await supabase.from("patients").select("*").eq(col, staff.id);
      if (error) throw error;
      return res.json({ patients: (data ?? []).map(mapPatient) });
    }
    const patients = staff.role === "doctor"
      ? MOCK_PATIENTS.filter((p) => p.assignedDoctorId === staff.id)
      : MOCK_PATIENTS.filter((p) => p.assignedNutritionistId === staff.id);
    return res.json({ patients });
  } catch (err) {
    req.log?.error(err, "patients error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/patients/:id", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  try {
    if (supabase) {
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
    }
    const patient = MOCK_PATIENTS.find((p) => p.id === req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    return res.json({ ...patient, labs: MOCK_LAB_RESULTS.filter((l) => l.patientId === patient.id), prescriptions: MOCK_PRESCRIPTIONS.filter((rx) => rx.patientId === patient.id), consultations: MOCK_CONSULTATIONS.filter((c) => c.patientId === patient.id).slice(0, 5), mealPlans: MOCK_MEAL_PLANS.filter((m) => m.patientId === patient.id), sessionNotes: MOCK_SESSION_NOTES.filter((n) => n.patientId === patient.id) });
  } catch (err) {
    req.log?.error(err, "patient detail error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Consultations ────────────────────────────────────────────────────────────
router.get("/consultations", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  const staff = req.clinicalStaff;
  const date = (req.query.date as string) ?? new Date().toISOString().slice(0, 10);
  try {
    if (supabase) {
      const col = staff.role === "doctor" ? "doctor_id" : "nutritionist_id";
      const { data: consults, error } = await supabase.from("consultations").select("*, patients(id, name)").eq(col, staff.id).eq("date", date);
      if (error) throw error;
      return res.json({ consultations: (consults ?? []).map((c: any) => mapConsultation(c, c.patients)) });
    }
    const today = "2026-05-02";
    const consults = staff.role === "doctor"
      ? MOCK_CONSULTATIONS.filter((c) => c.doctorId === staff.id && c.date === today)
      : MOCK_CONSULTATIONS.filter((c) => c.nutritionistId === staff.id && c.date === today);
    return res.json({ consultations: consults.map((c) => ({ ...c, patientName: MOCK_PATIENTS.find((p) => p.id === c.patientId)?.name ?? null })) });
  } catch (err) {
    req.log?.error(err, "consultations error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/consultations/:id", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  try {
    if (supabase) {
      const { data: c, error } = await supabase.from("consultations").select("*, patients(*)").eq("id", req.params.id).single();
      if (error || !c) return res.status(404).json({ error: "Not found" });
      const [{ data: labs }, { data: plan }] = await Promise.all([
        supabase.from("lab_results").select("*").eq("patient_id", c.patient_id).limit(3),
        supabase.from("meal_plans").select("*").eq("patient_id", c.patient_id).eq("status", "active").limit(1),
      ]);
      return res.json({ ...mapConsultation(c, c.patients), patient: mapPatient(c.patients), recentLabs: (labs ?? []).map((l) => mapLabResult(l)), activeMealPlan: plan?.[0] ? mapMealPlan(plan[0]) : null });
    }
    const c = MOCK_CONSULTATIONS.find((x) => x.id === req.params.id);
    if (!c) return res.status(404).json({ error: "Not found" });
    const patient = MOCK_PATIENTS.find((p) => p.id === c.patientId);
    return res.json({ ...c, patient, patientName: patient?.name ?? null, recentLabs: MOCK_LAB_RESULTS.filter((l) => l.patientId === c.patientId).slice(0, 3), activeMealPlan: MOCK_MEAL_PLANS.find((m) => m.patientId === c.patientId && m.status === "active") ?? null });
  } catch (err) {
    req.log?.error(err, "consultation detail error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Lab Results ──────────────────────────────────────────────────────────────
router.get("/lab-results", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  const staff = req.clinicalStaff;
  try {
    if (supabase) {
      const { data: patients } = await supabase.from("patients").select("id, name").eq("assigned_doctor_id", staff.id);
      const patientIds = (patients ?? []).map((p: any) => p.id);
      if (patientIds.length === 0) return res.json({ labResults: [] });
      const { data: labs, error } = await supabase.from("lab_results").select("*").in("patient_id", patientIds).order("date", { ascending: false });
      if (error) throw error;
      const pMap = new Map((patients ?? []).map((p: any) => [p.id, p.name]));
      return res.json({ labResults: (labs ?? []).map((l: any) => mapLabResult(l, pMap.get(l.patient_id))) });
    }
    const myPatients = MOCK_PATIENTS.filter((p) => p.assignedDoctorId === staff.id);
    const pMap = new Map(myPatients.map((p) => [p.id, p.name]));
    const results = MOCK_LAB_RESULTS.filter((l) => pMap.has(l.patientId)).map((l) => ({ ...l, patientName: pMap.get(l.patientId) }));
    return res.json({ labResults: results });
  } catch (err) {
    req.log?.error(err, "lab-results error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Prescriptions ────────────────────────────────────────────────────────────
router.get("/prescriptions", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  const staff = req.clinicalStaff;
  try {
    if (supabase) {
      const { data, error } = await supabase.from("prescriptions").select("*, patients(id, name, conditions)").eq("doctor_id", staff.id).order("date", { ascending: false });
      if (error) throw error;
      return res.json({ prescriptions: (data ?? []).map((r: any) => mapPrescription(r, r.patients)) });
    }
    return res.json({ prescriptions: MOCK_PRESCRIPTIONS.filter((rx) => rx.doctorId === staff.id).map((rx) => ({ ...rx, patient: MOCK_PATIENTS.find((p) => p.id === rx.patientId) })) });
  } catch (err) {
    req.log?.error(err, "prescriptions error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/prescriptions", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  const staff = req.clinicalStaff;
  if (staff.role !== "doctor") return res.status(403).json({ error: "Doctors only" });
  try {
    const id = `rx-${Date.now()}`;
    const date = new Date().toISOString().slice(0, 10);
    if (supabase) {
      const { data, error } = await supabase.from("prescriptions").insert({ id, doctor_id: staff.id, date, patient_id: req.body.patientId, diagnosis: req.body.diagnosis, medications: req.body.medications ?? [], notes: req.body.notes, valid_until: req.body.validUntil }).select().single();
      if (error) throw error;
      return res.status(201).json(mapPrescription(data));
    }
    const rx = { id, doctorId: staff.id, date, ...req.body };
    MOCK_PRESCRIPTIONS.push(rx);
    return res.status(201).json(rx);
  } catch (err) {
    req.log?.error(err, "create prescription error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Meal Plans ───────────────────────────────────────────────────────────────
router.get("/meal-plans", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  const staff = req.clinicalStaff;
  try {
    if (supabase) {
      const { data, error } = await supabase.from("meal_plans").select("*, patients(id, name, conditions)").eq("nutritionist_id", staff.id);
      if (error) throw error;
      return res.json({ mealPlans: (data ?? []).map((m: any) => mapMealPlan(m, m.patients)) });
    }
    return res.json({ mealPlans: MOCK_MEAL_PLANS.filter((m) => m.nutritionistId === staff.id).map((m) => ({ ...m, patient: MOCK_PATIENTS.find((p) => p.id === m.patientId) })) });
  } catch (err) {
    req.log?.error(err, "meal-plans error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/meal-plans", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  const staff = req.clinicalStaff;
  if (staff.role !== "nutritionist") return res.status(403).json({ error: "Nutritionists only" });
  try {
    const id = `mp-${Date.now()}`;
    if (supabase) {
      const { data, error } = await supabase.from("meal_plans").insert({ id, nutritionist_id: staff.id, patient_id: req.body.patientId, title: req.body.title, status: "active", target_calories: req.body.targetCalories, target_protein: req.body.targetProtein, target_carbs: req.body.targetCarbs, target_fat: req.body.targetFat, target_sodium: req.body.targetSodium, adherence_score: 0, meals: req.body.meals ?? [] }).select().single();
      if (error) throw error;
      return res.status(201).json(mapMealPlan(data));
    }
    const plan = { id, nutritionistId: staff.id, createdAt: new Date().toISOString().slice(0, 10), status: "active", ...req.body };
    MOCK_MEAL_PLANS.push(plan);
    return res.status(201).json(plan);
  } catch (err) {
    req.log?.error(err, "create meal-plan error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Session Notes ────────────────────────────────────────────────────────────
router.get("/session-notes", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  const staff = req.clinicalStaff;
  try {
    if (supabase) {
      const { data, error } = await supabase.from("session_notes").select("*, patients(id, name)").eq("nutritionist_id", staff.id).order("date", { ascending: false });
      if (error) throw error;
      return res.json({ sessionNotes: (data ?? []).map((n: any) => mapSessionNote(n, n.patients)) });
    }
    return res.json({ sessionNotes: MOCK_SESSION_NOTES.filter((n) => n.nutritionistId === staff.id).map((n) => ({ ...n, patient: MOCK_PATIENTS.find((p) => p.id === n.patientId) })) });
  } catch (err) {
    req.log?.error(err, "session-notes error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/session-notes", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  const staff = req.clinicalStaff;
  try {
    const id = `sn-${Date.now()}`;
    const date = new Date().toISOString().slice(0, 10);
    if (supabase) {
      const { data, error } = await supabase.from("session_notes").insert({ id, nutritionist_id: staff.id, patient_id: req.body.patientId, date, session_type: req.body.sessionType, summary: req.body.summary, action_items: req.body.actionItems ?? [], next_session: req.body.nextSession }).select().single();
      if (error) throw error;
      return res.status(201).json(mapSessionNote(data));
    }
    const note = { id, nutritionistId: staff.id, date, ...req.body };
    MOCK_SESSION_NOTES.push(note);
    return res.status(201).json(note);
  } catch (err) {
    req.log?.error(err, "create session-note error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Nutrition Analytics ──────────────────────────────────────────────────────
router.get("/nutrition-analytics", authMiddleware, loadStaffMiddleware, async (req: any, res) => {
  const staff = req.clinicalStaff;
  try {
    if (supabase) {
      const [{ data: plans }, { data: patients }] = await Promise.all([
        supabase.from("meal_plans").select("*").eq("nutritionist_id", staff.id),
        supabase.from("patients").select("conditions").eq("assigned_nutritionist_id", staff.id),
      ]);
      const myPlans = plans ?? [];
      const allPats = patients ?? [];
      const avg = (arr: any[], key: string) => arr.length ? Math.round(arr.reduce((s, p) => s + (p[key] ?? 0), 0) / arr.length) : 0;
      return res.json({
        averageAdherence: avg(myPlans, "adherence_score"),
        conditionBreakdown: [
          { condition: "Diabetes", count: allPats.filter((p: any) => p.conditions?.includes("diabetes")).length },
          { condition: "Hypertension", count: allPats.filter((p: any) => p.conditions?.includes("hypertension")).length },
          { condition: "Weight Loss", count: allPats.filter((p: any) => p.conditions?.includes("weightloss")).length },
          { condition: "Liver", count: allPats.filter((p: any) => p.conditions?.includes("liver")).length },
        ],
        macroTargetAvg: { calories: avg(myPlans, "target_calories"), protein: avg(myPlans, "target_protein"), carbs: avg(myPlans, "target_carbs"), fat: avg(myPlans, "target_fat") },
        adherenceByCondition: [{ condition: "Hypertension", adherence: 68 }, { condition: "Diabetes", adherence: 72 }, { condition: "Weight Loss", adherence: 89 }, { condition: "Liver", adherence: 51 }],
        weeklyAdherenceTrend: [{ week: "Apr W2", score: 71 }, { week: "Apr W3", score: 74 }, { week: "Apr W4", score: 78 }, { week: "May W1", score: 75 }, { week: "May W2", score: 80 }],
      });
    }
    const myPlans = MOCK_MEAL_PLANS.filter((m) => m.nutritionistId === staff.id);
    const avg = (arr: any[], key: string) => arr.length ? Math.round(arr.reduce((s, p) => s + p[key], 0) / arr.length) : 0;
    return res.json({ averageAdherence: avg(myPlans, "adherenceScore"), conditionBreakdown: [{ condition: "Diabetes", count: MOCK_PATIENTS.filter((p) => p.assignedNutritionistId === staff.id && p.conditions.includes("diabetes")).length }, { condition: "Hypertension", count: MOCK_PATIENTS.filter((p) => p.assignedNutritionistId === staff.id && p.conditions.includes("hypertension")).length }, { condition: "Weight Loss", count: MOCK_PATIENTS.filter((p) => p.assignedNutritionistId === staff.id && p.conditions.includes("weightloss")).length }, { condition: "Liver", count: MOCK_PATIENTS.filter((p) => p.assignedNutritionistId === staff.id && p.conditions.includes("liver")).length }], macroTargetAvg: { calories: avg(myPlans, "targetCalories"), protein: avg(myPlans, "targetProtein"), carbs: avg(myPlans, "targetCarbs"), fat: avg(myPlans, "targetFat") }, adherenceByCondition: [{ condition: "Hypertension", adherence: 68 }, { condition: "Diabetes", adherence: 72 }, { condition: "Weight Loss", adherence: 89 }, { condition: "Liver", adherence: 51 }], weeklyAdherenceTrend: [{ week: "Apr W2", score: 71 }, { week: "Apr W3", score: 74 }, { week: "Apr W4", score: 78 }, { week: "May W1", score: 75 }, { week: "May W2", score: 80 }] });
  } catch (err) {
    req.log?.error(err, "nutrition-analytics error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
