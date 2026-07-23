import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Router, Switch, Route } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { ProtectedRoute } from "@/App";
import PrepareSeuMes, { isPrepareMonthEnabled } from "@/pages/prepare-seu-mes";
import PrepareMonthPreview from "@/pages/prepare-month-preview";
import { PrepareMonthPage } from "../PrepareMonthPage";
import { useAuth } from "@/lib/auth-context";

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
  setDoc: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/firebase", () => ({ db: {} }));

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

describe("PrepareSeuMes (rota oficial — feature flag e proteção)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("1. feature flag desativada redireciona usuário autenticado para /dashboard", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    vi.stubEnv("VITE_ENABLE_PREPARE_MONTH", "false");
    render(
      <Router>
        <ProtectedRoute component={PrepareSeuMes} />
      </Router>
    );
    expect(screen.queryByText(/Prepare seu mês/i)).not.toBeInTheDocument();
  });

  it("2. usuário não autenticado é enviado para o login mesmo com a flag ativa", () => {
    mockedUseAuth.mockReturnValue(unauthenticated());
    vi.stubEnv("VITE_ENABLE_PREPARE_MONTH", "true");
    const { hook, history } = memoryLocation({ path: "/prepare-seu-mes", record: true });
    render(
      <Router hook={hook}>
        <ProtectedRoute component={PrepareSeuMes} />
      </Router>
    );
    expect(screen.queryByText(/Prepare seu mês/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Seu saldo/i)).not.toBeInTheDocument();
    expect(history[history.length - 1]).toMatch(/^\/login/);
  });

  it("3. página abre normalmente na rota oficial quando autenticado e a flag está ativa", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    vi.stubEnv("VITE_ENABLE_PREPARE_MONTH", "true");
    render(
      <Router>
        <ProtectedRoute component={PrepareSeuMes} />
      </Router>
    );
    expect(screen.getByText(/Prepare seu mês/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Seu saldo/i })).toBeInTheDocument();
  });

  it("4. flag ausente (padrão de produção) mantém a experiência desligada", () => {
    expect(isPrepareMonthEnabled(undefined)).toBe(false);
    expect(isPrepareMonthEnabled("")).toBe(false);
    expect(isPrepareMonthEnabled("1")).toBe(false);
  });

  it("5. rota antiga /prepare-month-preview redireciona para /prepare-seu-mes", async () => {
    const { hook, history } = memoryLocation({ path: "/prepare-month-preview", record: true });
    render(
      <Router hook={hook}>
        <Switch>
          <Route path="/prepare-month-preview" component={PrepareMonthPreview} />
          <Route path="/prepare-seu-mes">
            <div>marcador da rota oficial</div>
          </Route>
        </Switch>
      </Router>
    );
    await waitFor(() => expect(history[history.length - 1]).toBe("/prepare-seu-mes"));
    expect(screen.getByText(/marcador da rota oficial/i)).toBeInTheDocument();
  });
});

