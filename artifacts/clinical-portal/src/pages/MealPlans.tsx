import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Salad, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

function AdherenceRing({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
        <circle cx="36" cy="36" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className={cn("absolute text-xs font-bold", score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-600")}>
        {score}%
      </span>
    </div>
  );
}

export default function MealPlans() {
  const { data: plans, isLoading } = useQuery<any[]>({
    queryKey: ["meal-plans"],
    queryFn: () => fetchWithAuth("/api/clinical-staff/meal-plans").then((d) => d.mealPlans ?? []),
  });

  const active = (plans ?? []).filter(p => p.status === "active");
  const avgAdherence = active.length ? Math.round(active.reduce((s, p) => s + p.adherenceScore, 0) / active.length) : 0;

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 overflow-y-auto">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Meal Plans</h1>
        <p className="text-muted-foreground mt-1">{active.length} active plans across your clients</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Plans", value: active.length, icon: Salad, color: "text-primary" },
          { label: "Avg Adherence", value: `${avgAdherence}%`, icon: TrendingUp, color: avgAdherence >= 80 ? "text-green-600" : avgAdherence >= 60 ? "text-amber-600" : "text-red-600" },
          { label: "Need Attention", value: active.filter(p => p.adherenceScore < 60).length, icon: Target, color: "text-red-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-full bg-muted flex items-center justify-center", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold font-serif text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {active.filter(p => p.adherenceScore < 60).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-red-600 mb-3">Needs Attention — Low Adherence</h2>
          <div className="grid grid-cols-2 gap-4">
            {active.filter(p => p.adherenceScore < 60).map(plan => <PlanCard key={plan.id} plan={plan} />)}
          </div>
        </div>
      )}

      <div>
        {active.filter(p => p.adherenceScore < 60).length > 0 && (
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">All Plans</h2>
        )}
        <div className="grid grid-cols-2 gap-4">
          {active.map(plan => <PlanCard key={plan.id} plan={plan} />)}
        </div>
      </div>

      {active.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Salad className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No active meal plans</p>
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan }: { plan: any }) {
  const macros = [
    { label: "kcal", value: plan.targetCalories, color: "bg-primary/10 text-primary" },
    { label: "protein", value: `${plan.targetProtein}g`, color: "bg-blue-100 text-blue-700" },
    { label: "carbs", value: `${plan.targetCarbs}g`, color: "bg-amber-100 text-amber-700" },
    { label: "fat", value: `${plan.targetFat}g`, color: "bg-orange-100 text-orange-700" },
  ];

  return (
    <Card className={cn("border", plan.adherenceScore < 60 && "border-red-200")} data-testid={`meal-plan-${plan.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">{plan.patient?.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{plan.title}</p>
          </div>
          <AdherenceRing score={plan.adherenceScore} />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-4 gap-1.5">
          {macros.map((m) => (
            <div key={m.label} className={cn("rounded-md p-2 text-center", m.color)}>
              <div className="text-xs font-bold">{m.value}</div>
              <div className="text-xs opacity-70">{m.label}</div>
            </div>
          ))}
        </div>
        {plan.targetSodium && (
          <div className="text-xs text-muted-foreground">Sodium target: {plan.targetSodium}mg/day</div>
        )}
        <div className="text-xs text-muted-foreground">Created {plan.createdAt}</div>
      </CardContent>
    </Card>
  );
}
