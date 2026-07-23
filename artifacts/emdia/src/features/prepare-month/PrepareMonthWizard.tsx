import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { addDays } from "@/domain/finance/dates";
import { PrepareMonthFormState, PREPARE_MONTH_SCREENS } from "./types";
import { createInitialPrepareMonthState } from "./initialState";
import { parseReaisInput, parseReaisInputToCents } from "./buildContextFromForm";
import { buildPrepareMonthPreview } from "./buildPrepareMonthPreview";
import { buildFormFromContext } from "./buildFormFromContext";
import { buildValidatedContext } from "./buildValidatedContext";
import { usePrepareMonthPersistence } from "./data/usePrepareMonthPersistence";
import { PrepareMonthProgress } from "./components/PrepareMonthProgress";
import { ReferenceBalanceStep, ReferenceBalanceStepErrors } from "./components/ReferenceBalanceStep";
import { ReserveStep, ReserveStepErrors } from "./components/ReserveStep";
import { ExpectedIncomeStep, ExpectedIncomeStepErrors } from "./components/ExpectedIncomeStep";
import { CommitmentsStep, CommitmentsStepErrors } from "./components/CommitmentsStep";
import { ProtectedGoalsStep, ProtectedGoalsStepErrors } from "./components/ProtectedGoalsStep";
import { MonthPreviewStep } from "./components/MonthPreviewStep";

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
  const hasPrefilledRef = useRef(false);
  const [, navigate] = useLocation();

  const persistence = usePrepareMonthPersistence();

  const currentScreen = PREPARE_MONTH_SCREENS[screenIndex];
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const horizonIso = addDays(todayIso, 30);

  useEffect(() => {
    headingRef.current?.focus();
  }, [screenIndex]);

  // Prefill once with the saved context when the wizard opens for an
  // authenticated user — never overwrites in-progress edits afterwards.
  useEffect(() => {
    if (persistence.loadStatus === "loaded" && persistence.savedDocument && !hasPrefilledRef.current) {
      hasPrefilledRef.current = true;
      setFormState(buildFormFromContext(persistence.savedDocument));
    }
  }, [persistence.loadStatus, persistence.savedDocument]);

  function handleSave() {
    const result = buildValidatedContext(formState, todayIso, new Date().toISOString());
    if (result.status !== "ready") return;
    void persistence.save(result.document);
  }

  function handleRetrySave() {
    void persistence.retrySave();
  }

  function handleBackToStart() {
    navigate("/dashboard");
  }

  function handleReviewPlan() {
    setShowErrors(false);
    setScreenIndex(0);
  }

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

  const preview = useMemo(() => {
    const nowIso = new Date().toISOString();
    return buildPrepareMonthPreview(formState, todayIso, nowIso, horizonIso);
  }, [formState, todayIso, horizonIso]);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <PrepareMonthProgress currentScreen={currentScreen} />

      {persistence.loadStatus === "loaded" && (
        <Alert className="bg-blue-50/50 border-blue-100 text-blue-900">
          <Info className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <AlertDescription className="text-blue-700/90 text-sm">
            Seu planejamento atual foi carregado. Você pode revisá-lo e salvar novamente.
          </AlertDescription>
        </Alert>
      )}

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
        <MonthPreviewStep
          preview={preview}
          onRestart={handleRestart}
          headingRef={headingRef}
          canSave={persistence.canPersist}
          saveStatus={persistence.saveStatus}
          saveErrorMessage={persistence.saveErrorMessage}
          onSave={handleSave}
          onRetrySave={handleRetrySave}
          onBackToStart={handleBackToStart}
          onReviewPlan={handleReviewPlan}
        />
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
