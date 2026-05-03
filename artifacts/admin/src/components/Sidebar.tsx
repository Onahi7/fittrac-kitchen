import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

const NAV_SECTIONS = [
  {
    label: "OVERVIEW",
    items: [
      { href: "/", icon: "📊", label: "Dashboard" },
      { href: "/orders", icon: "📦", label: "Orders" },
      { href: "/analytics", icon: "📈", label: "Analytics" },
    ],
  },
  {
    label: "FOOD & CONTENT",
    items: [
      { href: "/menu", icon: "🥘", label: "Menu & Meals" },
      { href: "/quotes", icon: "💬", label: "Quotes" },
      { href: "/content", icon: "📚", label: "Health Content" },
      { href: "/notifications", icon: "🔔", label: "Notifications" },
    ],
  },
  {
    label: "PEOPLE",
    items: [
      { href: "/users", icon: "👤", label: "Users" },
      { href: "/wellness", icon: "🩺", label: "Wellness & Clinics" },
      { href: "/community", icon: "🌍", label: "Community" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { href: "/settings", icon: "⚙️", label: "App Settings" },
    ],
  },
];

function NavContent({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <>
      <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-base">🌿</div>
          <div>
            <div className="font-bold text-sm leading-tight">Fittrac Kitchen</div>
            <div className="text-sidebar-foreground/50 text-xs">Admin Console</div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sidebar-foreground/70 hover:bg-white/20 transition-all"
            aria-label="Close menu"
          >
            ✕
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="px-3 pb-1.5 text-[10px] font-semibold tracking-widest text-sidebar-foreground/40 uppercase">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <a
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <span className="text-base w-5 text-center">{item.icon}</span>
                      {item.label}
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
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
          onClick={() => { logout(); onClose?.(); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
        >
          <span>🚪</span>
          Sign Out
        </button>
      </div>
    </>
  );
}

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <aside className="hidden md:flex w-64 bg-sidebar text-sidebar-foreground flex-col h-full flex-shrink-0">
        <NavContent />
      </aside>

      {/* Mobile drawer — slide in from left */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar text-sidebar-foreground flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <NavContent onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
