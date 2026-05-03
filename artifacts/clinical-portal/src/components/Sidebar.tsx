import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  Pill,
  Salad,
  BarChart3,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { staff, logout } = useAuth();
  const [location] = useLocation();

  if (!staff) return null;

  const doctorNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Consultations", href: "/consultations", icon: CalendarDays },
    { name: "Lab Results", href: "/lab-results", icon: FileText },
    { name: "Prescriptions", href: "/prescriptions", icon: Pill },
  ];

  const nutritionistNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Clients", href: "/patients", icon: Users },
    { name: "Consultations", href: "/consultations", icon: CalendarDays },
    { name: "Meal Plans", href: "/meal-plans", icon: Salad },
    { name: "Analytics", href: "/nutrition-analytics", icon: BarChart3 },
  ];

  const navItems = staff.role === "doctor" ? doctorNav : nutritionistNav;

  return (
    <>
      <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border shrink-0">
        <h1 className="font-serif text-xl font-bold text-sidebar-foreground">Fittrac Clinical</h1>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sidebar-foreground/60 hover:bg-sidebar-accent/50 transition-all"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold">
            {staff.name.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-semibold text-sidebar-foreground">{staff.name}</div>
            <div className="text-xs text-sidebar-foreground/70">{staff.title}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={() => { logout(); onClose?.(); }}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );
}

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <aside className="hidden md:flex w-64 bg-sidebar flex-col h-screen border-r border-sidebar-border shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar flex flex-col border-r border-sidebar-border shadow-2xl animate-in slide-in-from-left duration-200">
            <SidebarContent onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
