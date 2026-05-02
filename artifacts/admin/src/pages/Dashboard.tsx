import { useEffect, useState } from "react";
import { useAdminFetch } from "@/contexts/AuthContext";

interface Stats {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  totalMeals: number;
  conditionBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  topMeal: string;
  avgOrderValue: number;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-amber-100 text-amber-700",
  ready: "bg-green-100 text-green-700",
  delivered: "bg-gray-100 text-gray-600",
};

const CONDITION_COLORS: Record<string, string> = {
  hypertension: "#BA1A1A",
  diabetes: "#8B500A",
  weightloss: "#154212",
  liver: "#493700",
};

export default function Dashboard() {
  const apiFetch = useAdminFetch();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-muted-foreground animate-pulse text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const statCards = [
    { label: "Today's Orders", value: stats?.todayOrders ?? 0, icon: "📦", sub: "vs 5 yesterday", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Today's Revenue", value: `₦${((stats?.todayRevenue ?? 0) / 1000).toFixed(1)}k`, icon: "💰", sub: "+12% from yesterday", color: "text-green-700", bg: "bg-green-50" },
    { label: "Total Orders", value: stats?.totalOrders ?? 0, icon: "🗂️", sub: "All time", color: "text-primary", bg: "bg-primary/10" },
    { label: "Avg Order Value", value: `₦${((stats?.avgOrderValue ?? 0) / 1000).toFixed(1)}k`, icon: "📊", sub: "Per transaction", color: "text-secondary", bg: "bg-secondary/10" },
  ];

  const conditions = Object.entries(stats?.conditionBreakdown ?? {});
  const totalConditions = conditions.reduce((s, [, v]) => s + v, 0);

  const statuses = Object.entries(stats?.statusBreakdown ?? {});

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-card rounded-2xl p-5 border border-border shadow-xs">
            <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center text-xl mb-3`}>
              {card.icon}
            </div>
            <div className={`text-3xl font-bold ${card.color} mb-1`}>{card.value}</div>
            <div className="text-sm font-medium text-foreground">{card.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 border border-border shadow-xs">
          <h2 className="text-lg font-bold text-foreground mb-4">Orders by Condition</h2>
          <div className="space-y-3">
            {conditions.map(([cond, count]) => {
              const pct = totalConditions > 0 ? Math.round((count / totalConditions) * 100) : 0;
              const color = CONDITION_COLORS[cond] ?? "#154212";
              return (
                <div key={cond} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize text-foreground">{cond === "weightloss" ? "Weight Loss" : cond}</span>
                    <span className="text-sm text-muted-foreground">{count} orders · {pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-xs">
          <h2 className="text-lg font-bold text-foreground mb-4">Order Status Pipeline</h2>
          <div className="grid grid-cols-2 gap-3">
            {statuses.map(([status, count]) => (
              <div key={status} className={`rounded-xl p-4 ${STATUS_COLORS[status] ?? "bg-muted text-muted-foreground"}`}>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm font-medium capitalize">{status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-card rounded-2xl p-6 border border-border shadow-xs">
          <h2 className="text-lg font-bold text-foreground mb-4">Weekly Order Volume</h2>
          <div className="flex items-end gap-2 h-32">
            {[12, 18, 15, 22, 19, 25, 17].map((v, i) => {
              const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
              const maxV = 25;
              const isToday = i === 4;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className="w-full rounded-t-lg transition-all"
                      style={{
                        height: `${(v / maxV) * 100}%`,
                        backgroundColor: isToday ? "#154212" : "#A5C9A1",
                      }}
                    />
                  </div>
                  <span className={`text-xs ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>{days[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-xs">
          <h2 className="text-lg font-bold text-foreground mb-4">Quick Stats</h2>
          <div className="space-y-4">
            {[
              { label: "Total Meals on Menu", value: stats?.totalMeals ?? 0, emoji: "🥘" },
              { label: "Top Selling Meal", value: stats?.topMeal ?? "—", emoji: "🏆", small: true },
              { label: "Active Regions", value: "7 (Mon–Sun)", emoji: "🗺️", small: true },
              { label: "Health Conditions Served", value: "5", emoji: "❤️" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm">{item.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className={`font-semibold text-foreground truncate ${item.small ? "text-sm" : "text-base"}`}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
