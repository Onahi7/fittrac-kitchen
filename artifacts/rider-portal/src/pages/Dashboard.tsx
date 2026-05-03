import { useState } from "react";
import { useRider } from "@/contexts/RiderContext";

export default function Dashboard() {
  const { rider, isOnline, toggleOnline, availableOrders, activeOrder, todayEarnings, todayDeliveries, acceptOrder, updateStatus } = useRider();
  const [accepting, setAccepting] = useState<string | null>(null);

  const handleAccept = async (order: typeof availableOrders[0]) => {
    setAccepting(order.id);
    await acceptOrder(order);
    setAccepting(null);
  };

  const weekEarnings = todayEarnings + 12400;
  const rating = rider?.rating ?? 4.8;

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Top bar */}
      <div className="bg-primary px-5 pt-12 pb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-xl">🛵</div>
            <div>
              <div className="font-bold text-base leading-tight">{rider?.name?.split(" ")[0] ?? "Rider"}</div>
              <div className="text-white/60 text-xs flex items-center gap-1.5 mt-0.5">
                <span className="text-yellow-300">★</span> {rating} rating
              </div>
            </div>
          </div>
          <button onClick={toggleOnline}
            className={`px-4 py-2 rounded-2xl text-sm font-bold border-2 transition-all ${isOnline ? "border-white bg-white/20 text-white" : "border-white/40 text-white/60"}`}
          >
            {isOnline ? "🟢 Online" : "⚫ Offline"}
          </button>
        </div>

        {/* Today stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Today's Earnings", value: `₦${todayEarnings.toLocaleString()}`, icon: "💰" },
            { label: "Deliveries", value: `${todayDeliveries}`, icon: "📦" },
            { label: "This Week", value: `₦${weekEarnings.toLocaleString()}`, icon: "📈" },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-2xl p-3 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="font-bold text-base">{s.value}</div>
              <div className="text-white/60 text-[10px] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Active order */}
        {activeOrder && (
          <div className="bg-card rounded-2xl border-2 border-primary shadow-sm overflow-hidden">
            <div className="bg-primary/10 px-4 py-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-bold text-primary">Active Delivery — {activeOrder.orderId}</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📍</span>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">DELIVERING TO</div>
                  <div className="font-semibold text-foreground">{activeOrder.customerName}</div>
                  <div className="text-sm text-muted-foreground">{activeOrder.customerAddress}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {activeOrder.items.map((item) => (
                  <span key={item} className="text-xs bg-accent text-primary px-2.5 py-1 rounded-full">{item}</span>
                ))}
              </div>
              <div className="flex gap-3">
                {activeOrder.status === "accepted" && (
                  <button onClick={() => updateStatus("picked_up")}
                    className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-all"
                  >✅ Food Picked Up</button>
                )}
                {activeOrder.status === "picked_up" && (
                  <button onClick={() => updateStatus("delivered")}
                    className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all"
                  >🎉 Mark Delivered</button>
                )}
                <a href={`tel:${activeOrder.customerPhone}`}
                  className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-xl flex-shrink-0"
                >📞</a>
              </div>
            </div>
          </div>
        )}

        {/* Online/Offline status */}
        {!isOnline && !activeOrder && (
          <div className="bg-card rounded-2xl border border-border p-6 text-center">
            <div className="text-5xl mb-3">⚫</div>
            <div className="font-bold text-foreground">You're Offline</div>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Go online to start receiving delivery requests</p>
            <button onClick={toggleOnline}
              className="px-8 py-3 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-all"
            >Go Online</button>
          </div>
        )}

        {/* Available orders */}
        {isOnline && !activeOrder && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground text-lg">Available Orders</h2>
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{availableOrders.length} nearby</span>
            </div>

            {availableOrders.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <div className="text-4xl mb-2">⏳</div>
                <div className="font-medium text-foreground">Waiting for orders...</div>
                <p className="text-sm text-muted-foreground mt-1">New orders will appear here automatically</p>
              </div>
            ) : (
              availableOrders.map((order) => (
                <div key={order.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-bold text-foreground">{order.orderId}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">📍 {order.distance} · ⏱ ~{order.estimatedTime} min</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary text-lg">₦{order.earnings.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">earnings</div>
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      <div className="flex gap-2 items-start">
                        <span className="text-sm mt-0.5 flex-shrink-0">🏪</span>
                        <div className="text-xs text-muted-foreground">{order.pickupAddress}</div>
                      </div>
                      <div className="flex gap-2 items-start">
                        <span className="text-sm mt-0.5 flex-shrink-0">🏠</span>
                        <div className="text-xs text-foreground font-medium">{order.customerAddress}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {order.items.map((item) => (
                        <span key={item} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{item}</span>
                      ))}
                    </div>

                    <button onClick={() => handleAccept(order)} disabled={accepting === order.id}
                      className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
                    >
                      {accepting === order.id ? (
                        <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Accepting…</>
                      ) : "Accept Order"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Quick tips */}
        {isOnline && (
          <div className="bg-accent/40 rounded-2xl p-4">
            <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">💡 Rider Tips</div>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li>• Call customer if address is unclear — 5-star rating follows!</li>
              <li>• Keep food bags upright to prevent spills</li>
              <li>• Confirm customer identity before handing over</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
