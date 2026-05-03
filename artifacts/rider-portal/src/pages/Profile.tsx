import { useRider } from "@/contexts/RiderContext";

const VEHICLE_ICONS: Record<string, string> = { motorcycle: "🛵", bicycle: "🚲", car: "🚗" };

export default function Profile() {
  const { rider, logout, todayDeliveries, todayEarnings } = useRider();
  if (!rider) return null;

  const stats = [
    { label: "Total Deliveries", value: rider.totalDeliveries + todayDeliveries, icon: "📦" },
    { label: "Rating", value: `${rider.rating} ★`, icon: "⭐" },
    { label: "Today Earned", value: `₦${todayEarnings.toLocaleString()}`, icon: "💰" },
    { label: "Vehicle", value: rider.vehicleType.charAt(0).toUpperCase() + rider.vehicleType.slice(1), icon: VEHICLE_ICONS[rider.vehicleType] },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary px-5 pt-12 pb-8 text-white text-center">
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-4xl mx-auto mb-3">
          {VEHICLE_ICONS[rider.vehicleType]}
        </div>
        <div className="font-bold text-xl">{rider.name}</div>
        <div className="text-white/60 text-sm mt-0.5">{rider.phone}</div>
        <div className="flex items-center justify-center gap-1 mt-2">
          {"★★★★★".split("").slice(0, Math.round(rider.rating)).map((s, i) => (
            <span key={i} className="text-yellow-300">★</span>
          ))}
          <span className="text-white/60 text-sm ml-1">{rider.rating}</span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-bold text-foreground text-lg">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="font-bold text-foreground">Achievements</div>
          {[
            { icon: "🏆", label: "300+ Deliveries", desc: "Milestone delivery hero", earned: true },
            { icon: "⭐", label: "Top Rated Rider", desc: "Maintained 4.8+ rating for 3 months", earned: true },
            { icon: "🔥", label: "Speed Demon", desc: "50+ deliveries on time in a week", earned: false },
            { icon: "💚", label: "Wellness Champion", desc: "Deliver 100+ healthy meals", earned: true },
          ].map((ach) => (
            <div key={ach.label} className={`flex items-center gap-3 ${!ach.earned ? "opacity-40" : ""}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${ach.earned ? "bg-primary/10" : "bg-muted"}`}>
                {ach.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">{ach.label}</div>
                <div className="text-xs text-muted-foreground">{ach.desc}</div>
              </div>
              {ach.earned && <div className="text-primary text-sm">✓</div>}
            </div>
          ))}
        </div>

        {/* Tips and resources */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {[
            { icon: "📋", label: "Delivery Guidelines" },
            { icon: "🆘", label: "Support & Help" },
            { icon: "💬", label: "Contact Dispatcher" },
            { icon: "📊", label: "My Performance Report" },
          ].map((item, i) => (
            <button key={item.label} className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-all ${i > 0 ? "border-t border-border" : ""}`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
              <span className="text-muted-foreground">›</span>
            </button>
          ))}
        </div>

        <button onClick={logout}
          className="w-full py-3.5 rounded-2xl border-2 border-destructive text-destructive font-bold hover:bg-destructive/5 transition-all"
        >Sign Out</button>
      </div>
    </div>
  );
}
