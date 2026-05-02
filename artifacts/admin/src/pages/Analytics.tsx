import { useEffect, useState } from "react";
import { useAdminFetch } from "@/contexts/AuthContext";

interface Analytics {
  weeklyOrders: number[];
  weeklyRevenue: number[];
  conditionTrend: { condition: string; count: number; pct: number }[];
  topMeals: { name: string; orders: number; revenue: number }[];
}

const CONDITION_COLORS: Record<string, string> = {
  Hypertension: "#BA1A1A",
  "Weight Loss": "#154212",
  Diabetes: "#8B500A",
  "Liver Health": "#493700",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Analytics() {
  const apiFetch = useAdminFetch();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 flex items-center justify-center h-full text-muted-foreground animate-pulse text-lg">Loading analytics...</div>;
  if (!data) return null;

  const maxOrders = Math.max(...data.weeklyOrders);
  const maxRevenue = Math.max(...data.weeklyRevenue);

  const totalWeekRevenue = data.weeklyRevenue.reduce((s, v) => s + v, 0);
  const totalWeekOrders = data.weeklyOrders.reduce((s, v) => s + v, 0);

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Weekly performance overview · May 2026</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Week Total Orders", value: totalWeekOrders, icon: "📦", color: "text-primary" },
          { label: "Week Revenue", value: `₦${(totalWeekRevenue / 1000).toFixed(0)}k`, icon: "💰", color: "text-green-700" },
          { label: "Avg Orders/Day", value: Math.round(totalWeekOrders / 7), icon: "📊", color: "text-secondary" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-5 border border-border shadow-xs">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 border border-border shadow-xs">
          <h2 className="text-lg font-bold text-foreground mb-1">Daily Orders</h2>
          <p className="text-sm text-muted-foreground mb-4">Orders placed per day this week</p>
          <div className="flex items-end gap-2 h-40">
            {data.weeklyOrders.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full text-center text-xs font-semibold text-primary" style={{ opacity: v === maxOrders ? 1 : 0.4 }}>
                  {v === maxOrders ? "↑" : ""}
                </div>
                <div className="flex-1 w-full flex items-end">
                  <div
                    className="w-full rounded-t-lg transition-all relative group"
                    style={{ height: `${(v / maxOrders) * 100}%`, backgroundColor: i === 4 ? "#154212" : "#A5C9A1" }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {v} orders
                    </div>
                  </div>
                </div>
                <span className={`text-xs ${i === 4 ? "text-primary font-bold" : "text-muted-foreground"}`}>{DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-xs">
          <h2 className="text-lg font-bold text-foreground mb-1">Daily Revenue</h2>
          <p className="text-sm text-muted-foreground mb-4">Revenue (₦) per day this week</p>
          <div className="flex items-end gap-2 h-40">
            {data.weeklyRevenue.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="flex-1 w-full flex items-end">
                  <div
                    className="w-full rounded-t-lg transition-all relative group"
                    style={{ height: `${(v / maxRevenue) * 100}%`, backgroundColor: i === 5 ? "#8B500A" : "#FFB065" }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      ₦{(v / 1000).toFixed(0)}k
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 border border-border shadow-xs">
          <h2 className="text-lg font-bold text-foreground mb-4">Health Condition Breakdown</h2>
          <div className="space-y-4">
            {data.conditionTrend.map((ct) => (
              <div key={ct.condition} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">{ct.condition}</span>
                  <span className="text-sm text-muted-foreground">{ct.count} users · {ct.pct}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${ct.pct}%`, backgroundColor: CONDITION_COLORS[ct.condition] ?? "#154212" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-xs">
          <h2 className="text-lg font-bold text-foreground mb-4">Top Performing Meals</h2>
          <div className="space-y-3">
            {data.topMeals.map((meal, i) => (
              <div key={meal.name} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{meal.name}</div>
                  <div className="text-xs text-muted-foreground">{meal.orders} orders</div>
                </div>
                <div className="text-sm font-bold text-primary">₦{(meal.revenue / 1000).toFixed(0)}k</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
