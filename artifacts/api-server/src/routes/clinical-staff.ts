import { Router } from "express";
import crypto from "crypto";

const router = Router();

// ─── Demo credentials ─────────────────────────────────────────────────────────
const CLINICAL_STAFF = [
  {
    id: "doc-001",
    username: "dr.amara",
    password: "doctor2026",
    name: "Dr. Amara Osei",
    title: "MD, Internal Medicine",
    role: "doctor",
    speciality: "Internal Medicine & Metabolic Health",
    avatar: "AO",
    patientsToday: 8,
    licenseNo: "MDCN/2019/04821",
  },
  {
    id: "doc-002",
    username: "dr.ifiok",
    password: "doctor2026",
    name: "Dr. Ifiok Bassey",
    title: "MD, Endocrinology",
    role: "doctor",
    speciality: "Endocrinology & Diabetes Care",
    avatar: "IB",
    patientsToday: 6,
    licenseNo: "MDCN/2017/03912",
  },
  {
    id: "nut-001",
    username: "nutri.kezia",
    password: "nutri2026",
    name: "Kezia Aderemi",
    title: "RDN, Registered Dietitian",
    role: "nutritionist",
    speciality: "Clinical Nutrition & Meal Planning",
    avatar: "KA",
    patientsToday: 11,
    licenseNo: "NDN/2021/00714",
  },
  {
    id: "nut-002",
    username: "nutri.chika",
    password: "nutri2026",
    name: "Chika Eze",
    title: "MSc, Sports Nutrition",
    role: "nutritionist",
    speciality: "Sports Nutrition & Weight Management",
    avatar: "CE",
    patientsToday: 9,
    licenseNo: "NDN/2020/00588",
  },
];

const activeSessions = new Map<string, string>(); // token → staffId

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const staffId = activeSessions.get(token);
  if (!token || !staffId) return res.status(401).json({ error: "Unauthorized" });
  const staff = CLINICAL_STAFF.find((s) => s.id === staffId);
  if (!staff) return res.status(401).json({ error: "Unauthorized" });
  req.clinicalStaff = staff;
  next();
}

