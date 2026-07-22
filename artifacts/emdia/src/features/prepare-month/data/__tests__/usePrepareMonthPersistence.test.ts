import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { usePrepareMonthPersistence } from "../usePrepareMonthPersistence";
import { FinancialContextRepository } from "../FinancialContextRepository";
import { GetCurrentResult, SaveCurrentResult } from "../types";
import { FinancialContextDocumentV1 } from "@/domain/finance/context/types";
import * as AuthContext from "@/lib/auth-context";
import type { User } from "firebase/auth";

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

function authenticated(uid: string | null) {
  return {
    user: uid ? ({ uid } as User) : null,
    loading: false,
    isAdmin: false,
    signUp: vi.fn(async () => undefined),
    signIn: vi.fn(async () => undefined),
    signInWithGoogle: vi.fn(async () => undefined),
    logOut: vi.fn(async () => undefined),
  };
}

function validDocument(overrides: Partial<FinancialContextDocumentV1> = {}): FinancialContextDocumentV1 {
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
    minimumReserve: { status: "missing" },
    expectedIncomes: [],
    recurringCommitments: [],
    protectedGoals: [],
    ...overrides,
  };
}

class FakeRepository implements FinancialContextRepository {
  saveCalls: Array<{ uid: string; document: FinancialContextDocumentV1; expectedRevision: number | null }> = [];
  getCurrentResult: GetCurrentResult = { status: "not_found" };
  saveCurrentResult: SaveCurrentResult = { status: "saved", document: validDocument() };
  saveDelayMs = 0;

  async getCurrent(_uid: string): Promise<GetCurrentResult> {
    return this.getCurrentResult;
  }

  async saveCurrent(uid: string, document: FinancialContextDocumentV1, expectedRevision: number | null): Promise<SaveCurrentResult> {
    this.saveCalls.push({ uid, document, expectedRevision });
    if (this.saveDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.saveDelayMs));
    }
    return this.saveCurrentResult;
  }
}

const mockedUseAuth = vi.mocked(AuthContext.useAuth);

describe("usePrepareMonthPersistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. usuário não autenticado não carrega nem pode salvar", async () => {
    mockedUseAuth.mockReturnValue(authenticated(null));
    const repo = new FakeRepository();
    const { result } = renderHook(() => usePrepareMonthPersistence(() => repo));

    expect(result.current.canPersist).toBe(false);
    expect(result.current.loadStatus).toBe("idle");
  });

  it("2. carrega o contexto existente ao montar", async () => {
    mockedUseAuth.mockReturnValue(authenticated("user-1"));
    const repo = new FakeRepository();
    repo.getCurrentResult = { status: "found", document: validDocument({ metadata: { ...validDocument().metadata, revision: 5 } }) };
    const { result } = renderHook(() => usePrepareMonthPersistence(() => repo));

    await waitFor(() => expect(result.current.loadStatus).toBe("loaded"));
    expect(result.current.savedDocument?.metadata.revision).toBe(5);
  });

  it("3. salvar com sucesso atualiza o documento salvo", async () => {
    mockedUseAuth.mockReturnValue(authenticated("user-1"));
    const repo = new FakeRepository();
    repo.saveCurrentResult = { status: "saved", document: validDocument({ metadata: { ...validDocument().metadata, revision: 1 } }) };
    const { result } = renderHook(() => usePrepareMonthPersistence(() => repo));

    await act(async () => {
      await result.current.save(validDocument());
    });

    expect(result.current.saveStatus).toBe("success");
    expect(repo.saveCalls).toHaveLength(1);
  });

  it("4. evita envio duplicado quando salvar é chamado duas vezes rapidamente", async () => {
    mockedUseAuth.mockReturnValue(authenticated("user-1"));
    const repo = new FakeRepository();
    repo.saveDelayMs = 20;
    const { result } = renderHook(() => usePrepareMonthPersistence(() => repo));

    await act(async () => {
      const first = result.current.save(validDocument());
      const second = result.current.save(validDocument());
      await Promise.all([first, second]);
    });

    expect(repo.saveCalls).toHaveLength(1);
  });

  it("5. conflito de revisão é exposto sem apagar o documento salvo anterior", async () => {
    mockedUseAuth.mockReturnValue(authenticated("user-1"));
    const repo = new FakeRepository();
    repo.saveCurrentResult = { status: "revision_conflict", currentRevision: 4 };
    const { result } = renderHook(() => usePrepareMonthPersistence(() => repo));

    await act(async () => {
      await result.current.save(validDocument());
    });

    expect(result.current.saveStatus).toBe("error");
    expect(result.current.saveErrorMessage).toMatch(/atualizado em outro lugar/i);
  });

  it("6. tentar novamente reenvia o último documento após um erro", async () => {
    mockedUseAuth.mockReturnValue(authenticated("user-1"));
    const repo = new FakeRepository();
    repo.saveCurrentResult = { status: "error", message: "boom" };
    const { result } = renderHook(() => usePrepareMonthPersistence(() => repo));

    const doc = validDocument();
    await act(async () => {
      await result.current.save(doc);
    });
    expect(result.current.saveStatus).toBe("error");

    repo.saveCurrentResult = { status: "saved", document: doc };
    await act(async () => {
      await result.current.retrySave();
    });

    expect(result.current.saveStatus).toBe("success");
    expect(repo.saveCalls).toHaveLength(2);
  });
});
