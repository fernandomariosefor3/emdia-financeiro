import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
import { FinancialSnapshot } from "@/domain/finance/types";
import { addDays } from "@/domain/finance/dates";
import { PrepareMonthFormState, PREPARE_MONTH_SCREENS } from "./types";
import { createInitialPrepareMonthState } from "./initialState";
import { parseReaisInput, parseReaisInputToCents, buildContextFromForm } from "./buildContextFromForm";
import { PrepareMonthProgress } from "./components/PrepareMonthProgress";
import { ReferenceBalanceStep, ReferenceBalanceStepErrors } from "./components/ReferenceBalanceStep";
import { ReserveStep, ReserveStepErrors } from "./components/ReserveStep";
import { ExpectedIncomeStep, ExpectedIncomeStepErrors } from "./components/ExpectedIncomeStep";
import { CommitmentsStep, CommitmentsStepErrors } from "./components/CommitmentsStep";
import { ProtectedGoalsStep, ProtectedGoalsStepErrors } from "./components/ProtectedGoalsStep";
import { MonthPreviewStep, MonthPreviewData } from "./components/MonthPreviewStep";

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

function validateBalanceScreen(state: PrepareMonthFormState, todayIso: string): ReferenceBalanceStepErrors {
  const errors: ReferenceBalanceStepErrors = {};
  if (parseReaisInputToCents(state.referenceBalance.amountReaisText) === null) {
    errors.amount = "Informe um valor válido, por exemplo 1500,00.";
  }
  if (!state.referenceBalance.referenceDate) {
    errors.date = "Escolha a data desse saldo.";
  } else if (state.referenceBalance.referenceDate > todayIso) {
    errors.date = "A data não pode ser no futuro.";
  }
  return errors;
}

function validateReserveScreen(state: PrepareMonthFormState): ReserveStepErrors {
  const errors: ReserveStepErrors = {};
  if (state.reserve.choice === "want_to_protect") {
    const cents = parseReaisInputToCents(state.reserve.amountReaisText);
    if (cents === null || cents <= 0) {
      errors.amount = "Informe o valor que deseja proteger.";
    }
  }
  return errors;
}

function validateIncomeScreen(state: PrepareMonthFormState): ExpectedIncomeStepErrors {
  const errors: ExpectedIncomeStepErrors = {};
  for (const entry of state.incomes) {
    const entryErrors: ExpectedIncomeStepErrors[string] = {};
    if (!entry.description.trim()) entryErrors.description = "Informe uma descrição.";
    const reais = parseReaisInput(entry.amountReaisText);
    if (reais === null || reais <= 0) entryErrors.amount = "Informe um valor maior que zero.";
    if (!entry.expectedDate) entryErrors.date = "Escolha a data prevista.";
    if (Object.keys(entryErrors).length > 0) errors[entry.id] = entryErrors;
  }
  return errors;
}

function validateCommitmentsScreen(state: PrepareMonthFormState): CommitmentsStepErrors {
  const errors: CommitmentsStepErrors = {};
  for (const entry of state.commitments) {
    const entryErrors: CommitmentsStepErrors[string] = {};
    if (!entry.name.trim()) entryErrors.name = "Informe um nome.";
    const reais = parseReaisInput(entry.amountReaisText);
    if (reais === null || reais <= 0) entryErrors.amount = "Informe um valor maior que zero.";
    if (!entry.nextDueDate) entryErrors.date = "Escolha a próxima data.";
    if (Object.keys(entryErrors).length > 0) errors[entry.id] = entryErrors;
  }
  return errors;
}

function validateGoalsScreen(state: PrepareMonthFormState): ProtectedGoalsStepErrors {
  const errors: ProtectedGoalsStepErrors = {};
  for (const entry of state.goals) {
    const entryErrors: ProtectedGoalsStepErrors[string] = {};
    if (!entry.name.trim()) entryErrors.name = "Informe um nome.";
    const target = parseReaisInput(entry.targetAmountReaisText);
    const protectedValue = parseReaisInput(entry.protectedAmountReaisText);
    if (target === null || target <= 0) entryErrors.target = "Informe um valor maior que zero.";
    if (protectedValue === null || protectedValue < 0) entryErrors.protectedAmount = "Informe um valor válido.";
    if (target !== null && protectedValue !== null && protectedValue > target) {
      entryErrors.protectedAmount = "Não pode ser maior que o valor total da meta.";
    }
    if (Object.keys(entryErrors).length > 0) errors[entry.id] = entryErrors;
  }
  return errors;
}

