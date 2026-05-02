-- ─────────────────────────────────────────────────────────────────
--  Fittrac Kitchen — Seed Data
--  Run AFTER schema.sql. Safe to re-run (uses ON CONFLICT DO NOTHING).
-- ─────────────────────────────────────────────────────────────────

-- Clinical Staff
INSERT INTO clinical_staff (id, username, password, name, title, role, specialization, email, badge, license_no, patients_today) VALUES
  ('doc-001','dr.amara','doctor2026','Dr. Amara Osei','MD, Internal Medicine','doctor','Internal Medicine & Metabolic Health','dr.amara@fittrac.ng','MD, FMCP','MDCN/2019/04821',8),
  ('doc-002','dr.ifiok','doctor2026','Dr. Ifiok Bassey','MD, Endocrinology','doctor','Endocrinology & Diabetes Care','dr.ifiok@fittrac.ng','MD, FMCP, FACE','MDCN/2017/03912',6),
  ('nut-001','nutri.kezia','nutri2026','Kezia Aderemi','RDN, Registered Dietitian','nutritionist','Clinical Nutrition & Meal Planning','kezia@fittrac.ng','RDN, MSc','NDN/2021/00714',11),
  ('nut-002','nutri.chika','nutri2026','Chika Eze','MSc, Sports Nutrition','nutritionist','Sports Nutrition & Weight Management','chika@fittrac.ng','MSc, PGDip','NDN/2020/00588',9)
ON CONFLICT (id) DO NOTHING;

-- Patients
INSERT INTO patients (id, name, age, gender, dob, phone, email, conditions, primary_condition, bmi, blood_type, last_visit, next_appointment, assigned_doctor_id, assigned_nutritionist_id, fasting_glucose, hba1c, bp_systolic, bp_diastolic, cholesterol, medications, notes, adherence_score, risk_score) VALUES
  ('pat-001','Amaka Okonkwo',42,'female','1982-03-14','08031234567','amaka@example.com',ARRAY['hypertension','diabetes'],'Hypertension',28.4,'O+','2026-04-28','2026-05-03','doc-001','nut-001',118,7.2,142,91,205,ARRAY['Metformin 500mg','Lisinopril 10mg'],'Patient responding well to dietary changes. BP trending down.',74,6),
  ('pat-002','Emeka Nwosu',35,'male','1990-11-08','07051234567','emeka@example.com',ARRAY['diabetes'],'Diabetes',31.2,'A+','2026-04-25','2026-05-04','doc-001','nut-001',134,8.1,128,82,188,ARRAY['Metformin 1000mg','Glipizide 5mg'],'HbA1c still elevated. Reviewing meal plan and medication dosage.',62,7),
  ('pat-003','Fatima Abubakar',29,'female','1996-07-22','09021234567','fatima@example.com',ARRAY['weightloss'],'Weight Loss',34.7,'B+','2026-05-01','2026-05-08','doc-001','nut-001',88,5.4,118,76,172,ARRAY[]::text[],'Motivated patient. Meal log compliance excellent this month.',91,2),
  ('pat-004','Babatunde Fashola',56,'male','1969-01-30','08021234567','baba@example.com',ARRAY['hypertension','liver'],'Hypertension',27.1,'O-','2026-04-20','2026-05-05','doc-002','nut-001',95,5.7,158,98,231,ARRAY['Amlodipine 5mg','Atorvastatin 20mg'],'LFT results pending. Sodium restriction critical.',55,8),
  ('pat-005','Ngozi Eze',38,'female','1987-09-11','08041234567','ngozi@example.com',ARRAY['diabetes','weightloss'],'Diabetes',30.1,'AB+','2026-04-29','2026-05-06','doc-002','nut-002',111,6.9,124,80,196,ARRAY['Metformin 500mg'],'Started low-GI meal plan 3 weeks ago. Progress steady.',82,5),
  ('pat-006','Chidi Umeh',45,'male','1980-05-17','07041234567','chidi@example.com',ARRAY['hypertension'],'Hypertension',25.6,'A-','2026-04-15','2026-05-10','doc-001','nut-002',91,5.2,148,95,210,ARRAY['Lisinopril 20mg','Hydrochlorothiazide 12.5mg'],'Dietary compliance improved after counselling.',68,5),
  ('pat-007','Seun Adeyemi',32,'female','1993-12-03','09041234567','seun@example.com',ARRAY['weightloss','allergies'],'Weight Loss',29.3,'B-','2026-05-01','2026-05-07','doc-001','nut-002',84,5.1,116,74,165,ARRAY['Cetirizine 10mg'],'Gluten-free Nigerian alternatives working well.',88,2),
  ('pat-008','Kemi Bello',51,'female','1974-08-25','08091234567','kemi@example.com',ARRAY['liver','hypertension','diabetes'],'Liver Disease',26.8,'O+','2026-04-18','2026-05-02','doc-002','nut-001',128,7.8,152,96,248,ARRAY['Metformin 1000mg','Lisinopril 10mg','Ursodeoxycholic acid 500mg'],'Complex case. Liver enzymes elevated last check.',47,9)
