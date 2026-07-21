import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { UserPlanProvider } from "@/lib/useUserPlan";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Cadastro from "@/pages/cadastro";
import Dashboard from "@/pages/dashboard";
import Transacoes from "@/pages/transacoes";
import Upgrade from "@/pages/upgrade";
import NotFound from "@/pages/not-found";
import TodayPreview from "@/pages/today-preview";
import PrepareMonthPreview from "@/pages/prepare-month-preview";

export function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;

  return <Component />;
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (user) return <Redirect to="/dashboard" />;

  return <Component />;
}

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login">
        <PublicRoute component={Login} />
      </Route>
      <Route path="/cadastro">
        <PublicRoute component={Cadastro} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/transacoes">
        <ProtectedRoute component={Transacoes} />
      </Route>
      <Route path="/upgrade">
        <ProtectedRoute component={Upgrade} />
      </Route>
      <Route path="/today-preview">
        <ProtectedRoute component={TodayPreview} />
      </Route>
      <Route path="/prepare-month-preview">
        <ProtectedRoute component={PrepareMonthPreview} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserPlanProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </UserPlanProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
