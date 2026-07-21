import test from "node:test";
import assert from "node:assert";
import { validateFinancialContextDocument } from "../index";
import { FinancialContextDocumentV1 } from "../types";
import { MAX_MONEY_IN_CENTS } from "../constants";

const baseDoc: FinancialContextDocumentV1 = {
  schemaVersion: 1,
  metadata: {
    schemaVersion: 1,
    createdAt: "2026-07-20T12:00:00Z",
    updatedAt: "2026-07-20T12:00:00Z",
    lastConfirmedAt: "2026-07-20T12:00:00Z",
    source: "test",
    dataQuality: "complete",
    completeness: { referenceBalance: true, minimumReserve: true, expectedIncome: false, recurringCommitments: false, protectedGoals: false },
    revision: 1
  },
  profile: {},
  calculationPreferences: {
    includeProbableIncome: false,
    includeUncertainIncome: false,
    minimumDataQuality: "complete",
    planningHorizonDays: 90,
    protectMinimumReserve: true,
    includePausedGoals: false
  },
  referenceBalance: {
    amountInCents: 100000,
    referenceDate: "2026-07-20",
    source: "user_input",
    confidence: "confirmed",
    lastConfirmedAt: "2026-07-20T12:00:00Z"
  },
  minimumReserve: {
    status: "configured",
    amountInCents: 50000,
    explicitZero: false,
    lastConfirmedAt: "2026-07-20T12:00:00Z"
  },
  expectedIncomes: [],
  recurringCommitments: [],
  protectedGoals: []
};

test("Validation: Core Document and Schema", async (t) => {
  await t.test("1. documento V1 válido", () => {
    const res = validateFinancialContextDocument(baseDoc, "2026-07-20");
    assert.strictEqual(res.success, true);
  });

  await t.test("2. schemaVersion inválido", () => {
    const doc = { ...baseDoc, schemaVersion: 2 as any };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, false);
    if (!res.success) assert.strictEqual(res.errors[0].code, "INVALID_SCHEMA_VERSION");
  });

  await t.test("3. schemaVersion ausente", () => {
    const doc = { ...baseDoc };
    delete (doc as any).schemaVersion;
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, false);
    if (!res.success) assert.strictEqual(res.errors[0].code, "MISSING_SCHEMA_VERSION");
  });
});

test("Validation: Reference Balance", async (t) => {
  await t.test("4. saldo positivo", () => {
    const res = validateFinancialContextDocument(baseDoc, "2026-07-20");
    assert.strictEqual(res.success, true);
  });

  await t.test("5. saldo zero confirmado", () => {
    const doc = { ...baseDoc, referenceBalance: { ...baseDoc.referenceBalance!, amountInCents: 0 } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, true);
  });

  await t.test("6. saldo negativo", () => {
    const doc = { ...baseDoc, referenceBalance: { ...baseDoc.referenceBalance!, amountInCents: -5000 } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, true);
  });

  await t.test("7. saldo sem referenceDate", () => {
    const doc = { ...baseDoc, referenceBalance: { ...baseDoc.referenceBalance!, referenceDate: "" } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, false);
    if (!res.success) assert.strictEqual(res.errors[0].code, "INVALID_DATE");
  });

  await t.test("8. saldo com data futura", () => {
    const doc = { ...baseDoc, referenceBalance: { ...baseDoc.referenceBalance!, referenceDate: "2026-07-21" } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, false);
    if (!res.success) assert.strictEqual(res.errors[0].code, "FUTURE_REFERENCE_BALANCE_DATE");
  });

  await t.test("9. saldo com data civil impossível", () => {
    const doc = { ...baseDoc, referenceBalance: { ...baseDoc.referenceBalance!, referenceDate: "2026-13-45" } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, false);
    if (!res.success) assert.strictEqual(res.errors[0].code, "INVALID_DATE");
  });
});

