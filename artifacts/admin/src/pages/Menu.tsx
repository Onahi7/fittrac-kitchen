import { useEffect, useState } from "react";
import { useAdminFetch } from "@/contexts/AuthContext";

interface Meal {
  id: string;
  name: string;
  price: number;
  calories: number;
  mealType: string;
  conditions: string[];
  glycemicIndex: string;
  sodiumLevel: string;
  description?: string;
  image?: string;
  orders?: number;
}

const BLANK: Omit<Meal, "id" | "orders"> = {
  name: "",
  price: 0,
  calories: 0,
  mealType: "lunch",
  conditions: [],
  glycemicIndex: "Low",
  sodiumLevel: "Low",
  description: "",
  image: "",
};

const MEAL_TYPE_STYLE: Record<string, string> = {
  breakfast: "bg-amber-50 text-amber-700 border-amber-200",
  lunch: "bg-green-50 text-green-700 border-green-200",
  dinner: "bg-blue-50 text-blue-700 border-blue-200",
  drink: "bg-purple-50 text-purple-700 border-purple-200",
};

const GI_STYLE: Record<string, string> = {
  Low: "text-green-700",
  Medium: "text-amber-600",
  High: "text-red-600",
};

const CONDITION_EMOJI: Record<string, string> = {
  hypertension: "❤️",
  diabetes: "🩺",
  weightloss: "⚡",
  liver: "🌿",
  allergies: "🛡️",
};

const ALL_CONDITIONS = ["hypertension", "diabetes", "weightloss", "liver", "allergies"];
const GI_OPTIONS = ["Low", "Medium", "High"];
const SODIUM_OPTIONS = ["Low", "Medium", "High"];
const TYPE_OPTIONS = ["breakfast", "lunch", "dinner", "drink"];

