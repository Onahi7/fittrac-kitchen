import { useEffect, useState } from "react";
import { useAdminFetch } from "@/contexts/AuthContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "announcement" | "health_tip" | "promotional" | "alert";
  audience: string;
  sentAt: string;
}

const TYPE_META: Record<string, { label: string; emoji: string; color: string }> = {
  announcement: { label: "Announcement", emoji: "📢", color: "bg-blue-100 text-blue-700" },
  health_tip: { label: "Health Tip", emoji: "💚", color: "bg-green-100 text-green-700" },
  promotional: { label: "Promotional", emoji: "🎁", color: "bg-purple-100 text-purple-700" },
  alert: { label: "Alert", emoji: "⚠️", color: "bg-red-100 text-red-700" },
};

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All Users" },
  { value: "diabetes", label: "Diabetes Patients" },
  { value: "hypertension", label: "Hypertension Patients" },
  { value: "weight_loss", label: "Weight Loss Users" },
  { value: "liver", label: "Liver Health Patients" },
  { value: "new", label: "New Users (< 7 days)" },
];

const TEMPLATES = [
  { title: "New Menu Drop 🍛", message: "Fresh additions to this week's menu! Check out our new Jollof Fonio and Moringa Smoothie Bowl — both diabetes-friendly and absolutely delicious.", type: "promotional" },
  { title: "Health Tip of the Day 💚", message: "Did you know? Drinking a glass of water 30 minutes before each meal can help control portion sizes and improve digestion. Stay hydrated with Fittrac!", type: "health_tip" },
  { title: "Free Delivery Weekend 🚀", message: "Enjoy free delivery on all orders above ₦4,000 this weekend only. Order your favourite Nigerian wellness meals now!", type: "promotional" },
  { title: "Consultation Reminder 🩺", message: "Your health matters. Book a telemedicine session with our doctors and nutritionists today. Available 7 days a week.", type: "announcement" },
  { title: "Blood Sugar Management Alert ⚠️", message: "Reminder for diabetic users: Please log your meals consistently and avoid high-GI foods like white rice and garri. Fonio and Ofada rice are better options.", type: "alert" },
];

const EMPTY = { title: "", message: "", type: "announcement" as const, audience: "all" };

export default function Notifications() {
  const apiFetch = useAdminFetch();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    apiFetch("/api/admin/notifications")
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) return;
    setSending(true);
    try {
      const res = await apiFetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const notif = await res.json();
      setNotifications((prev) => [notif, ...prev]);
      setForm({ ...EMPTY });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/api/admin/notifications/${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleTemplate = (t: typeof TEMPLATES[0]) => {
    setForm((f) => ({ ...f, title: t.title, message: t.message, type: t.type as typeof form.type }));
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        Loading notifications...
      </div>
    </div>
  );

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">Send announcements, health tips, and alerts to app users</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-bold text-foreground text-lg">Compose Notification</h2>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(TYPE_META) as [string, typeof TYPE_META[string]][]).map(([k, v]) => (
                    <button key={k} onClick={() => setForm((f) => ({ ...f, type: k as typeof form.type }))}
                      className={`px-3 py-2 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${
                        form.type === k ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <span>{v.emoji}</span>{v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Audience</label>
                <select value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {AUDIENCE_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. New Menu Drop 🍛"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Message *</label>
                <textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={4} placeholder="Write your message to users..."
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <button onClick={handleSend} disabled={sending || !form.title.trim() || !form.message.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {sending ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending…</>
                ) : sent ? (
                  <><span>✓</span> Sent!</>
                ) : (
                  <><span>📤</span> Send Notification</>
                )}
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="font-bold text-foreground">Quick Templates</h2>
              {TEMPLATES.map((t, i) => {
                const meta = TYPE_META[t.type];
                return (
                  <button key={i} onClick={() => handleTemplate(t)}
                    className="w-full text-left bg-card rounded-xl border border-border p-3.5 hover:border-primary/40 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0">{meta.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">{t.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.message}</div>
                      </div>
                      <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">Use →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-bold text-foreground text-lg">Sent Notifications ({notifications.length})</h2>
            {notifications.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground bg-card rounded-2xl border border-border">
                <div className="text-4xl mb-3">🔔</div>
                <div className="font-medium">No notifications sent yet</div>
                <div className="text-sm mt-1">Send your first notification using the form</div>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => {
                  const meta = TYPE_META[n.type] ?? TYPE_META.announcement;
                  const sentDate = new Date(n.sentAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
                  const audienceLabel = AUDIENCE_OPTIONS.find((a) => a.value === n.audience)?.label ?? n.audience;
                  return (
                    <div key={n.id} className="bg-card rounded-2xl border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>{meta.emoji} {meta.label}</span>
                            <span className="text-xs text-muted-foreground">→ {audienceLabel}</span>
                          </div>
                          <div className="font-semibold text-foreground text-sm">{n.title}</div>
                          <p className="text-muted-foreground text-xs mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                          <div className="text-xs text-muted-foreground/60 mt-2">{sentDate}</div>
                        </div>
                        <button onClick={() => handleDelete(n.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all flex-shrink-0"
                        >🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