test("Validation: Minimum Reserve", async (t) => {
  await t.test("10. reserva ausente", () => {
    const doc = { ...baseDoc, minimumReserve: { status: "missing" as const } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, true);
  });

  await t.test("11. reserva zero com explicitZero true", () => {
    const doc = { ...baseDoc, minimumReserve: { status: "configured" as const, amountInCents: 0, explicitZero: true, lastConfirmedAt: "2026-07-20T12:00:00Z" } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, true);
  });

  await t.test("12. reserva zero com explicitZero false", () => {
    const doc = { ...baseDoc, minimumReserve: { status: "configured" as const, amountInCents: 0, explicitZero: false, lastConfirmedAt: "2026-07-20T12:00:00Z" } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, false);
    if (!res.success) assert.strictEqual(res.errors[0].code, "INVALID_EXPLICIT_ZERO");
  });

  await t.test("13. reserva positiva com explicitZero false", () => {
    const doc = { ...baseDoc, minimumReserve: { status: "configured" as const, amountInCents: 5000, explicitZero: false, lastConfirmedAt: "2026-07-20T12:00:00Z" } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, true);
  });

  await t.test("14. reserva positiva com explicitZero true", () => {
    const doc = { ...baseDoc, minimumReserve: { status: "configured" as const, amountInCents: 5000, explicitZero: true, lastConfirmedAt: "2026-07-20T12:00:00Z" } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, false);
    if (!res.success) assert.strictEqual(res.errors[0].code, "INVALID_EXPLICIT_ZERO");
  });
});

test("Validation: Recurring Commitments (custom_interval)", async (t) => {
  await t.test("27. custom_interval rejeitado nesta versão", () => {
    const doc = { ...baseDoc, recurringCommitments: [
      { id: "1", name: "A", amountInCents: 100, recurrence: "custom_interval" as any, nextDueDate: "2026-08-01", essential: false, priority: 5, status: "active" as const, source: "t", lastConfirmedAt: "" }
    ] };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, false);
    if (!res.success) assert.strictEqual(res.errors[0].code, "UNSUPPORTED_CUSTOM_INTERVAL");
  });
});

test("Validation: Protected Goals", async (t) => {
  await t.test("34. valor protegido maior que o alvo", () => {
    const doc = { ...baseDoc, protectedGoals: [
      { id: "1", name: "G", targetAmountInCents: 100, protectedAmountInCents: 200, status: "active" as const, priority: 1, source: "t", lastConfirmedAt: "" }
    ]};
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, false);
    if (!res.success) assert.strictEqual(res.errors[0].code, "INVALID_MONEY");
  });
});

test("Validation: Limits and Data Types", async (t) => {
  await t.test("35. IDs duplicados", () => {
    const doc = { ...baseDoc, expectedIncomes: [
      { id: "1", description: "A", amountInCents: 100, expectedDate: "2026-08-01", status: "active" as const, confidence: "confirmed" as const, source: "t", lastConfirmedAt: "" },
      { id: "1", description: "B", amountInCents: 100, expectedDate: "2026-08-01", status: "active" as const, confidence: "confirmed" as const, source: "t", lastConfirmedAt: "" },
    ]};
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, false);
    if (!res.success) assert.strictEqual(res.errors[0].code, "DUPLICATE_ID");
  });

  await t.test("40. NaN", () => {
    const doc = { ...baseDoc, referenceBalance: { ...baseDoc.referenceBalance!, amountInCents: NaN } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, false);
    if (!res.success) assert.strictEqual(res.errors[0].code, "INVALID_MONEY");
  });

  await t.test("41. Infinity", () => {
    const doc = { ...baseDoc, referenceBalance: { ...baseDoc.referenceBalance!, amountInCents: Infinity } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, false);
    if (!res.success) assert.strictEqual(res.errors[0].code, "INVALID_MONEY");
  });

  await t.test("42. valor monetário acima do limite", () => {
    const doc = { ...baseDoc, referenceBalance: { ...baseDoc.referenceBalance!, amountInCents: MAX_MONEY_IN_CENTS + 1 } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, false);
  });
});

test("Validation: Idempotency Key", async (t) => {
  await t.test("Idempotency key formato válido", () => {
    const doc = { ...baseDoc, metadata: { ...baseDoc.metadata, idempotencyKey: "abc-123" } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, true);
  });
  
  await t.test("Idempotency key vazia", () => {
    const doc = { ...baseDoc, metadata: { ...baseDoc.metadata, idempotencyKey: "" } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, false);
    if (!res.success) assert.strictEqual(res.errors[0].code, "INVALID_IDEMPOTENCY_KEY");
  });
});
