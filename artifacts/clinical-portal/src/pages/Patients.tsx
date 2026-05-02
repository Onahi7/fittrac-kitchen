import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { Link } from "wouter";

const conditionColors: Record<string, string> = {
  hypertension: "bg-red-100 text-red-800 border-red-200",
  diabetes: "bg-amber-100 text-amber-800 border-amber-200",
  weightloss: "bg-green-100 text-green-800 border-green-200",
  liver: "bg-orange-100 text-orange-800 border-orange-200",
  allergies: "bg-purple-100 text-purple-800 border-purple-200",
};

export default function Patients() {
  const [search, setSearch] = useState("");

  const { data: patients, isLoading } = useQuery<any[]>({
    queryKey: ["patients"],
    queryFn: () => fetchWithAuth("/api/clinical-staff/patients").then((d) => d.patients ?? []),
  });

  const filteredPatients = patients?.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.conditions.some((c: string) => c.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 space-y-6 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Patient Directory</h1>
          <p className="text-muted-foreground">Manage and view patient profiles.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search patients by name or condition..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground">
          <Filter className="w-4 h-4" />
          Filters
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPatients?.map((patient: any) => (
            <Link key={patient.id} href={`/patients/${patient.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{patient.name}</h3>
                      <div className="text-sm text-muted-foreground">
                        {patient.age} yrs • {patient.gender} • BMI: {patient.bmi}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-wrap gap-2">
                    {patient.conditions?.map((condition: string) => (
                      <Badge 
                        key={condition} 
                        variant="outline" 
                        className={conditionColors[condition.toLowerCase()] || "bg-muted text-muted-foreground"}
                      >
                        {condition}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-col sm:items-end gap-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Adherence:</span>
                      <span className={`font-bold ${patient.adherenceScore >= 80 ? 'text-green-600' : patient.adherenceScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {patient.adherenceScore}%
                      </span>
                    </div>
                    <div className="text-muted-foreground">Last Visit: {patient.lastVisit}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {filteredPatients?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border">
              No patients found matching your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
