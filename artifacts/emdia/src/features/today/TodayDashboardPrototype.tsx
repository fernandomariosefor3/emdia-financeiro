import { useState, useMemo } from "react";
import { 
  mockReferenceDate, 
  mockInitialBalanceInCents,
  mockMinimumReserveInCents,
  mockConfirmedIncome,
  mockCommitments
} from "./fixtures";
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

export function TodayDashboardPrototype() {
  const [explainOpen, setExplainOpen] = useState(false);
  
  const horizonDate = "2026-07-28";
  
  const snapshot: FinancialSnapshot = useMemo(() => {
    const breathingRoomResult = calculateBreathingRoom({
      currentBalanceInCents: mockInitialBalanceInCents,
      commitments: mockCommitments,
      expectedIncomes: mockConfirmedIncome,
      protectedAmountInCents: 0,
      minimumReserveInCents: mockMinimumReserveInCents,
      referenceDate: mockReferenceDate,
      horizonDate
    });

    const dailyPaceResult = calculateSafeDailyPace({
      breathingRoomInCents: breathingRoomResult.breathingRoomInCents,
      expectedIncomes: mockConfirmedIncome,
      referenceDate: mockReferenceDate,
      defaultHorizonDate: horizonDate
    });

    return {
      referenceDate: mockReferenceDate,
      currentBalanceInCents: mockInitialBalanceInCents,
      committedAmountInCents: breathingRoomResult.committedAmountInCents,
      protectedAmountInCents: breathingRoomResult.protectedAmountInCents,
      breathingRoomInCents: breathingRoomResult.breathingRoomInCents,
      safeDailyPaceInCents: dailyPaceResult.safeDailyPaceInCents,
      nextIncomeDate: dailyPaceResult.nextIncomeDate,
      projectedBalanceInCents: 0,
      calculatedAt: new Date().toISOString(),
      explanations: [...breathingRoomResult.explanations, ...dailyPaceResult.explanations]
    };
  }, [horizonDate]);

  const timeline = useMemo(() => projectCashFlow({
    currentBalanceInCents: mockInitialBalanceInCents,
    expectedIncomes: mockConfirmedIncome,
    commitments: mockCommitments,
    referenceDate: mockReferenceDate,
    horizonDate
  }), [horizonDate]);
  
  const risks = useMemo(() => detectUpcomingRisks({
    currentBalanceInCents: mockInitialBalanceInCents,
    expectedIncomes: mockConfirmedIncome,
    commitments: mockCommitments,
    referenceDate: mockReferenceDate,
    horizonDate
  }), [horizonDate]);

  const primaryRisk = risks.length > 0 ? risks[0] : null;
  const recommendedAction = buildRecommendedAction(snapshot, risks);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <header className="space-y-1 mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Boa tarde, Fernando.</h1>
        <p className="text-muted-foreground text-lg">Veja como está seu mês hoje.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2">
          <BreathingRoomCard 
            breathingRoomInCents={snapshot.breathingRoomInCents} 
            onExplainClick={() => setExplainOpen(true)}
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
          currentBalanceInCents={mockInitialBalanceInCents}
          commitments={mockCommitments}
          expectedIncomes={mockConfirmedIncome}
          protectedAmountInCents={0}
          minimumReserveInCents={mockMinimumReserveInCents}
          referenceDate={mockReferenceDate}
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
        totalIncomeInCents={mockConfirmedIncome.reduce((sum, inc) => sum + inc.amountInCents, 0)}
        totalCommitmentsInCents={mockCommitments.reduce((sum, com) => sum + com.amountInCents, 0)}
        minimumReserveInCents={mockMinimumReserveInCents}
      />
    </div>
  );
}