function MealModal({
  mode,
  meal,
  onSave,
  onClose,
  saving,
}: {
  mode: "add" | "edit";
  meal: Omit<Meal, "id" | "orders"> & { id?: string };
  onSave: (m: typeof meal) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(meal);

  const setField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleCondition = (c: string) =>
    setField(
      "conditions",
      form.conditions.includes(c)
        ? form.conditions.filter((x) => x !== c)
        : [...form.conditions, c],
    );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            {mode === "add" ? "Add Meal" : "Edit Meal"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Meal Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Jollof Rice with Grilled Chicken"
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Price (₦) *</label>
              <input
                type="number"
                value={form.price || ""}
                onChange={(e) => setField("price", Number(e.target.value))}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Calories (kcal) *</label>
              <input
                type="number"
                value={form.calories || ""}
                onChange={(e) => setField("calories", Number(e.target.value))}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Meal Type</label>
            <div className="flex gap-2 flex-wrap">
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setField("mealType", t)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all capitalize ${
                    form.mealType === t
                      ? "bg-primary text-white border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Glycemic Index</label>
              <select
                value={form.glycemicIndex}
                onChange={(e) => setField("glycemicIndex", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              >
                {GI_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Sodium Level</label>
              <select
                value={form.sodiumLevel}
                onChange={(e) => setField("sodiumLevel", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              >
                {SODIUM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Health Conditions</label>
            <div className="flex gap-2 flex-wrap">
              {ALL_CONDITIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCondition(c)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-1.5 ${
                    form.conditions.includes(c)
                      ? "bg-primary/10 text-primary border-primary/40"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  <span>{CONDITION_EMOJI[c]}</span>
                  <span className="capitalize">{c}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Description</label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Brief description of the meal..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Image URL</label>
            <input
              type="text"
              value={form.image ?? ""}
              onChange={(e) => setField("image", e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.name || !form.price || !form.calories}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : mode === "add" ? "Add Meal" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  meal,
  onConfirm,
  onClose,
  deleting,
}: {
  meal: Meal;
  onConfirm: () => void;
  onClose: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center space-y-2">
          <div className="text-4xl">🗑️</div>
          <h2 className="text-xl font-bold text-foreground">Delete Meal?</h2>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{meal.name}</strong> will be permanently removed from the menu.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Menu() {
  const apiFetch = useAdminFetch();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [editMeal, setEditMeal] = useState<Meal | null>(null);
  const [deleteMeal, setDeleteMeal] = useState<Meal | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch("/api/admin/menu-items")
      .then((r) => r.json())
      .then((data) => setMeals(Array.isArray(data) ? data : []))
      .catch(() => setMeals([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const types = ["all", "breakfast", "lunch", "dinner", "drink"];
  const filtered = meals.filter((m) => {
    const matchType = filterType === "all" || m.mealType === filterType;
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const topMeal = [...meals].sort((a, b) => (b.orders ?? 0) - (a.orders ?? 0))[0];
  const totalOrders = meals.reduce((s, m) => s + (m.orders ?? 0), 0);

  const handleAdd = async (form: Omit<Meal, "id" | "orders">) => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/admin/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowAdd(false); load(); }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (form: Partial<Meal> & { id?: string }) => {
    if (!editMeal) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/admin/menu-items/${editMeal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setEditMeal(null); load(); }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteMeal) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/admin/menu-items/${deleteMeal.id}`, { method: "DELETE" });
      if (res.ok) { setDeleteMeal(null); load(); }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full">
      {showAdd && (
        <MealModal
          mode="add"
          meal={BLANK}
          onSave={handleAdd}
          onClose={() => setShowAdd(false)}
          saving={saving}
        />
      )}
      {editMeal && (
        <MealModal
          mode="edit"
          meal={editMeal}
          onSave={handleEdit}
          onClose={() => setEditMeal(null)}
          saving={saving}
        />
      )}
      {deleteMeal && (
        <DeleteModal
          meal={deleteMeal}
          onConfirm={handleDelete}
          onClose={() => setDeleteMeal(null)}
          deleting={deleting}
        />
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Menu</h1>
          <p className="text-muted-foreground mt-1">{meals.length} items · {totalOrders} total orders this week</p>
        </div>
        <div className="flex items-center gap-3">
          {topMeal && (
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-medium">
              🏆 Top: {topMeal.name}
            </div>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Add Meal
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search meals..."
          className="px-4 py-2 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all min-w-48"
        />
        <div className="flex gap-2 flex-wrap">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all capitalize ${
                filterType === t
                  ? "bg-primary text-white border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground animate-pulse">Loading menu…</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((meal) => (
            <div key={meal.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${MEAL_TYPE_STYLE[meal.mealType] ?? "bg-muted text-muted-foreground border-border"}`}>
                      {meal.mealType}
                    </span>
                    {(meal.orders ?? 0) > 70 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        🔥 Trending
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-foreground text-base">{meal.name}</h3>
                  {meal.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{meal.description}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-primary text-lg">₦{meal.price.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{meal.calories} kcal</div>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-3 text-sm">
                <div>
                  <span className="text-muted-foreground">GI: </span>
                  <span className={`font-semibold ${GI_STYLE[meal.glycemicIndex] ?? "text-foreground"}`}>{meal.glycemicIndex}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sodium: </span>
                  <span className={`font-semibold ${GI_STYLE[meal.sodiumLevel] ?? "text-foreground"}`}>{meal.sodiumLevel}</span>
                </div>
                <div className="ml-auto">
                  <span className="text-muted-foreground">Orders: </span>
                  <span className="font-bold text-foreground">{meal.orders ?? 0}</span>
                </div>
              </div>

              <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(((meal.orders ?? 0) / 100) * 100, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-muted-foreground mr-1">Conditions:</span>
                  {meal.conditions.map((c) => (
                    <span key={c} className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs" title={c}>
                      {CONDITION_EMOJI[c] ?? "✓"}
                    </span>
                  ))}
                  {meal.conditions.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">None</span>
                  )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditMeal(meal)}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteMeal(meal)}
                    className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="col-span-2 text-center py-20 text-muted-foreground">
              <div className="text-4xl mb-3">🥘</div>
              <div className="font-medium mb-1">No meals found</div>
              <button
                onClick={() => setShowAdd(true)}
                className="mt-3 px-5 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                Add the first meal
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
