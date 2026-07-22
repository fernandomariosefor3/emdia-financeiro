import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Router } from "wouter";
import { ProtectedRoute } from "@/App";
import PrepareMonthPreview, { isPrepareMonthEnabled } from "@/pages/prepare-month-preview";
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

describe("PrepareMonthPreview (Feature Flag e Proteção — 1 a 3)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("1. feature flag desativada redireciona usuário autenticado para /dashboard", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    vi.stubEnv("VITE_ENABLE_PREPARE_MONTH", "false");
    render(
      <Router>
        <ProtectedRoute component={PrepareMonthPreview} />
      </Router>
    );
    expect(screen.queryByText(/Prepare seu mês/i)).not.toBeInTheDocument();
  });

  it("2. usuário não autenticado continua protegido mesmo com a flag ativa", () => {
    mockedUseAuth.mockReturnValue(unauthenticated());
    vi.stubEnv("VITE_ENABLE_PREPARE_MONTH", "true");
    render(
      <Router>
        <ProtectedRoute component={PrepareMonthPreview} />
      </Router>
    );
    expect(screen.queryByText(/Prepare seu mês/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Seu ponto de partida/i)).not.toBeInTheDocument();
  });

  it("3. página abre normalmente quando autenticado e a flag está ativa", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    vi.stubEnv("VITE_ENABLE_PREPARE_MONTH", "true");
    render(
      <Router>
        <ProtectedRoute component={PrepareMonthPreview} />
      </Router>
    );
    expect(screen.getByText(/Prepare seu mês/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Seu ponto de partida/i })).toBeInTheDocument();
  });

  it("14. flag ausente (padrão de produção) mantém a experiência desligada", () => {
    expect(isPrepareMonthEnabled(undefined)).toBe(false);
  });
});

describe("PrepareMonthWizard (fluxo — 7 e 19 a 29)", () => {
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

  it("7. data futura no saldo é bloqueada e mantém o usuário na mesma etapa", () => {
    render(<PrepareMonthPage />);
    fillBalance("1000,00", "2099-01-01");
    clickContinuar();
    expect(screen.getByText(/data não pode ser no futuro/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Seu ponto de partida/i })).toBeInTheDocument();
  });

  it("19. meta válida permite avançar sem bloqueio", () => {
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
    expect(screen.getByRole("heading", { name: /Veja como seu mês pode ficar/i })).toBeInTheDocument();
  });

  it("20. meta protegida maior que o alvo é bloqueada", () => {
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
    expect(screen.getByRole("heading", { name: /O que você quer proteger/i })).toBeInTheDocument();
  });

  it("21. contexto parcial exibe qualidade parcial e hipóteses consideradas", () => {
    render(<PrepareMonthPage />);
    fillBalance();
    clickContinuar();
    clickContinuar(); // reserva ainda "undecided"
    clickContinuar();
    clickContinuar();
    clickContinuar();
    expect(screen.getByRole("heading", { name: /Veja como seu mês pode ficar/i })).toBeInTheDocument();
    expect(screen.getByText(/^Parcial$/i)).toBeInTheDocument();
    expect(screen.getByText(/Reserva mínima ainda não foi definida/i)).toBeInTheDocument();
  });

  it("22 e 23. prévia válida exibe o Respiro como estimativa", () => {
    render(<PrepareMonthPage />);
    fillBalance("1500,00", "2026-07-21");
    clickContinuar();
    clickContinuar();
    clickContinuar();
    clickContinuar();
    clickContinuar();
    expect(screen.getByText(/Dinheiro livre estimado/i)).toBeInTheDocument();
    expect(screen.getByText(/1\.500,00/)).toBeInTheDocument();
    expect(screen.getByText(/Estimativa com os dados informados/i)).toBeInTheDocument();
  });

  it("24. renda provável não é somada ao Respiro do cenário oficial", () => {
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
    expect(screen.getByText(/1\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/Renda provável e incerta não foram consideradas/i)).toBeInTheDocument();
  });

  it("25. reiniciar simulação limpa todo o estado preenchido", () => {
    render(<PrepareMonthPage />);
    fillBalance("1500,00", "2026-07-21");
    clickContinuar();
    fireEvent.click(screen.getByLabelText(/Confirmei que não quero reservar/i));
    clickContinuar();
    clickContinuar();
    clickContinuar();
    clickContinuar();
    fireEvent.click(screen.getByRole("button", { name: /Reiniciar simulação/i }));
    expect(screen.getByRole("heading", { name: /Seu ponto de partida/i })).toBeInTheDocument();
    expect((screen.getByLabelText(/Saldo de hoje/i) as HTMLInputElement).value).toBe("");
  });

  it("26. dados não persistem após remontagem do componente", () => {
    const { unmount } = render(<PrepareMonthPage />);
    fillBalance("1500,00", "2026-07-21");
    expect((screen.getByLabelText(/Saldo de hoje/i) as HTMLInputElement).value).toBe("1500,00");
    unmount();

    render(<PrepareMonthPage />);
    expect((screen.getByLabelText(/Saldo de hoje/i) as HTMLInputElement).value).toBe("");
  });

  it("27. nenhuma chamada de rede ocorre durante o fluxo do protótipo", () => {
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

  it("28. navegação voltar/avançar preserva os dados já preenchidos", () => {
    render(<PrepareMonthPage />);
    fillBalance("1500,00", "2026-07-21");
    clickContinuar();
    expect(screen.getByRole("heading", { name: /Reserva mínima/i })).toBeInTheDocument();
    clickVoltar();
    expect(screen.getByRole("heading", { name: /Seu ponto de partida/i })).toBeInTheDocument();
    expect((screen.getByLabelText(/Saldo de hoje/i) as HTMLInputElement).value).toBe("1500,00");
  });

  it("29. o foco muda para o título da nova etapa ao avançar", () => {
    render(<PrepareMonthPage />);
    fillBalance();
    clickContinuar();
    const reserveHeading = screen.getByText(/Reserva mínima/i);
    expect(document.activeElement).toBe(reserveHeading);
  });
});
