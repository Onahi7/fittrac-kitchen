import { useState } from "react";

const CONSULTANTS = [
  { name: "Dr. Adaeze Okonkwo", type: "Nutritionist", sessions: 312, rating: 4.9, revenue: 2652000, condition: "Weight Loss, Diabetes", status: "active", emoji: "🩺", id: "dr-adaeze" },
  { name: "Dr. Emeka Nwosu", type: "Registered Dietitian", sessions: 228, rating: 4.8, revenue: 1641600, condition: "Hypertension, Liver", status: "active", emoji: "❤️", id: "dr-emeka" },
  { name: "Coach Fatima Al-Rashid", type: "Health Coach", sessions: 480, rating: 4.9, revenue: 2640000, condition: "Weight Loss, Allergies", status: "active", emoji: "⚡", id: "coach-fatima" },
  { name: "Dr. Bola Fashola", type: "General Practitioner", sessions: 156, rating: 4.7, revenue: 1872000, condition: "Liver, Hypertension, Diabetes", status: "active", emoji: "🌿", id: "dr-bola" },
];

const UPCOMING = [
  { id: "CON-1042", patient: "A.O.", specialist: "Dr. Adaeze Okonkwo", specialistId: "dr-adaeze", date: "Today", time: "2:00 PM", type: "Nutritionist", price: 8500, status: "scheduled" },
  { id: "CON-1041", patient: "E.N.", specialist: "Coach Fatima Al-Rashid", specialistId: "coach-fatima", date: "Today", time: "4:00 PM", type: "Health Coach", price: 5500, status: "scheduled" },
  { id: "CON-1040", patient: "B.F.", specialist: "Dr. Emeka Nwosu", specialistId: "dr-emeka", date: "Tomorrow", time: "10:00 AM", type: "Dietitian", price: 7200, status: "scheduled" },
  { id: "CON-1039", patient: "C.U.", specialist: "Dr. Bola Fashola", specialistId: "dr-bola", date: "Friday", time: "11:00 AM", type: "GP", price: 12000, status: "scheduled" },
];

const COMMON_TESTS = [
  "Fasting Blood Sugar (FBS)", "HbA1c", "Lipid Profile (Cholesterol)",
  "Liver Function Test (LFT)", "Complete Blood Count (CBC)",
  "Kidney Function Test (KFT)", "Thyroid Function (TSH, T3, T4)",
  "Urine Analysis", "Electrolytes (Na, K, Cl)", "Blood Pressure (24hr Monitor)",
];

interface Medication { name: string; dosage: string; frequency: string; duration: string; instructions: string; }

