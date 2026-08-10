import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { UserPlanProvider } from "@/lib/useUserPlan";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingSpinner } from "@/components/LoadingSpinner";
// Home is the landing page and the most common entry point — kept eager so
// it renders in the same chunk as the shell, with no lazy-load flash.
import Home from "@/pages/home";
// Every other route is code-split: each is only downloaded when visited,
// keeping the initial bundle within the web performance budget.
const Login = lazy(() => import("@/pages/login"));
const Cadastro = lazy(() => import("@/pages/cadastro"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Transacoes = lazy(() => import("@/pages/transacoes"));
const Upgrade = lazy(() => import("@/pages/upgrade"));
const NotFound = lazy(() => import("@/pages/not-found"));
const TodayPreview = lazy(() => import("@/pages/today-preview"));
const PrepareSeuMes = lazy(() => import("@/pages/prepare-seu-mes"));
const PrepareMonthPreview = lazy(() => import("@/pages/prepare-month-preview"));
const WhatsAppPreview = lazy(() => import("@/pages/whatsapp-preview"));
const TelegramPreview = lazy(() => import("@/pages/telegram-preview"));
const Planos = lazy(() => import("@/pages/planos"));
const PrivacyPage = lazy(() => import("@/pages/privacy").then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("@/pages/terms").then((m) => ({ default: m.TermsPage })));

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
      <Route path="/prepare-seu-mes">
        <ProtectedRoute component={PrepareSeuMes} />
      </Route>
      <Route path="/prepare-month-preview">
        <ProtectedRoute component={PrepareMonthPreview} />
      </Route>
      <Route path="/whatsapp-preview">
        <ProtectedRoute component={WhatsAppPreview} />
      </Route>
      <Route path="/telegram-preview">
        <ProtectedRoute component={TelegramPreview} />
      </Route>
      <Route path="/planos" component={Planos} />
      <Route path="/privacidade" component={PrivacyPage} />
      <Route path="/termos" component={TermsPage} />
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
              <Suspense fallback={<LoadingSpinner />}>
                <Router />
              </Suspense>
            </WouterRouter>
          </UserPlanProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