// ─── Mock Patient Data ─────────────────────────────────────────────────────────
const MOCK_PATIENTS = [
  { id: "pat-001", name: "Amaka Okonkwo", age: 42, gender: "female", dob: "1982-03-14", phone: "08031234567", email: "amaka@example.com", conditions: ["hypertension", "diabetes"], bmi: 28.4, bloodType: "O+", lastVisit: "2026-04-28", nextAppointment: "2026-05-03", assignedDoctorId: "doc-001", assignedNutritionistId: "nut-001", fasting_glucose: 118, hba1c: 7.2, bp_systolic: 142, bp_diastolic: 91, cholesterol: 205, medications: ["Metformin 500mg", "Lisinopril 10mg"], notes: "Patient is responding well to dietary changes. BP trending down.", adherenceScore: 74 },
  { id: "pat-002", name: "Emeka Nwosu", age: 35, gender: "male", dob: "1990-11-08", phone: "07051234567", email: "emeka@example.com", conditions: ["diabetes"], bmi: 31.2, bloodType: "A+", lastVisit: "2026-04-25", nextAppointment: "2026-05-04", assignedDoctorId: "doc-001", assignedNutritionistId: "nut-001", fasting_glucose: 134, hba1c: 8.1, bp_systolic: 128, bp_diastolic: 82, cholesterol: 188, medications: ["Metformin 1000mg", "Glipizide 5mg"], notes: "HbA1c still elevated. Reviewing meal plan and medication dosage.", adherenceScore: 62 },
  { id: "pat-003", name: "Fatima Abubakar", age: 29, gender: "female", dob: "1996-07-22", phone: "09021234567", email: "fatima@example.com", conditions: ["weightloss"], bmi: 34.7, bloodType: "B+", lastVisit: "2026-05-01", nextAppointment: "2026-05-08", assignedDoctorId: "doc-001", assignedNutritionistId: "nut-001", fasting_glucose: 88, hba1c: 5.4, bp_systolic: 118, bp_diastolic: 76, cholesterol: 172, medications: [], notes: "Motivated patient. Meal log compliance excellent this month.", adherenceScore: 91 },
  { id: "pat-004", name: "Babatunde Fashola", age: 56, gender: "male", dob: "1969-01-30", phone: "08021234567", email: "baba@example.com", conditions: ["hypertension", "liver"], bmi: 27.1, bloodType: "O-", lastVisit: "2026-04-20", nextAppointment: "2026-05-05", assignedDoctorId: "doc-002", assignedNutritionistId: "nut-001", fasting_glucose: 95, hba1c: 5.7, bp_systolic: 158, bp_diastolic: 98, cholesterol: 231, medications: ["Amlodipine 5mg", "Atorvastatin 20mg"], notes: "LFT results pending. Sodium restriction critical.", adherenceScore: 55 },
  { id: "pat-005", name: "Ngozi Eze", age: 38, gender: "female", dob: "1987-09-11", phone: "08041234567", email: "ngozi@example.com", conditions: ["diabetes", "weightloss"], bmi: 30.1, bloodType: "AB+", lastVisit: "2026-04-29", nextAppointment: "2026-05-06", assignedDoctorId: "doc-002", assignedNutritionistId: "nut-002", fasting_glucose: 111, hba1c: 6.9, bp_systolic: 124, bp_diastolic: 80, cholesterol: 196, medications: ["Metformin 500mg"], notes: "Started low-GI meal plan 3 weeks ago. Progress steady.", adherenceScore: 82 },
  { id: "pat-006", name: "Chidi Umeh", age: 45, gender: "male", dob: "1980-05-17", phone: "07041234567", email: "chidi@example.com", conditions: ["hypertension"], bmi: 25.6, bloodType: "A-", lastVisit: "2026-04-15", nextAppointment: "2026-05-10", assignedDoctorId: "doc-001", assignedNutritionistId: "nut-002", fasting_glucose: 91, hba1c: 5.2, bp_systolic: 148, bp_diastolic: 95, cholesterol: 210, medications: ["Lisinopril 20mg", "Hydrochlorothiazide 12.5mg"], notes: "Dietary compliance improved after counselling.", adherenceScore: 68 },
  { id: "pat-007", name: "Seun Adeyemi", age: 32, gender: "female", dob: "1993-12-03", phone: "09041234567", email: "seun@example.com", conditions: ["weightloss", "allergies"], bmi: 29.3, bloodType: "B-", lastVisit: "2026-05-01", nextAppointment: "2026-05-07", assignedDoctorId: "doc-001", assignedNutritionistId: "nut-002", fasting_glucose: 84, hba1c: 5.1, bp_systolic: 116, bp_diastolic: 74, cholesterol: 165, medications: ["Cetirizine 10mg"], notes: "Gluten-free Nigerian alternatives working well.", adherenceScore: 88 },
  { id: "pat-008", name: "Kemi Bello", age: 51, gender: "female", dob: "1974-08-25", phone: "08091234567", email: "kemi@example.com", conditions: ["liver", "hypertension", "diabetes"], bmi: 26.8, bloodType: "O+", lastVisit: "2026-04-18", nextAppointment: "2026-05-02", assignedDoctorId: "doc-002", assignedNutritionistId: "nut-001", fasting_glucose: 128, hba1c: 7.8, bp_systolic: 152, bp_diastolic: 96, cholesterol: 248, medications: ["Metformin 1000mg", "Lisinopril 10mg", "Ursodeoxycholic acid 500mg"], notes: "Complex case. Liver enzymes elevated last check.", adherenceScore: 47 },
];

