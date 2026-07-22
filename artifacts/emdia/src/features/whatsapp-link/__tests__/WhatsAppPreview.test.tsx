import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { Router } from "wouter";
import { ProtectedRoute } from "@/App";
import WhatsAppPreview, { isWhatsAppLinkEnabled } from "@/pages/whatsapp-preview";
import { useAuth } from "@/lib/auth-context";

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn(() => vi.fn(async () => ({ data: {} }))),
}));

vi.mock("@/lib/firebase", () => ({ functions: {} }));

const mockedUseAuth = vi.mocked(useAuth);

function authenticated() {
  return {
    user: { uid: "test-user" } as any,
    loading: false,
    isAdmin: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    logOut: vi.fn(),
  };
}

function unauthenticated() {
  return { ...authenticated(), user: null };
}

describe("WhatsAppPreview — feature flag e proteção", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("1. feature flag desligada redireciona usuário autenticado para /dashboard", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    vi.stubEnv("VITE_ENABLE_WHATSAPP_LINK", "false");
    render(
      <Router>
        <ProtectedRoute component={WhatsAppPreview} />
      </Router>
    );
    expect(screen.queryByText(/Emdia no Zap/i)).not.toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it("2. feature flag ausente (padrão de produção) mantém a experiência desligada", () => {
    expect(isWhatsAppLinkEnabled(undefined)).toBe(false);
    expect(isWhatsAppLinkEnabled("")).toBe(false);
    expect(isWhatsAppLinkEnabled("1")).toBe(false);
  });

  it("3. usuário não autenticado continua protegido mesmo com a flag ativa", () => {
    mockedUseAuth.mockReturnValue(unauthenticated());
    vi.stubEnv("VITE_ENABLE_WHATSAPP_LINK", "true");
    render(
      <Router>
        <ProtectedRoute component={WhatsAppPreview} />
      </Router>
    );
    expect(screen.queryByText(/Emdia no Zap/i)).not.toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it("4. feature flag ligada e usuário autenticado abre a página normalmente", async () => {
    mockedUseAuth.mockReturnValue(authenticated());
    vi.stubEnv("VITE_ENABLE_WHATSAPP_LINK", "true");
    render(
      <Router>
        <ProtectedRoute component={WhatsAppPreview} />
      </Router>
    );
    expect(await screen.findByRole("heading", { name: /Emdia no Zap/i })).toBeInTheDocument();
    vi.unstubAllEnvs();
  });
});
