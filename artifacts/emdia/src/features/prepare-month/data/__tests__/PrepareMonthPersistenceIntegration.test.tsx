import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrepareMonthPage } from "../../PrepareMonthPage";
import { useAuth } from "@/lib/auth-context";
import type { User } from "firebase/auth";

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((..._args: unknown[]) => ({ path: "mock-doc-ref" })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({ db: {} }));

import { getDoc, setDoc } from "firebase/firestore";

const mockedUseAuth = vi.mocked(useAuth);

function authenticated() {
  return {
    user: { uid: "user-1" } as User,
    loading: false,
    isAdmin: false,
    signUp: vi.fn(async () => undefined),
    signIn: vi.fn(async () => undefined),
    signInWithGoogle: vi.fn(async () => undefined),
    logOut: vi.fn(async () => undefined),
  };
}

function snapshot(exists: boolean, data?: unknown) {
  return { exists: () => exists, data: () => data };
}

function baseSavedDocument(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    metadata: {
      schemaVersion: 1,
      createdAt: "2026-07-20T12:00:00.000Z",
      updatedAt: "2026-07-20T12:00:00.000Z",
      lastConfirmedAt: "2026-07-20T12:00:00.000Z",
      source: "prepare_month_prototype",
      dataQuality: "partial",
      completeness: { referenceBalance: true, minimumReserve: false, expectedIncome: false, recurringCommitments: false, protectedGoals: false },
      revision: 1,
    },
    profile: {},
    calculationPreferences: {
      includeProbableIncome: false,
      includeUncertainIncome: false,
      minimumDataQuality: "insufficient",
      planningHorizonDays: 30,
      protectMinimumReserve: true,
      includePausedGoals: false,
    },
    referenceBalance: {
      amountInCents: 150000,
      referenceDate: "2026-07-20",
      source: "user_input",
      confidence: "confirmed",
      lastConfirmedAt: "2026-07-20T12:00:00.000Z",
    },
    minimumReserve: { status: "missing" },
    expectedIncomes: [],
    recurringCommitments: [],
    protectedGoals: [],
    ...overrides,
  };
}

function fillBalance(amount = "1000,00", date = "2026-07-20") {
  fireEvent.change(screen.getByLabelText(/Saldo de hoje/i), { target: { value: amount } });
  fireEvent.change(screen.getByLabelText(/Data desse saldo/i), { target: { value: date } });
}

function clickContinuar() {
  fireEvent.click(screen.getByRole("button", { name: /^Continuar$/i }));
}

async function advanceToPreview() {
  fillBalance();
  clickContinuar(); // reserve
  clickContinuar(); // income
  clickContinuar(); // commitments
  clickContinuar(); // goals
  clickContinuar(); // preview
  await screen.findByRole("heading", { name: /Veja como seu mês pode ficar/i });
}

describe("Prepare seu mês — persistência integrada (Firebase mockado)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue(authenticated());
  });

  it("1. carrega o contexto existente ao abrir e preenche o formulário", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce(snapshot(true, baseSavedDocument()) as never);
    render(<PrepareMonthPage />);

    await waitFor(() => {
      expect((screen.getByLabelText(/Saldo de hoje/i) as HTMLInputElement).value).toBe("1500,00");
    });
  });

  it("2. salvar mostra 'Salvando...' e depois a confirmação de sucesso", async () => {
    // getDoc is called once for the initial load and again inside saveCurrent's
    // own pre-write check — both resolve "not found" since nothing exists yet.
    vi.mocked(getDoc).mockResolvedValue(snapshot(false) as never);
    vi.mocked(setDoc).mockResolvedValueOnce(undefined as never);
    render(<PrepareMonthPage />);

    await advanceToPreview();
    fireEvent.click(screen.getByRole("button", { name: /Salvar meu planejamento/i }));

    await waitFor(() => expect(screen.getByText(/Seu planejamento foi salvo\./i)).toBeInTheDocument());
    expect(setDoc).toHaveBeenCalledTimes(1);
  });

  it("3. erro ao salvar mantém os dados preenchidos no formulário", async () => {
    vi.mocked(getDoc).mockResolvedValue(snapshot(false) as never);
    vi.mocked(setDoc).mockRejectedValueOnce(new Error("network down"));
    render(<PrepareMonthPage />);

    await advanceToPreview();
    fireEvent.click(screen.getByRole("button", { name: /Salvar meu planejamento/i }));

    await waitFor(() =>
      expect(screen.getByText(/Não foi possível salvar agora\. Seus dados continuam nesta tela\./i)).toBeInTheDocument()
    );

    // Navigate back to the balance step (preview -> goals -> commitments -> income -> reserve -> balance)
    // and confirm the value survived the error.
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole("button", { name: /^Voltar$/i }));
    }
    expect((screen.getByLabelText(/Saldo de hoje/i) as HTMLInputElement).value).toBe("1000,00");
  });

  it("4. clique duplo em salvar dispara apenas uma gravação", async () => {
    vi.mocked(getDoc).mockResolvedValue(snapshot(false) as never);
    let resolveSetDoc: () => void = () => {};
    vi.mocked(setDoc).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSetDoc = () => resolve(undefined);
        })
    );
    render(<PrepareMonthPage />);

    await advanceToPreview();
    const saveButton = screen.getByRole("button", { name: /Salvar meu planejamento/i });
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    // Wait until the (single) in-flight saveCurrent call has actually reached
    // setDoc — it awaits a getDoc pre-check first — before resolving it.
    await waitFor(() => expect(setDoc).toHaveBeenCalledTimes(1));
    resolveSetDoc();
    await waitFor(() => expect(screen.getByText(/Seu planejamento foi salvo\./i)).toBeInTheDocument());
    expect(setDoc).toHaveBeenCalledTimes(1);
  });

  it("5. usuário não autenticado continua vendo o aviso de simulação, sem botão de salvar", async () => {
    mockedUseAuth.mockReturnValue({ ...authenticated(), user: null });
    render(<PrepareMonthPage />);

    await advanceToPreview();
    expect(screen.getAllByText(/Esta é uma simulação\. Nada será salvo\./i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Salvar meu planejamento/i })).not.toBeInTheDocument();
    expect(getDoc).not.toHaveBeenCalled();
  });
});
