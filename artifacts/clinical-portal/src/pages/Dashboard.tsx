import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, AlertTriangle, Users, Activity, FileText, CheckCircle2, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { staff } = useAuth();
  
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchWithAuth("/api/clinical-staff/dashboard"),
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const isDoctor = staff?.role === "doctor";

  return (
    <div className="p-8 space-y-8 overflow-y-auto">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Welcome back, {staff?.name}</h1>
        <p className="text-muted-foreground mt-1">Here is your clinical summary for today.</p>
      </div>

      {isDoctor ? (
        <DoctorDashboard data={data} />
      ) : (
        <NutritionistDashboard data={data} />
      )}
    </div>
  );
}

function DoctorDashboard({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-bold">{data.todayConsultations}</div>
              <div className="text-sm font-medium text-muted-foreground">Today's Consults</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-bold">{data.inProgress + data.scheduled}</div>
              <div className="text-sm font-medium text-muted-foreground">Remaining</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-bold">{data.criticalAlerts}</div>
              <div className="text-sm font-medium text-muted-foreground">Critical Labs</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-bold">{data.totalPatients}</div>
              <div className="text-sm font-medium text-muted-foreground">Total Patients</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {data.upcomingConsultation && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                    {data.upcomingConsultation.patientName?.charAt(0) || "P"}
                  </div>
                  <div>
                    <div className="text-sm text-primary font-semibold mb-1">UPCOMING CONSULTATION</div>
                    <div className="text-xl font-bold">{data.upcomingConsultation.patientName}</div>
                    <div className="text-sm text-muted-foreground">
                      {data.upcomingConsultation.time} • {data.upcomingConsultation.type} • {data.upcomingConsultation.chiefComplaint}
                    </div>
                  </div>
                </div>
                <Link href={`/consultations/${data.upcomingConsultation.id}`}>
                  <Button size="lg" className="w-full md:w-auto">Join Call</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(data.recentActivity || []).map((activity: any, i: number) => (
                  <div key={i} className="flex gap-4 relative">
                    {i !== data.recentActivity.length - 1 && (
                      <div className="absolute left-[11px] top-8 bottom-[-24px] w-[2px] bg-border" />
                    )}
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 z-10">
                      <Activity className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{activity.title}</div>
                      <div className="text-sm text-muted-foreground">{activity.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">{activity.time}</div>
                    </div>
                  </div>
                ))}
                {(!data.recentActivity || data.recentActivity.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">No recent activity</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
           <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/consultations" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors">
                <CalendarDays className="w-5 h-5 text-primary" />
                <span className="font-medium text-sm">View Schedule</span>
              </Link>
              <Link href="/patients" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-medium text-sm">Patient Directory</span>
              </Link>
              <Link href="/lab-results" className="flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-medium text-sm">Review Labs</span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function NutritionistDashboard({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-bold">{data.totalClients}</div>
              <div className="text-sm font-medium text-muted-foreground">Total Clients</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
              <Salad className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-bold">{data.activePlans}</div>
              <div className="text-sm font-medium text-muted-foreground">Active Plans</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-bold">{data.averageAdherence}%</div>
              <div className="text-sm font-medium text-muted-foreground">Avg Adherence</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-bold">{data.todaySessions}</div>
              <div className="text-sm font-medium text-muted-foreground">Today's Sessions</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Clients Needing Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data.clientsNeedingAttention || []).map((client: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <div className="font-semibold">{client.name}</div>
                    <div className="text-sm text-destructive">{client.reason}</div>
                  </div>
                  <Link href={`/patients/${client.id}`}>
                    <Button variant="outline" size="sm">Review</Button>
                  </Link>
                </div>
              ))}
              {(!data.clientsNeedingAttention || data.clientsNeedingAttention.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">All clients are on track</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(data.recentActivity || []).map((activity: any, i: number) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== data.recentActivity.length - 1 && (
                    <div className="absolute left-[11px] top-8 bottom-[-24px] w-[2px] bg-border" />
                  )}
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 z-10">
                    <Activity className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{activity.title}</div>
                    <div className="text-sm text-muted-foreground">{activity.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">{activity.time}</div>
                  </div>
                </div>
              ))}
              {(!data.recentActivity || data.recentActivity.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