function hasAnyError(errors: object): boolean {
  return Object.keys(errors).length > 0;
}

export function PrepareMonthWizard() {
  const [formState, setFormState] = useState<PrepareMonthFormState>(createInitialPrepareMonthState);
  const [screenIndex, setScreenIndex] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const currentScreen = PREPARE_MONTH_SCREENS[screenIndex];
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const horizonIso = addDays(todayIso, 30);

  useEffect(() => {
    headingRef.current?.focus();
  }, [screenIndex]);

  const balanceErrors = validateBalanceScreen(formState, todayIso);
  const reserveErrors = validateReserveScreen(formState);
  const incomeErrors = validateIncomeScreen(formState);
  const commitmentsErrors = validateCommitmentsScreen(formState);
  const goalsErrors = validateGoalsScreen(formState);

  const currentScreenErrors = {
    balance: balanceErrors,
    reserve: reserveErrors,
    income: incomeErrors,
    commitments: commitmentsErrors,
    goals: goalsErrors,
    preview: {},
  }[currentScreen];

  function handleNext() {
    if (hasAnyError(currentScreenErrors)) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setScreenIndex((i) => Math.min(i + 1, PREPARE_MONTH_SCREENS.length - 1));
  }

  function handleBack() {
    setShowErrors(false);
    setScreenIndex((i) => Math.max(i - 1, 0));
  }

  function handleRestart() {
    setFormState(createInitialPrepareMonthState());
    setScreenIndex(0);
    setShowErrors(false);
  }

  const preview: MonthPreviewData = useMemo(() => {
    const nowIso = new Date().toISOString();
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

    const snapshot: FinancialSnapshot = {
      referenceDate: todayIso,
      currentBalanceInCents: ctx.currentBalanceInCents,
      committedAmountInCents: breathing.committedAmountInCents,
      protectedAmountInCents: breathing.protectedAmountInCents,
      breathingRoomInCents: breathing.breathingRoomInCents,
      safeDailyPaceInCents: pace.safeDailyPaceInCents,
      nextIncomeDate: pace.nextIncomeDate,
      projectedBalanceInCents: 0,
      calculatedAt: nowIso,
      explanations: [...breathing.explanations, ...pace.explanations],
    };

    const recommendedAction = buildRecommendedAction(snapshot, risks);

    const severityScore = { critical: 4, high: 3, medium: 2, low: 1 };
    const sortedRisks = [...risks].sort(
      (a, b) => severityScore[b.severity] - severityScore[a.severity] || (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)
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
      topRisk: sortedRisks[0] ?? null,
      recommendedAction,
      assumptions,
      ignoredNotes,
    };
  }, [formState, todayIso, horizonIso]);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <PrepareMonthProgress currentScreen={currentScreen} />

      {currentScreen === "balance" && (
        <ReferenceBalanceStep
          value={formState.referenceBalance}
          onChange={(referenceBalance) => setFormState({ ...formState, referenceBalance })}
          todayIso={todayIso}
          errors={showErrors ? balanceErrors : {}}
          headingRef={headingRef}
        />
      )}
      {currentScreen === "reserve" && (
        <ReserveStep
          value={formState.reserve}
          onChange={(reserve) => setFormState({ ...formState, reserve })}
          errors={showErrors ? reserveErrors : {}}
          headingRef={headingRef}
        />
      )}
      {currentScreen === "income" && (
        <ExpectedIncomeStep
          value={formState.incomes}
          onChange={(incomes) => setFormState({ ...formState, incomes })}
          errors={showErrors ? incomeErrors : {}}
          headingRef={headingRef}
        />
      )}
      {currentScreen === "commitments" && (
        <CommitmentsStep
          value={formState.commitments}
          onChange={(commitments) => setFormState({ ...formState, commitments })}
          errors={showErrors ? commitmentsErrors : {}}
          headingRef={headingRef}
        />
      )}
      {currentScreen === "goals" && (
        <ProtectedGoalsStep
          value={formState.goals}
          onChange={(goals) => setFormState({ ...formState, goals })}
          errors={showErrors ? goalsErrors : {}}
          headingRef={headingRef}
        />
      )}
      {currentScreen === "preview" && (
        <MonthPreviewStep preview={preview} onRestart={handleRestart} headingRef={headingRef} />
      )}

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="ghost" onClick={handleBack} disabled={screenIndex === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
          Voltar
        </Button>
        {currentScreen !== "preview" && (
          <Button type="button" onClick={handleNext}>
            Continuar
            <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
