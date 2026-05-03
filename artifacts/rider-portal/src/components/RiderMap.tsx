import { useEffect, useState } from "react";

interface RiderMapProps {
  status: "accepted" | "picked_up";
  customerName: string;
  distance: string;
  estimatedTime: number;
}

// A beautiful animated SVG city map — works everywhere, no API key needed
export default function RiderMap({ status, estimatedTime }: RiderMapProps) {
  const [riderPos, setRiderPos] = useState({ x: 60, y: 240 });
  const [elapsed, setElapsed] = useState(0);

  // Route waypoints: rider moves from pickup → customer
  const pickupRoute = [
    { x: 60, y: 240 },
    { x: 100, y: 240 },
    { x: 100, y: 180 },
    { x: 200, y: 180 },
    { x: 200, y: 140 },
    { x: 290, y: 140 },
  ];

  const deliveryRoute = [
    { x: 290, y: 140 },
    { x: 290, y: 100 },
    { x: 320, y: 100 },
  ];

  const fullRoute = status === "accepted" ? pickupRoute : deliveryRoute;

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((e) => (e + 1) % (fullRoute.length * 40));
    }, 80);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    const idx = Math.floor(elapsed / 40);
    const t = (elapsed % 40) / 40;
    if (idx < fullRoute.length - 1) {
      const from = fullRoute[idx];
      const to = fullRoute[idx + 1];
      setRiderPos({
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
      });
    }
  }, [elapsed]);

  const routeD = pickupRoute.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#f0ebe3] border border-border" style={{ height: 280 }}>
      <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        {/* Map background */}
        <rect width="400" height="300" fill="#f0ebe3" />

        {/* City blocks */}
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3, 4].map((c) => (
            <rect key={`${r}-${c}`}
              x={20 + c * 80} y={20 + r * 70}
              width={60} height={50}
              fill="#e8e2d8" rx={4}
            />
          ))
        )}

        {/* Main roads */}
        <line className="map-street" x1="0" y1="100" x2="400" y2="100" />
        <line className="map-street" x1="0" y1="180" x2="400" y2="180" />
        <line className="map-street" x1="0" y1="260" x2="400" y2="260" />
        <line className="map-street" x1="100" y1="0" x2="100" y2="300" />
        <line className="map-street" x1="200" y1="0" x2="200" y2="300" />
        <line className="map-street" x1="300" y1="0" x2="300" y2="300" />

        {/* Green route line */}
        <path d={routeD} className="map-route" />

        {/* Animated dots on route */}
        {[0, 1, 2].map((i) => {
          const progress = ((elapsed * 2 + i * 60) % 180) / 180;
          const pointIdx = Math.floor(progress * (pickupRoute.length - 1));
          const t = (progress * (pickupRoute.length - 1)) % 1;
          if (pointIdx >= pickupRoute.length - 1) return null;
          const from = pickupRoute[pointIdx];
          const to = pickupRoute[pointIdx + 1];
          const x = from.x + (to.x - from.x) * t;
          const y = from.y + (to.y - from.y) * t;
          return (
            <circle key={i} cx={x} cy={y} r={3} fill="#154212" opacity={0.6} />
          );
        })}

        {/* Fittrac Kitchen (pickup) */}
        <g transform="translate(60, 240)">
          <circle cx={0} cy={0} r={12} fill="#154212" opacity={0.15} />
          <circle cx={0} cy={0} r={7} fill="#154212" />
          <text x={0} y={4} textAnchor="middle" fill="white" fontSize={8} fontWeight="bold">FK</text>
          <rect x={-24} y={-30} width={48} height={18} rx={4} fill="#154212" />
          <text x={0} y={-18} textAnchor="middle" fill="white" fontSize={8}>Kitchen</text>
        </g>

        {/* Customer destination */}
        <g transform="translate(320, 100)">
          <circle cx={0} cy={0} r={10} fill="#BA1A1A" opacity={0.15} />
          <circle cx={0} cy={0} r={6} fill="#BA1A1A" />
          <circle cx={0} cy={0} r={2} fill="white" />
          <line x1={0} y1={-6} x2={0} y2={-24} stroke="#BA1A1A" strokeWidth={2} />
          <rect x={-22} y={-42} width={44} height={18} rx={4} fill="#BA1A1A" />
          <text x={0} y={-30} textAnchor="middle" fill="white" fontSize={8}>Customer</text>
        </g>

        {/* Rider marker (animated) */}
        <g transform={`translate(${riderPos.x}, ${riderPos.y})`}>
          <circle cx={0} cy={0} r={16} fill="white" opacity={0.9}
            style={{ filter: "drop-shadow(0 2px 6px rgba(21,66,18,0.3))" }} />
          <circle cx={0} cy={0} r={12} fill="#154212" />
          <text x={0} y={5} textAnchor="middle" fill="white" fontSize={13}>🛵</text>
        </g>
      </svg>

      {/* Status overlay */}
      <div className="absolute bottom-3 left-3 right-3">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center justify-between shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${status === "accepted" ? "bg-amber-500" : "bg-green-500"}`} />
            <div>
              <div className="text-xs font-semibold text-foreground">
                {status === "accepted" ? "Heading to Kitchen" : "On the way to customer"}
              </div>
              <div className="text-xs text-muted-foreground">Live tracking active</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-bold text-foreground">{estimatedTime} min</div>
            <div className="text-xs text-muted-foreground">ETA</div>
          </div>
        </div>
      </div>
    </div>
  );
}
