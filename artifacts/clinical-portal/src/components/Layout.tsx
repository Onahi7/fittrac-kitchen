import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";

export default function Layout({ children, fullHeight }: { children: ReactNode; fullHeight?: boolean }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`flex w-full bg-background font-sans ${fullHeight ? "h-screen overflow-hidden" : "min-h-screen"}`}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar — hidden on desktop */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-background shrink-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-foreground hover:bg-muted transition-all"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-serif font-bold text-foreground">Fittrac Clinical</span>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
