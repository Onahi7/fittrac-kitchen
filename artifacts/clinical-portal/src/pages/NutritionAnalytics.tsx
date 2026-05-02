import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Users, Target, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

function AdherenceGauge({ score }: { score: number }) {
  const r = 56;
  const circ = Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-20 overflow-hidden">
        <svg className="w-36 h-36 -translate-y-[72px]" viewBox="0 0 144 144">
          <circle cx="72" cy="72" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={0} strokeLinecap="round" transform="rotate(180, 72, 72)" />
          <circle cx="72" cy="72" r={r} fill="none" stroke={color} strokeWidth="12" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(180, 72, 72)" className="transition-all duration-700" />
        </svg>
      </div>
      <div className="text-4xl font-bold font-serif mt-1" style={{ color }}>{score}%</div>
      <div className="text-xs text-muted-foreground mt-1">Average Adherence</div>
    </div>
  );
}

export default function NutritionAnalytics() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["nutrition-analytics"],
    queryFn: () => fetchWithAuth("/api/clinical-staff/nutrition-analytics"),
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  const conditionColors: Record<string, string> = {
    Diabetes: "#d97706",
    Hypertension: "#dc2626",
    "Weight Loss": "#16a34a",
    Liver: "#ea580c",
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Nutrition Analytics</h1>
        <p className="text-muted-foreground mt-1">Performance overview across your client panel</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Avg Adherence", value: `${data?.averageAdherence ?? 0}%`, icon: Activity, color: "text-primary" },
          { label: "High Adherence", value: data?.macroTargetAvg?.calories ?? 0, icon: TrendingUp, color: "text-green-600", sub: "kcal avg target" },
          { label: "Protein Target", value: `${data?.macroTargetAvg?.protein ?? 0}g`, icon: Target, color: "text-blue-600", sub: "avg across plans" },
          { label: "Total Conditions", value: (data?.conditionBreakdown ?? []).reduce((s: number, c: any) => s + c.count, 0), icon: Users, color: "text-secondary" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-full bg-muted flex items-center justify-center", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold font-serif text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
                {stat.sub && <div className="text-xs text-muted-foreground/70">{stat.sub}</div>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="flex flex-col items-center justify-center py-8">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-base font-serif">Average Adherence</CardTitle>
          </CardHeader>
          <CardContent>
            <AdherenceGauge score={data?.averageAdherence ?? 0} />
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-serif">Weekly Adherence Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data?.weeklyAdherenceTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }} />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", r: 4 }} name="Adherence %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-serif">Adherence by Condition</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.adherenceByCondition ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="condition" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={90} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }} formatter={(v) => [`${v}%`, "Adherence"]} />
                <Bar dataKey="adherence" radius={[0, 4, 4, 0]}>
                  {(data?.adherenceByCondition ?? []).map((entry: any) => (
                    <Cell key={entry.condition} fill={conditionColors[entry.condition] ?? "hsl(var(--primary))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-serif">Client Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.conditionBreakdown ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="condition" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Clients">
                  {(data?.conditionBreakdown ?? []).map((entry: any) => (
                    <Cell key={entry.condition} fill={conditionColors[entry.condition] ?? "hsl(var(--primary))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-serif">Average Macro Targets Across Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Calories", value: `${data?.macroTargetAvg?.calories ?? 0} kcal`, color: "bg-primary/10 text-primary" },
              { label: "Protein", value: `${data?.macroTargetAvg?.protein ?? 0}g`, color: "bg-blue-100 text-blue-700" },
              { label: "Carbohydrates", value: `${data?.macroTargetAvg?.carbs ?? 0}g`, color: "bg-amber-100 text-amber-700" },
              { label: "Fat", value: `${data?.macroTargetAvg?.fat ?? 0}g`, color: "bg-orange-100 text-orange-700" },
            ].map((m) => (
              <div key={m.label} className={cn("rounded-xl p-5 text-center", m.color)}>
                <div className="text-2xl font-bold font-serif">{m.value}</div>
                <div className="text-xs opacity-80 mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
