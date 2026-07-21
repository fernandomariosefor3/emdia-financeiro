import test from "node:test";
import assert from "node:assert";
import { normalizeFinancialContextDocument } from "../index";
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
  minimumReserve: { status: "missing" },
  expectedIncomes: [],
  recurringCommitments: [],
  protectedGoals: []
};

test("Normalization: Immutability and Determinism", async (t) => {
  await t.test("43. imutabilidade da entrada", () => {
    const doc: FinancialContextDocumentV1 = {
      ...baseDoc,
      expectedIncomes: [
        { id: "1", description: " A ", amountInCents: 100, expectedDate: "2026-08-01", status: "active", confidence: "confirmed", source: "test", lastConfirmedAt: "" },
      ]
    };
    const norm = normalizeFinancialContextDocument(doc);
    assert.notStrictEqual(norm, doc);
    assert.strictEqual(norm.expectedIncomes[0].description, "A");
    assert.strictEqual(doc.expectedIncomes[0].description, " A "); // untouched
  });

  await t.test("44. ordenação determinística", () => {
    const doc: FinancialContextDocumentV1 = {
      ...baseDoc,
      expectedIncomes: [
        { id: "2", description: "B", amountInCents: 100, expectedDate: "2026-08-02", status: "active", confidence: "confirmed", source: "test", lastConfirmedAt: "" },
        { id: "1", description: "A", amountInCents: 100, expectedDate: "2026-08-01", status: "active", confidence: "confirmed", source: "test", lastConfirmedAt: "" },
      ]
    };
    const norm = normalizeFinancialContextDocument(doc);
    assert.strictEqual(norm.expectedIncomes[0].id, "1");
    assert.strictEqual(norm.expectedIncomes[1].id, "2");
  });

  await t.test("45. mesmas entradas produzem mesma saída", () => {
    const doc: FinancialContextDocumentV1 = {
      ...baseDoc,
      expectedIncomes: [
        { id: "2", description: "B", amountInCents: 100, expectedDate: "2026-08-02", status: "active", confidence: "confirmed", source: "test", lastConfirmedAt: "" },
        { id: "1", description: "A", amountInCents: 100, expectedDate: "2026-08-01", status: "active", confidence: "confirmed", source: "test", lastConfirmedAt: "" },
      ]
    };
    const norm1 = normalizeFinancialContextDocument(doc);
    const norm2 = normalizeFinancialContextDocument(doc);
    assert.deepStrictEqual(norm1, norm2);
  });
});
