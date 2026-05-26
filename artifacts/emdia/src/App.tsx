import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Cadastro from "@/pages/cadastro";
import Dashboard from "@/pages/dashboard";
import Transacoes from "@/pages/transacoes";
import NotFound from "@/pages/not-found";
import { Component, ReactNode } from "react";

// Error Boundary para capturar erros React
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Erro capturado pelo ErrorBoundary:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4">
          <div className="bg-[#1A1F3A] border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Algo deu errado</h2>
            <p className="text-gray-400 mb-4">Desculpe, ocorreu um erro inesperado.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#1AC87E] hover:bg-[#15B36D] text-[#0A0F1E] font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Componente Loading reutilizável
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-[#1AC87E] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) return <LoadingSpinner />;

  if (!user) {
    return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
  }

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
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
