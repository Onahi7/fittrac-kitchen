import { useEffect, useState } from "react";
import { useAdminFetch } from "@/contexts/AuthContext";

interface FeaturedPost {
  id: string;
  author: string;
  conditionTag: string;
  content: string;
  type: "milestone" | "insight" | "question" | "meal" | "announcement";
  active: boolean;
  pinned: boolean;
  createdAt: string;
}

const TYPE_META: Record<string, { label: string; emoji: string; color: string }> = {
  milestone: { label: "Milestone", emoji: "🏆", color: "bg-green-100 text-green-700" },
  insight: { label: "Insight", emoji: "💡", color: "bg-amber-100 text-amber-700" },
  question: { label: "Question", emoji: "❓", color: "bg-blue-100 text-blue-700" },
  meal: { label: "Meal Story", emoji: "🍛", color: "bg-purple-100 text-purple-700" },
  announcement: { label: "Announcement", emoji: "📢", color: "bg-red-100 text-red-700" },
};

const CONDITION_TAGS = ["Diabetes", "Hypertension", "Weight Loss", "Liver Health", "Allergies", "Wellness", "General"];

const EMPTY: Omit<FeaturedPost, "id"> = {
  author: "Fittrac Kitchen",
  conditionTag: "Wellness",
  content: "",
  type: "announcement",
  active: true,
  pinned: true,
  createdAt: new Date().toISOString(),
};

export default function Community() {
  const apiFetch = useAdminFetch();
  const [posts, setPosts] = useState<FeaturedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [composing, setComposing] = useState(false);
  const [newPost, setNewPost] = useState<Omit<FeaturedPost, "id">>({ ...EMPTY });

  useEffect(() => {
    apiFetch("/api/admin/community-posts")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .finally(() => setLoading(false));
  }, []);

  const persist = async (updated: FeaturedPost[]) => {
    setSaving(true); setSaved(false);
    try {
      await apiFetch("/api/admin/community-posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts: updated }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const handlePublish = () => {
    if (!newPost.content.trim()) return;
    const post: FeaturedPost = { ...newPost, id: `fp-${Date.now()}`, createdAt: new Date().toISOString() };
    const updated = [post, ...posts];
    setPosts(updated);
    persist(updated);
    setComposing(false);
    setNewPost({ ...EMPTY });
  };

  const handleToggleActive = (id: string) => {
    const updated = posts.map((p) => (p.id === id ? { ...p, active: !p.active } : p));
    setPosts(updated);
    persist(updated);
  };

  const handleDelete = (id: string) => {
    const updated = posts.filter((p) => p.id !== id);
    setPosts(updated);
    persist(updated);
  };

  const handleTogglePin = (id: string) => {
    const updated = posts.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p));
    setPosts(updated);
    persist(updated);
  };

  const activeCount = posts.filter((p) => p.active).length;

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        Loading community...
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-6 h-full overflow-y-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Community</h1>
          <p className="text-muted-foreground mt-1">{activeCount} pinned posts · Official announcements and featured content in the community feed</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
          {saving && <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />}
          <button
            onClick={() => setComposing(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            <span>＋</span> Post to Community
          </button>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📌</span>
          <div>
            <div className="font-semibold text-foreground">How Official Posts Work</div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Posts you create here appear as pinned "Official" posts at the top of the community feed in the mobile app.
              Use this for health announcements, wellness campaigns, featured success stories, and important notices.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {posts.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">🌍</div>
            <div className="font-medium">No official posts yet</div>
            <div className="text-sm mt-1">Create your first post to pin it in the community feed</div>
          </div>
        )}
        {posts.map((post) => {
          const meta = TYPE_META[post.type];
          const date = new Date(post.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
          return (
            <div key={post.id} className={`bg-card rounded-2xl border p-5 transition-all ${post.active ? "border-border" : "border-border/40 opacity-60"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${meta.color}`}>{meta.emoji} {meta.label}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">{post.conditionTag}</span>
                    {post.pinned && <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-primary/10 text-primary">📌 Pinned</span>}
                    {!post.active && <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">Hidden</span>}
                  </div>
                  <p className="text-foreground text-sm leading-relaxed">{post.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground font-medium">{post.author}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleTogglePin(post.id)} title={post.pinned ? "Unpin" : "Pin"}
                    className={`p-2 rounded-lg transition-all text-sm ${post.pinned ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}
                  >📌</button>
                  <button onClick={() => handleToggleActive(post.id)} title={post.active ? "Hide" : "Show"}
                    className={`p-2 rounded-lg transition-all text-sm ${post.active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"}`}
                  >{post.active ? "👁" : "🙈"}</button>
                  <button onClick={() => handleDelete(post.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all"
                  >🗑</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {composing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl w-full max-w-lg shadow-2xl border border-border p-6 space-y-5">
            <h2 className="text-xl font-bold text-foreground">Post to Community</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Content *</label>
                <textarea value={newPost.content} onChange={(e) => setNewPost((p) => ({ ...p, content: e.target.value }))}
                  rows={4} placeholder="Write your community message..."
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Post Type</label>
                  <select value={newPost.type} onChange={(e) => setNewPost((p) => ({ ...p, type: e.target.value as FeaturedPost["type"] }))}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Condition Tag</label>
                  <select value={newPost.conditionTag} onChange={(e) => setNewPost((p) => ({ ...p, conditionTag: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {CONDITION_TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Author Name</label>
                <input type="text" value={newPost.author} onChange={(e) => setNewPost((p) => ({ ...p, author: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newPost.pinned} onChange={(e) => setNewPost((p) => ({ ...p, pinned: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-foreground">📌 Pin to top of feed</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newPost.active} onChange={(e) => setNewPost((p) => ({ ...p, active: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-foreground">Publish immediately</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setComposing(false); setNewPost({ ...EMPTY }); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted/50 transition-all"
              >Cancel</button>
              <button onClick={handlePublish} disabled={!newPost.content.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
              >Publish Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