function ConsultationRoom({ session, onClose }: { session: typeof UPCOMING[0]; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"call" | "tests" | "prescription">("call");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [testsSent, setTestsSent] = useState(false);
  const [callActive, setCallActive] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [callDuration, setCallDuration] = useState("4:23");

  const [diagnosis, setDiagnosis] = useState("");
  const [medications, setMedications] = useState<Medication[]>([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
  ]);
  const [followUp, setFollowUp] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [rxSaved, setRxSaved] = useState(false);

  const specialist = CONSULTANTS.find((c) => c.id === session.specialistId);

  const toggleTest = (t: string) => {
    setSelectedTests((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const addMed = () => setMedications((prev) => [...prev, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  const removeMed = (i: number) => setMedications((prev) => prev.filter((_, idx) => idx !== i));
  const updateMed = (i: number, field: keyof Medication, val: string) => {
    setMedications((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  };

  const handleSaveRx = () => { setRxSaved(true); setTimeout(() => setRxSaved(false), 2500); };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
              {specialist?.emoji}
            </div>
            <div>
              <div className="font-bold text-foreground">{session.id} · {session.specialist}</div>
              <div className="text-sm text-muted-foreground">{session.type} · Patient {session.patient} · {session.date} at {session.time}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block"></span> LIVE
            </span>
            <span className="text-sm text-muted-foreground font-mono">{callDuration}</span>
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
                  {selectedTests.length > 0 && (
                    <button
                      className="w-full py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all"
                      onClick={() => { setTestsSent(true); }}
                    >
                      {testsSent ? "✓ Sent to Patient" : `Send ${selectedTests.length} Test Request${selectedTests.length > 1 ? "s" : ""}`}
                    </button>
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
                    <label className="text-xs text-muted-foreground mb-1 block">Follow-Up Date</label>
                    <input
                      value={followUp}
                      onChange={(e) => setFollowUp(e.target.value)}
                      placeholder="e.g. In 6 weeks"
                      className="w-full rounded-xl border border-border bg-muted p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <button
                    className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all"
                    onClick={handleSaveRx}
                  >
                    {rxSaved ? "✓ Prescription Saved" : "Save & Send Prescription"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-zinc-900 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-primary/20 border-4 border-primary/40 flex items-center justify-center mx-auto mb-4 text-4xl">
                  {specialist?.emoji}
                </div>
                <div className="text-white font-semibold text-lg">{session.specialist}</div>
                <div className="text-zinc-400 text-sm">{session.type}</div>
                <div className="mt-4 flex justify-center gap-2">
                  {[1,2,3,4].map((i) => (
                    <div key={i} style={{ height: `${8 + i * 4}px` }} className="w-1.5 bg-green-400/60 rounded-full animate-pulse" />
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute top-4 right-4 w-28 h-36 rounded-2xl bg-zinc-700 border-2 border-primary/40 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center mx-auto mb-2 text-xl">👤</div>
                <div className="text-white text-xs font-medium">Patient {session.patient}</div>
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
                className="w-full py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all"
                onClick={handleSaveRx}
              >
                {rxSaved ? "✓ Prescription Saved & Sent" : "💊 Finalise & Send Prescription"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Wellness() {
  const totalRevenue = CONSULTANTS.reduce((s, c) => s + c.revenue, 0);
  const totalSessions = CONSULTANTS.reduce((s, c) => s + c.sessions, 0);
  const avgRating = (CONSULTANTS.reduce((s, c) => s + c.rating, 0) / CONSULTANTS.length).toFixed(1);
  const [activeSession, setActiveSession] = useState<typeof UPCOMING[0] | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "sessions">("overview");

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      {activeSession && <ConsultationRoom session={activeSession} onClose={() => setActiveSession(null)} />}

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

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Sessions", value: totalSessions, icon: "🩺", color: "text-primary" },
          { label: "Total Revenue", value: `₦${(totalRevenue / 1_000_000).toFixed(1)}M`, icon: "💰", color: "text-green-700" },
          { label: "Avg Rating", value: avgRating, icon: "⭐", color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-5 border border-border shadow-xs">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Specialist Team</h2>
            </div>
            <div className="divide-y divide-border">
              {CONSULTANTS.map((c) => (
                <div key={c.name} className="p-5 flex items-center gap-4 hover:bg-muted/30 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">{c.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground">{c.name}</div>
                    <div className="text-sm text-muted-foreground">{c.type} · {c.condition}</div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="text-sm font-medium text-foreground">{c.sessions} sessions</div>
                    <div className="text-xs text-muted-foreground">⭐ {c.rating}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary text-sm">₦{(c.revenue / 1_000_000).toFixed(1)}M</div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Upcoming Sessions</h2>
              <button onClick={() => setActiveTab("sessions")} className="text-sm text-primary font-semibold hover:underline">
                Open Doctor's Room →
              </button>
            </div>
            <div className="divide-y divide-border">
              {UPCOMING.map((s) => (
                <div key={s.id} className="p-5 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{s.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{s.date}</span>
                    </div>
                    <div className="font-medium text-foreground text-sm">{s.specialist} · {s.time}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.type} · Patient {s.patient}</div>
                  </div>
                  <div className="font-bold text-primary">₦{s.price.toLocaleString()}</div>
                  <button
                    onClick={() => { setActiveSession(s); setActiveTab("sessions"); }}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1"
                  >
                    📹 Open Room
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "sessions" && (
        <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">Doctor's Consultation Rooms</h2>
            <p className="text-sm text-muted-foreground mt-1">Click "Open Room" to enter a live consultation — manage calls, request tests, write prescriptions</p>
          </div>
          <div className="divide-y divide-border">
            {UPCOMING.map((s) => {
              const specialist = CONSULTANTS.find((c) => c.id === s.specialistId);
              return (
                <div key={s.id} className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">{specialist?.emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-foreground">{s.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.date === "Today" ? "bg-green-50 text-green-700 border border-green-200" : "bg-muted text-muted-foreground"}`}>
                        {s.date}
                      </span>
                    </div>
                    <div className="text-sm text-foreground font-medium">{s.specialist} with Patient {s.patient}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.type} · {s.time}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="font-bold text-primary">₦{s.price.toLocaleString()}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.date === "Today" ? "bg-red-50 text-red-600" : "bg-muted text-muted-foreground"}`}>
                      {s.date === "Today" ? "LIVE" : "Scheduled"}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveSession(s)}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all flex items-center gap-2"
                  >
                    📹 Open Room
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
