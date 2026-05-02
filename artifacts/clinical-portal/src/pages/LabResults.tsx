import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FlaskConical, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type LabFilter = "all" | "critical" | "abnormal" | "normal";

function statusConfig(status: string) {
  switch (status) {
    case "critical": return { label: "Critical", icon: AlertTriangle, class: "bg-red-100 text-red-800 border-red-200", rowClass: "border-l-4 border-l-red-500" };
    case "abnormal": return { label: "Abnormal", icon: AlertCircle, class: "bg-amber-100 text-amber-800 border-amber-200", rowClass: "border-l-4 border-l-amber-400" };
    case "normal": return { label: "Normal", icon: CheckCircle2, class: "bg-green-100 text-green-800 border-green-200", rowClass: "" };
    default: return { label: status, icon: FlaskConical, class: "bg-muted text-muted-foreground", rowClass: "" };
  }
}

export default function LabResults() {
  const [filter, setFilter] = useState<LabFilter>("all");

  const { data: results, isLoading } = useQuery<any[]>({
    queryKey: ["lab-results"],
    queryFn: () => fetchWithAuth("/api/clinical-staff/lab-results"),
  });

  const filtered = (results ?? []).filter((r) => filter === "all" || r.status === filter);

  const counts = {
    all: results?.length ?? 0,
    critical: (results ?? []).filter(r => r.status === "critical").length,
    abnormal: (results ?? []).filter(r => r.status === "abnormal").length,
    normal: (results ?? []).filter(r => r.status === "normal").length,
  };

  const filters: { key: LabFilter; label: string; color: string }[] = [
    { key: "all", label: "All Results", color: "bg-muted text-muted-foreground" },
    { key: "critical", label: "Critical", color: "bg-red-100 text-red-800" },
    { key: "abnormal", label: "Abnormal", color: "bg-amber-100 text-amber-800" },
    { key: "normal", label: "Normal", color: "bg-green-100 text-green-800" },
  ];

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-9 w-28" />)}
        </div>
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 overflow-y-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Lab Results</h1>
          <p className="text-muted-foreground mt-1">{counts.all} results across your patients</p>
        </div>
        {counts.critical > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-700">{counts.critical} critical {counts.critical === 1 ? "result" : "results"} require attention</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all",
            filter === f.key ? `${f.color} border-current shadow-sm` : "bg-background text-muted-foreground border-border hover:bg-muted"
          )} data-testid={`filter-${f.key}`}>
            {f.label} <span className="font-bold">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {counts.critical > 0 && filter === "all" && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Critical — Immediate Attention
          </h2>
          {(results ?? []).filter(r => r.status === "critical").map((r) => (
            <ResultCard key={r.id} result={r} />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filter !== "all" && <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{filters.find(f => f.key === filter)?.label}</h2>}
        {filter === "all" && counts.critical > 0 && (
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">All Other Results</h2>
        )}
        {(filter === "all" ? filtered.filter(r => r.status !== "critical") : filtered).map((r) => (
          <ResultCard key={r.id} result={r} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No {filter === "all" ? "" : filter} results found</p>
        </div>
      )}
    </div>
  );
}

function ResultCard({ result }: { result: any }) {
  const sc = statusConfig(result.status);
  const StatusIcon = sc.icon;

  return (
    <Card className={cn("border", sc.rowClass)} data-testid={`lab-result-${result.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-foreground">{result.testName}</span>
              <Badge className={cn("text-xs border", sc.class)}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {sc.label}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Result</div>
                <div className={cn("text-sm font-semibold", result.status === "critical" ? "text-red-600" : result.status === "abnormal" ? "text-amber-600" : "text-foreground")}>{result.value}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Reference Range</div>
                <div className="text-sm text-muted-foreground">{result.referenceRange}</div>
              </div>
            </div>
            {result.notes && (
              <div className="text-xs text-muted-foreground bg-muted rounded px-3 py-2">{result.notes}</div>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="font-medium text-sm text-foreground">{result.patient?.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{result.resultDate}</div>
            <div className="text-xs text-muted-foreground">Uploaded {result.uploadedAt}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
