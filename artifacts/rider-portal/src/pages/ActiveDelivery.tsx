import { useRider } from "@/contexts/RiderContext";
import RiderMap from "@/components/RiderMap";

const STATUS_STEPS = [
  { key: "accepted", label: "Order Accepted", icon: "✅", desc: "Head to Fittrac Kitchen to pick up" },
  { key: "picked_up", label: "Food Picked Up", icon: "📦", desc: "On your way to the customer" },
  { key: "delivered", label: "Delivered", icon: "🎉", desc: "Order complete!" },
];

export default function ActiveDelivery() {
  const { activeOrder, updateStatus, rider } = useRider();

  if (!activeOrder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <div className="font-bold text-foreground text-xl">No Active Delivery</div>
          <p className="text-muted-foreground text-sm mt-2">Accept an order from the dashboard to see it here</p>
        </div>
      </div>
    );
  }

  const statusIdx = STATUS_STEPS.findIndex((s) => s.key === activeOrder.status);
  const currentStep = STATUS_STEPS[statusIdx] ?? STATUS_STEPS[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary px-5 pt-12 pb-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white/60 text-xs uppercase tracking-wider">Active Delivery</div>
            <div className="font-bold text-xl">{activeOrder.orderId}</div>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
            activeOrder.status === "accepted" ? "border-amber-300 text-amber-300" :
            activeOrder.status === "picked_up" ? "border-green-300 text-green-300" :
            "border-white text-white"
          }`}>
            {currentStep.icon} {currentStep.label}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Map */}
        <RiderMap
          status={activeOrder.status === "picked_up" ? "picked_up" : "accepted"}
          customerName={activeOrder.customerName}
          distance={activeOrder.distance}
          estimatedTime={activeOrder.estimatedTime}
        />

        {/* Status timeline */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="text-sm font-bold text-foreground mb-4">Delivery Progress</div>
          <div className="space-y-3">
            {STATUS_STEPS.map((step, i) => {
              const isDone = i < statusIdx;
              const isActive = i === statusIdx;
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5 ${
                    isDone ? "bg-primary text-white" :
                    isActive ? "bg-amber-100 border-2 border-amber-500" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {isDone ? "✓" : step.icon}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${isActive ? "text-foreground" : isDone ? "text-primary" : "text-muted-foreground"}`}>
                      {step.label}
                    </div>
                    {isActive && <div className="text-xs text-muted-foreground mt-0.5">{step.desc}</div>}
                  </div>
                  {isActive && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mt-3" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer info */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="text-sm font-bold text-foreground">Customer Details</div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
              {activeOrder.customerName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-foreground">{activeOrder.customerName}</div>
              <div className="text-sm text-muted-foreground">{activeOrder.customerPhone}</div>
              <div className="text-sm text-muted-foreground mt-1">{activeOrder.customerAddress}</div>
            </div>
            <a href={`tel:${activeOrder.customerPhone}`}
              className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg"
            >📞</a>
          </div>
          <div className="bg-muted/50 rounded-xl p-3">
            <div className="text-xs text-muted-foreground mb-1.5">ORDER ITEMS</div>
            {activeOrder.items.map((item) => (
              <div key={item} className="text-sm font-medium text-foreground">• {item}</div>
            ))}
          </div>
        </div>

        {/* Earnings */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Your earnings this delivery</div>
            <div className="text-2xl font-bold text-primary">₦{activeOrder.earnings.toLocaleString()}</div>
          </div>
          <div className="text-3xl">💰</div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {activeOrder.status === "accepted" && (
            <button onClick={() => updateStatus("picked_up")}
              className="w-full py-4 rounded-2xl bg-amber-500 text-white font-bold text-base hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xl">📦</span> I've Picked Up the Food
            </button>
          )}
          {activeOrder.status === "picked_up" && (
            <button onClick={() => updateStatus("delivered")}
              className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-base hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xl">🎉</span> Confirm Delivery Complete
            </button>
          )}
          {activeOrder.status === "delivered" && (
            <div className="py-4 rounded-2xl bg-green-50 border-2 border-green-400 text-center">
              <div className="text-3xl mb-1">🎉</div>
              <div className="font-bold text-green-700">Delivery Complete!</div>
              <div className="text-sm text-green-600">₦{activeOrder.earnings.toLocaleString()} added to your earnings</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
