import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { RiderProvider, useRider } from "@/contexts/RiderContext";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ActiveDelivery from "@/pages/ActiveDelivery";
import Earnings from "@/pages/Earnings";
import Profile from "@/pages/Profile";

const queryClient = new QueryClient();

type Tab = "home" | "delivery" | "earnings" | "profile";

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "delivery", icon: "📍", label: "Delivery" },
  { id: "earnings", icon: "💰", label: "Earnings" },
  { id: "profile", icon: "👤", label: "Profile" },
];

function RiderApp() {
  const { rider, activeOrder } = useRider();
  const [tab, setTab] = useState<Tab>("home");

  if (!rider) return <Login />;

  const renderPage = () => {
    switch (tab) {
      case "home": return <Dashboard />;
      case "delivery": return <ActiveDelivery />;
      case "earnings": return <Earnings />;
      case "profile": return <Profile />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative">
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 72 }}>
        {renderPage()}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border flex max-w-md mx-auto" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {TABS.map((t) => {
          const isActive = tab === t.id;
          const hasActiveDelivery = t.id === "delivery" && activeOrder;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-all relative ${isActive ? "text-primary" : "text-muted-foreground"}`}
            >
              <span className="text-xl leading-none">{t.icon}</span>
              <span className={`text-[10px] font-semibold ${isActive ? "text-primary" : "text-muted-foreground"}`}>{t.label}</span>
              {hasActiveDelivery && (
                <span className="absolute top-2 right-1/4 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RiderProvider>
        <RiderApp />
        <Toaster />
      </RiderProvider>
    </QueryClientProvider>
  );
}

export default App;
