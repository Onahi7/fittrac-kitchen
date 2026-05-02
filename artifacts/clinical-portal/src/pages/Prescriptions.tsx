import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill, ChevronDown, ChevronUp, Calendar, User, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Prescriptions() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: prescriptions, isLoading } = useQuery<any[]>({
    queryKey: ["prescriptions"],
    queryFn: () => fetchWithAuth("/api/clinical-staff/prescriptions"),
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 overflow-y-auto">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Prescriptions</h1>
        <p className="text-muted-foreground mt-1">{prescriptions?.length ?? 0} prescriptions issued</p>
      </div>

      {(prescriptions?.length ?? 0) === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Pill className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No prescriptions issued yet</p>
          <p className="text-sm mt-1">Issue prescriptions from within a consultation session</p>
        </div>
      )}

      <div className="space-y-3">
        {(prescriptions ?? []).map((rx) => {
          const isOpen = expanded === rx.id;
          return (
            <Card key={rx.id} className="border" data-testid={`prescription-${rx.id}`}>
              <CardContent className="p-5">
                <button className="w-full" onClick={() => setExpanded(isOpen ? null : rx.id)} data-testid={`btn-expand-${rx.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-left space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <Pill className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{rx.patient?.name}</div>
                          <div className="text-xs text-muted-foreground">{rx.diagnosis}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pl-10">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {rx.date}</span>
                        <span className="flex items-center gap-1"><Pill className="w-3 h-3" /> {rx.medications?.length} medication{rx.medications?.length !== 1 ? "s" : ""}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> Valid until {rx.validUntil}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-border space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Medications</h4>
                      <div className="space-y-2">
                        {rx.medications?.map((med: any, i: number) => (
                          <div key={i} className="bg-muted rounded-lg p-4 grid grid-cols-2 gap-x-6 gap-y-1.5">
                            <div className="col-span-2 font-semibold text-foreground text-sm">{med.name} {med.dose}</div>
                            <div><span className="text-xs text-muted-foreground">Frequency: </span><span className="text-xs text-foreground">{med.frequency}</span></div>
                            <div><span className="text-xs text-muted-foreground">Duration: </span><span className="text-xs text-foreground">{med.duration}</span></div>
                            {med.instructions && (
                              <div className="col-span-2"><span className="text-xs text-muted-foreground">Instructions: </span><span className="text-xs text-foreground">{med.instructions}</span></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {rx.notes && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Clinical Notes</h4>
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-foreground">{rx.notes}</div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
