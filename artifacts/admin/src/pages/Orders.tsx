import { useEffect, useState } from "react";
import { useAdminFetch } from "@/contexts/AuthContext";

interface Order {
  id: string;
  customer: string;
  total: number;
  status: string;
  fulfillment: string;
  items: string[];
  date: string;
  condition: string;
}

const STATUS_OPTIONS = ["confirmed", "preparing", "ready", "delivered", "cancelled"];

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  preparing: "bg-amber-100 text-amber-700 border-amber-200",
  ready: "bg-green-100 text-green-700 border-green-200",
  delivered: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const FULFILLMENT_STYLE: Record<string, string> = {
  delivery: "bg-primary/10 text-primary",
  pickup: "bg-secondary/10 text-secondary",
};

const CONDITION_LABEL: Record<string, string> = {
  hypertension: "Hypertension",
  diabetes: "Diabetes",
  weightloss: "Weight Loss",
  liver: "Liver Health",
  allergies: "Allergies",
};

export default function Orders() {
  const apiFetch = useAdminFetch();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = () => {
    const url = filterStatus === "all" ? "/api/admin/orders" : `/api/admin/orders?status=${filterStatus}`;
    apiFetch(url)
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [filterStatus]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    await apiFetch(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    setUpdatingId(null);
  };

  const nextStatus = (current: string): string | null => {
    const flow = ["confirmed", "preparing", "ready", "delivered"];
    const idx = flow.indexOf(current);
    return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  const totalToday = orders.filter((o) => o.date === new Date().toISOString().split("T")[0]).length;
  const revenue = orders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">{orders.length} orders · ₦{(revenue / 1000).toFixed(1)}k total</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-all"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {["all", ...STATUS_OPTIONS.filter((s) => s !== "cancelled")].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all capitalize ${
              filterStatus === s
                ? "bg-primary text-white border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50"
            }`}
          >
            {s === "all" ? "All Orders" : s}
            {s === "all" && orders.length > 0 && <span className="ml-1.5 bg-white/20 text-white px-1.5 rounded-full text-xs">{orders.length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground animate-pulse">Loading orders...</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const next = nextStatus(order.status);
            return (
              <div key={order.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className="font-bold text-foreground font-mono text-sm">{order.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLE[order.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                        {order.status}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${FULFILLMENT_STYLE[order.fulfillment] ?? "bg-muted text-muted-foreground"}`}>
                        {order.fulfillment}
                      </span>
                      {order.condition && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/30 text-accent-foreground">
                          {CONDITION_LABEL[order.condition] ?? order.condition}
                        </span>
                      )}
                    </div>

                    <div className="font-semibold text-foreground">{order.customer}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {order.items.join(" · ")}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-muted-foreground">📅 {order.date}</span>
                      <span className="font-bold text-primary">₦{order.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {next && (
                      <button
                        disabled={updatingId === order.id}
                        onClick={() => updateStatus(order.id, next)}
                        className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60 whitespace-nowrap"
                      >
                        {updatingId === order.id ? "..." : `Mark ${next}`}
                      </button>
                    )}
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      disabled={updatingId === order.id}
                      className="text-xs border border-border rounded-lg px-2 py-1.5 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s} className="capitalize">{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
          {orders.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <div className="text-4xl mb-3">📭</div>
              <div>No orders found</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
