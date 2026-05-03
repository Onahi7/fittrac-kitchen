import { useEffect, useState } from "react";
import { useAdminFetch } from "@/contexts/AuthContext";

interface ContentItem {
  id: string;
  title: string;
  body: string;
  type: "food_fact" | "health_tip" | "meal_spotlight" | "wellness_guide" | "nigerian_herb";
  imageUrl: string;
  active: boolean;
}

const TYPES = ["food_fact", "health_tip", "meal_spotlight", "wellness_guide", "nigerian_herb"] as const;

const TYPE_META: Record<string, { label: string; emoji: string; color: string }> = {
  food_fact: { label: "Food Fact", emoji: "🥗", color: "bg-green-100 text-green-700" },
  health_tip: { label: "Health Tip", emoji: "💚", color: "bg-emerald-100 text-emerald-700" },
  meal_spotlight: { label: "Meal Spotlight", emoji: "⭐", color: "bg-amber-100 text-amber-700" },
  wellness_guide: { label: "Wellness Guide", emoji: "📖", color: "bg-blue-100 text-blue-700" },
  nigerian_herb: { label: "Nigerian Herb", emoji: "🌿", color: "bg-teal-100 text-teal-700" },
};

const EMPTY: Omit<ContentItem, "id"> = { title: "", body: "", type: "food_fact", imageUrl: "", active: true };

export default function Content() {
  const apiFetch = useAdminFetch();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/admin/content")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const persist = async (updated: ContentItem[]) => {
    setSaving(true); setSaved(false);
    try {
      await apiFetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: updated }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const handleSaveEdit = () => {
    if (!editing || !editing.title.trim()) return;
    let updated: ContentItem[];
    if (isNew) {
      updated = [{ ...editing, id: `c-${Date.now()}` }, ...items];
    } else {
      updated = items.map((i) => (i.id === editing.id ? editing : i));
    }
    setItems(updated);
    persist(updated);
    setEditing(null);
    setIsNew(false);
  };

  const handleDelete = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    persist(updated);
  };

  const handleToggleActive = (id: string) => {
    const updated = items.map((i) => (i.id === id ? { ...i, active: !i.active } : i));
    setItems(updated);
    persist(updated);
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);
  const activeCount = items.filter((i) => i.active).length;

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        Loading content library...
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-6 h-full overflow-y-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Health Content</h1>
          <p className="text-muted-foreground mt-1">{activeCount} active articles · Food facts, health tips & wellness guides shown in the app</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
          {saving && <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />}
          <button
            onClick={() => { setEditing({ ...EMPTY, id: "" }); setIsNew(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            <span>＋</span> Add Content
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === "all" ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:border-primary/40"}`}
        >All ({items.length})</button>
        {TYPES.map((t) => {
          const meta = TYPE_META[t];
          const count = items.filter((i) => i.type === t).length;
          return (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${filter === t ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:border-primary/40"}`}
            >
              <span>{meta.emoji}</span>{meta.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid gap-4">
        {filtered.map((item) => {
          const meta = TYPE_META[item.type];
          const expanded = expandedId === item.id;
          return (
            <div key={item.id} className={`bg-card rounded-2xl border transition-all ${item.active ? "border-border" : "border-border/40 opacity-60"}`}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${meta.color}`}>{meta.emoji} {meta.label}</span>
                      {!item.active && <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">Hidden</span>}
                    </div>
                    <h3 className="font-semibold text-foreground text-base">{item.title}</h3>
                    <p className={`text-muted-foreground text-sm mt-1.5 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>{item.body}</p>
                    {item.body.length > 120 && (
                      <button onClick={() => setExpandedId(expanded ? null : item.id)}
                        className="text-xs text-primary mt-1 hover:underline"
                      >{expanded ? "Show less" : "Read more"}</button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleToggleActive(item.id)}
                      title={item.active ? "Hide" : "Show"}
                      className={`p-2 rounded-lg transition-all text-sm ${item.active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"}`}
                    >{item.active ? "👁" : "🙈"}</button>
                    <button onClick={() => { setEditing({ ...item }); setIsNew(false); }}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                    >✏️</button>
                    <button onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all"
                    >🗑</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">📚</div>
            <div className="font-medium">No content in this category</div>
            <div className="text-sm mt-1">Add your first article using the button above</div>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl w-full max-w-xl shadow-2xl border border-border p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground">{isNew ? "Add Content" : "Edit Content"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Title *</label>
                <input type="text" value={editing.title} onChange={(e) => setEditing((i) => i ? { ...i, title: e.target.value } : i)}
                  placeholder="e.g. Why Moringa is Called the Miracle Tree"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Content *</label>
                <textarea value={editing.body} onChange={(e) => setEditing((i) => i ? { ...i, body: e.target.value } : i)}
                  rows={5} placeholder="Write the health content here..."
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
                <select value={editing.type} onChange={(e) => setEditing((i) => i ? { ...i, type: e.target.value as ContentItem["type"] } : i)}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {TYPES.map((t) => <option key={t} value={t}>{TYPE_META[t].emoji} {TYPE_META[t].label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Image URL (optional)</label>
                <input type="url" value={editing.imageUrl} onChange={(e) => setEditing((i) => i ? { ...i, imageUrl: e.target.value } : i)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editing.active} onChange={(e) => setEditing((i) => i ? { ...i, active: e.target.checked } : i)} className="rounded" />
                <span className="text-sm text-foreground">Active (visible in app)</span>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setEditing(null); setIsNew(false); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted/50 transition-all"
              >Cancel</button>
              <button onClick={handleSaveEdit} disabled={!editing.title.trim() || !editing.body.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
              >Save Content</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
