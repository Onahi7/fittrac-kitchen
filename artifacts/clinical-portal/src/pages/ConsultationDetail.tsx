import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Activity, Pill, FlaskConical, Plus, Trash2, Salad, BookOpen, Video } from "lucide-react";
import { cn } from "@/lib/utils";

const conditionColors: Record<string, string> = {
  hypertension: "bg-red-100 text-red-800",
  diabetes: "bg-amber-100 text-amber-800",
  weightloss: "bg-green-100 text-green-800",
  liver: "bg-orange-100 text-orange-800",
  allergies: "bg-purple-100 text-purple-800",
};

export default function ConsultationDetail() {
  const [, params] = useRoute("/consultations/:id");
  const [, setLocation] = useLocation();
  const { staff } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const id = params?.id ?? "";

  const { data, isLoading } = useQuery<any>({
    queryKey: ["consultation", id],
    queryFn: () => fetchWithAuth(`/api/clinical-staff/consultations/${id}`),
    enabled: !!id,
  });

  const createRx = useMutation({
    mutationFn: (rx: any) => fetchWithAuth("/api/clinical-staff/prescriptions", { method: "POST", body: JSON.stringify(rx), headers: { "Content-Type": "application/json" } }),
    onSuccess: () => { toast({ title: "Prescription saved" }); qc.invalidateQueries({ queryKey: ["prescriptions"] }); },
  });

  const createNote = useMutation({
    mutationFn: (note: any) => fetchWithAuth("/api/clinical-staff/session-notes", { method: "POST", body: JSON.stringify(note), headers: { "Content-Type": "application/json" } }),
    onSuccess: () => { toast({ title: "Session note saved" }); qc.invalidateQueries({ queryKey: ["session-notes"] }); },
  });

  const [rxForm, setRxForm] = useState({ diagnosis: "", medications: [{ name: "", dose: "", frequency: "", duration: "", instructions: "" }], notes: "" });
  const [noteForm, setNoteForm] = useState({ sessionType: "follow-up", summary: "", actionItems: "", nextSession: "" });

  if (isLoading || !data) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-3 gap-6 mt-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const { patient, recentLabs, activeMealPlan } = data;
  const isDoctor = staff?.role === "doctor";

  const labStatusColor = (s: string) => s === "critical" ? "text-red-600 bg-red-50" : s === "abnormal" ? "text-amber-600 bg-amber-50" : "text-green-600 bg-green-50";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-8 py-4 border-b border-border flex items-center justify-between bg-background shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/consultations")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-serif text-xl font-bold text-foreground">Consultation — {patient?.name}</h1>
            <p className="text-xs text-muted-foreground">{data.type} · {data.time} · {data.duration} min · {data.chiefComplaint}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-xs", data.status === "in-progress" ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground")}>
            {data.status}
          </Badge>
          <Button size="sm" className="gap-1.5"><Video className="w-3.5 h-3.5" /> {data.status === "completed" ? "Call Ended" : "In Session"}</Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-0 overflow-hidden">
        {/* Left: Patient Summary */}
        <div className="border-r border-border overflow-y-auto p-6 space-y-5">
          <div>
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg mb-3">
              {patient?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </div>
            <h2 className="font-semibold text-foreground">{patient?.name}</h2>
            <p className="text-sm text-muted-foreground">{patient?.age} yrs · {patient?.gender} · {patient?.bloodType}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {patient?.conditions?.map((c: string) => (
                <span key={c} className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", conditionColors[c] ?? "bg-muted text-muted-foreground")}>{c}</span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Activity className="w-3 h-3" /> Vitals</h3>
            {[
              { label: "Fasting Glucose", value: `${patient?.fasting_glucose} mg/dL`, alert: patient?.fasting_glucose > 99 },
              { label: "HbA1c", value: `${patient?.hba1c}%`, alert: patient?.hba1c >= 6.5 },
              { label: "Blood Pressure", value: `${patient?.bp_systolic}/${patient?.bp_diastolic} mmHg`, alert: patient?.bp_systolic >= 130 },
              { label: "Cholesterol", value: `${patient?.cholesterol} mg/dL`, alert: patient?.cholesterol >= 200 },
              { label: "BMI", value: patient?.bmi?.toFixed(1), alert: patient?.bmi >= 30 },
            ].map((v) => (
              <div key={v.label} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                <span className="text-xs text-muted-foreground">{v.label}</span>
                <span className={cn("text-xs font-semibold", v.alert ? "text-red-600" : "text-foreground")}>{v.value}</span>
              </div>
            ))}
          </div>

          {patient?.medications?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Pill className="w-3 h-3" /> Current Medications</h3>
              <div className="space-y-1">
                {patient.medications.map((m: string) => (
                  <div key={m} className="text-xs bg-muted px-3 py-2 rounded-md text-foreground">{m}</div>
                ))}
              </div>
            </div>
          )}

          {recentLabs?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><FlaskConical className="w-3 h-3" /> Recent Labs</h3>
              <div className="space-y-1.5">
                {recentLabs.map((l: any) => (
                  <div key={l.id} className={cn("text-xs px-3 py-2 rounded-md", labStatusColor(l.status))}>
                    <div className="font-semibold">{l.testName}</div>
                    <div className="opacity-80">{l.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center: Chief Complaint + Notes */}
        <div className="overflow-y-auto p-6 border-r border-border space-y-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Chief Complaint</h3>
            <div className="bg-muted rounded-lg p-4 text-sm text-foreground font-medium">{data.chiefComplaint}</div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Patient Notes</h3>
            <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground min-h-24">
              {patient?.notes || "No prior notes recorded."}
            </div>
          </div>

          {isDoctor && data.notes && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Consultation Notes</h3>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-foreground">{data.notes}</div>
            </div>
          )}

          {activeMealPlan && !isDoctor && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2"><Salad className="w-3 h-3" /> Active Meal Plan</h3>
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="font-medium text-sm text-foreground">{activeMealPlan.title}</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: "Calories", value: `${activeMealPlan.targetCalories} kcal` },
                    { label: "Protein", value: `${activeMealPlan.targetProtein}g` },
                    { label: "Carbs", value: `${activeMealPlan.targetCarbs}g` },
                    { label: "Fat", value: `${activeMealPlan.targetFat}g` },
                  ].map((m) => (
                    <div key={m.label} className="bg-background rounded p-2">
                      <div className="text-muted-foreground">{m.label}</div>
                      <div className="font-semibold text-foreground">{m.value}</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">Adherence: <span className={cn("font-semibold", activeMealPlan.adherenceScore >= 80 ? "text-green-600" : activeMealPlan.adherenceScore >= 60 ? "text-amber-600" : "text-red-600")}>{activeMealPlan.adherenceScore}%</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Action Panel */}
        <div className="overflow-y-auto p-6 space-y-6">
          {isDoctor ? (
            <>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-3"><Pill className="w-3 h-3" /> Write Prescription</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Diagnosis</Label>
                    <Input value={rxForm.diagnosis} onChange={(e) => setRxForm(f => ({ ...f, diagnosis: e.target.value }))} placeholder="e.g. Type 2 Diabetes Mellitus" className="mt-1 text-xs" data-testid="input-diagnosis" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Medications</Label>
                    {rxForm.medications.map((med, i) => (
                      <div key={i} className="bg-muted rounded-lg p-3 space-y-2">
                        <Input value={med.name} onChange={(e) => { const m = [...rxForm.medications]; m[i].name = e.target.value; setRxForm(f => ({ ...f, medications: m })); }} placeholder="Drug name" className="text-xs" data-testid={`input-drug-name-${i}`} />
                        <div className="grid grid-cols-2 gap-2">
                          <Input value={med.dose} onChange={(e) => { const m = [...rxForm.medications]; m[i].dose = e.target.value; setRxForm(f => ({ ...f, medications: m })); }} placeholder="Dose" className="text-xs" data-testid={`input-drug-dose-${i}`} />
                          <Input value={med.frequency} onChange={(e) => { const m = [...rxForm.medications]; m[i].frequency = e.target.value; setRxForm(f => ({ ...f, medications: m })); }} placeholder="Frequency" className="text-xs" data-testid={`input-drug-freq-${i}`} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input value={med.duration} onChange={(e) => { const m = [...rxForm.medications]; m[i].duration = e.target.value; setRxForm(f => ({ ...f, medications: m })); }} placeholder="Duration" className="text-xs" data-testid={`input-drug-duration-${i}`} />
                          {rxForm.medications.length > 1 && (
                            <button onClick={() => { const m = rxForm.medications.filter((_, j) => j !== i); setRxForm(f => ({ ...f, medications: m })); }} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-xs">
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setRxForm(f => ({ ...f, medications: [...f.medications, { name: "", dose: "", frequency: "", duration: "", instructions: "" }] }))} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80" data-testid="btn-add-medication">
                      <Plus className="w-3 h-3" /> Add medication
                    </button>
                  </div>
                  <div>
                    <Label className="text-xs">Clinical Notes</Label>
                    <Textarea value={rxForm.notes} onChange={(e) => setRxForm(f => ({ ...f, notes: e.target.value }))} placeholder="Dietary instructions, follow-up..." className="mt-1 text-xs min-h-16" data-testid="textarea-rx-notes" />
                  </div>
                  <Button size="sm" className="w-full" data-testid="btn-save-prescription" onClick={() => createRx.mutate({ patientId: patient?.id, diagnosis: rxForm.diagnosis, medications: rxForm.medications, notes: rxForm.notes, validUntil: new Date(Date.now() + 90*24*3600*1000).toISOString().slice(0,10) })} disabled={createRx.isPending || !rxForm.diagnosis}>
                    {createRx.isPending ? "Saving..." : "Save Prescription"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-3"><BookOpen className="w-3 h-3" /> Session Notes</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Session Type</Label>
                    <select value={noteForm.sessionType} onChange={(e) => setNoteForm(f => ({ ...f, sessionType: e.target.value }))} className="mt-1 w-full text-xs border border-border rounded-md px-3 py-2 bg-background text-foreground" data-testid="select-session-type">
                      {["initial", "follow-up", "review", "counselling", "check-in"].map((t) => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Session Summary</Label>
                    <Textarea value={noteForm.summary} onChange={(e) => setNoteForm(f => ({ ...f, summary: e.target.value }))} placeholder="What was discussed, observations, client response..." className="mt-1 text-xs min-h-24" data-testid="textarea-session-summary" />
                  </div>
                  <div>
                    <Label className="text-xs">Action Items (one per line)</Label>
                    <Textarea value={noteForm.actionItems} onChange={(e) => setNoteForm(f => ({ ...f, actionItems: e.target.value }))} placeholder="- Avoid processed foods&#10;- Log meals daily" className="mt-1 text-xs min-h-16" data-testid="textarea-action-items" />
                  </div>
                  <div>
                    <Label className="text-xs">Next Session Date</Label>
                    <Input type="date" value={noteForm.nextSession} onChange={(e) => setNoteForm(f => ({ ...f, nextSession: e.target.value }))} className="mt-1 text-xs" data-testid="input-next-session" />
                  </div>
                  <Button size="sm" className="w-full" data-testid="btn-save-note" onClick={() => createNote.mutate({ patientId: patient?.id, sessionType: noteForm.sessionType, summary: noteForm.summary, actionItems: noteForm.actionItems.split("\n").filter(Boolean).map(s => s.replace(/^-\s*/, "")), nextSession: noteForm.nextSession })} disabled={createNote.isPending || !noteForm.summary}>
                    {createNote.isPending ? "Saving..." : "Save Session Notes"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
