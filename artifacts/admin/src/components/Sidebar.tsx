import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  { href: "/", icon: "📊", label: "Dashboard" },
  { href: "/orders", icon: "📦", label: "Orders" },
  { href: "/menu", icon: "🥘", label: "Menu" },
  { href: "/analytics", icon: "📈", label: "Analytics" },
  { href: "/wellness", icon: "🩺", label: "Wellness" },
  { href: "/settings", icon: "⚙️", label: "Settings" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-full flex-shrink-0">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-base">🌿</div>
          <div>
            <div className="font-bold text-sm leading-tight">Fittrac Kitchen</div>
            <div className="text-sidebar-foreground/50 text-xs">Admin Console</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
            {user?.username?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.username ?? "Admin"}</div>
            <div className="text-xs text-sidebar-foreground/50 capitalize">{user?.role ?? "admin"}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
        >
          <span>🚪</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
