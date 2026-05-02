#!/usr/bin/env node
/**
 * Fittrac Kitchen — Supabase Seeder
 * Seeds all clinical staff, patients, consultations, lab results, meal plans,
 * session notes, and prescriptions into Supabase using the service role key.
 *
 * Run: node scripts/seed-supabase.mjs
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates,return=minimal",
};

async function upsert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers,
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${table}: HTTP ${res.status} — ${err}`);
  }
  console.log(`  ✅  ${table} — ${rows.length} row(s) upserted`);
}

async function checkTables() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/clinical_staff?select=id&limit=1`, { headers });
  if (res.status === 404 || res.status === 400) {
    const body = await res.text();
    if (body.includes("does not exist") || body.includes("relation")) {
      return false;
    }
  }
  return res.ok;
}

async function main() {
  console.log("\n🌱  Fittrac Kitchen — Supabase Seeder");
  console.log(`📡  ${SUPABASE_URL}\n`);

  const tablesExist = await checkTables();
  if (!tablesExist) {
    console.error("❌  Tables not found. Please run supabase/schema.sql first:");
    console.error("    1. Go to https://supabase.com/dashboard/project/vuxarushmfmxritydbxi/sql");
    console.error("    2. Paste the contents of supabase/schema.sql and click Run");
    console.error("    3. Then run this script again\n");
    process.exit(1);
  }

  console.log("✅  Tables found — seeding data...\n");

  await upsert("clinical_staff", [
    { id: "doc-001", username: "dr.amara",     password: "doctor2026", name: "Dr. Amara Osei",     title: "MD, Internal Medicine", role: "doctor",       specialization: "Internal Medicine & Metabolic Health",  email: "dr.amara@fittrac.ng",  badge: "MD, FMCP",        license_no: "MDCN/2019/04821", patients_today: 8  },
    { id: "doc-002", username: "dr.ifiok",     password: "doctor2026", name: "Dr. Ifiok Bassey",   title: "MD, Endocrinology",     role: "doctor",       specialization: "Endocrinology & Diabetes Care",         email: "dr.ifiok@fittrac.ng",  badge: "MD, FMCP, FACE",  license_no: "MDCN/2017/03912", patients_today: 6  },
    { id: "nut-001", username: "nutri.kezia",  password: "nutri2026",  name: "Kezia Aderemi",      title: "RDN, Registered Dietitian", role: "nutritionist", specialization: "Clinical Nutrition & Meal Planning",  email: "kezia@fittrac.ng",     badge: "RDN, MSc",        license_no: "NDN/2021/00714",  patients_today: 11 },
    { id: "nut-002", username: "nutri.chika",  password: "nutri2026",  name: "Chika Eze",          title: "MSc, Sports Nutrition", role: "nutritionist", specialization: "Sports Nutrition & Weight Management",   email: "chika@fittrac.ng",     badge: "MSc, PGDip",      license_no: "NDN/2020/00588",  patients_today: 9  },
  ]);

  await upsert("patients", [
    { id: "pat-001", name: "Amaka Okonkwo",     age: 42, gender: "female", dob: "1982-03-14", phone: "08031234567", email: "amaka@example.com",  conditions: ["hypertension","diabetes"], primary_condition: "Hypertension",   bmi: 28.4, blood_type: "O+", last_visit: "2026-04-28", next_appointment: "2026-05-03", assigned_doctor_id: "doc-001", assigned_nutritionist_id: "nut-001", fasting_glucose: 118, hba1c: 7.2,  bp_systolic: 142, bp_diastolic: 91, cholesterol: 205, medications: ["Metformin 500mg","Lisinopril 10mg"],                          notes: "Patient responding well to dietary changes. BP trending down.",          adherence_score: 74, risk_score: 6 },
    { id: "pat-002", name: "Emeka Nwosu",        age: 35, gender: "male",   dob: "1990-11-08", phone: "07051234567", email: "emeka@example.com",  conditions: ["diabetes"],               primary_condition: "Diabetes",       bmi: 31.2, blood_type: "A+", last_visit: "2026-04-25", next_appointment: "2026-05-04", assigned_doctor_id: "doc-001", assigned_nutritionist_id: "nut-001", fasting_glucose: 134, hba1c: 8.1,  bp_systolic: 128, bp_diastolic: 82, cholesterol: 188, medications: ["Metformin 1000mg","Glipizide 5mg"],                            notes: "HbA1c still elevated. Reviewing meal plan and medication dosage.",       adherence_score: 62, risk_score: 7 },
    { id: "pat-003", name: "Fatima Abubakar",    age: 29, gender: "female", dob: "1996-07-22", phone: "09021234567", email: "fatima@example.com", conditions: ["weightloss"],             primary_condition: "Weight Loss",    bmi: 34.7, blood_type: "B+", last_visit: "2026-05-01", next_appointment: "2026-05-08", assigned_doctor_id: "doc-001", assigned_nutritionist_id: "nut-001", fasting_glucose: 88,  hba1c: 5.4,  bp_systolic: 118, bp_diastolic: 76, cholesterol: 172, medications: [],                                                              notes: "Motivated patient. Meal log compliance excellent this month.",           adherence_score: 91, risk_score: 2 },
    { id: "pat-004", name: "Babatunde Fashola",  age: 56, gender: "male",   dob: "1969-01-30", phone: "08021234567", email: "baba@example.com",   conditions: ["hypertension","liver"],   primary_condition: "Hypertension",   bmi: 27.1, blood_type: "O-", last_visit: "2026-04-20", next_appointment: "2026-05-05", assigned_doctor_id: "doc-002", assigned_nutritionist_id: "nut-001", fasting_glucose: 95,  hba1c: 5.7,  bp_systolic: 158, bp_diastolic: 98, cholesterol: 231, medications: ["Amlodipine 5mg","Atorvastatin 20mg"],                          notes: "LFT results pending. Sodium restriction critical.",                      adherence_score: 55, risk_score: 8 },
    { id: "pat-005", name: "Ngozi Eze",          age: 38, gender: "female", dob: "1987-09-11", phone: "08041234567", email: "ngozi@example.com",  conditions: ["diabetes","weightloss"],  primary_condition: "Diabetes",       bmi: 30.1, blood_type: "AB+",last_visit: "2026-04-29", next_appointment: "2026-05-06", assigned_doctor_id: "doc-002", assigned_nutritionist_id: "nut-002", fasting_glucose: 111, hba1c: 6.9,  bp_systolic: 124, bp_diastolic: 80, cholesterol: 196, medications: ["Metformin 500mg"],                                             notes: "Started low-GI meal plan 3 weeks ago. Progress steady.",                 adherence_score: 82, risk_score: 5 },
    { id: "pat-006", name: "Chidi Umeh",         age: 45, gender: "male",   dob: "1980-05-17", phone: "07041234567", email: "chidi@example.com",  conditions: ["hypertension"],           primary_condition: "Hypertension",   bmi: 25.6, blood_type: "A-", last_visit: "2026-04-15", next_appointment: "2026-05-10", assigned_doctor_id: "doc-001", assigned_nutritionist_id: "nut-002", fasting_glucose: 91,  hba1c: 5.2,  bp_systolic: 148, bp_diastolic: 95, cholesterol: 210, medications: ["Lisinopril 20mg","Hydrochlorothiazide 12.5mg"],                notes: "Dietary compliance improved after counselling.",                          adherence_score: 68, risk_score: 5 },
    { id: "pat-007", name: "Seun Adeyemi",       age: 32, gender: "female", dob: "1993-12-03", phone: "09041234567", email: "seun@example.com",   conditions: ["weightloss","allergies"], primary_condition: "Weight Loss",    bmi: 29.3, blood_type: "B-", last_visit: "2026-05-01", next_appointment: "2026-05-07", assigned_doctor_id: "doc-001", assigned_nutritionist_id: "nut-002", fasting_glucose: 84,  hba1c: 5.1,  bp_systolic: 116, bp_diastolic: 74, cholesterol: 165, medications: ["Cetirizine 10mg"],                                             notes: "Gluten-free Nigerian alternatives working well.",                         adherence_score: 88, risk_score: 2 },
    { id: "pat-008", name: "Kemi Bello",         age: 51, gender: "female", dob: "1974-08-25", phone: "08091234567", email: "kemi@example.com",   conditions: ["liver","hypertension","diabetes"], primary_condition: "Liver Disease", bmi: 26.8, blood_type: "O+", last_visit: "2026-04-18", next_appointment: "2026-05-02", assigned_doctor_id: "doc-002", assigned_nutritionist_id: "nut-001", fasting_glucose: 128, hba1c: 7.8,  bp_systolic: 152, bp_diastolic: 96, cholesterol: 248, medications: ["Metformin 1000mg","Lisinopril 10mg","Ursodeoxycholic acid 500mg"], notes: "Complex case. Liver enzymes elevated last check.",                        adherence_score: 47, risk_score: 9 },
  ]);

  await upsert("consultations", [
    { id: "cons-001", patient_id: "pat-001", doctor_id: "doc-001", nutritionist_id: "nut-001", date: "2026-05-02", scheduled_time: "09:00", duration: 30, status: "completed",   type: "follow-up",    notes: "BP reviewed. Medication adjusted.",                      chief_complaint: "Hypertension review" },
    { id: "cons-002", patient_id: "pat-002", doctor_id: "doc-001", nutritionist_id: "nut-001", date: "2026-05-02", scheduled_time: "10:00", duration: 45, status: "in-progress", type: "follow-up",    notes: "",                                                       chief_complaint: "Diabetes management" },
    { id: "cons-003", patient_id: "pat-003", doctor_id: "doc-001", nutritionist_id: "nut-001", date: "2026-05-02", scheduled_time: "11:30", duration: 30, status: "scheduled",   type: "review",       notes: "",                                                       chief_complaint: "Weight loss check-in" },
    { id: "cons-004", patient_id: "pat-007", doctor_id: "doc-001", nutritionist_id: "nut-002", date: "2026-05-02", scheduled_time: "14:00", duration: 30, status: "scheduled",   type: "initial",      notes: "",                                                       chief_complaint: "Allergy management" },
    { id: "cons-005", patient_id: "pat-006", doctor_id: "doc-001", nutritionist_id: "nut-002", date: "2026-05-02", scheduled_time: "15:30", duration: 45, status: "scheduled",   type: "follow-up",    notes: "",                                                       chief_complaint: "BP review + meal plan update" },
    { id: "cons-006", patient_id: "pat-004", doctor_id: "doc-002", nutritionist_id: "nut-001", date: "2026-05-02", scheduled_time: "09:30", duration: 30, status: "completed",   type: "urgent",       notes: "LFT reviewed. Sodium restriction reinforced.",           chief_complaint: "Liver function concern" },
    { id: "cons-007", patient_id: "pat-005", doctor_id: "doc-002", nutritionist_id: "nut-002", date: "2026-05-02", scheduled_time: "11:00", duration: 30, status: "scheduled",   type: "follow-up",    notes: "",                                                       chief_complaint: "Glucose control" },
    { id: "cons-008", patient_id: "pat-008", doctor_id: "doc-002", nutritionist_id: "nut-001", date: "2026-05-02", scheduled_time: "13:00", duration: 60, status: "scheduled",   type: "comprehensive",notes: "",                                                       chief_complaint: "Complex multi-condition review" },
  ]);

  await upsert("lab_results", [
    { id: "lab-001", patient_id: "pat-001", ordered_by: "doc-001", test_name: "HbA1c",                 value: "7.2%",                                                    reference_range: "< 5.7% normal, 5.7-6.4% pre-diabetic, ≥ 6.5% diabetic", flag: "elevated", status: "abnormal",  date: "2026-04-26", uploaded_at: "2026-04-28", notes: "Slight improvement from 7.6% last quarter" },
    { id: "lab-002", patient_id: "pat-001", ordered_by: "doc-001", test_name: "Fasting Blood Sugar",  value: "118 mg/dL",                                               reference_range: "70-99 mg/dL",                                            flag: "elevated", status: "abnormal",  date: "2026-04-26", uploaded_at: "2026-04-28", notes: "" },
    { id: "lab-003", patient_id: "pat-001", ordered_by: "doc-001", test_name: "Lipid Profile",        value: "TC: 205, LDL: 130, HDL: 48, TG: 185 mg/dL",             reference_range: "TC < 200, LDL < 100, HDL > 60, TG < 150",             flag: "elevated", status: "abnormal",  date: "2026-04-26", uploaded_at: "2026-04-28", notes: "" },
    { id: "lab-004", patient_id: "pat-002", ordered_by: "doc-001", test_name: "HbA1c",                 value: "8.1%",                                                    reference_range: "< 5.7%",                                               flag: "critical", status: "critical",  date: "2026-04-23", uploaded_at: "2026-04-25", notes: "Increased from 7.8%. Review medication and diet" },
    { id: "lab-005", patient_id: "pat-004", ordered_by: "doc-002", test_name: "Liver Function Test",   value: "ALT: 68 U/L, AST: 54 U/L, ALP: 112 U/L",               reference_range: "ALT < 40, AST < 40, ALP 44-147",                      flag: "elevated", status: "abnormal",  date: "2026-04-18", uploaded_at: "2026-04-20", notes: "Elevated transaminases. Alcohol cessation counselled" },
    { id: "lab-006", patient_id: "pat-008", ordered_by: "doc-002", test_name: "Complete Blood Count",  value: "WBC: 7.2, Hgb: 11.8 g/dL, Hct: 36%, Plt: 198",         reference_range: "Hgb: 12-16 g/dL (F)",                                 flag: "elevated", status: "abnormal",  date: "2026-04-16", uploaded_at: "2026-04-18", notes: "Mild anaemia. Iron supplementation considered" },
    { id: "lab-007", patient_id: "pat-005", ordered_by: "doc-002", test_name: "Fasting Blood Sugar",  value: "111 mg/dL",                                               reference_range: "70-99 mg/dL",                                          flag: "elevated", status: "abnormal",  date: "2026-04-27", uploaded_at: "2026-04-29", notes: "" },
    { id: "lab-008", patient_id: "pat-006", ordered_by: "doc-001", test_name: "Blood Pressure 24hr",   value: "Avg: 148/95, Peak: 167/102 mmHg",                        reference_range: "< 130/80 mmHg",                                        flag: "elevated", status: "abnormal",  date: "2026-04-14", uploaded_at: "2026-04-15", notes: "Sustained hypertension. Dose escalation recommended" },
  ]);

  await upsert("meal_plans", [
    { id: "mp-001", patient_id: "pat-001", nutritionist_id: "nut-001", title: "Low-GI Hypertension Plan — Week 3",          status: "active", target_calories: 1800, target_protein: 75, target_carbs: 200, target_fat: 55, target_sodium: 1500, adherence_score: 74, meals: [{"day":"Mon","breakfast":"Akara (2 balls) + Zobo (no sugar)","lunch":"Ogbono light soup + Brown rice (small)","dinner":"Tilapia pepper soup + Boiled plantain (½)"},{"day":"Tue","breakfast":"Oats + Moringa smoothie","lunch":"Moi Moi + Salad","dinner":"Egusi (reduced palm oil) + Pounded yam (small)"}], created_at: "2026-04-20" },
    { id: "mp-002", patient_id: "pat-002", nutritionist_id: "nut-001", title: "Glycemic Control Plan — High Compliance Target", status: "active", target_calories: 1600, target_protein: 85, target_carbs: 160, target_fat: 50, target_sodium: 2000, adherence_score: 62, meals: [{"day":"Mon","breakfast":"Boiled eggs (2) + Cucumber","lunch":"Jollof brown rice + Grilled fish","dinner":"Vegetable soup (no thickener) + Yam (small)"}], created_at: "2026-04-18" },
    { id: "mp-003", patient_id: "pat-003", nutritionist_id: "nut-001", title: "Caloric Deficit + High Protein",               status: "active", target_calories: 1400, target_protein: 95, target_carbs: 130, target_fat: 45, target_sodium: 2000, adherence_score: 91, meals: [{"day":"Mon","breakfast":"Akara protein balls (3) + Zobo","lunch":"Jollof brown rice + Grilled chicken","dinner":"Pepper soup (lean protein)"}], created_at: "2026-05-01" },
    { id: "mp-004", patient_id: "pat-005", nutritionist_id: "nut-002", title: "Low-GI Diabetes + Weight Loss",                status: "active", target_calories: 1500, target_protein: 90, target_carbs: 145, target_fat: 48, target_sodium: 1800, adherence_score: 82, meals: [], created_at: "2026-04-22" },
    { id: "mp-005", patient_id: "pat-006", nutritionist_id: "nut-002", title: "DASH Diet Adaptation (Nigerian)",              status: "active", target_calories: 1900, target_protein: 80, target_carbs: 220, target_fat: 60, target_sodium: 1200, adherence_score: 68, meals: [], created_at: "2026-04-10" },
    { id: "mp-006", patient_id: "pat-007", nutritionist_id: "nut-002", title: "Gluten-Free Nigerian Plan",                    status: "active", target_calories: 1650, target_protein: 88, target_carbs: 175, target_fat: 52, target_sodium: 2000, adherence_score: 88, meals: [], created_at: "2026-05-01" },
  ]);

  await upsert("session_notes", [
    { id: "sn-001", patient_id: "pat-001", nutritionist_id: "nut-001", date: "2026-04-28", session_type: "follow-up",   summary: "Patient showed improved meal log compliance. Sodium intake down to avg 1800mg/day. Zobo replacing fizzy drinks consistently.", action_items: ["Increase leafy greens intake","Try sugarless akamu for breakfast"], next_session: "2026-05-12" },
    { id: "sn-002", patient_id: "pat-002", nutritionist_id: "nut-001", date: "2026-04-25", session_type: "counselling", summary: "Reviewed food diary. Evening snacking identified as major issue. Educated on glycemic impact. Introduced structured snack options.",   action_items: ["Replace chin-chin with groundnut","No food after 8pm"],            next_session: "2026-05-09" },
    { id: "sn-003", patient_id: "pat-003", nutritionist_id: "nut-001", date: "2026-05-01", session_type: "check-in",    summary: "Patient reports feeling energetic. Lost 2.1kg this month. Celebrating milestone — healthy meal out guide provided.",                  action_items: ["Maintain current plan","Add resistance training"],                  next_session: "2026-05-15" },
    { id: "sn-004", patient_id: "pat-007", nutritionist_id: "nut-002", date: "2026-05-01", session_type: "initial",     summary: "First nutritional assessment. Gluten sensitivity confirmed. Reviewed Nigerian staples safe for gluten-free diet. Menu guide provided.", action_items: ["Avoid all wheat-based foods","Focus on yam, plantain, oats"],      next_session: "2026-05-08" },
  ]);

  await upsert("prescriptions", [
    { id: "rx-001", patient_id: "pat-001", doctor_id: "doc-001", date: "2026-04-28", diagnosis: "Type 2 Diabetes Mellitus with Hypertension",      medications: [{"name":"Metformin","dose":"500mg","frequency":"Twice daily","duration":"90 days","instructions":"Take with meals"},{"name":"Lisinopril","dose":"10mg","frequency":"Once daily","duration":"90 days","instructions":"Take in morning"}],                                              notes: "Low-sodium, low-GI diet reinforced. Follow up in 4 weeks.", valid_until: "2026-07-28" },
    { id: "rx-002", patient_id: "pat-002", doctor_id: "doc-001", date: "2026-04-25", diagnosis: "Type 2 Diabetes Mellitus — Poor Control",          medications: [{"name":"Metformin","dose":"1000mg","frequency":"Twice daily","duration":"60 days","instructions":"Take with meals"},{"name":"Glipizide","dose":"5mg","frequency":"Once daily before breakfast","duration":"60 days","instructions":"Monitor for hypoglycaemia"}],                     notes: "Increase physical activity. Fasting glucose monitoring daily.", valid_until: "2026-06-25" },
    { id: "rx-003", patient_id: "pat-004", doctor_id: "doc-002", date: "2026-04-20", diagnosis: "Essential Hypertension with Hyperlipidaemia",       medications: [{"name":"Amlodipine","dose":"5mg","frequency":"Once daily","duration":"90 days","instructions":"Take in evening"},{"name":"Atorvastatin","dose":"20mg","frequency":"Once at night","duration":"90 days","instructions":"Avoid grapefruit"}],                                       notes: "Strict low-sodium diet. Alcohol cessation mandatory. LFT repeat in 8 weeks.", valid_until: "2026-07-20" },
  ]);

  console.log("\n🎉  All data seeded successfully!\n");
}

main().catch((err) => {
  console.error("\n❌  Seed failed:", err.message);
  process.exit(1);
});
