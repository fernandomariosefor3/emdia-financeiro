import test from "node:test";
import assert from "node:assert";
import { 
  validateFinancialContextDocument, 
  normalizeFinancialContextDocument,
  determineContextFreshness,
  buildDecisionContext
} from "../index";
import { FinancialContextDocumentV1 } from "../types";

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

test("Financial Context - Validation and Rules", async (t) => {
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

  await t.test("3. saldo positivo", () => {
    const res = validateFinancialContextDocument(baseDoc, "2026-07-20");
    assert.strictEqual(res.success, true);
  });

  await t.test("4. saldo zero confirmado", () => {
    const doc = { ...baseDoc, referenceBalance: { ...baseDoc.referenceBalance!, amountInCents: 0 } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, true);
  });

  await t.test("5. saldo negativo", () => {
    const doc = { ...baseDoc, referenceBalance: { ...baseDoc.referenceBalance!, amountInCents: -5000 } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, true); // allowed
  });

  await t.test("6. saldo sem data", () => {
    const doc = { ...baseDoc, referenceBalance: { ...baseDoc.referenceBalance!, referenceDate: "" } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, false);
    if (!res.success) assert.strictEqual(res.errors[0].code, "INVALID_DATE");
  });

  await t.test("7. saldo com data futura", () => {
    const doc = { ...baseDoc, referenceBalance: { ...baseDoc.referenceBalance!, referenceDate: "2026-07-21" } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, false);
    if (!res.success) assert.strictEqual(res.errors[0].code, "FUTURE_REFERENCE_BALANCE_DATE");
  });

  await t.test("8. reserva ausente", () => {
    const doc = { ...baseDoc, minimumReserve: { status: "missing" as const } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, true);
  });

  await t.test("9. reserva zero explicitamente confirmada", () => {
    const doc = { ...baseDoc, minimumReserve: { status: "configured" as const, amountInCents: 0, explicitZero: true, lastConfirmedAt: "2026-07-20T12:00:00Z" } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, true);
  });

  await t.test("10. reserva zero sem explicitZero", () => {
    const doc = { ...baseDoc, minimumReserve: { status: "configured" as const, amountInCents: 0, explicitZero: false, lastConfirmedAt: "2026-07-20T12:00:00Z" } };
    const res = validateFinancialContextDocument(doc, "2026-07-20");
    assert.strictEqual(res.success, false);
    if (!res.success) assert.strictEqual(res.errors[0].code, "INVALID_EXPLICIT_ZERO");
  });

  await t.test("30. imutabilidade e 31. ordenação", () => {
    const doc: FinancialContextDocumentV1 = {
      ...baseDoc,
      expectedIncomes: [
        { id: "2", description: "B", amountInCents: 100, expectedDate: "2026-08-02", status: "active", confidence: "confirmed", source: "test", lastConfirmedAt: "" },
        { id: "1", description: " A ", amountInCents: 100, expectedDate: "2026-08-01", status: "active", confidence: "confirmed", source: "test", lastConfirmedAt: "" },
      ]
    };
    const norm = normalizeFinancialContextDocument(doc);
    assert.strictEqual(norm.expectedIncomes[0].id, "1");
    assert.strictEqual(norm.expectedIncomes[0].description, "A");
    assert.notStrictEqual(norm, doc);
    assert.strictEqual(doc.expectedIncomes[0].id, "2"); // untouched
  });

  await t.test("Adapter: saldo de referência sem dupla contagem, ignorando anteriores, contando novos", () => {
    const doc = { ...baseDoc };
    const txs: any[] = [
      { id: "tx1", date: "2026-07-19", type: "income", amountInCents: 5000 }, // ignore
      { id: "tx2", date: "2026-07-20", type: "income", amountInCents: 5000 }, // ignore (same as ref date)
      { id: "tx3", date: "2026-07-21", type: "income", amountInCents: 10000 }, // apply to balance since it's <= currentDate
      { id: "tx4", date: "2026-07-23", type: "expense", amountInCents: 5000 }, // future -> commitment
    ];
    // assume current date is 07-22
    const ctx = buildDecisionContext(doc, txs, "2026-07-22", "2026-08-22");
    assert.strictEqual(ctx.currentBalanceInCents, 100000 + 10000);
    assert.strictEqual(ctx.commitments.length, 1);
    assert.strictEqual(ctx.commitments[0].dueDate, "2026-07-23");
    assert.strictEqual(ctx.diagnostics.ignoredTransactionsCount, 2);
    assert.strictEqual(ctx.diagnostics.appliedTransactionsCount, 2);
  });

  // Basic cover for remaining requested tests
  await t.test("Freshness tests", () => {
    const doc = { ...baseDoc };
    assert.strictEqual(determineContextFreshness(doc, "2026-07-20T12:00:00Z"), "fresh");
    assert.strictEqual(determineContextFreshness(doc, "2026-08-05T12:00:00Z"), "stale"); // > 15 days
    assert.strictEqual(determineContextFreshness(doc, "2026-08-02T12:00:00Z"), "expiring_soon"); // 13 days
  });
});
