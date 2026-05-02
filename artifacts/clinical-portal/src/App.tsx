import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import PatientDetail from "@/pages/PatientDetail";
import Consultations from "@/pages/Consultations";
import ConsultationDetail from "@/pages/ConsultationDetail";
import LabResults from "@/pages/LabResults";
import Prescriptions from "@/pages/Prescriptions";
import MealPlans from "@/pages/MealPlans";
import NutritionAnalytics from "@/pages/NutritionAnalytics";
import Layout from "@/components/Layout";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/" />;
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function ConsultationDetailWrapper() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/" />;
  return (
    <Layout fullHeight>
      <ConsultationDetail />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/patients"><ProtectedRoute component={Patients} /></Route>
      <Route path="/patients/:id"><ProtectedRoute component={PatientDetail} /></Route>
      <Route path="/consultations"><ProtectedRoute component={Consultations} /></Route>
      <Route path="/consultations/:id"><ConsultationDetailWrapper /></Route>
      <Route path="/lab-results"><ProtectedRoute component={LabResults} /></Route>
      <Route path="/prescriptions"><ProtectedRoute component={Prescriptions} /></Route>
      <Route path="/meal-plans"><ProtectedRoute component={MealPlans} /></Route>
      <Route path="/nutrition-analytics"><ProtectedRoute component={NutritionAnalytics} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
