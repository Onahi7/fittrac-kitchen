const CONSULTANTS = [
  { name: "Dr. Adaeze Okonkwo", type: "Nutritionist", sessions: 312, rating: 4.9, revenue: 2652000, condition: "Weight Loss, Diabetes", status: "active", emoji: "🩺" },
  { name: "Dr. Emeka Nwosu", type: "Registered Dietitian", sessions: 228, rating: 4.8, revenue: 1641600, condition: "Hypertension, Liver", status: "active", emoji: "❤️" },
  { name: "Coach Fatima Al-Rashid", type: "Health Coach", sessions: 480, rating: 4.9, revenue: 2640000, condition: "Weight Loss, Allergies", status: "active", emoji: "⚡" },
  { name: "Dr. Bola Fashola", type: "General Practitioner", sessions: 156, rating: 4.7, revenue: 1872000, condition: "Liver, Hypertension, Diabetes", status: "active", emoji: "🌿" },
];

const UPCOMING = [
  { id: "CON-1042", patient: "A.O.", specialist: "Dr. Adaeze Okonkwo", date: "Today", time: "2:00 PM", type: "Nutritionist", price: 8500 },
  { id: "CON-1041", patient: "E.N.", specialist: "Coach Fatima Al-Rashid", date: "Today", time: "4:00 PM", type: "Health Coach", price: 5500 },
  { id: "CON-1040", patient: "B.F.", specialist: "Dr. Emeka Nwosu", date: "Tomorrow", time: "10:00 AM", type: "Dietitian", price: 7200 },
  { id: "CON-1039", patient: "C.U.", specialist: "Dr. Bola Fashola", date: "Friday", time: "11:00 AM", type: "GP", price: 12000 },
];

export default function Wellness() {
  const totalRevenue = CONSULTANTS.reduce((s, c) => s + c.revenue, 0);
  const totalSessions = CONSULTANTS.reduce((s, c) => s + c.sessions, 0);
  const avgRating = (CONSULTANTS.reduce((s, c) => s + c.rating, 0) / CONSULTANTS.length).toFixed(1);

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Wellness</h1>
        <p className="text-muted-foreground mt-1">Telemedicine consultations and specialist management</p>
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

      <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Specialist Team</h2>
        </div>
        <div className="divide-y divide-border">
          {CONSULTANTS.map((c) => (
            <div key={c.name} className="p-5 flex items-center gap-4 hover:bg-muted/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                {c.emoji}
              </div>
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
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Upcoming Sessions</h2>
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
              <button className="px-3 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted transition-all">
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