const MOCK_CONSULTATIONS = [
  { id: "cons-001", patientId: "pat-001", doctorId: "doc-001", nutritionistId: "nut-001", date: "2026-05-02", time: "09:00", duration: 30, status: "completed", type: "follow-up", notes: "BP reviewed. Medication adjusted.", chiefComplaint: "Hypertension review" },
  { id: "cons-002", patientId: "pat-002", doctorId: "doc-001", nutritionistId: "nut-001", date: "2026-05-02", time: "10:00", duration: 45, status: "in-progress", type: "follow-up", notes: "", chiefComplaint: "Diabetes management" },
  { id: "cons-003", patientId: "pat-003", doctorId: "doc-001", nutritionistId: "nut-001", date: "2026-05-02", time: "11:30", duration: 30, status: "scheduled", type: "review", notes: "", chiefComplaint: "Weight loss check-in" },
  { id: "cons-004", patientId: "pat-007", doctorId: "doc-001", nutritionistId: "nut-002", date: "2026-05-02", time: "14:00", duration: 30, status: "scheduled", type: "initial", notes: "", chiefComplaint: "Allergy management" },
  { id: "cons-005", patientId: "pat-006", doctorId: "doc-001", nutritionistId: "nut-002", date: "2026-05-02", time: "15:30", duration: 45, status: "scheduled", type: "follow-up", notes: "", chiefComplaint: "BP review + meal plan update" },
  { id: "cons-006", patientId: "pat-004", doctorId: "doc-002", nutritionistId: "nut-001", date: "2026-05-02", time: "09:30", duration: 30, status: "completed", type: "urgent", notes: "LFT reviewed. Sodium restriction reinforced.", chiefComplaint: "Liver function concern" },
  { id: "cons-007", patientId: "pat-005", doctorId: "doc-002", nutritionistId: "nut-002", date: "2026-05-02", time: "11:00", duration: 30, status: "scheduled", type: "follow-up", notes: "", chiefComplaint: "Glucose control" },
  { id: "cons-008", patientId: "pat-008", doctorId: "doc-002", nutritionistId: "nut-001", date: "2026-05-02", time: "13:00", duration: 60, status: "scheduled", type: "comprehensive", notes: "", chiefComplaint: "Complex multi-condition review" },
];

const MOCK_LAB_RESULTS = [
  { id: "lab-001", patientId: "pat-001", orderedBy: "doc-001", testName: "HbA1c", value: "7.2%", referenceRange: "< 5.7% (normal), 5.7-6.4% (pre-diabetic), ≥ 6.5% (diabetic)", status: "abnormal", uploadedAt: "2026-04-28", resultDate: "2026-04-26", notes: "Slight improvement from 7.6% last quarter" },
  { id: "lab-002", patientId: "pat-001", orderedBy: "doc-001", testName: "Fasting Blood Sugar", value: "118 mg/dL", referenceRange: "70-99 mg/dL", status: "abnormal", uploadedAt: "2026-04-28", resultDate: "2026-04-26", notes: "" },
  { id: "lab-003", patientId: "pat-001", orderedBy: "doc-001", testName: "Lipid Profile", value: "Total Cholesterol: 205 mg/dL, LDL: 130 mg/dL, HDL: 48 mg/dL, TG: 185 mg/dL", referenceRange: "TC < 200, LDL < 100, HDL > 60, TG < 150", status: "abnormal", uploadedAt: "2026-04-28", resultDate: "2026-04-26", notes: "" },
  { id: "lab-004", patientId: "pat-002", orderedBy: "doc-001", testName: "HbA1c", value: "8.1%", referenceRange: "< 5.7%", status: "critical", uploadedAt: "2026-04-25", resultDate: "2026-04-23", notes: "Increased from 7.8%. Review medication and diet" },
  { id: "lab-005", patientId: "pat-004", orderedBy: "doc-002", testName: "Liver Function Test", value: "ALT: 68 U/L, AST: 54 U/L, ALP: 112 U/L, Bilirubin: 1.4 mg/dL", referenceRange: "ALT < 40, AST < 40, ALP 44-147", status: "abnormal", uploadedAt: "2026-04-20", resultDate: "2026-04-18", notes: "Elevated transaminases. Alcohol cessation counselled" },
  { id: "lab-006", patientId: "pat-008", orderedBy: "doc-002", testName: "Complete Blood Count", value: "WBC: 7.2, RBC: 4.1, Hgb: 11.8 g/dL, Hct: 36%, Platelets: 198", referenceRange: "Hgb: 12-16 g/dL (F)", status: "abnormal", uploadedAt: "2026-04-18", resultDate: "2026-04-16", notes: "Mild anaemia. Iron supplementation considered" },
  { id: "lab-007", patientId: "pat-005", orderedBy: "doc-002", testName: "Fasting Blood Sugar", value: "111 mg/dL", referenceRange: "70-99 mg/dL", status: "abnormal", uploadedAt: "2026-04-29", resultDate: "2026-04-27", notes: "" },
  { id: "lab-008", patientId: "pat-006", orderedBy: "doc-001", testName: "Blood Pressure (24hr)", value: "Avg: 148/95 mmHg, Peak: 167/102 mmHg", referenceRange: "< 130/80 mmHg", status: "abnormal", uploadedAt: "2026-04-15", resultDate: "2026-04-14", notes: "Sustained hypertension. Dose escalation recommended" },
];