ON CONFLICT (id) DO NOTHING;

-- Consultations
INSERT INTO consultations (id, patient_id, doctor_id, nutritionist_id, date, scheduled_time, duration, status, type, notes, chief_complaint) VALUES
  ('cons-001','pat-001','doc-001','nut-001','2026-05-02','09:00',30,'completed','follow-up','BP reviewed. Medication adjusted.','Hypertension review'),
  ('cons-002','pat-002','doc-001','nut-001','2026-05-02','10:00',45,'in-progress','follow-up','','Diabetes management'),
  ('cons-003','pat-003','doc-001','nut-001','2026-05-02','11:30',30,'scheduled','review','','Weight loss check-in'),
  ('cons-004','pat-007','doc-001','nut-002','2026-05-02','14:00',30,'scheduled','initial','','Allergy management'),
  ('cons-005','pat-006','doc-001','nut-002','2026-05-02','15:30',45,'scheduled','follow-up','','BP review + meal plan update'),
  ('cons-006','pat-004','doc-002','nut-001','2026-05-02','09:30',30,'completed','urgent','LFT reviewed. Sodium restriction reinforced.','Liver function concern'),
  ('cons-007','pat-005','doc-002','nut-002','2026-05-02','11:00',30,'scheduled','follow-up','','Glucose control'),
  ('cons-008','pat-008','doc-002','nut-001','2026-05-02','13:00',60,'scheduled','comprehensive','','Complex multi-condition review')
ON CONFLICT (id) DO NOTHING;

-- Lab Results
INSERT INTO lab_results (id, patient_id, ordered_by, test_name, value, reference_range, flag, status, date, uploaded_at, notes) VALUES
  ('lab-001','pat-001','doc-001','HbA1c','7.2%','< 5.7% normal, 5.7-6.4% pre-diabetic, ≥ 6.5% diabetic','elevated','abnormal','2026-04-26','2026-04-28','Slight improvement from 7.6% last quarter'),
  ('lab-002','pat-001','doc-001','Fasting Blood Sugar','118 mg/dL','70-99 mg/dL','elevated','abnormal','2026-04-26','2026-04-28',''),
  ('lab-003','pat-001','doc-001','Lipid Profile','TC: 205, LDL: 130, HDL: 48, TG: 185 mg/dL','TC < 200, LDL < 100, HDL > 60, TG < 150','elevated','abnormal','2026-04-26','2026-04-28',''),
  ('lab-004','pat-002','doc-001','HbA1c','8.1%','< 5.7%','critical','critical','2026-04-23','2026-04-25','Increased from 7.8%. Review medication and diet'),
  ('lab-005','pat-004','doc-002','Liver Function Test','ALT: 68 U/L, AST: 54 U/L, ALP: 112 U/L','ALT < 40, AST < 40, ALP 44-147','elevated','abnormal','2026-04-18','2026-04-20','Elevated transaminases. Alcohol cessation counselled'),
  ('lab-006','pat-008','doc-002','Complete Blood Count','WBC: 7.2, Hgb: 11.8 g/dL, Hct: 36%, Plt: 198','Hgb: 12-16 g/dL (F)','elevated','abnormal','2026-04-16','2026-04-18','Mild anaemia. Iron supplementation considered'),
  ('lab-007','pat-005','doc-002','Fasting Blood Sugar','111 mg/dL','70-99 mg/dL','elevated','abnormal','2026-04-27','2026-04-29',''),
  ('lab-008','pat-006','doc-001','Blood Pressure 24hr','Avg: 148/95, Peak: 167/102 mmHg','< 130/80 mmHg','elevated','abnormal','2026-04-14','2026-04-15','Sustained hypertension. Dose escalation recommended')
ON CONFLICT (id) DO NOTHING;