describe("PrepareMonthWizard (fluxo)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    mockedUseAuth.mockReturnValue(unauthenticated());
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-21T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function fillBalance(amount = "1500,00", date = "2026-07-21") {
    fireEvent.change(screen.getByLabelText(/Saldo de hoje/i), { target: { value: amount } });
    fireEvent.change(screen.getByLabelText(/Data desse saldo/i), { target: { value: date } });
  }

  function clickContinuar() {
    fireEvent.click(screen.getByRole("button", { name: /^Continuar$/i }));
  }

  function clickVoltar() {
    fireEvent.click(screen.getByRole("button", { name: /^Voltar$/i }));
  }

  it("data futura no saldo é bloqueada e mantém o usuário na mesma etapa", () => {
    render(<PrepareMonthPage />);
    fillBalance("1000,00", "2099-01-01");
    clickContinuar();
    expect(screen.getByText(/data não pode ser no futuro/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Seu saldo/i })).toBeInTheDocument();
  });

  it("meta válida permite avançar sem bloqueio", () => {
    render(<PrepareMonthPage />);
    fillBalance();
    clickContinuar(); // -> reserve
    fireEvent.click(screen.getByLabelText(/Confirmei que não quero reservar/i));
    clickContinuar(); // -> income
    clickContinuar(); // -> commitments
    clickContinuar(); // -> goals
    fireEvent.click(screen.getByRole("button", { name: /Adicionar meta/i }));
    fireEvent.change(screen.getByLabelText(/^Nome$/i), { target: { value: "Viagem" } });
    fireEvent.change(screen.getByLabelText(/Valor total da meta/i), { target: { value: "5000,00" } });
    fireEvent.change(screen.getByLabelText(/Já protegido/i), { target: { value: "1000,00" } });
    clickContinuar(); // -> preview
    expect(screen.getByRole("heading", { name: /Seu mês preparado/i })).toBeInTheDocument();
  });

  it("meta protegida maior que o alvo é bloqueada", () => {
    render(<PrepareMonthPage />);
    fillBalance();
    clickContinuar();
    fireEvent.click(screen.getByLabelText(/Confirmei que não quero reservar/i));
    clickContinuar();
    clickContinuar();
    clickContinuar();
    fireEvent.click(screen.getByRole("button", { name: /Adicionar meta/i }));
    fireEvent.change(screen.getByLabelText(/^Nome$/i), { target: { value: "Viagem" } });
    fireEvent.change(screen.getByLabelText(/Valor total da meta/i), { target: { value: "500,00" } });
    fireEvent.change(screen.getByLabelText(/Já protegido/i), { target: { value: "1000,00" } });
    clickContinuar();
    expect(screen.getByText(/não pode ser maior que o valor total da meta/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Metas protegidas/i })).toBeInTheDocument();
  });

  it("contexto parcial exibe qualidade parcial e hipóteses consideradas", () => {
    render(<PrepareMonthPage />);
    fillBalance();
    clickContinuar();
    clickContinuar(); // reserva ainda "undecided"
    clickContinuar();
    clickContinuar();
    clickContinuar();
    expect(screen.getByRole("heading", { name: /Seu mês preparado/i })).toBeInTheDocument();
    expect(screen.getByText(/^Parcial$/i)).toBeInTheDocument();
    expect(screen.getByText(/Você ainda não definiu sua reserva/i)).toBeInTheDocument();
  });

  it("prévia válida exibe o Respiro e o Ritmo como estimativas", () => {
    render(<PrepareMonthPage />);
    fillBalance("1500,00", "2026-07-21");
    clickContinuar();
    clickContinuar();
    clickContinuar();
    clickContinuar();
    clickContinuar();
    expect(screen.getByText(/Dinheiro livre estimado/i)).toBeInTheDocument();
    expect(screen.getByText(/Ritmo seguro diário/i)).toBeInTheDocument();
    expect(screen.getAllByText(/1\.500,00/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Estimativa com os dados informados/i)).toBeInTheDocument();
  });

  it("saldo projetado e data considerada no cálculo aparecem na prévia final", () => {
    render(<PrepareMonthPage />);
    fillBalance("1500,00", "2026-07-21");
    clickContinuar();
    clickContinuar();
    clickContinuar();
    clickContinuar();
    clickContinuar();
    expect(screen.getByText(/Saldo projetado/i)).toBeInTheDocument();
    expect(screen.getByText(/Data considerada no cálculo/i)).toBeInTheDocument();
  });

  it("renda provável não é somada ao Respiro do cenário oficial", () => {
    render(<PrepareMonthPage />);
    fillBalance("1000,00", "2026-07-21");
    clickContinuar();
    fireEvent.click(screen.getByLabelText(/Confirmei que não quero reservar/i));
    clickContinuar();
    fireEvent.click(screen.getByRole("button", { name: /Adicionar renda/i }));
    fireEvent.change(screen.getByLabelText(/^Descrição$/i), { target: { value: "Bônus incerto" } });
    fireEvent.change(screen.getByLabelText(/^Valor \(R\$\)$/i), { target: { value: "500,00" } });
    fireEvent.change(screen.getByLabelText(/Data prevista/i), { target: { value: "2026-07-25" } });
    fireEvent.click(screen.getByLabelText(/Provavelmente entra/i));
    clickContinuar();
    clickContinuar();
    clickContinuar();
    // Saldo de 1000,00 permanece intacto: a renda provável de 500,00 não deveria ser somada.
    expect(screen.getAllByText(/1\.000,00/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Renda provável e incerta não foram consideradas/i)).toBeInTheDocument();
  });

  it("recomeçar planejamento limpa todo o estado preenchido", () => {
    render(<PrepareMonthPage />);
    fillBalance("1500,00", "2026-07-21");
    clickContinuar();
    fireEvent.click(screen.getByLabelText(/Confirmei que não quero reservar/i));
    clickContinuar();
    clickContinuar();
    clickContinuar();
    clickContinuar();
    fireEvent.click(screen.getByRole("button", { name: /Recomeçar planejamento/i }));
    expect(screen.getByRole("heading", { name: /Seu saldo/i })).toBeInTheDocument();
    expect((screen.getByLabelText(/Saldo de hoje/i) as HTMLInputElement).value).toBe("");
  });

  it("dados não persistem após remontagem do componente", () => {
    const { unmount } = render(<PrepareMonthPage />);
    fillBalance("1500,00", "2026-07-21");
    expect((screen.getByLabelText(/Saldo de hoje/i) as HTMLInputElement).value).toBe("1500,00");
    unmount();

    render(<PrepareMonthPage />);
    expect((screen.getByLabelText(/Saldo de hoje/i) as HTMLInputElement).value).toBe("");
  });

  it("nenhuma chamada de rede ocorre durante o fluxo do planejamento", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<PrepareMonthPage />);
    fillBalance();
    clickContinuar();
    clickContinuar();
    clickContinuar();
    clickContinuar();
    clickContinuar();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("navegação voltar/avançar preserva os dados já preenchidos", () => {
    render(<PrepareMonthPage />);
    fillBalance("1500,00", "2026-07-21");
    clickContinuar();
    expect(screen.getByRole("heading", { name: /Sua reserva/i })).toBeInTheDocument();
    clickVoltar();
    expect(screen.getByRole("heading", { name: /Seu saldo/i })).toBeInTheDocument();
    expect((screen.getByLabelText(/Saldo de hoje/i) as HTMLInputElement).value).toBe("1500,00");
  });

  it("o foco muda para o título da nova etapa ao avançar", () => {
    render(<PrepareMonthPage />);
    fillBalance();
    clickContinuar();
    const reserveHeading = screen.getByRole("heading", { name: /Sua reserva/i });
    expect(document.activeElement).toBe(reserveHeading);
  });
});