const MOCK_PRESCRIPTIONS: any[] = [
  { id: "rx-001", patientId: "pat-001", doctorId: "doc-001", date: "2026-04-28", diagnosis: "Type 2 Diabetes Mellitus with Hypertension", medications: [{ name: "Metformin", dose: "500mg", frequency: "Twice daily", duration: "90 days", instructions: "Take with meals" }, { name: "Lisinopril", dose: "10mg", frequency: "Once daily", duration: "90 days", instructions: "Take in morning" }], notes: "Low-sodium, low-GI diet reinforced. Follow up in 4 weeks.", validUntil: "2026-07-28" },
  { id: "rx-002", patientId: "pat-002", doctorId: "doc-001", date: "2026-04-25", diagnosis: "Type 2 Diabetes Mellitus — Poor Control", medications: [{ name: "Metformin", dose: "1000mg", frequency: "Twice daily", duration: "60 days", instructions: "Take with meals" }, { name: "Glipizide", dose: "5mg", frequency: "Once daily before breakfast", duration: "60 days", instructions: "Monitor for hypoglycaemia" }], notes: "Increase physical activity. Fasting glucose monitoring daily.", validUntil: "2026-06-25" },
  { id: "rx-003", patientId: "pat-004", doctorId: "doc-002", date: "2026-04-20", diagnosis: "Essential Hypertension with Hyperlipidaemia", medications: [{ name: "Amlodipine", dose: "5mg", frequency: "Once daily", duration: "90 days", instructions: "Take in evening" }, { name: "Atorvastatin", dose: "20mg", frequency: "Once at night", duration: "90 days", instructions: "Avoid grapefruit" }], notes: "Strict low-sodium diet. Alcohol cessation mandatory. LFT repeat in 8 weeks.", validUntil: "2026-07-20" },
];

