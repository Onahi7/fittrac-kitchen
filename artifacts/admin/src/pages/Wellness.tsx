import { useEffect, useState } from "react";
import { useAdminFetch } from "@/contexts/AuthContext";

const COMMON_TESTS = [
  "Fasting Blood Sugar (FBS)", "HbA1c", "Lipid Profile (Cholesterol)",
  "Liver Function Test (LFT)", "Complete Blood Count (CBC)",
  "Kidney Function Test (KFT)", "Thyroid Function (TSH, T3, T4)",
  "Urine Analysis", "Electrolytes (Na, K, Cl)", "Blood Pressure (24hr Monitor)",
];

interface Medication { name: string; dosage: string; frequency: string; duration: string; instructions: string; }

interface ClinicalStaff {
  id: string; name: string; title: string; role: string;
  specialization: string; badge: string;
  sessions: number; patients: number;
}

interface ConsultationSession {
  id: string; patientId: string; patientName: string;
  doctorId: string | null; nutritionistId: string | null; staffId: string | null;
  staffName: string; staffRole: string;
  date: string; time: string; duration: number;
  status: string; type: string; chiefComplaint: string;
}

type AdminFetch = (url: string, init?: RequestInit) => Promise<Response>;

function roleEmoji(role: string) {
  return role === "doctor" ? "🩺" : "🥗";
}

