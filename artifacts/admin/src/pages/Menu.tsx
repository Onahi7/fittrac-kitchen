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
  orders?: number;
}

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

export default function Menu() {
  const apiFetch = useAdminFetch();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/meals")
      .then((r) => r.json())
      .then(setMeals)
      .finally(() => setLoading(false));
  }, []);

  const types = ["all", "breakfast", "lunch", "dinner", "drink"];
  const filtered = meals.filter((m) => {
    const matchType = filterType === "all" || m.mealType === filterType;
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const topMeal = meals[0];
  const totalOrders = meals.reduce((s, m) => s + (m.orders ?? 0), 0);

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Menu</h1>
          <p className="text-muted-foreground mt-1">{meals.length} items · {totalOrders} total orders this week</p>
        </div>
        {topMeal && (
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-medium">
            🏆 Top: {topMeal.name}
          </div>
        )}
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
        <div className="text-center py-20 text-muted-foreground animate-pulse">Loading menu...</div>
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
                </div>
                <div className="text-right">
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

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground mr-1">Conditions:</span>
                {meal.conditions.map((c) => (
                  <span key={c} className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs" title={c}>
                    {CONDITION_EMOJI[c] ?? "✓"}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-20 text-muted-foreground">
              <div className="text-4xl mb-3">🥘</div>
              <div>No meals found</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
