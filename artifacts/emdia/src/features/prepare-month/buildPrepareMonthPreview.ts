import {
  validateFinancialContextDocument,
  normalizeFinancialContextDocument,
  buildDecisionContext,
  ValidationError,
} from "@/domain/finance/context";
import { calculateBreathingRoom } from "@/domain/finance/calculateBreathingRoom";
import { calculateSafeDailyPace } from "@/domain/finance/calculateSafeDailyPace";
import { detectUpcomingRisks } from "@/domain/finance/detectUpcomingRisks";
import { buildRecommendedAction } from "@/domain/finance/buildRecommendedAction";
import { projectCashFlow } from "@/domain/finance/projectCashFlow";
import { FinancialSnapshot } from "@/domain/finance/types";
import { PrepareMonthFormState } from "./types";
import { buildContextFromForm } from "./buildContextFromForm";
import { formatRecommendedActionForUser } from "./formatRecommendedActionForUser";
import { MonthPreviewData } from "./components/MonthPreviewStep";

const ERROR_CODE_MESSAGES: Record<string, string> = {
  FUTURE_REFERENCE_BALANCE_DATE: "A data do saldo não pode ser no futuro.",
  INVALID_EXPLICIT_ZERO: "A configuração da reserva mínima ficou inconsistente. Revise a etapa de reserva.",
  TOO_MANY_EXPECTED_INCOMES: "Você informou mais rendas do que o limite permitido.",
  TOO_MANY_COMMITMENTS: "Você informou mais compromissos do que o limite permitido.",
  TOO_MANY_GOALS: "Você informou mais metas do que o limite permitido.",
  UNSUPPORTED_CUSTOM_INTERVAL: "Recorrência personalizada ainda não é suportada nesta versão.",
};

const ERROR_MESSAGE_TRANSLATIONS: Record<string, string> = {
  "Protected amount cannot exceed target": "O valor já protegido não pode ser maior que o valor total da meta.",
};

function friendlyErrorMessage(error: ValidationError): string {
  return ERROR_CODE_MESSAGES[error.code] ?? ERROR_MESSAGE_TRANSLATIONS[error.message] ?? error.message;
}

const SEVERITY_SCORE = { critical: 4, high: 3, medium: 2, low: 1 };

/**
 * Pure builder for the "Prepare your month" preview. No React, no Date.now,
 * no Firebase, no mutation. Reuses the existing domain validation,
 * normalization, and Decision Engine exactly as-is — this function only
 * wires them together and translates the result into presentation data.
 */
export function buildPrepareMonthPreview(
  formState: PrepareMonthFormState,
  todayIso: string,
  nowIso: string,
  horizonIso: string
): MonthPreviewData {
  const rawDoc = buildContextFromForm(formState, nowIso, todayIso);
  if (!rawDoc) {
    return {
      status: "insufficient",
      blockingMessages: ["Alguns dados informados não puderam ser interpretados. Volte e revise os valores."],
      assumptions: [],
      ignoredNotes: [],
    };
  }

  const validation = validateFinancialContextDocument(rawDoc, todayIso);
  if (!validation.success) {
    return {
      status: "insufficient",
      blockingMessages: validation.errors.map(friendlyErrorMessage),
      assumptions: [],
      ignoredNotes: [],
    };
  }

  const normalized = normalizeFinancialContextDocument(validation.data);
  const ctx = buildDecisionContext(normalized, [], todayIso, horizonIso);

  const breathing = calculateBreathingRoom({
    currentBalanceInCents: ctx.currentBalanceInCents,
    commitments: ctx.commitments,
    expectedIncomes: ctx.expectedIncomes,
    protectedAmountInCents: ctx.protectedAmountInCents,
    minimumReserveInCents: ctx.minimumReserveInCents,
    referenceDate: todayIso,
    horizonDate: horizonIso,
  });

  const pace = calculateSafeDailyPace({
    breathingRoomInCents: breathing.breathingRoomInCents,
    expectedIncomes: ctx.expectedIncomes,
    referenceDate: todayIso,
    defaultHorizonDate: horizonIso,
  });

  const risks = detectUpcomingRisks({
    currentBalanceInCents: ctx.currentBalanceInCents,
    expectedIncomes: ctx.expectedIncomes,
    commitments: ctx.commitments,
    referenceDate: todayIso,
    horizonDate: horizonIso,
  });

  // Projected balance: reuse the existing cash-flow projection (same one the
  // Today V3 timeline already uses) instead of a fabricated placeholder.
  // The balance after the last event in the horizon *is* the projection; if
  // there are no events at all, the balance simply stays where it is.
  const timeline = projectCashFlow({
    currentBalanceInCents: ctx.currentBalanceInCents,
    expectedIncomes: ctx.expectedIncomes,
    commitments: ctx.commitments,
    referenceDate: todayIso,
    horizonDate: horizonIso,
  });
  const projectedBalanceInCents =
    timeline.length > 0 ? timeline[timeline.length - 1].balanceAfterInCents : ctx.currentBalanceInCents;

  const snapshot: FinancialSnapshot = {
    referenceDate: todayIso,
    currentBalanceInCents: ctx.currentBalanceInCents,
    committedAmountInCents: breathing.committedAmountInCents,
    protectedAmountInCents: breathing.protectedAmountInCents,
    breathingRoomInCents: breathing.breathingRoomInCents,
    safeDailyPaceInCents: pace.safeDailyPaceInCents,
    nextIncomeDate: pace.nextIncomeDate,
    projectedBalanceInCents,
    calculatedAt: nowIso,
    explanations: [...breathing.explanations, ...pace.explanations],
  };

  const recommendedAction = buildRecommendedAction(snapshot, risks);

  const sortedRisks = [...risks].sort(
    (a, b) => SEVERITY_SCORE[b.severity] - SEVERITY_SCORE[a.severity] || (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)
  );

  const assumptions: string[] = ["Renda provável e incerta não foram consideradas no cenário principal."];
  if (formState.reserve.choice === "undecided") assumptions.push("Reserva mínima ainda não foi definida.");
  if (formState.incomes.length === 0) assumptions.push("Nenhuma renda esperada foi informada.");
  if (formState.commitments.length === 0) assumptions.push("Nenhum compromisso foi informado.");
  if (formState.goals.length === 0) assumptions.push("Nenhuma meta protegida foi informada.");

  const ignoredNotes: string[] = [
    "Esta simulação usa apenas os dados informados aqui — nenhuma movimentação real foi conectada.",
    ...validation.warnings.map((w) => w.message),
  ];

  return {
    status: "ready",
    blockingMessages: [],
    dataQuality: normalized.metadata.dataQuality,
    breathingRoomInCents: breathing.breathingRoomInCents,
    safeDailyPaceInCents: pace.safeDailyPaceInCents,
    projectedBalanceInCents,
    topRisk: sortedRisks[0] ?? null,
    recommendedAction: formatRecommendedActionForUser(recommendedAction),
    assumptions,
    ignoredNotes,
  };
}
