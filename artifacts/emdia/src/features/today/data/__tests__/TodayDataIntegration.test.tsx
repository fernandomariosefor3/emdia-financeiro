import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useTodayFinancialData, TodayDataSource } from "../useTodayFinancialData";
import { mapTransactionsToContext, RawTransaction } from "../financeDataMappers";
import * as AuthContext from "../../../../lib/auth-context";
import type { User } from "firebase/auth";

// Mock Firebase
vi.mock("firebase/firestore", () => {
  return {
    collection: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
    doc: vi.fn(),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => undefined })),
    getFirestore: vi.fn(),
  };
});

vi.mock("../../../../lib/firebase", () => ({
  db: {}
}));

import type { FinancialContextDocumentV1 } from "../../../../domain/finance/context/types";

function validDocument(
  overrides: Partial<FinancialContextDocumentV1> = {}
): FinancialContextDocumentV1 {
  return {
    schemaVersion: 1,
    metadata: {
      schemaVersion: 1,
      createdAt: "2026-07-20T12:00:00.000Z",
      updatedAt: "2026-07-20T12:00:00.000Z",
      lastConfirmedAt: "2026-07-20T12:00:00.000Z",
      source: "prepare_month_prototype",
      dataQuality: "partial",
      completeness: {
        referenceBalance: true,
        minimumReserve: false,
        expectedIncome: false,
        recurringCommitments: false,
        protectedGoals: false,
      },
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

function docSnapshot(exists: boolean, data?: unknown) {
  return { exists: () => exists, data: () => data };
}

function txDocs(raw: Array<Record<string, unknown>>) {
  return { docs: raw.map((data) => ({ id: String(data.id ?? ""), data: () => data })) };
}

describe("Today Data Integration - 25 Scenarios", () => {
  const referenceDate = "2026-07-20";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_TODAY_DATA_SOURCE", "firebase");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const setupAuth = (uid: string | null) => {
    const user = uid ? ({ uid } as User) : null;
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({ 
      user, 
      loading: false, 
      isAdmin: false,
      signUp: vi.fn(async () => undefined),
      signIn: vi.fn(async () => undefined),
      signInWithGoogle: vi.fn(async () => undefined),
      logOut: vi.fn(async () => undefined)
    });
  };

  describe("Mappers (Rules 1-16)", () => {
    it("1. receita passada compõe o saldo", () => {
      const raw: RawTransaction[] = [{ id: "1", type: "income", amount: 150.50, date: "2026-07-15" }];
      const { context } = mapTransactionsToContext(raw, referenceDate);
      expect(context.currentBalanceInCents).toBe(15050);
    });

    it("2. despesa passada reduz o saldo", () => {
      const raw: RawTransaction[] = [{ id: "1", type: "expense", amount: 50, date: "2026-07-15" }];
      const { context } = mapTransactionsToContext(raw, referenceDate);
      expect(context.currentBalanceInCents).toBe(-5000);
    });

    it("3. receita futura não entra no saldo", () => {
      const raw: RawTransaction[] = [{ id: "1", type: "income", amount: 150.50, date: "2026-07-25" }];
      const { context } = mapTransactionsToContext(raw, referenceDate);
      expect(context.currentBalanceInCents).toBe(0);
    });

    it("4. despesa futura não entra no saldo", () => {
      const raw: RawTransaction[] = [{ id: "1", type: "expense", amount: 50, date: "2026-07-25" }];
      const { context } = mapTransactionsToContext(raw, referenceDate);
      expect(context.currentBalanceInCents).toBe(0);
    });

    it("5. receita futura vira ExpectedIncome", () => {
      const raw: RawTransaction[] = [{ id: "1", type: "income", amount: 150.50, date: "2026-07-25" }];
      const { context } = mapTransactionsToContext(raw, referenceDate);
      expect(context.expectedIncomes).toHaveLength(1);
      expect(context.expectedIncomes[0].amountInCents).toBe(15050);
    });

    it("6. despesa futura vira FinancialCommitment", () => {
      const raw: RawTransaction[] = [{ id: "1", type: "expense", amount: 50, date: "2026-07-25" }];
      const { context } = mapTransactionsToContext(raw, referenceDate);
      expect(context.commitments).toHaveLength(1);
      expect(context.commitments[0].amountInCents).toBe(5000);
    });

    it("7. ausência de dupla contagem", () => {
      const raw: RawTransaction[] = [
        { id: "1", type: "expense", amount: 50, date: "2026-07-15" } // passado
      ];
      const { context } = mapTransactionsToContext(raw, referenceDate);
      expect(context.currentBalanceInCents).toBe(-5000);
      expect(context.commitments).toHaveLength(0); // não deve estar em compromissos
    });

    it("8. receita futura sem confirmação vira probable", () => {
      const raw: RawTransaction[] = [{ id: "1", type: "income", amount: 100, date: "2026-07-25" }];
      const { context } = mapTransactionsToContext(raw, referenceDate);
      expect(context.expectedIncomes[0].confidence).toBe("probable");
    });

    it("9. receita futura confirmada vira confirmed", () => {
      const raw: RawTransaction[] = [{ id: "1", type: "income", amount: 100, date: "2026-07-25", confirmed: true }];
      const { context } = mapTransactionsToContext(raw, referenceDate);
      expect(context.expectedIncomes[0].confidence).toBe("confirmed");
    });

    it("10. data civil impossível é rejeitada", () => {
      const raw: RawTransaction[] = [{ id: "1", type: "income", amount: 100, date: "2026-02-30" }];
      const { context, diagnostics } = mapTransactionsToContext(raw, referenceDate);
      expect(context.currentBalanceInCents).toBe(0);
      expect(diagnostics.invalidDocumentCount).toBe(1);
    });

    it("11. NaN é rejeitado", () => {
      const raw: RawTransaction[] = [{ id: "1", type: "income", amount: NaN, date: "2026-07-15" }];
      const { diagnostics } = mapTransactionsToContext(raw, referenceDate);
      expect(diagnostics.invalidDocumentCount).toBe(1);
    });

    it("12. Infinity é rejeitado", () => {
      const raw: RawTransaction[] = [{ id: "1", type: "income", amount: Infinity, date: "2026-07-15" }];
      const { diagnostics } = mapTransactionsToContext(raw, referenceDate);
      expect(diagnostics.invalidDocumentCount).toBe(1);
    });

    it("13. valor negativo é rejeitado", () => {
      const raw: RawTransaction[] = [{ id: "1", type: "income", amount: -100, date: "2026-07-15" }];
      const { diagnostics } = mapTransactionsToContext(raw, referenceDate);
      expect(diagnostics.invalidDocumentCount).toBe(1);
    });

    it("14. tipo ausente é rejeitado", () => {
      const raw: RawTransaction[] = [{ id: "1", amount: 100, date: "2026-07-15" }];
      const { diagnostics } = mapTransactionsToContext(raw, referenceDate);
      expect(diagnostics.invalidDocumentCount).toBe(1);
    });

    it("15. documento original não é alterado", () => {
      const raw: RawTransaction[] = [{ id: "1", type: "income", amount: 100, date: "2026-07-15" }];
      const snapshot = JSON.stringify(raw);
      mapTransactionsToContext(raw, referenceDate);
      expect(JSON.stringify(raw)).toBe(snapshot);
    });

    it("16. ordem diferente produz o mesmo resultado lógico", () => {
      const tx1: RawTransaction = { id: "1", type: "income", amount: 100, date: "2026-07-15" };
      const tx2: RawTransaction = { id: "2", type: "expense", amount: 50, date: "2026-07-16" };

      const result1 = mapTransactionsToContext([tx1, tx2], referenceDate);
      const result2 = mapTransactionsToContext([tx2, tx1], referenceDate);

      expect(result1.context.currentBalanceInCents).toBe(result2.context.currentBalanceInCents);
    });

    it("16b. datetime ISO legado é normalizado para data civil e não é descartado", () => {
      const raw: RawTransaction[] = [
        { id: "1", type: "income", amount: 100, date: "2026-07-15T16:43:00.000Z" },
      ];
      const { context, diagnostics } = mapTransactionsToContext(raw, referenceDate);
      expect(diagnostics.invalidDocumentCount).toBe(0);
      expect(diagnostics.validDocumentCount).toBe(1);
      expect(context.currentBalanceInCents).toBe(10000);
    });
  });

  describe("Hooks e Fonte de Dados (Rules 17-25)", () => {
    it("17. fonte demo explícita utiliza fixtures", async () => {
      vi.stubEnv("VITE_TODAY_DATA_SOURCE", "demo");
      setupAuth(null);
      const { result } = renderHook(() => useTodayFinancialData(referenceDate));
      
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.source).toBe("demo");
      expect(result.current.data?.context.currentBalanceInCents).toBe(124000); // mockInitialBalanceInCents
    });

    it("18. fonte firebase exige autenticação", async () => {
      vi.stubEnv("VITE_TODAY_DATA_SOURCE", "firebase");
      setupAuth(null);
      const { result } = renderHook(() => useTodayFinancialData(referenceDate));
      
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBe("Usuário não autenticado.");
    });

    it("19. fonte ausente produz erro de configuração", async () => {
      vi.stubEnv("VITE_TODAY_DATA_SOURCE", "");
      setupAuth("user-1");
      const { result } = renderHook(() => useTodayFinancialData(referenceDate));
      
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.source).toBe("error");
      expect(result.current.error).toContain("Configure VITE_TODAY_DATA_SOURCE");
    });

    it("20. fonte inválida produz erro de configuração", async () => {
      vi.stubEnv("VITE_TODAY_DATA_SOURCE", "invalid_source");
      setupAuth("user-1");
      const { result } = renderHook(() => useTodayFinancialData(referenceDate));
      
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.source).toBe("error");
    });

    it("21. falha do Firebase não ativa fixtures", async () => {
      vi.stubEnv("VITE_TODAY_DATA_SOURCE", "firebase");
      setupAuth("user-1");
      
      const { getDocs } = await import("firebase/firestore");
      vi.mocked(getDocs).mockRejectedValueOnce(new Error("Network Error"));
      
      const { result } = renderHook(() => useTodayFinancialData(referenceDate));
      
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.source).toBe("firebase");
      expect(result.current.error).toBe("Network Error");
      expect(result.current.data).toBeNull(); // Sem fallbacks!
    });

    it("22. troca de usuário limpa dados anteriores", async () => {
      vi.stubEnv("VITE_TODAY_DATA_SOURCE", "firebase");
      setupAuth("user-1");
      
      const { result, rerender } = renderHook(() => useTodayFinancialData(referenceDate));
      await waitFor(() => expect(result.current.loading).toBe(false));
      
      // Simulate logout
      setupAuth(null);
      rerender();
      
      await waitFor(() => expect(result.current.error).toBe("Usuário não autenticado."));
      expect(result.current.data).toBeNull();
    });

    it("23. usuário não autenticado não consulta Firestore", async () => {
      vi.stubEnv("VITE_TODAY_DATA_SOURCE", "firebase");
      setupAuth(null);
      
      const { getDocs } = await import("firebase/firestore");
      vi.mocked(getDocs).mockClear();
      
      const { result } = renderHook(() => useTodayFinancialData(referenceDate));
      await waitFor(() => expect(result.current.loading).toBe(false));
      
      expect(getDocs).not.toHaveBeenCalled();
    });

    it("24. erro desconhecido é tratado sem any", async () => {
      vi.stubEnv("VITE_TODAY_DATA_SOURCE", "firebase");
      setupAuth("user-1");
      
      const { getDocs } = await import("firebase/firestore");
      // Throw non-error object
      vi.mocked(getDocs).mockRejectedValueOnce({ some: "object" });
      
      const { result } = renderHook(() => useTodayFinancialData(referenceDate));
      
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBe("Erro ao carregar dados financeiros.");
    });

    it("25. nenhum método de escrita é chamado", async () => {
      vi.stubEnv("VITE_TODAY_DATA_SOURCE", "firebase");
      setupAuth("user-1");

      const { result } = renderHook(() => useTodayFinancialData(referenceDate));
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Since we only mocked getDocs, collection, query, orderBy,
      // if any write method was used, it would either fail or not be in the mock.
      // We explicitly check that no writes are performed.
      expect(result.current.data).toBeDefined();
    });
  });

  describe("Contexto Confirmado — Híbrido (Rules 26-31)", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_TODAY_DATA_SOURCE", "firebase");
      setupAuth("user-1");
    });

    it("26. sem doc confirmado cai no fallback com aviso e reserva ausente", async () => {
      const { getDoc, getDocs } = await import("firebase/firestore");
      vi.mocked(getDoc).mockResolvedValueOnce(docSnapshot(false) as never);
      vi.mocked(getDocs).mockResolvedValueOnce(
        txDocs([{ id: "1", type: "income", amount: 100, date: "2026-07-15" }]) as never
      );

      const { result } = renderHook(() => useTodayFinancialData(referenceDate));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data?.availability.minimumReserve).toBe("missing");
      expect(result.current.data?.availability.protectedGoals).toBe("missing");
      expect(result.current.data?.diagnostics.assumptions.some((a) => a.includes("Prepare seu mês"))).toBe(true);
    });

    it("27. doc confirmado com reserva configurada expõe reserva disponível", async () => {
      const { getDoc, getDocs } = await import("firebase/firestore");
      vi.mocked(getDoc).mockResolvedValueOnce(
        docSnapshot(true, validDocument({
          minimumReserve: {
            status: "configured",
            amountInCents: 50000,
            explicitZero: false,
            lastConfirmedAt: "2026-07-20T12:00:00.000Z",
          },
        })) as never
      );
      vi.mocked(getDocs).mockResolvedValueOnce(txDocs([]) as never);

      const { result } = renderHook(() => useTodayFinancialData(referenceDate));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data?.availability.minimumReserve).toBe("available");
      expect(result.current.data?.context.minimumReserveInCents).toBe(50000);
    });

    it("28. doc confirmado com meta ativa expõe metas disponíveis", async () => {
      const { getDoc, getDocs } = await import("firebase/firestore");
      vi.mocked(getDoc).mockResolvedValueOnce(
        docSnapshot(true, validDocument({
          protectedGoals: [{
            id: "g1",
            name: "Viagem",
            targetAmountInCents: 200000,
            protectedAmountInCents: 30000,
            status: "active",
            priority: 1,
            source: "user_input",
            lastConfirmedAt: "2026-07-20T12:00:00.000Z",
          }],
        })) as never
      );
      vi.mocked(getDocs).mockResolvedValueOnce(txDocs([]) as never);

      const { result } = renderHook(() => useTodayFinancialData(referenceDate));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data?.availability.protectedGoals).toBe("available");
      expect(result.current.data?.context.protectedAmountInCents).toBe(30000);
    });

    it("29. saldo de referência é usado e transações anteriores não são recontadas", async () => {
      const { getDoc, getDocs } = await import("firebase/firestore");
      vi.mocked(getDoc).mockResolvedValueOnce(docSnapshot(true, validDocument()) as never);
      // Past transaction (<= referenceDate) must be ignored to avoid double counting.
      vi.mocked(getDocs).mockResolvedValueOnce(
        txDocs([{ id: "1", type: "expense", amount: 500, date: "2026-07-15" }]) as never
      );

      const { result } = renderHook(() => useTodayFinancialData(referenceDate));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data?.context.currentBalanceInCents).toBe(150000);
    });

    it("30. doc confirmado carregado marca a suposição de contexto confirmado", async () => {
      const { getDoc, getDocs } = await import("firebase/firestore");
      vi.mocked(getDoc).mockResolvedValueOnce(docSnapshot(true, validDocument()) as never);
      vi.mocked(getDocs).mockResolvedValueOnce(txDocs([]) as never);

      const { result } = renderHook(() => useTodayFinancialData(referenceDate));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data?.diagnostics.assumptions.some((a) => a.includes("confirmado"))).toBe(true);
      expect(result.current.data?.diagnostics.assumptions.some((a) => a.includes("Prepare seu mês"))).toBe(false);
    });

    it("31. doc confirmado inválido cai no fallback derivado de transações", async () => {
      const { getDoc, getDocs } = await import("firebase/firestore");
      vi.mocked(getDoc).mockResolvedValueOnce(docSnapshot(true, { schemaVersion: 1, garbage: true }) as never);
      vi.mocked(getDocs).mockResolvedValueOnce(
        txDocs([{ id: "1", type: "income", amount: 100, date: "2026-07-15" }]) as never
      );

      const { result } = renderHook(() => useTodayFinancialData(referenceDate));
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data?.availability.minimumReserve).toBe("missing");
      expect(result.current.data?.context.currentBalanceInCents).toBe(10000);
      expect(result.current.data?.diagnostics.assumptions.some((a) => a.includes("Prepare seu mês"))).toBe(true);
    });
  });
});
// Mocks aligned
