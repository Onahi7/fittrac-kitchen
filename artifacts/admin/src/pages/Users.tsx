import { useEffect, useState } from "react";
import { useAdminFetch } from "@/contexts/AuthContext";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  conditions: string[];
  allergies: string[];
  joinedAt: string;
  orderCount: number;
  totalSpent: number;
}

const CONDITION_COLORS: Record<string, string> = {
  "Hypertension": "bg-red-100 text-red-700",
  "Diabetes": "bg-orange-100 text-orange-700",
  "Weight Loss": "bg-green-100 text-green-700",
  "Liver Health": "bg-amber-100 text-amber-700",
  "Allergies": "bg-blue-100 text-blue-700",
  "Wellness": "bg-teal-100 text-teal-700",
};

function conditionColor(c: string) {
  return CONDITION_COLORS[c] ?? "bg-gray-100 text-gray-600";
}

export default function Users() {
  const apiFetch = useAdminFetch();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [condFilter, setCondFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .finally(() => setLoading(false));
  }, []);

  const allConditions = Array.from(new Set(users.flatMap((u) => u.conditions)));

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchCond = condFilter === "all" || u.conditions.includes(condFilter);
    return matchSearch && matchCond;
  });

  const totalRevenue = users.reduce((s, u) => s + u.totalSpent, 0);
  const avgOrders = users.length ? (users.reduce((s, u) => s + u.orderCount, 0) / users.length).toFixed(1) : "0";

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        Loading users...
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-6 h-full overflow-y-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground mt-1">View and manage all registered patients and app users</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: users.length, icon: "👤", color: "bg-blue-50 text-blue-700" },
          { label: "Total Revenue", value: `₦${(totalRevenue / 100).toLocaleString()}`, icon: "💰", color: "bg-green-50 text-green-700" },
          { label: "Avg Orders/User", value: avgOrders, icon: "📦", color: "bg-amber-50 text-amber-700" },
          { label: "With Conditions", value: users.filter((u) => u.conditions.length > 0).length, icon: "🩺", color: "bg-red-50 text-red-700" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl p-4 border border-border">
            <div className={`text-2xl mb-1 w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
            <div className="text-2xl font-bold text-foreground mt-2">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select value={condFilter} onChange={(e) => setCondFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Conditions</option>
          {allConditions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">👤</div>
            <div className="font-medium">{users.length === 0 ? "No users registered yet" : "No users match your search"}</div>
          </div>
        ) : filtered.map((user) => {
          const isExpanded = expanded === user.id;
          const joinDate = new Date(user.joinedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
          const initials = user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

          return (
            <div key={user.id} className="bg-card rounded-2xl border border-border overflow-hidden transition-all">
              <button
                className="w-full p-4 flex items-center gap-4 hover:bg-muted/30 transition-all text-left"
                onClick={() => setExpanded(isExpanded ? null : user.id)}
              >
                <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {initials || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{user.name}</span>
                    {user.conditions.slice(0, 2).map((c) => (
                      <span key={c} className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionColor(c)}`}>{c}</span>
                    ))}
                    {user.conditions.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{user.conditions.length - 2} more</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0 text-right">
                  <div>
                    <div className="font-semibold text-foreground">{user.orderCount}</div>
                    <div className="text-xs text-muted-foreground">orders</div>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">₦{(user.totalSpent / 100).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">spent</div>
                  </div>
                  <span className="text-muted-foreground">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-border/50 grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contact</div>
                      <div className="text-sm text-foreground">{user.email}</div>
                      {user.phone && <div className="text-sm text-foreground">{user.phone}</div>}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Joined</div>
                      <div className="text-sm text-foreground">{joinDate}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {user.conditions.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Health Conditions</div>
                        <div className="flex flex-wrap gap-1.5">
                          {user.conditions.map((c) => (
                            <span key={c} className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionColor(c)}`}>{c}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {user.allergies.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Allergies</div>
                        <div className="flex flex-wrap gap-1.5">
                          {user.allergies.map((a) => (
                            <span key={a} className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600">{a}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
