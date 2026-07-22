import {
  FinancialContextDocumentV1,
  ExpectedIncome,
  RecurringCommitment,
} from "@/domain/finance/context/types";
import {
  PrepareMonthFormState,
  IncomeConfidenceLabel,
  CommitmentRecurrenceLabel,
} from "./types";
import { centsToReaisInputText } from "./buildContextFromForm";
import { createInitialPrepareMonthState } from "./initialState";

const CONFIDENCE_LABEL_MAP: Record<ExpectedIncome["confidence"], IncomeConfidenceLabel> = {
  confirmed: "certain",
  probable: "probable",
  uncertain: "uncertain",
};

const RECURRENCE_LABEL_MAP: Record<RecurringCommitment["recurrence"], CommitmentRecurrenceLabel> = {
  monthly: "monthly",
  weekly: "weekly",
  yearly: "yearly",
  // custom_interval is rejected by validateFinancialContextDocument (V1), so
  // a stored document can never legitimately carry it — fall back to
  // monthly only as a defensive default, never surfaced in practice.
  custom_interval: "monthly",
};

/**
 * Maps a saved FinancialContextDocumentV1 back into editable wizard form
 * state, for prefilling "Prepare seu mês" when a context already exists.
 * Pure inverse of buildContextFromForm — no I/O, no Firebase.
 */
export function buildFormFromContext(doc: FinancialContextDocumentV1): PrepareMonthFormState {
  const initial = createInitialPrepareMonthState();

  return {
    referenceBalance: doc.referenceBalance
      ? {
          amountReaisText: centsToReaisInputText(doc.referenceBalance.amountInCents),
          referenceDate: doc.referenceBalance.referenceDate,
        }
      : initial.referenceBalance,
    reserve:
      doc.minimumReserve.status === "missing"
        ? { choice: "undecided", amountReaisText: "" }
        : doc.minimumReserve.explicitZero
          ? { choice: "confirmed_none", amountReaisText: "" }
          : { choice: "want_to_protect", amountReaisText: centsToReaisInputText(doc.minimumReserve.amountInCents) },
    incomes: doc.expectedIncomes
      .filter((income) => income.status === "active")
      .map((income) => ({
        id: income.id,
        description: income.description,
        amountReaisText: centsToReaisInputText(income.amountInCents),
        expectedDate: income.expectedDate,
        confidenceLabel: CONFIDENCE_LABEL_MAP[income.confidence],
      })),
    commitments: doc.recurringCommitments
      .filter((commitment) => commitment.status === "active")
      .map((commitment) => ({
        id: commitment.id,
        name: commitment.name,
        amountReaisText: centsToReaisInputText(commitment.amountInCents),
        nextDueDate: commitment.nextDueDate,
        recurrence: RECURRENCE_LABEL_MAP[commitment.recurrence],
        essential: commitment.essential,
      })),
    goals: doc.protectedGoals
      .filter((goal) => goal.status === "active")
      .map((goal) => ({
        id: goal.id,
        name: goal.name,
        targetAmountReaisText: centsToReaisInputText(goal.targetAmountInCents),
        protectedAmountReaisText: centsToReaisInputText(goal.protectedAmountInCents),
        targetDate: goal.targetDate ?? "",
        priority: goal.priority,
      })),
  };
}
