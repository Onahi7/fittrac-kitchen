import { useRider } from "@/contexts/RiderContext";

const HISTORY = [
  { date: "Today", deliveries: 5, earnings: 4750, distance: "22 km" },
  { date: "Yesterday", deliveries: 8, earnings: 7200, distance: "38 km" },
  { date: "Tuesday", deliveries: 6, earnings: 5400, distance: "29 km" },
  { date: "Monday", deliveries: 7, earnings: 6800, distance: "33 km" },
  { date: "Sunday", deliveries: 4, earnings: 3200, distance: "18 km" },
  { date: "Saturday", deliveries: 9, earnings: 8800, distance: "42 km" },
  { date: "Friday", deliveries: 11, earnings: 9500, distance: "51 km" },
];

export default function Earnings() {
  const { todayEarnings, todayDeliveries } = useRider();

  const weekTotal = HISTORY.reduce((s, d) => s + d.earnings, 0) + todayEarnings - 4750;
  const monthTotal = weekTotal * 4.2;

  // Update today's row
  const rows = HISTORY.map((r, i) => i === 0 ? { ...r, earnings: todayEarnings, deliveries: todayDeliveries } : r);

  const maxEarnings = Math.max(...rows.map((r) => r.earnings));

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary px-5 pt-12 pb-6 text-white">
        <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Earnings</div>
        <div className="text-3xl font-bold">₦{(weekTotal + todayEarnings - 4750).toLocaleString()}</div>
        <div className="text-white/60 text-sm">This week</div>
      </div>

      <div className="p-5 space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Today", value: `₦${todayEarnings.toLocaleString()}`, sub: `${todayDeliveries} deliveries`, icon: "☀️" },
            { label: "This Month", value: `₦${Math.round(monthTotal).toLocaleString()}`, sub: "est.", icon: "📅" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="font-bold text-foreground text-lg">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
              <div className="text-xs font-medium text-primary mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Weekly chart */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="font-bold text-foreground mb-4">7-Day Overview</div>
          <div className="flex items-end gap-2 h-24">
            {rows.reverse().map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-lg bg-primary/80"
                  style={{ height: `${(day.earnings / maxEarnings) * 88}px`, minHeight: 4 }}
                />
                <div className="text-[9px] text-muted-foreground text-center leading-tight">
                  {day.date === "Today" ? "Today" : day.date.slice(0, 3)}
                </div>
              </div>
            )).reverse()}
          </div>
        </div>

        {/* Daily breakdown */}
        <div className="space-y-2">
          <div className="font-bold text-foreground">Daily Breakdown</div>
          {rows.map((day) => (
            <div key={day.date} className="bg-card rounded-xl border border-border px-4 py-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-foreground text-sm">{day.date}</div>
                <div className="text-xs text-muted-foreground">{day.deliveries} deliveries · {day.distance}</div>
              </div>
              <div className="font-bold text-primary">₦{day.earnings.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Payment info */}
        <div className="bg-accent/40 rounded-2xl p-4">
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">💳 Payment Schedule</div>
          <div className="text-sm text-muted-foreground space-y-1.5">
            <div className="flex justify-between">
              <span>Weekly payout</span><span className="font-semibold text-foreground">Every Friday</span>
            </div>
            <div className="flex justify-between">
              <span>Transfer method</span><span className="font-semibold text-foreground">Bank Transfer</span>
            </div>
            <div className="flex justify-between">
              <span>Next payout</span><span className="font-semibold text-primary">Friday, May 9</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