const MOCK_MEAL_PLANS: any[] = [
  { id: "mp-001", patientId: "pat-001", nutritionistId: "nut-001", createdAt: "2026-04-20", title: "Low-GI Hypertension Plan — Week 3", status: "active", targetCalories: 1800, targetProtein: 75, targetCarbs: 200, targetFat: 55, targetSodium: 1500, adherenceScore: 74, meals: [ { day: "Mon", breakfast: "Akara (2 balls) + Zobo (no sugar)", lunch: "Ogbono light soup + Brown rice (small)", dinner: "Tilapia pepper soup + Boiled plantain (½)" }, { day: "Tue", breakfast: "Oats + Moringa smoothie", lunch: "Moi Moi + Salad", dinner: "Egusi (reduced palm oil) + Pounded yam (small)" } ] },
  { id: "mp-002", patientId: "pat-002", nutritionistId: "nut-001", createdAt: "2026-04-18", title: "Glycemic Control Plan — High Compliance Target", status: "active", targetCalories: 1600, targetProtein: 85, targetCarbs: 160, targetFat: 50, targetSodium: 2000, adherenceScore: 62, meals: [ { day: "Mon", breakfast: "Boiled eggs (2) + Cucumber slices", lunch: "Jollof brown rice + Grilled fish", dinner: "Vegetable soup (no thickener) + Yam (small)" } ] },
  { id: "mp-003", patientId: "pat-003", nutritionistId: "nut-001", createdAt: "2026-05-01", title: "Caloric Deficit + High Protein", status: "active", targetCalories: 1400, targetProtein: 95, targetCarbs: 130, targetFat: 45, targetSodium: 2000, adherenceScore: 91, meals: [ { day: "Mon", breakfast: "Akara protein balls (3) + Zobo", lunch: "Jollof brown rice + Grilled chicken", dinner: "Pepper soup (lean protein)" } ] },
  { id: "mp-004", patientId: "pat-005", nutritionistId: "nut-002", createdAt: "2026-04-22", title: "Low-GI Diabetes + Weight Loss", status: "active", targetCalories: 1500, targetProtein: 90, targetCarbs: 145, targetFat: 48, targetSodium: 1800, adherenceScore: 82, meals: [] },
  { id: "mp-005", patientId: "pat-006", nutritionistId: "nut-002", createdAt: "2026-04-10", title: "DASH Diet Adaptation (Nigerian)", status: "active", targetCalories: 1900, targetProtein: 80, targetCarbs: 220, targetFat: 60, targetSodium: 1200, adherenceScore: 68, meals: [] },
  { id: "mp-006", patientId: "pat-007", nutritionistId: "nut-002", createdAt: "2026-05-01", title: "Gluten-Free Nigerian Plan", status: "active", targetCalories: 1650, targetProtein: 88, targetCarbs: 175, targetFat: 52, targetSodium: 2000, adherenceScore: 88, meals: [] },
];

const MOCK_SESSION_NOTES: any[] = [
  { id: "sn-001", patientId: "pat-001", nutritionistId: "nut-001", date: "2026-04-28", sessionType: "follow-up", summary: "Patient showed improved meal log compliance. Sodium intake down to avg 1800mg/day. Zobo replacing fizzy drinks consistently. Discussed potassium-rich foods.", actionItems: ["Increase leafy greens intake", "Try sugarless akamu (pap) for breakfast"], nextSession: "2026-05-12" },
  { id: "sn-002", patientId: "pat-002", nutritionistId: "nut-001", date: "2026-04-25", sessionType: "counselling", summary: "Reviewed food diary. Evening snacking identified as major issue. Educated on glycemic impact. Introduced structured snack options.", actionItems: ["Replace chin-chin with groundnut", "No food after 8pm"], nextSession: "2026-05-09" },
  { id: "sn-003", patientId: "pat-003", nutritionistId: "nut-001", date: "2026-05-01", sessionType: "check-in", summary: "Patient reports feeling energetic. Lost 2.1kg this month. Celebrating milestone with healthy meal out guide provided.", actionItems: ["Maintain current plan", "Add resistance training"], nextSession: "2026-05-15" },
  { id: "sn-004", patientId: "pat-007", nutritionistId: "nut-002", date: "2026-05-01", sessionType: "initial", summary: "First nutritional assessment. Gluten sensitivity confirmed. Reviewed Nigerian staples safe for gluten-free diet. Menu guide provided.", actionItems: ["Avoid all wheat-based foods", "Focus on yam, plantain, oats"], nextSession: "2026-05-08" },
];

// ─── Auth Routes ───────────────────────────────────────────────────────────────
router.post("/login", (req, res) => {
  const { username, password } = req.body ?? {};
  const staff = CLINICAL_STAFF.find((s) => s.username === username && s.password === password);
  if (!staff) return res.status(401).json({ error: "Invalid credentials" });
  const token = generateToken();
  activeSessions.set(token, staff.id);
  const { password: _pw, ...safeStaff } = staff;
  return res.json({ token, staff: safeStaff });
});

