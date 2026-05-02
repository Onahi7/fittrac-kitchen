import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Activity, Pill, FlaskConical, CalendarDays, Salad, BookOpen, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const conditionColors: Record<string, string> = {
  hypertension: "bg-red-100 text-red-800",
  diabetes: "bg-amber-100 text-amber-800",
  weightloss: "bg-green-100 text-green-800",
  liver: "bg-orange-100 text-orange-800",
  allergies: "bg-purple-100 text-purple-800",
};

const labStatusColor = (s: string) => s === "critical" ? "bg-red-50 text-red-700 border-red-200" : s === "abnormal" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200";

export default function PatientDetail() {
  const [, params] = useRoute("/patients/:id");
  const [, setLocation] = useLocation();
  const { staff } = useAuth();
  const id = params?.id ?? "";

  const { data: patient, isLoading } = useQuery<any>({
    queryKey: ["patient", id],
    queryFn: () => fetchWithAuth(`/api/clinical-staff/patients/${id}`),
    enabled: !!id,
  });

  if (isLoading || !patient) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-72" />)}
        </div>
      </div>
    );
  }

  const isDoctor = staff?.role === "doctor";
  const adherencePlan = patient.mealPlans?.[0];

  return (
    <div className="p-8 space-y-6 overflow-y-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => setLocation("/patients")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            {patient.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">{patient.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-muted-foreground">{patient.age} yrs · {patient.gender} · {patient.bloodType}</span>
              <span className="text-xs text-muted-foreground">DOB: {patient.dob}</span>
              <div className="flex gap-1">
                {patient.conditions?.map((c: string) => (
                  <span key={c} className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", conditionColors[c] ?? "bg-muted text-muted-foreground")}>{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Vitals + Medications */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-serif flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Vitals</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Fasting Glucose", value: `${patient.fasting_glucose} mg/dL`, alert: patient.fasting_glucose > 99 },
              { label: "HbA1c", value: `${patient.hba1c}%`, alert: patient.hba1c >= 6.5 },
              { label: "Blood Pressure", value: `${patient.bp_systolic}/${patient.bp_diastolic} mmHg`, alert: patient.bp_systolic >= 130 },
              { label: "Cholesterol", value: `${patient.cholesterol} mg/dL`, alert: patient.cholesterol >= 200 },
              { label: "BMI", value: patient.bmi?.toFixed(1), alert: patient.bmi >= 30 },
            ].map((v) => (
              <div key={v.label} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                <span className="text-sm text-muted-foreground">{v.label}</span>
                <div className="flex items-center gap-1.5">
                  {v.alert && <AlertCircle className="w-3 h-3 text-amber-500" />}
                  <span className={cn("text-sm font-semibold", v.alert ? "text-amber-600" : "text-foreground")}>{v.value}</span>
                </div>
              </div>
            ))}

            {patient.medications?.length > 0 && (
              <div className="pt-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"><Pill className="w-3 h-3" /> Current Medications</div>
                <div className="space-y-1.5">
                  {patient.medications.map((m: string) => (
                    <div key={m} className="text-xs bg-muted px-3 py-2 rounded-md">{m}</div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lab Results */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-serif flex items-center gap-2"><FlaskConical className="w-4 h-4 text-primary" /> Lab Results</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {patient.labs?.length > 0 ? patient.labs.map((l: any) => (
              <div key={l.id} className={cn("border rounded-lg p-3 text-xs", labStatusColor(l.status))} data-testid={`lab-${l.id}`}>
                <div className="font-semibold">{l.testName}</div>
                <div className="mt-0.5 opacity-90">{l.value}</div>
                {l.notes && <div className="mt-1 opacity-70">{l.notes}</div>}
                <div className="mt-1 opacity-60">{l.resultDate}</div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No lab results on file</p>
            )}
          </CardContent>
        </Card>

        {/* Consultations & Plan/Notes */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-serif flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" /> Consultation History</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {patient.consultations?.length > 0 ? patient.consultations.map((c: any) => (
                <div key={c.id} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0 text-xs">
                  <div>
                    <div className="font-medium text-foreground">{c.chiefComplaint}</div>
                    <div className="text-muted-foreground">{c.type} · {c.date}</div>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                    c.status === "completed" ? "bg-green-100 text-green-800" : c.status === "in-progress" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>{c.status}</span>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No consultation history</p>
              )}
            </CardContent>
          </Card>

          {!isDoctor && adherencePlan && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base font-serif flex items-center gap-2"><Salad className="w-4 h-4 text-primary" /> Active Meal Plan</CardTitle></CardHeader>
              <CardContent>
                <div className="font-medium text-sm text-foreground mb-2">{adherencePlan.title}</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[{ label: "Calories", value: `${adherencePlan.targetCalories} kcal` }, { label: "Protein", value: `${adherencePlan.targetProtein}g` }, { label: "Carbs", value: `${adherencePlan.targetCarbs}g` }, { label: "Fat", value: `${adherencePlan.targetFat}g` }].map(m => (
                    <div key={m.label} className="bg-muted rounded p-2 text-center">
                      <div className="font-bold text-foreground">{m.value}</div>
                      <div className="text-muted-foreground">{m.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">Adherence: <span className={cn("font-semibold", adherencePlan.adherenceScore >= 80 ? "text-green-600" : adherencePlan.adherenceScore >= 60 ? "text-amber-600" : "text-red-600")}>{adherencePlan.adherenceScore}%</span></div>
              </CardContent>
            </Card>
          )}

          {!isDoctor && patient.sessionNotes?.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base font-serif flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Session Notes</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {patient.sessionNotes.slice(0, 3).map((n: any) => (
                  <div key={n.id} className="text-xs border-b border-border/50 last:border-0 pb-3 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-foreground capitalize">{n.sessionType}</span>
                      <span className="text-muted-foreground">{n.date}</span>
                    </div>
                    <p className="text-muted-foreground">{n.summary}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
