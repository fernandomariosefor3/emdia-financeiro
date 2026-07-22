import { describe, it, expect, vi, beforeEach } from "vitest";
import { FirebaseFinancialContextRepository } from "../FirebaseFinancialContextRepository";
import { FinancialContextDocumentV1 } from "@/domain/finance/context/types";

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((..._args: unknown[]) => ({ path: "mock-doc-ref" })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({ db: {} }));

import { getDoc, setDoc } from "firebase/firestore";

const NOW = new Date("2026-07-22T10:00:00.000Z");

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

function snapshot(exists: boolean, data?: unknown) {
  return { exists: () => exists, data: () => data };
}

function createRepository() {
  return new FirebaseFinancialContextRepository({ authenticatedUserId: "user-1", now: () => NOW });
}

describe("FirebaseFinancialContextRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. carrega o contexto existente", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce(snapshot(true, validDocument()) as never);
    const repo = createRepository();
    const result = await repo.getCurrent("user-1");
    expect(result.status).toBe("found");
    if (result.status === "found") {
      expect(result.document.referenceBalance?.amountInCents).toBe(150000);
    }
  });

  it("2. contexto inexistente retorna not_found", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce(snapshot(false) as never);
    const repo = createRepository();
    const result = await repo.getCurrent("user-1");
    expect(result.status).toBe("not_found");
  });

  it("3. salva um contexto válido pela primeira vez (create)", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce(snapshot(false) as never);
    vi.mocked(setDoc).mockResolvedValueOnce(undefined as never);
    const repo = createRepository();
    const result = await repo.saveCurrent("user-1", validDocument(), null);

    expect(result.status).toBe("saved");
    expect(setDoc).toHaveBeenCalledTimes(1);
    if (result.status === "saved") {
      expect(result.document.metadata.revision).toBe(1);
      expect(result.document.metadata.createdAt).toBe(NOW.toISOString());
      expect(result.document.metadata.updatedAt).toBe(NOW.toISOString());
    }
  });

  it("4. bloqueia documento inválido sem gravar", async () => {
    const repo = createRepository();
    const invalid = validDocument({ schemaVersion: 2 as never });
    const result = await repo.saveCurrent("user-1", invalid, null);

    expect(result.status).toBe("invalid");
    expect(getDoc).not.toHaveBeenCalled();
    expect(setDoc).not.toHaveBeenCalled();
  });

  it("5. revisão desatualizada não sobrescreve silenciosamente", async () => {
    const existing = validDocument({ metadata: { ...validDocument().metadata, revision: 2 } });
    vi.mocked(getDoc).mockResolvedValueOnce(snapshot(true, existing) as never);
    const repo = createRepository();
    const result = await repo.saveCurrent("user-1", validDocument(), 1);

    expect(result.status).toBe("revision_conflict");
    if (result.status === "revision_conflict") {
      expect(result.currentRevision).toBe(2);
    }
    expect(setDoc).not.toHaveBeenCalled();
  });

  it("6. createdAt é preservado em uma atualização", async () => {
    const existing = validDocument({
      metadata: { ...validDocument().metadata, revision: 1, createdAt: "2026-01-01T00:00:00.000Z" },
    });
    vi.mocked(getDoc).mockResolvedValueOnce(snapshot(true, existing) as never);
    vi.mocked(setDoc).mockResolvedValueOnce(undefined as never);
    const repo = createRepository();
    const result = await repo.saveCurrent("user-1", validDocument(), 1);

    expect(result.status).toBe("saved");
    if (result.status === "saved") {
      expect(result.document.metadata.createdAt).toBe("2026-01-01T00:00:00.000Z");
      expect(result.document.metadata.revision).toBe(2);
      expect(result.document.metadata.updatedAt).toBe(NOW.toISOString());
    }
  });

  it("7. reserva mínima com zero explícito é preservada, distinta de ausente", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce(snapshot(false) as never);
    vi.mocked(setDoc).mockResolvedValueOnce(undefined as never);
    const repo = createRepository();
    const doc = validDocument({
      minimumReserve: { status: "configured", amountInCents: 0, explicitZero: true, lastConfirmedAt: "2026-07-20T12:00:00.000Z" },
    });
    const result = await repo.saveCurrent("user-1", doc, null);

    expect(result.status).toBe("saved");
    if (result.status === "saved") {
      expect(result.document.minimumReserve).toEqual({
        status: "configured",
        amountInCents: 0,
        explicitZero: true,
        lastConfirmedAt: "2026-07-20T12:00:00.000Z",
      });
    }
  });

  it("8. reserva ausente ('missing') permanece distinta de zero", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce(snapshot(false) as never);
    vi.mocked(setDoc).mockResolvedValueOnce(undefined as never);
    const repo = createRepository();
    const result = await repo.saveCurrent("user-1", validDocument({ minimumReserve: { status: "missing" } }), null);

    expect(result.status).toBe("saved");
    if (result.status === "saved") {
      expect(result.document.minimumReserve).toEqual({ status: "missing" });
    }
  });

  it("9. nenhum campo calculado (Respiro, Ritmo, Risco, recomendação) é persistido", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce(snapshot(false) as never);
    vi.mocked(setDoc).mockResolvedValueOnce(undefined as never);
    const repo = createRepository();

    const docWithLeakedFields = {
      ...validDocument(),
      breathingRoomInCents: 999999,
      safeDailyPaceInCents: 1234,
      topRisk: { reason: "should not persist" },
      recommendedAction: { title: "should not persist" },
    } as unknown as FinancialContextDocumentV1;

    await repo.saveCurrent("user-1", docWithLeakedFields, null);

    const persisted = vi.mocked(setDoc).mock.calls[0][1] as Record<string, unknown>;
    expect(persisted).not.toHaveProperty("breathingRoomInCents");
    expect(persisted).not.toHaveProperty("safeDailyPaceInCents");
    expect(persisted).not.toHaveProperty("topRisk");
    expect(persisted).not.toHaveProperty("recommendedAction");
  });

  it("10. gravação idempotente: mesmo idempotencyKey não grava de novo", async () => {
    const existing = validDocument({
      metadata: { ...validDocument().metadata, revision: 3, idempotencyKey: "retry-key-1" },
    });
    vi.mocked(getDoc).mockResolvedValueOnce(snapshot(true, existing) as never);
    const repo = createRepository();

    const retry = validDocument({
      metadata: { ...validDocument().metadata, idempotencyKey: "retry-key-1" },
    });
    // Intentionally pass a stale expectedRevision — idempotency must short-circuit before the revision check.
    const result = await repo.saveCurrent("user-1", retry, 0);

    expect(result.status).toBe("saved");
    if (result.status === "saved") {
      expect(result.document.metadata.revision).toBe(3);
    }
    expect(setDoc).not.toHaveBeenCalled();
  });

  it("11. uid nunca é aceito sem authenticatedUserId no construtor", () => {
    expect(() => new FirebaseFinancialContextRepository({ authenticatedUserId: "" })).toThrow();
  });
});