-- Meal Plans
INSERT INTO meal_plans (id, patient_id, nutritionist_id, title, status, target_calories, target_protein, target_carbs, target_fat, target_sodium, adherence_score, meals, created_at) VALUES
  ('mp-001','pat-001','nut-001','Low-GI Hypertension Plan — Week 3','active',1800,75,200,55,1500,74,'[{"day":"Mon","breakfast":"Akara (2 balls) + Zobo (no sugar)","lunch":"Ogbono light soup + Brown rice (small)","dinner":"Tilapia pepper soup + Boiled plantain (½)"},{"day":"Tue","breakfast":"Oats + Moringa smoothie","lunch":"Moi Moi + Salad","dinner":"Egusi (reduced palm oil) + Pounded yam (small)"}]','2026-04-20'),
  ('mp-002','pat-002','nut-001','Glycemic Control Plan — High Compliance Target','active',1600,85,160,50,2000,62,'[{"day":"Mon","breakfast":"Boiled eggs (2) + Cucumber","lunch":"Jollof brown rice + Grilled fish","dinner":"Vegetable soup (no thickener) + Yam (small)"}]','2026-04-18'),
  ('mp-003','pat-003','nut-001','Caloric Deficit + High Protein','active',1400,95,130,45,2000,91,'[{"day":"Mon","breakfast":"Akara protein balls (3) + Zobo","lunch":"Jollof brown rice + Grilled chicken","dinner":"Pepper soup (lean protein)"}]','2026-05-01'),
  ('mp-004','pat-005','nut-002','Low-GI Diabetes + Weight Loss','active',1500,90,145,48,1800,82,'[]','2026-04-22'),
  ('mp-005','pat-006','nut-002','DASH Diet Adaptation (Nigerian)','active',1900,80,220,60,1200,68,'[]','2026-04-10'),
  ('mp-006','pat-007','nut-002','Gluten-Free Nigerian Plan','active',1650,88,175,52,2000,88,'[]','2026-05-01')
ON CONFLICT (id) DO NOTHING;

-- Session Notes
INSERT INTO session_notes (id, patient_id, nutritionist_id, date, session_type, summary, action_items, next_session) VALUES
  ('sn-001','pat-001','nut-001','2026-04-28','follow-up','Patient showed improved meal log compliance. Sodium intake down to avg 1800mg/day. Zobo replacing fizzy drinks consistently.',ARRAY['Increase leafy greens intake','Try sugarless akamu for breakfast'],'2026-05-12'),
  ('sn-002','pat-002','nut-001','2026-04-25','counselling','Reviewed food diary. Evening snacking identified as major issue. Educated on glycemic impact. Introduced structured snack options.',ARRAY['Replace chin-chin with groundnut','No food after 8pm'],'2026-05-09'),
  ('sn-003','pat-003','nut-001','2026-05-01','check-in','Patient reports feeling energetic. Lost 2.1kg this month. Celebrating milestone — healthy meal out guide provided.',ARRAY['Maintain current plan','Add resistance training'],'2026-05-15'),
  ('sn-004','pat-007','nut-002','2026-05-01','initial','First nutritional assessment. Gluten sensitivity confirmed. Reviewed Nigerian staples safe for gluten-free diet. Menu guide provided.',ARRAY['Avoid all wheat-based foods','Focus on yam, plantain, oats'],'2026-05-08')
ON CONFLICT (id) DO NOTHING;

-- Prescriptions
INSERT INTO prescriptions (id, patient_id, doctor_id, date, diagnosis, medications, notes, valid_until) VALUES
  ('rx-001','pat-001','doc-001','2026-04-28','Type 2 Diabetes Mellitus with Hypertension','[{"name":"Metformin","dose":"500mg","frequency":"Twice daily","duration":"90 days","instructions":"Take with meals"},{"name":"Lisinopril","dose":"10mg","frequency":"Once daily","duration":"90 days","instructions":"Take in morning"}]','Low-sodium, low-GI diet reinforced. Follow up in 4 weeks.','2026-07-28'),
  ('rx-002','pat-002','doc-001','2026-04-25','Type 2 Diabetes Mellitus — Poor Control','[{"name":"Metformin","dose":"1000mg","frequency":"Twice daily","duration":"60 days","instructions":"Take with meals"},{"name":"Glipizide","dose":"5mg","frequency":"Once daily before breakfast","duration":"60 days","instructions":"Monitor for hypoglycaemia"}]','Increase physical activity. Fasting glucose monitoring daily.','2026-06-25'),
  ('rx-003','pat-004','doc-002','2026-04-20','Essential Hypertension with Hyperlipidaemia','[{"name":"Amlodipine","dose":"5mg","frequency":"Once daily","duration":"90 days","instructions":"Take in evening"},{"name":"Atorvastatin","dose":"20mg","frequency":"Once at night","duration":"90 days","instructions":"Avoid grapefruit"}]','Strict low-sodium diet. Alcohol cessation mandatory. LFT repeat in 8 weeks.','2026-07-20')
ON CONFLICT (id) DO NOTHING;