router.post("/logout", authMiddleware, (req: any, res) => {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  activeSessions.delete(token);
  return res.json({ success: true });
});

router.get("/me", authMiddleware, (req: any, res) => {
  const { password: _pw, ...safeStaff } = req.clinicalStaff;
  return res.json(safeStaff);
});

// ─── Dashboard ─────────────────────────────────────────────────────────────────
router.get("/dashboard", authMiddleware, (req: any, res) => {
  const staff = req.clinicalStaff;
  const today = "2026-05-02";

  if (staff.role === "doctor") {
    const myConsultations = MOCK_CONSULTATIONS.filter((c) => c.doctorId === staff.id && c.date === today);
    const completed = myConsultations.filter((c) => c.status === "completed").length;
    const inProgress = myConsultations.filter((c) => c.status === "in-progress").length;
    const scheduled = myConsultations.filter((c) => c.status === "scheduled").length;
    const myPatients = MOCK_PATIENTS.filter((p) => p.assignedDoctorId === staff.id);
    const criticalLabs = MOCK_LAB_RESULTS.filter((l) => l.status === "critical" && myPatients.some((p) => p.id === l.patientId));
    const pendingRx = MOCK_PRESCRIPTIONS.filter((rx) => rx.doctorId === staff.id);
    return res.json({
      role: "doctor",
      todayConsultations: myConsultations.length,
      completed,
      inProgress,
      scheduled,
      totalPatients: myPatients.length,
      criticalAlerts: criticalLabs.length,
      pendingPrescriptions: pendingRx.length,
      upcomingConsultation: myConsultations.find((c) => c.status === "scheduled") ?? null,
      recentActivity: [
        { time: "09:15", event: "Completed consultation with Amaka Okonkwo" },
        { time: "10:42", event: "Lab result flagged: Emeka Nwosu HbA1c critical" },
        { time: "11:00", event: "Prescription issued: Pat-001 (Amaka)" },
      ],
    });
  } else {
    const myClients = MOCK_PATIENTS.filter((p) => p.assignedNutritionistId === staff.id);
    const myPlans = MOCK_MEAL_PLANS.filter((m) => m.nutritionistId === staff.id);
    const avgAdherence = myPlans.length > 0
      ? Math.round(myPlans.reduce((sum, p) => sum + p.adherenceScore, 0) / myPlans.length)
      : 0;
    const myConsultations = MOCK_CONSULTATIONS.filter((c) => c.nutritionistId === staff.id && c.date === today);
    const highAdherence = myPlans.filter((p) => p.adherenceScore >= 80).length;
    const lowAdherence = myPlans.filter((p) => p.adherenceScore < 60).length;
    return res.json({
      role: "nutritionist",
      totalClients: myClients.length,
      activePlans: myPlans.filter((p) => p.status === "active").length,
      averageAdherence: avgAdherence,
      highAdherence,
      lowAdherence,
      todaySessions: myConsultations.length,
      recentActivity: [
        { time: "09:30", event: "Session notes added: Amaka Okonkwo" },
        { time: "10:15", event: "Meal plan updated: Emeka Nwosu — low-GI revision" },
        { time: "11:00", event: "New client assigned: Seun Adeyemi (gluten-free)" },
      ],
      clientsNeedingAttention: myClients.filter((c) => {
        const plan = myPlans.find((p) => p.patientId === c.id);
        return plan && plan.adherenceScore < 60;
      }).map((c) => ({ id: c.id, name: c.name, adherenceScore: myPlans.find((p) => p.patientId === c.id)?.adherenceScore ?? 0 })),
    });
  }
});

