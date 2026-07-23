import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { Router } from "wouter";
import { FounderPlanPage } from "@/features/founder-plan";
import { createAnnualCheckoutSession } from "@/features/founder-plan/billingClient";
import { useAuth } from "@/lib/auth-context";

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/features/founder-plan/billingClient", () => ({
  createAnnualCheckoutSession: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedCreateCheckout = vi.mocked(createAnnualCheckoutSession);

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

function renderPlanos() {
  return render(
    <Router>
      <FounderPlanPage />
    </Router>
  );
}

describe("FounderPlanPage — Plano Fundador Emdia", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("1. exibe o nome do plano e o preço de R$ 9,99 por ano", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    vi.stubEnv("VITE_ENABLE_BILLING", "false");
    renderPlanos();

    expect(screen.getByRole("heading", { name: /Plano Fundador Emdia/i })).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*9,99/)).toBeInTheDocument();
    expect(screen.getByText(/por ano/i)).toBeInTheDocument();
    expect(screen.getByText(/Menos de R\$ 1 por mês/i)).toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it("2. lista os recursos obrigatórios do plano", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    vi.stubEnv("VITE_ENABLE_BILLING", "false");
    renderPlanos();

    expect(screen.getByText("Receitas e despesas")).toBeInTheDocument();
    expect(screen.getByText("Dashboard financeiro")).toBeInTheDocument();
    expect(screen.getByText("Prepare seu mês")).toBeInTheDocument();
    expect(screen.getByText("Respiro e Ritmo seguro")).toBeInTheDocument();
    expect(screen.getByText("Atualizações do aplicativo durante a assinatura")).toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it("3. exibe o aviso de Emdia no Zap em preparação", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    vi.stubEnv("VITE_ENABLE_BILLING", "false");
    renderPlanos();

    expect(screen.getByText(/Emdia no Zap.*em preparação/i)).toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it("4. exibe o texto obrigatório de renovação automática e cancelamento", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    vi.stubEnv("VITE_ENABLE_BILLING", "false");
    renderPlanos();

    expect(
      screen.getByText(/Assinatura anual com renovação automática\. Você poderá cancelar antes da próxima renovação\./i)
    ).toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it("5. com VITE_ENABLE_BILLING=false o botão mostra 'Assinaturas em breve' e fica desabilitado", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    vi.stubEnv("VITE_ENABLE_BILLING", "false");
    renderPlanos();

    const button = screen.getByRole("button", { name: /Assinaturas em breve/i });
    expect(button).toBeDisabled();
    vi.unstubAllEnvs();
  });

  it("6. com a flag ausente (padrão de produção) nenhum Checkout é iniciado ao clicar", async () => {
    mockedUseAuth.mockReturnValue(authenticated());
    vi.stubEnv("VITE_ENABLE_BILLING", undefined);
    renderPlanos();

    const user = userEvent.setup();
    const button = screen.getByRole("button", { name: /Assinaturas em breve/i });
    await user.click(button);

    expect(mockedCreateCheckout).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("7. com a flag ligada e usuário autenticado, o botão fica habilitado para assinar", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    vi.stubEnv("VITE_ENABLE_BILLING", "true");
    renderPlanos();

    const button = screen.getByRole("button", { name: /Assinar Plano Fundador/i });
    expect(button).toBeEnabled();
    vi.unstubAllEnvs();
  });
});
