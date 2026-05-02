import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

export default function Layout({ children, fullHeight }: { children: ReactNode; fullHeight?: boolean }) {
  return (
    <div className={`flex w-full bg-background font-sans ${fullHeight ? "h-screen overflow-hidden" : "min-h-screen"}`}>
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