// ─── Patients ─────────────────────────────────────────────────────────────────
router.get("/patients", authMiddleware, (req: any, res) => {
  const staff = req.clinicalStaff;
  const patients = staff.role === "doctor"
    ? MOCK_PATIENTS.filter((p) => p.assignedDoctorId === staff.id)
    : MOCK_PATIENTS.filter((p) => p.assignedNutritionistId === staff.id);
  return res.json(patients);
});

router.get("/patients/:id", authMiddleware, (req: any, res) => {
  const patient = MOCK_PATIENTS.find((p) => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: "Patient not found" });

  const labs = MOCK_LAB_RESULTS.filter((l) => l.patientId === patient.id);
  const prescriptions = MOCK_PRESCRIPTIONS.filter((rx) => rx.patientId === patient.id);
  const consultations = MOCK_CONSULTATIONS.filter((c) => c.patientId === patient.id).slice(0, 5);
  const mealPlans = MOCK_MEAL_PLANS.filter((m) => m.patientId === patient.id);
  const sessionNotes = MOCK_SESSION_NOTES.filter((n) => n.patientId === patient.id);

  return res.json({ ...patient, labs, prescriptions, consultations, mealPlans, sessionNotes });
});

// ─── Consultations ────────────────────────────────────────────────────────────
router.get("/consultations", authMiddleware, (req: any, res) => {
  const staff = req.clinicalStaff;
  const today = req.query.date ?? "2026-05-02";
  const consultations = staff.role === "doctor"
    ? MOCK_CONSULTATIONS.filter((c) => c.doctorId === staff.id && c.date === today)
    : MOCK_CONSULTATIONS.filter((c) => c.nutritionistId === staff.id && c.date === today);

  const enriched = consultations.map((c) => ({
    ...c,
    patient: MOCK_PATIENTS.find((p) => p.id === c.patientId),
  }));

  return res.json(enriched);
});

router.get("/consultations/:id", authMiddleware, (req: any, res) => {
  const consultation = MOCK_CONSULTATIONS.find((c) => c.id === req.params.id);
  if (!consultation) return res.status(404).json({ error: "Not found" });
  const patient = MOCK_PATIENTS.find((p) => p.id === consultation.patientId);
  const labs = MOCK_LAB_RESULTS.filter((l) => l.patientId === consultation.patientId).slice(0, 3);
  const latestPlan = MOCK_MEAL_PLANS.find((m) => m.patientId === consultation.patientId && m.status === "active");
  return res.json({ ...consultation, patient, recentLabs: labs, activeMealPlan: latestPlan ?? null });
});

// ─── Lab Results ──────────────────────────────────────────────────────────────
router.get("/lab-results", authMiddleware, (req: any, res) => {
  const staff = req.clinicalStaff;
  const myPatients = MOCK_PATIENTS.filter((p) => p.assignedDoctorId === staff.id);
  const patientIds = new Set(myPatients.map((p) => p.id));
  const results = MOCK_LAB_RESULTS.filter((l) => patientIds.has(l.patientId)).map((l) => ({
    ...l,
    patient: MOCK_PATIENTS.find((p) => p.id === l.patientId),
  }));
  return res.json(results);
});

// ─── Prescriptions ────────────────────────────────────────────────────────────
router.get("/prescriptions", authMiddleware, (req: any, res) => {
  const staff = req.clinicalStaff;
  const prescriptions = MOCK_PRESCRIPTIONS.filter((rx) => rx.doctorId === staff.id).map((rx) => ({
    ...rx,
    patient: MOCK_PATIENTS.find((p) => p.id === rx.patientId),
  }));
  return res.json(prescriptions);
});

router.post("/prescriptions", authMiddleware, (req: any, res) => {
  const staff = req.clinicalStaff;
  if (staff.role !== "doctor") return res.status(403).json({ error: "Doctors only" });
  const rx = { id: `rx-${Date.now()}`, doctorId: staff.id, date: new Date().toISOString().slice(0, 10), ...req.body };
  MOCK_PRESCRIPTIONS.push(rx);
  return res.status(201).json(rx);
});

