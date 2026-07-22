import { realsToCents } from "@/domain/finance/money";
import {
  CivilDate,
  FinancialContextDocumentV1,
  DataQuality,
  MinimumReserveSetting,
  ExpectedIncome,
  RecurringCommitment,
  ProtectedGoal,
} from "@/domain/finance/context/types";
import {
  PrepareMonthFormState,
  IncomeConfidenceLabel,
  CommitmentRecurrenceLabel,
} from "./types";

const MONEY_INPUT_PATTERN = /^-?\d+(,\d{1,2})?$/;

/**
 * Parses a Brazilian-formatted reais string ("1234,56", "-50") into a plain
 * number of reais. Returns null for empty or malformed input instead of
 * silently coercing to zero.
 */
export function parseReaisInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (!MONEY_INPUT_PATTERN.test(trimmed)) return null;
  const value = Number(trimmed.replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

export function parseReaisInputToCents(raw: string): number | null {
  const reais = parseReaisInput(raw);
  if (reais === null) return null;
  return realsToCents(reais);
}

/**
 * Inverse of parseReaisInputToCents — formats cents back into the editable
 * "1234,56" input format (not the currency-formatted formatMoney output).
 */
export function centsToReaisInputText(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const absCents = Math.abs(cents);
  const reais = Math.floor(absCents / 100);
  const remainderCents = absCents % 100;
  return `${sign}${reais},${String(remainderCents).padStart(2, "0")}`;
}

const CONFIDENCE_MAP: Record<IncomeConfidenceLabel, ExpectedIncome["confidence"]> = {
  certain: "confirmed",
  probable: "probable",
  uncertain: "uncertain",
};

const RECURRENCE_MAP: Record<CommitmentRecurrenceLabel, RecurringCommitment["recurrence"]> = {
  monthly: "monthly",
  weekly: "weekly",
  yearly: "yearly",
};

function buildMinimumReserve(
  state: PrepareMonthFormState,
  nowIso: string
): MinimumReserveSetting | null {
  if (state.reserve.choice === "undecided") {
    return { status: "missing" };
  }
  if (state.reserve.choice === "confirmed_none") {
    return { status: "configured", amountInCents: 0, explicitZero: true, lastConfirmedAt: nowIso };
  }
  const cents = parseReaisInputToCents(state.reserve.amountReaisText);
  if (cents === null) return null;
  return { status: "configured", amountInCents: cents, explicitZero: false, lastConfirmedAt: nowIso };
}

function computeDataQuality(state: PrepareMonthFormState): DataQuality {
  const hasReserveDecision = state.reserve.choice !== "undecided";
  const hasAnyIncome = state.incomes.length > 0;
  const hasAnyGoal = state.goals.length > 0;
  if (hasReserveDecision && hasAnyIncome && hasAnyGoal) return "complete";
  return "partial";
}

/**
 * Maps the wizard's form state into a FinancialContextDocumentV1 draft.
 * This is a pure mapping layer only — business-rule validation stays in
 * validateFinancialContextDocument, calculations stay in the Decision Engine.
 * Returns null when a required field cannot be parsed (caller decides how to
 * surface that as a field-level message).
 */
export function buildContextFromForm(
  state: PrepareMonthFormState,
  nowIso: string,
  referenceDate: CivilDate
): FinancialContextDocumentV1 | null {
  const balanceCents = parseReaisInputToCents(state.referenceBalance.amountReaisText);
  if (balanceCents === null || !state.referenceBalance.referenceDate) return null;

  const minimumReserve = buildMinimumReserve(state, nowIso);
  if (minimumReserve === null) return null;

  const expectedIncomes: ExpectedIncome[] = [];
  for (const entry of state.incomes) {
    const cents = parseReaisInputToCents(entry.amountReaisText);
    if (cents === null || !entry.expectedDate) return null;
    expectedIncomes.push({
      id: entry.id,
      description: entry.description.trim(),
      amountInCents: cents,
      expectedDate: entry.expectedDate,
      status: "active",
      confidence: CONFIDENCE_MAP[entry.confidenceLabel],
      source: "prepare_month_prototype",
      lastConfirmedAt: nowIso,
    });
  }

  const recurringCommitments: RecurringCommitment[] = [];
  for (const entry of state.commitments) {
    const cents = parseReaisInputToCents(entry.amountReaisText);
    if (cents === null || !entry.nextDueDate) return null;
    recurringCommitments.push({
      id: entry.id,
      name: entry.name.trim(),
      amountInCents: cents,
      recurrence: RECURRENCE_MAP[entry.recurrence],
      nextDueDate: entry.nextDueDate,
      essential: entry.essential,
      priority: entry.essential ? 1 : 5,
      status: "active",
      source: "prepare_month_prototype",
      lastConfirmedAt: nowIso,
    });
  }

  const protectedGoals: ProtectedGoal[] = [];
  for (const entry of state.goals) {
    const targetCents = parseReaisInputToCents(entry.targetAmountReaisText);
    const protectedCents = parseReaisInputToCents(entry.protectedAmountReaisText);
    if (targetCents === null || protectedCents === null) return null;
    protectedGoals.push({
      id: entry.id,
      name: entry.name.trim(),
      targetAmountInCents: targetCents,
      protectedAmountInCents: protectedCents,
      targetDate: entry.targetDate || undefined,
      status: "active",
      priority: entry.priority,
      source: "prepare_month_prototype",
      lastConfirmedAt: nowIso,
    });
  }

  return {
    schemaVersion: 1,
    metadata: {
      schemaVersion: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastConfirmedAt: nowIso,
      source: "prepare_month_prototype",
      dataQuality: computeDataQuality(state),
      completeness: {
        referenceBalance: true,
        minimumReserve: state.reserve.choice !== "undecided",
        expectedIncome: state.incomes.length > 0,
        recurringCommitments: state.commitments.length > 0,
        protectedGoals: state.goals.length > 0,
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
      amountInCents: balanceCents,
      referenceDate: state.referenceBalance.referenceDate,
      source: "user_input",
      confidence: "confirmed",
      lastConfirmedAt: nowIso,
    },
    minimumReserve,
    expectedIncomes,
    recurringCommitments,
    protectedGoals,
  };
}
