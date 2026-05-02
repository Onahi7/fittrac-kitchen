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
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
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
    <aside className="w-64 bg-sidebar flex flex-col h-screen border-r border-sidebar-border shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <h1 className="font-serif text-xl font-bold text-sidebar-foreground">Fittrac Clinical</h1>
      </div>
      
      <div className="p-6">
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

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href} className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive 
                ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}>
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <button 
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
