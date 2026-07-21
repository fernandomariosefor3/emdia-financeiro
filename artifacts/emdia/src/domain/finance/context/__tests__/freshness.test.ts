import test from "node:test";
import assert from "node:assert";
import { determineContextFreshness } from "../index";
import { FinancialContextDocumentV1 } from "../types";

const baseDoc: FinancialContextDocumentV1 = {
  schemaVersion: 1,
  metadata: {
    schemaVersion: 1,
    createdAt: "2026-07-20T12:00:00Z",
    updatedAt: "2026-07-20T12:00:00Z",
    lastConfirmedAt: "2026-07-01T12:00:00Z", // 1st of July
    source: "test",
    dataQuality: "complete",
    completeness: { referenceBalance: true, minimumReserve: true, expectedIncome: true, recurringCommitments: true, protectedGoals: true },
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

test("Freshness: Context Decay", async (t) => {
  await t.test("59. contexto prestes a ficar desatualizado", () => {
    // 1st of July to 14th of July = 13 days
    const res = determineContextFreshness(baseDoc, "2026-07-14T12:00:00Z");
    assert.strictEqual(res, "expiring_soon");
  });

  await t.test("60. contexto desatualizado", () => {
    // 1st of July to 16th of July = 15 days
    const res = determineContextFreshness(baseDoc, "2026-07-16T12:00:00Z");
    assert.strictEqual(res, "stale");
  });

  await t.test("Contexto atualizado", () => {
    // 1st of July to 2nd of July = 1 day
    const res = determineContextFreshness(baseDoc, "2026-07-02T12:00:00Z");
    assert.strictEqual(res, "fresh");
  });

  await t.test("mesma entrada e mesma data gerando o mesmo resultado", () => {
    const res1 = determineContextFreshness(baseDoc, "2026-07-05T12:00:00Z");
    const res2 = determineContextFreshness(baseDoc, "2026-07-05T12:00:00Z");
    assert.strictEqual(res1, res2);
  });
});
