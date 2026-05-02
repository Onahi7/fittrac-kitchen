import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Clock, User, Video, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

function statusConfig(status: string) {
  switch (status) {
    case "completed": return { label: "Completed", class: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" };
    case "in-progress": return { label: "In Progress", class: "bg-green-100 text-green-800", dot: "bg-green-500" };
    case "scheduled": return { label: "Scheduled", class: "bg-blue-100 text-blue-800", dot: "bg-blue-500" };
    case "urgent": return { label: "Urgent", class: "bg-red-100 text-red-800", dot: "bg-red-500" };
    default: return { label: status, class: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" };
  }
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    "follow-up": "Follow-Up", "initial": "Initial", "review": "Review",
    "urgent": "Urgent", "comprehensive": "Comprehensive",
  };
  return map[type] ?? type;
}

export default function Consultations() {
  const { staff } = useAuth();

  const { data: consultations, isLoading } = useQuery<any[]>({
    queryKey: ["consultations"],
    queryFn: () => fetchWithAuth("/api/clinical-staff/consultations"),
  });

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-48" />
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  const completed = (consultations ?? []).filter((c) => c.status === "completed");
  const active = (consultations ?? []).filter((c) => c.status !== "completed");

  return (
    <div className="p-8 space-y-8 overflow-y-auto">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Today's Schedule</h1>
        <p className="text-muted-foreground mt-1">{today} — {consultations?.length ?? 0} consultations</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: consultations?.length ?? 0, icon: CalendarDays, color: "text-primary" },
          { label: "Completed", value: completed.length, icon: CheckCircle2, color: "text-green-600" },
          { label: "In Progress", value: (consultations ?? []).filter(c => c.status === "in-progress").length, icon: Loader2, color: "text-amber-600" },
          { label: "Scheduled", value: (consultations ?? []).filter(c => c.status === "scheduled").length, icon: Clock, color: "text-blue-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-full bg-muted flex items-center justify-center", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold font-serif text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {active.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Upcoming & Active</h2>
          <div className="space-y-3">
            {active.map((c) => {
              const sc = statusConfig(c.status);
              return (
                <Card key={c.id} className={cn("border", c.status === "in-progress" && "border-primary/30 bg-primary/5")}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                          {c.patient?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "PT"}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{c.patient?.name ?? "Patient"}</h3>
                            <Badge variant="outline" className="text-xs">{typeLabel(c.type)}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{c.chiefComplaint}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.time}</span>
                            <span>{c.duration} min</span>
                            {c.patient?.conditions?.length > 0 && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {c.patient.conditions.slice(0, 2).join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium", sc.class)}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                          {sc.label}
                        </div>
                        <Link href={`/consultations/${c.id}`}>
                          <Button size="sm" className="gap-1.5" data-testid={`btn-join-${c.id}`}>
                            <Video className="w-3.5 h-3.5" />
                            {c.status === "in-progress" ? "Rejoin" : "Join Call"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Completed</h2>
          <div className="space-y-2">
            {completed.map((c) => (
              <Card key={c.id} className="opacity-70">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold">
                        {c.patient?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "PT"}
                      </div>
                      <div>
                        <span className="font-medium text-sm text-foreground">{c.patient?.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">— {c.chiefComplaint}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      <span>{c.time}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(consultations?.length ?? 0) === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No consultations scheduled for today</p>
          <p className="text-sm mt-1">Enjoy the downtime — or check your upcoming schedule</p>
        </div>
      )}
    </div>
  );
}
