import { useEffect, useState } from "react";
import { useAdminFetch } from "@/contexts/AuthContext";

interface Quote {
  id: string;
  text: string;
  author: string;
  category: "health" | "wellness" | "nutrition" | "motivation" | "culture";
  active: boolean;
  daily: boolean;
}

const CATEGORIES = ["health", "wellness", "nutrition", "motivation", "culture"] as const;
const CAT_COLORS: Record<string, string> = {
  health: "bg-red-100 text-red-700",
  wellness: "bg-green-100 text-green-700",
  nutrition: "bg-orange-100 text-orange-700",
  motivation: "bg-blue-100 text-blue-700",
  culture: "bg-purple-100 text-purple-700",
};

const EMPTY_QUOTE: Omit<Quote, "id"> = { text: "", author: "", category: "wellness", active: true, daily: false };

export default function Quotes() {
  const apiFetch = useAdminFetch();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<Quote | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    apiFetch("/api/admin/quotes")
      .then((r) => r.json())
      .then((d) => setQuotes(d.quotes ?? []))
      .finally(() => setLoading(false));
  }, []);

  const save = async (updated: Quote[]) => {
    setSaving(true);
    setSaved(false);
    try {
      await apiFetch("/api/admin/quotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotes: updated }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = () => {
    if (!editing || !editing.text.trim()) return;
    let updated: Quote[];
    if (isNew) {
      const newQ = { ...editing, id: `q-${Date.now()}` };
      updated = [newQ, ...quotes];
    } else {
      updated = quotes.map((q) => (q.id === editing.id ? editing : q));
    }
    setQuotes(updated);
    save(updated);
    setEditing(null);
    setIsNew(false);
  };

  const handleDelete = (id: string) => {
    const updated = quotes.filter((q) => q.id !== id);
    setQuotes(updated);
    save(updated);
  };

  const handleSetDaily = (id: string) => {
    const updated = quotes.map((q) => ({ ...q, daily: q.id === id }));
    setQuotes(updated);
    save(updated);
  };

  const handleToggleActive = (id: string) => {
    const updated = quotes.map((q) => (q.id === id ? { ...q, active: !q.active } : q));
    setQuotes(updated);
    save(updated);
  };

  const filtered = filter === "all" ? quotes : quotes.filter((q) => q.category === filter);
  const dailyQuote = quotes.find((q) => q.daily && q.active);

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        Loading quotes...
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-6 h-full overflow-y-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quotes</h1>
          <p className="text-muted-foreground mt-1">Manage health & motivation quotes shown in the mobile app</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
          {saving && <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />}
          <button
            onClick={() => { setEditing({ ...EMPTY_QUOTE, id: "" }); setIsNew(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            <span>＋</span> Add Quote
          </button>
        </div>
      </div>

      {dailyQuote && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">☀️</span>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Today's Daily Quote</span>
          </div>
          <p className="text-foreground font-medium text-lg leading-relaxed italic">"{dailyQuote.text}"</p>
          <p className="text-muted-foreground text-sm mt-2">— {dailyQuote.author}</p>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {["all", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
              filter === cat ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {cat === "all" ? `All (${quotes.length})` : `${cat} (${quotes.filter((q) => q.category === cat).length})`}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filtered.map((q) => (
          <div key={q.id} className={`bg-card rounded-2xl p-5 border transition-all ${q.active ? "border-border" : "border-border/40 opacity-60"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${CAT_COLORS[q.category]}`}>{q.category}</span>
                  {q.daily && q.active && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">☀️ Daily</span>
                  )}
                  {!q.active && <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">Hidden</span>}
                </div>
                <p className="text-foreground font-medium leading-relaxed italic text-sm">"{q.text}"</p>
                <p className="text-muted-foreground text-xs mt-1.5">— {q.author}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!q.daily && q.active && (
                  <button
                    onClick={() => handleSetDaily(q.id)}
                    title="Set as daily quote"
                    className="p-2 rounded-lg text-muted-foreground hover:bg-amber-50 hover:text-amber-600 transition-all text-sm"
                  >☀️</button>
                )}
                <button
                  onClick={() => handleToggleActive(q.id)}
                  title={q.active ? "Hide quote" : "Show quote"}
                  className={`p-2 rounded-lg transition-all text-sm ${q.active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"}`}
                >
                  {q.active ? "👁" : "🙈"}
                </button>
                <button
                  onClick={() => { setEditing({ ...q }); setIsNew(false); }}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                >✏️</button>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all"
                >🗑</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">💬</div>
            <div className="font-medium">No quotes in this category</div>
            <div className="text-sm mt-1">Add your first quote using the button above</div>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl w-full max-w-lg shadow-2xl border border-border p-6 space-y-5">
            <h2 className="text-xl font-bold text-foreground">{isNew ? "Add Quote" : "Edit Quote"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Quote Text *</label>
                <textarea
                  value={editing.text}
                  onChange={(e) => setEditing((q) => q ? { ...q, text: e.target.value } : q)}
                  rows={3}
                  placeholder="Enter the quote..."
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Author</label>
                <input
                  type="text"
                  value={editing.author}
                  onChange={(e) => setEditing((q) => q ? { ...q, author: e.target.value } : q)}
                  placeholder="e.g. Hippocrates"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
                <select
                  value={editing.category}
                  onChange={(e) => setEditing((q) => q ? { ...q, category: e.target.value as Quote["category"] } : q)}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editing.active} onChange={(e) => setEditing((q) => q ? { ...q, active: e.target.checked } : q)} className="rounded" />
                  <span className="text-sm text-foreground">Active (visible in app)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editing.daily} onChange={(e) => setEditing((q) => q ? { ...q, daily: e.target.checked } : q)} className="rounded" />
                  <span className="text-sm text-foreground">Set as Daily Quote</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setEditing(null); setIsNew(false); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted/50 transition-all"
              >Cancel</button>
              <button
                onClick={handleSaveEdit}
                disabled={!editing.text.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
              >Save Quote</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