function ConsultationRoom({
  session, onClose, apiFetch,
}: {
  session: ConsultationSession;
  onClose: () => void;
  apiFetch: AdminFetch;
}) {
  const [activeTab, setActiveTab] = useState<"call" | "tests" | "prescription">("call");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [testsSending, setTestsSending] = useState(false);
  const [testsSent, setTestsSent] = useState(false);
  const [callActive, setCallActive] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);

  const [diagnosis, setDiagnosis] = useState("");
  const [medications, setMedications] = useState<Medication[]>([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
  ]);
  const [followUp, setFollowUp] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [rxSaving, setRxSaving] = useState(false);
  const [rxSaved, setRxSaved] = useState(false);
  const [rxError, setRxError] = useState("");
  const [testError, setTestError] = useState("");

  const toggleTest = (t: string) =>
    setSelectedTests((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const addMed = () => setMedications((prev) => [...prev, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  const removeMed = (i: number) => setMedications((prev) => prev.filter((_, idx) => idx !== i));
  const updateMed = (i: number, field: keyof Medication, val: string) =>
    setMedications((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));

  const handleSendTests = async () => {
    if (!selectedTests.length) return;
    setTestsSending(true);
    setTestError("");
    try {
      const res = await apiFetch("/api/admin/test-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: session.patientId,
          consultationId: session.id,
          doctorName: session.staffName,
          tests: selectedTests,
        }),
      });
      if (!res.ok) throw new Error("Failed to send test requests");
      setTestsSent(true);
    } catch {
      setTestError("Could not send tests. Check that the patient exists in the database.");
    } finally {
      setTestsSending(false);
    }
  };

  const handleSaveRx = async () => {
    if (!diagnosis) return;
    setRxSaving(true);
    setRxError("");
    try {
      const res = await apiFetch("/api/admin/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: session.patientId,
          consultationId: session.id,
          doctorId: session.doctorId,
          doctorName: session.staffName,
          doctorType: session.staffRole === "doctor" ? "Medical Doctor" : "Nutritionist",
          diagnosis,
          medications: medications.filter((m) => m.name),
          labTests: selectedTests,
          notes: doctorNotes,
          followUpDate: followUp || null,
          validUntil: followUp || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save prescription");
      setRxSaved(true);
      setTimeout(() => setRxSaved(false), 3000);
    } catch {
      setRxError("Could not save prescription. Check that the patient exists in the database.");
    } finally {
      setRxSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
              {roleEmoji(session.staffRole)}
            </div>
            <div>
              <div className="font-bold text-foreground">{session.id} · {session.staffName}</div>
              <div className="text-sm text-muted-foreground">
                {session.staffRole === "doctor" ? "Doctor" : "Nutritionist"} · Patient {session.patientName} · {session.date} {session.time ? `at ${session.time}` : ""}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block"></span> LIVE
            </span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors ml-2">✕</button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col w-80 border-r border-border">
            <div className="flex border-b border-border">
              {(["call", "tests", "prescription"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-3 text-xs font-semibold transition-all ${activeTab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                >
                  {t === "call" ? "Call" : t === "tests" ? "Test Req." : "Rx"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === "call" && (
                <div className="space-y-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Call Controls</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: isMicOn ? "Mute" : "Unmute", icon: isMicOn ? "🎙️" : "🔇", action: () => setIsMicOn(!isMicOn) },
                      { label: isCamOn ? "Cam Off" : "Cam On", icon: isCamOn ? "📷" : "📵", action: () => setIsCamOn(!isCamOn) },
                      { label: "Screen Share", icon: "🖥️", action: () => {} },
                      { label: "Chat", icon: "💬", action: () => {} },
                    ].map((ctrl) => (
                      <button
                        key={ctrl.label}
                        onClick={ctrl.action}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-all text-xs text-foreground"
                      >
                        <span className="text-xl">{ctrl.icon}</span>
                        {ctrl.label}
                      </button>
                    ))}
                  </div>
                  <button
                    className="w-full py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all"
                    onClick={() => setCallActive(false)}
                  >
                    📴 End Consultation
                  </button>
                  <div className={`rounded-xl p-3 text-center text-xs ${callActive ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"}`}>
                    {callActive ? "🟢 Call in progress" : "⚫ Call ended"}
                  </div>
                  {session.chiefComplaint && (
                    <div className="rounded-xl bg-muted p-3 text-xs text-foreground">
                      <div className="font-semibold text-muted-foreground mb-1">Chief Complaint</div>
                      {session.chiefComplaint}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "tests" && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Tests to Request</div>
                  <div className="space-y-2">
                    {COMMON_TESTS.map((t) => (
                      <label key={t} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTests.includes(t)}
                          onChange={() => toggleTest(t)}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-sm text-foreground">{t}</span>
                      </label>
                    ))}
                  </div>
                  {testError && <p className="text-xs text-red-600 bg-red-50 rounded-xl p-3">{testError}</p>}
                  {selectedTests.length > 0 && !testsSent && (
                    <button
                      className="w-full py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-60"
                      onClick={handleSendTests}
                      disabled={testsSending}
                    >
                      {testsSending ? "Sending…" : `Send ${selectedTests.length} Test Request${selectedTests.length > 1 ? "s" : ""}`}
                    </button>
                  )}
                  {testsSent && (
                    <div className="w-full py-3 rounded-xl bg-green-100 text-green-700 text-sm font-bold text-center">
                      ✓ Sent to Patient
                    </div>
                  )}
                </div>
              )}

              {activeTab === "prescription" && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Write Prescription</div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Diagnosis</label>
                    <textarea
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="Enter clinical diagnosis..."
                      rows={3}
                      className="w-full rounded-xl border border-border bg-muted p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Valid Until</label>
                    <input
                      type="date"
                      value={followUp}
                      onChange={(e) => setFollowUp(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  {rxError && <p className="text-xs text-red-600 bg-red-50 rounded-xl p-3">{rxError}</p>}
                  <button
                    className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-60"
                    onClick={handleSaveRx}
                    disabled={rxSaving || !diagnosis}
                  >
                    {rxSaved ? "✓ Prescription Saved" : rxSaving ? "Saving…" : "Save & Send Prescription"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-zinc-900 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-primary/20 border-4 border-primary/40 flex items-center justify-center mx-auto mb-4 text-4xl">
                  {roleEmoji(session.staffRole)}
                </div>
                <div className="text-white font-semibold text-lg">{session.staffName}</div>
                <div className="text-zinc-400 text-sm">{session.staffRole === "doctor" ? "Doctor" : "Nutritionist"}</div>
                <div className="mt-4 flex justify-center gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ height: `${8 + i * 4}px` }} className="w-1.5 bg-green-400/60 rounded-full animate-pulse" />
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute top-4 right-4 w-28 h-36 rounded-2xl bg-zinc-700 border-2 border-primary/40 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center mx-auto mb-2 text-xl">👤</div>
                <div className="text-white text-xs font-medium">{session.patientName}</div>
              </div>
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              {[
                { icon: isMicOn ? "🎙️" : "🔇", action: () => setIsMicOn(!isMicOn), active: isMicOn },
                { icon: isCamOn ? "📷" : "📵", action: () => setIsCamOn(!isCamOn), active: isCamOn },
                { icon: "💬", action: () => setActiveTab("call"), active: true },
                { icon: "🔬", action: () => setActiveTab("tests"), active: activeTab === "tests" },
                { icon: "📋", action: () => setActiveTab("prescription"), active: activeTab === "prescription" },
              ].map((ctrl, i) => (
                <button
                  key={i}
                  onClick={ctrl.action}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${ctrl.active ? "bg-white/20" : "bg-white/10 opacity-60"} hover:bg-white/30`}
                >
                  {ctrl.icon}
                </button>
              ))}
              <button
                className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-xl hover:bg-red-600 transition-all"
                onClick={() => { setCallActive(false); onClose(); }}
              >
                📴
              </button>
            </div>
          </div>

          <div className="w-72 border-l border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="text-sm font-bold text-foreground mb-1">Medications</div>
              <div className="text-xs text-muted-foreground">Add to prescription</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {medications.map((med, i) => (
                <div key={i} className="bg-muted rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Medication {i + 1}</span>
                    {medications.length > 1 && (
                      <button onClick={() => removeMed(i)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                    )}
                  </div>
                  {(["name", "dosage", "frequency", "duration", "instructions"] as (keyof Medication)[]).map((field) => (
                    <input
                      key={field}
                      value={med[field]}
                      onChange={(e) => updateMed(i, field, e.target.value)}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      className="w-full text-xs rounded-lg border border-border bg-background p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  ))}
                </div>
              ))}
              <button onClick={addMed} className="w-full py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all">
                + Add Medication
              </button>

              <div className="pt-2">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Doctor's Notes</div>
                <textarea
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Additional notes, diet recommendations, lifestyle advice..."
                  rows={4}
                  className="w-full rounded-xl border border-border bg-muted p-3 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <button
                className="w-full py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-60"
                onClick={handleSaveRx}
                disabled={rxSaving || !diagnosis}
              >
                {rxSaved ? "✓ Prescription Saved & Sent" : rxSaving ? "Saving…" : "💊 Finalise & Send Prescription"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Wellness() {
  const apiFetch = useAdminFetch();
  const [staff, setStaff] = useState<ClinicalStaff[]>([]);
  const [consultations, setConsultations] = useState<ConsultationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<ConsultationSession | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "sessions">("overview");

  useEffect(() => {
    Promise.all([
      apiFetch("/api/admin/clinical-staff").then((r) => r.json()),
      apiFetch("/api/admin/consultations").then((r) => r.json()),
    ])
      .then(([s, c]) => {
        setStaff(s.staff ?? []);
        setConsultations(c.consultations ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalSessions = staff.reduce((s, c) => s + c.sessions, 0);
  const totalPatients = staff.reduce((s, c) => s + c.patients, 0);
  const doctors = staff.filter((s) => s.role === "doctor");
  const nutritionists = staff.filter((s) => s.role === "nutritionist");

  const today = new Date().toISOString().slice(0, 10);
  const todayConsults = consultations.filter((c) => c.date === today);
  const upcomingConsults = consultations.filter((c) => c.date > today);

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      {activeSession && (
        <ConsultationRoom
          session={activeSession}
          onClose={() => setActiveSession(null)}
          apiFetch={apiFetch}
        />
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Wellness</h1>
          <p className="text-muted-foreground mt-1">Telemedicine consultations and specialist management</p>
        </div>
        <div className="flex gap-2">
          {(["overview", "sessions"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === t ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {t === "overview" ? "Overview" : "Live Sessions"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-2xl p-5 border border-border shadow-xs animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Sessions", value: totalSessions, icon: "🩺", color: "text-primary" },
            { label: "Total Patients", value: totalPatients, icon: "👥", color: "text-blue-600" },
            { label: "Clinical Staff", value: staff.length, icon: "⭐", color: "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl p-5 border border-border shadow-xs">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {!loading && activeTab === "overview" && (
        <>
          {staff.length > 0 ? (
            <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">Clinical Team</h2>
              </div>
              {doctors.length > 0 && (
                <>
                  <div className="px-5 py-2 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Doctors</div>
                  <div className="divide-y divide-border">
                    {doctors.map((c) => (
                      <div key={c.id} className="p-5 flex items-center gap-4 hover:bg-muted/30 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">🩺</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground">{c.name}</div>
                          <div className="text-sm text-muted-foreground">{c.title ?? "Doctor"} · {c.specialization ?? "General"}</div>
                        </div>
                        <div className="text-right space-y-0.5">
                          <div className="text-sm font-medium text-foreground">{c.sessions} sessions</div>
                          <div className="text-xs text-muted-foreground">{c.patients} patients</div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {nutritionists.length > 0 && (
                <>
                  <div className="px-5 py-2 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nutritionists</div>
                  <div className="divide-y divide-border">
                    {nutritionists.map((c) => (
                      <div key={c.id} className="p-5 flex items-center gap-4 hover:bg-muted/30 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">🥗</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground">{c.name}</div>
                          <div className="text-sm text-muted-foreground">{c.title ?? "Nutritionist"} · {c.specialization ?? "General Nutrition"}</div>
                        </div>
                        <div className="text-right space-y-0.5">
                          <div className="text-sm font-medium text-foreground">{c.sessions} sessions</div>
                          <div className="text-xs text-muted-foreground">{c.patients} patients</div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
              <div className="text-4xl mb-3">🩺</div>
              <div className="font-semibold">No clinical staff found</div>
              <div className="text-sm mt-1">Run the Supabase seed script to populate clinical staff data.</div>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                Upcoming Sessions
                {todayConsults.length > 0 && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                    {todayConsults.length} today
                  </span>
                )}
              </h2>
              {consultations.length > 0 && (
                <button onClick={() => setActiveTab("sessions")} className="text-sm text-primary font-semibold hover:underline">
                  Open Doctor's Room →
                </button>
              )}
            </div>
            {consultations.length > 0 ? (
              <div className="divide-y divide-border">
                {consultations.slice(0, 5).map((s) => (
                  <div key={s.id} className="p-5 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{s.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${s.date === today ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-100"}`}>
                          {s.date === today ? "Today" : s.date}
                        </span>
                      </div>
                      <div className="font-medium text-foreground text-sm">{s.staffName} · {s.time ?? "—"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.staffRole === "doctor" ? "Doctor" : "Nutritionist"} · Patient {s.patientName}</div>
                    </div>
                    <button
                      onClick={() => { setActiveSession(s); setActiveTab("sessions"); }}
                      className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1"
                    >
                      📹 Open Room
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No upcoming sessions scheduled. Sessions booked via the mobile app will appear here.
              </div>
            )}
          </div>
        </>
      )}

      {!loading && activeTab === "sessions" && (
        <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">Doctor's Consultation Rooms</h2>
            <p className="text-sm text-muted-foreground mt-1">Click "Open Room" to monitor a live consultation — manage calls, request tests, write prescriptions</p>
          </div>
          {consultations.length > 0 ? (
            <div className="divide-y divide-border">
              {consultations.map((s) => (
                <div key={s.id} className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                    {roleEmoji(s.staffRole)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-foreground">{s.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.date === today ? "bg-green-50 text-green-700 border border-green-200" : "bg-muted text-muted-foreground"}`}>
                        {s.date === today ? "Today" : s.date}
                      </span>
                    </div>
                    <div className="text-sm text-foreground font-medium">{s.staffName} with {s.patientName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.staffRole === "doctor" ? "Doctor" : "Nutritionist"} · {s.time ?? "—"}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      s.status === "in-progress" ? "bg-red-50 text-red-600 font-semibold" :
                      s.status === "scheduled" ? "bg-blue-50 text-blue-700" : "bg-muted text-muted-foreground"
                    }`}>
                      {s.status === "in-progress" ? "LIVE" : s.status}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveSession(s)}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all flex items-center gap-2"
                  >
                    📹 Open Room
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <div className="text-4xl mb-3">📹</div>
              <div className="font-semibold">No consultations scheduled</div>
              <div className="text-sm mt-1">When patients book consultations via the mobile app, they will appear here.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