// ─── Meal Plans ───────────────────────────────────────────────────────────────
router.get("/meal-plans", authMiddleware, (req: any, res) => {
  const staff = req.clinicalStaff;
  const plans = MOCK_MEAL_PLANS.filter((m) => m.nutritionistId === staff.id).map((m) => ({
    ...m,
    patient: MOCK_PATIENTS.find((p) => p.id === m.patientId),
  }));
  return res.json(plans);
});

router.post("/meal-plans", authMiddleware, (req: any, res) => {
  const staff = req.clinicalStaff;
  if (staff.role !== "nutritionist") return res.status(403).json({ error: "Nutritionists only" });
  const plan = { id: `mp-${Date.now()}`, nutritionistId: staff.id, createdAt: new Date().toISOString().slice(0, 10), status: "active", ...req.body };
  MOCK_MEAL_PLANS.push(plan);
  return res.status(201).json(plan);
});

// ─── Session Notes ────────────────────────────────────────────────────────────
router.get("/session-notes", authMiddleware, (req: any, res) => {
  const staff = req.clinicalStaff;
  const notes = MOCK_SESSION_NOTES.filter((n) => n.nutritionistId === staff.id).map((n) => ({
    ...n,
    patient: MOCK_PATIENTS.find((p) => p.id === n.patientId),
  }));
  return res.json(notes);
});

router.post("/session-notes", authMiddleware, (req: any, res) => {
  const staff = req.clinicalStaff;
  const note = { id: `sn-${Date.now()}`, nutritionistId: staff.id, date: new Date().toISOString().slice(0, 10), ...req.body };
  MOCK_SESSION_NOTES.push(note);
  return res.status(201).json(note);
});

// ─── Nutrition Analytics ──────────────────────────────────────────────────────
router.get("/nutrition-analytics", authMiddleware, (req: any, res) => {
  const staff = req.clinicalStaff;
  const myPlans = MOCK_MEAL_PLANS.filter((m) => m.nutritionistId === staff.id);
  return res.json({
    averageAdherence: myPlans.length
      ? Math.round(myPlans.reduce((s, p) => s + p.adherenceScore, 0) / myPlans.length)
      : 0,
    conditionBreakdown: [
      { condition: "Diabetes", count: MOCK_PATIENTS.filter((p) => p.assignedNutritionistId === staff.id && p.conditions.includes("diabetes")).length },
      { condition: "Hypertension", count: MOCK_PATIENTS.filter((p) => p.assignedNutritionistId === staff.id && p.conditions.includes("hypertension")).length },
      { condition: "Weight Loss", count: MOCK_PATIENTS.filter((p) => p.assignedNutritionistId === staff.id && p.conditions.includes("weightloss")).length },
      { condition: "Liver", count: MOCK_PATIENTS.filter((p) => p.assignedNutritionistId === staff.id && p.conditions.includes("liver")).length },
    ],
    macroTargetAvg: {
      calories: Math.round(myPlans.reduce((s, p) => s + p.targetCalories, 0) / (myPlans.length || 1)),
      protein: Math.round(myPlans.reduce((s, p) => s + p.targetProtein, 0) / (myPlans.length || 1)),
      carbs: Math.round(myPlans.reduce((s, p) => s + p.targetCarbs, 0) / (myPlans.length || 1)),
      fat: Math.round(myPlans.reduce((s, p) => s + p.targetFat, 0) / (myPlans.length || 1)),
    },
    adherenceByCondition: [
      { condition: "Hypertension", adherence: 68 },
      { condition: "Diabetes", adherence: 72 },
      { condition: "Weight Loss", adherence: 89 },
      { condition: "Liver", adherence: 51 },
    ],
    weeklyAdherenceTrend: [
      { week: "Apr W2", score: 71 }, { week: "Apr W3", score: 74 }, { week: "Apr W4", score: 78 },
      { week: "May W1", score: 75 }, { week: "May W2", score: 80 },
    ],
  });
});

export default router;
