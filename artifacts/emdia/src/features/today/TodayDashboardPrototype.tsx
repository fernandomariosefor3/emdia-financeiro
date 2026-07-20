import { useState, useMemo } from "react";
import { calculateBreathingRoom } from "@/domain/finance/calculateBreathingRoom";
import { calculateSafeDailyPace } from "@/domain/finance/calculateSafeDailyPace";
import { projectCashFlow } from "@/domain/finance/projectCashFlow";
import { detectUpcomingRisks } from "@/domain/finance/detectUpcomingRisks";
import { buildRecommendedAction } from "@/domain/finance/buildRecommendedAction";
import { FinancialSnapshot } from "@/domain/finance/types";
import {
  BreathingRoomCard,
  PrimaryRiskCard,
  RecommendedActionCard,
  SafeDailyPaceCard
} from "./TodayCards";
import { FinancialTimeline } from "./FinancialTimeline";
import { DecisionSimulator } from "./DecisionSimulator";
import { ExplainCalculationDialog } from "./ExplainCalculationDialog";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTodayFinancialData } from "./data/useTodayFinancialData";
import { format } from "date-fns";

export function TodayDashboardPrototype() {
  const [explainOpen, setExplainOpen] = useState(false);

  const referenceDate = format(new Date(), "yyyy-MM-dd");
  // Arbitrary horizon date for now, let's say end of next month, or just fixed +30 days
  const horizonDate = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");

  const { data: financialResult, loading, error, source } = useTodayFinancialData(referenceDate);

  const snapshot: FinancialSnapshot | null = useMemo(() => {
    if (!financialResult) return null;
    const ctx = financialResult.context;

    const breathingRoomResult = calculateBreathingRoom({
      currentBalanceInCents: ctx.currentBalanceInCents,
      commitments: ctx.commitments,
      expectedIncomes: ctx.expectedIncomes,
      protectedAmountInCents: ctx.protectedAmountInCents,
      minimumReserveInCents: ctx.minimumReserveInCents,
      referenceDate,
      horizonDate
    });

    const dailyPaceResult = calculateSafeDailyPace({
      breathingRoomInCents: breathingRoomResult.breathingRoomInCents,
      expectedIncomes: ctx.expectedIncomes,
      referenceDate,
      defaultHorizonDate: horizonDate
    });

    return {
      referenceDate,
      currentBalanceInCents: ctx.currentBalanceInCents,
      committedAmountInCents: breathingRoomResult.committedAmountInCents,
      protectedAmountInCents: breathingRoomResult.protectedAmountInCents,
      breathingRoomInCents: breathingRoomResult.breathingRoomInCents,
      safeDailyPaceInCents: dailyPaceResult.safeDailyPaceInCents,
      nextIncomeDate: dailyPaceResult.nextIncomeDate,
      projectedBalanceInCents: 0,
      calculatedAt: new Date().toISOString(),
      explanations: [...breathingRoomResult.explanations, ...dailyPaceResult.explanations]
    };
  }, [financialResult, referenceDate, horizonDate]);

  const timeline = useMemo(() => {
    if (!financialResult) return [];
    return projectCashFlow({
      currentBalanceInCents: financialResult.context.currentBalanceInCents,
      expectedIncomes: financialResult.context.expectedIncomes,
      commitments: financialResult.context.commitments,
      referenceDate,
      horizonDate
    });
  }, [financialResult, referenceDate, horizonDate]);

  const risks = useMemo(() => {
    if (!financialResult) return [];
    return detectUpcomingRisks({
      currentBalanceInCents: financialResult.context.currentBalanceInCents,
      expectedIncomes: financialResult.context.expectedIncomes,
      commitments: financialResult.context.commitments,
      referenceDate,
      horizonDate
    });
  }, [financialResult, referenceDate, horizonDate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Calculando seu contexto financeiro...</p>
      </div>
    );
  }

  if (error || !financialResult || !snapshot) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>
            {error || "Não foi possível calcular o contexto financeiro."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const primaryRisk = risks.length > 0 ? risks[0] : null;
  const recommendedAction = buildRecommendedAction(snapshot, risks);
  const isPartial = financialResult.quality === "partial" || financialResult.quality === "insufficient";

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <header className="space-y-3 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Boa tarde.</h1>
            <p className="text-muted-foreground text-lg">Veja como está seu mês hoje.</p>
          </div>
          {source === "demo" && (
            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border border-yellow-200">
              Dados Fictícios
            </div>
          )}
        </div>

        {isPartial && (
          <Alert className="bg-blue-50/50 border-blue-100 text-blue-900">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800 font-semibold">Estimativa Parcial</AlertTitle>
            <AlertDescription className="text-blue-700/90 text-sm mt-1">
              Este resultado considera somente as movimentações registradas no Emdia. Sua reserva mínima e seu saldo bancário real ainda não estão configurados.
            </AlertDescription>
          </Alert>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2 relative">
          <BreathingRoomCard
            breathingRoomInCents={snapshot.breathingRoomInCents}
            onExplainClick={() => setExplainOpen(true)}
            isPartial={isPartial}
          />
        </div>
        <div className="md:col-span-2">
          <SafeDailyPaceCard
            dailyPaceInCents={snapshot.safeDailyPaceInCents}
            horizonDate={horizonDate}
          />
        </div>
        <div className="md:col-span-2">
          <PrimaryRiskCard risk={primaryRisk} />
        </div>
        <div className="md:col-span-2">
          <RecommendedActionCard action={recommendedAction} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FinancialTimeline timeline={timeline} />
        <DecisionSimulator
          currentBalanceInCents={financialResult.context.currentBalanceInCents}
          commitments={financialResult.context.commitments}
          expectedIncomes={financialResult.context.expectedIncomes}
          protectedAmountInCents={financialResult.context.protectedAmountInCents}
          minimumReserveInCents={financialResult.context.minimumReserveInCents}
          referenceDate={referenceDate}
          horizonDate={horizonDate}
        />
      </div>

      <div className="mt-8">
        <div className="relative">
          <Input
            className="w-full pl-4 pr-12 py-6 rounded-2xl bg-muted/50 border-muted focus-visible:ring-primary shadow-sm text-base"
            placeholder="Pergunte ou registre algo... “Posso gastar R$ 300 em roupas?”"
          />
          <div className="absolute right-3 top-3 bg-primary text-primary-foreground p-1.5 rounded-xl cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </div>
        </div>
      </div>

      <ExplainCalculationDialog
        open={explainOpen}
        onOpenChange={setExplainOpen}
        snapshot={snapshot}
        horizonDate={horizonDate}
        totalIncomeInCents={financialResult.context.expectedIncomes.reduce((sum, inc) => sum + inc.amountInCents, 0)}
        totalCommitmentsInCents={financialResult.context.commitments.reduce((sum, com) => sum + com.amountInCents, 0)}
        minimumReserveInCents={financialResult.context.minimumReserveInCents}
      />
    </div>
  );
}
