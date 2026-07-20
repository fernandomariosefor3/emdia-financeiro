import { FinancialContextDocumentV1, CivilDate } from "./types";
import { FinancialTransaction, FinancialCommitment, ExpectedIncome as DomainExpectedIncome } from "../types";

export interface BuildDecisionContextResult {
  currentBalanceInCents: number;
  commitments: FinancialCommitment[];
  expectedIncomes: DomainExpectedIncome[];
  protectedAmountInCents: number;
  minimumReserveInCents: number;
  diagnostics: {
    ignoredTransactionsCount: number;
    appliedTransactionsCount: number;
    quality: string;
  };
}

export function buildDecisionContext(
  doc: FinancialContextDocumentV1,
  transactions: FinancialTransaction[],
  currentDate: CivilDate,
  horizonEndDate: CivilDate
): BuildDecisionContextResult {
  let currentBalanceInCents = doc.referenceBalance ? doc.referenceBalance.amountInCents : 0;
  const refDate = doc.referenceBalance ? doc.referenceBalance.referenceDate : currentDate;

  let ignoredTransactionsCount = 0;
  let appliedTransactionsCount = 0;

  const commitments: FinancialCommitment[] = [];
  const expectedIncomes: DomainExpectedIncome[] = [];

  // 1. Process transactions
  for (const t of transactions) {
    if (t.date <= refDate) {
      ignoredTransactionsCount++;
      continue;
    }

    if (t.date <= currentDate) {
      // Past or today, update balance
      if (t.type === "income") {
        currentBalanceInCents += t.amountInCents;
      } else {
        currentBalanceInCents -= t.amountInCents;
      }
      appliedTransactionsCount++;
    } else if (t.date <= horizonEndDate) {
      // Future transaction inside horizon: map as projection
      if (t.type === "expense") {
        commitments.push({
          id: `tx-${t.id}`,
          name: t.description || "Transação Futura",
          amountInCents: t.amountInCents,
          dueDate: t.date,
          status: "pending",
          essential: false,
          priority: 5,
        });
      } else {
        expectedIncomes.push({
          id: `tx-${t.id}`,
          description: t.description || "Receita Futura",
          amountInCents: t.amountInCents,
          expectedDate: t.date,
          confidence: t.confirmed ? "confirmed" : "probable",
          status: "pending",
        });
      }
      appliedTransactionsCount++;
    } else {
      ignoredTransactionsCount++;
    }
  }

  // 2. Process recurring commitments (generate occurrences up to horizon)
  for (const c of doc.recurringCommitments) {
    if (c.status !== "active") continue;
    let nextDate = c.nextDueDate;
    let instance = 0;
    while (nextDate <= horizonEndDate) {
      if (nextDate > currentDate) {
        commitments.push({
          id: `${c.id}-occ-${instance}`,
          name: c.name,
          amountInCents: c.amountInCents,
          dueDate: nextDate,
          status: "pending",
          essential: c.essential,
          priority: c.priority,
          recurrence: c.recurrence
        });
      }
      // advance nextDate
      const d = new Date(nextDate);
      if (c.recurrence === "monthly") d.setUTCMonth(d.getUTCMonth() + 1);
      else if (c.recurrence === "weekly") d.setUTCDate(d.getUTCDate() + 7);
      else if (c.recurrence === "yearly") d.setUTCFullYear(d.getUTCFullYear() + 1);
      else break; // custom not fully supported in pure mock yet without more logic
      
      nextDate = d.toISOString().split("T")[0];
      instance++;
      if (instance > 100) break; // safety
    }
  }

  // 3. Process expected incomes
  for (const inc of doc.expectedIncomes) {
    if (inc.status === "received" || inc.status === "cancelled" || inc.status === "archived") continue;
    if (
      inc.confidence === "confirmed" || 
      (inc.confidence === "probable" && doc.calculationPreferences.includeProbableIncome) ||
      (inc.confidence === "uncertain" && doc.calculationPreferences.includeUncertainIncome)
    ) {
      if (inc.expectedDate > currentDate && inc.expectedDate <= horizonEndDate) {
        expectedIncomes.push({
          id: inc.id,
          description: inc.description,
          amountInCents: inc.amountInCents,
          expectedDate: inc.expectedDate,
          confidence: inc.confidence,
          status: "pending",
        });
      }
    }
  }

  // 4. Protected Goals
  let protectedAmountInCents = 0;
  for (const g of doc.protectedGoals) {
    if (g.status === "active" || (g.status === "paused" && doc.calculationPreferences.includePausedGoals)) {
      protectedAmountInCents += g.protectedAmountInCents;
    }
  }

  // 5. Minimum Reserve
  let minimumReserveInCents = 0;
  if (doc.minimumReserve.status === "configured" && doc.calculationPreferences.protectMinimumReserve) {
    minimumReserveInCents = doc.minimumReserve.amountInCents;
  }

  return {
    currentBalanceInCents,
    commitments,
    expectedIncomes,
    protectedAmountInCents,
    minimumReserveInCents,
    diagnostics: {
      ignoredTransactionsCount,
      appliedTransactionsCount,
      quality: doc.metadata.dataQuality,
    }
  };
}
