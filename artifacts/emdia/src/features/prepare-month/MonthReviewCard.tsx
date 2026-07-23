import { useMemo } from "react";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import {
  TrendingUp, TrendingDown, ArrowRight, Target, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { usePrepareMonthPersistence } from "./data/usePrepareMonthPersistence";
import { useTransactions } from "@/hooks/use-transactions";
import { formatMoney } from "@/domain/finance/money";
import { calculateBreathingRoom } from "@/domain/finance/calculateBreathingRoom";
import { calculateSafeDailyPace } from "@/domain/finance/calculateSafeDailyPace";
import type { FinancialContextDocumentV1 } from "@/domain/finance/context/types";

interface ComparisonData {
  plannedIncome: number;
  plannedExpense: number;
  plannedBreathingRoom: number;
  plannedPace: number;
  actualIncome: number;
  actualExpense: number;
  actualBreathingRoom: number;
  actualPace: number;
  incomeGap: number;
  expenseGap: number;
  breathingRoomGap: number;
  dayOfMonth: number;
  daysInMonth: number;
}

function computeComparison(
  ctx: FinancialContextDocumentV1,
  transactions: { type: string; amount: number; date: string }[],
  referenceDate: string,
  horizonDate: string,
): ComparisonData {
  const monthStart = startOfMonth(parseISO(referenceDate));
  const monthEnd = endOfMonth(parseISO(referenceDate));

  // Actual: transactions in the month
  const monthTx = transactions.filter((t) =>
    isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd }),
  );

  const actualIncome = Math.round(
    monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0) * 100,
  );
  const actualExpense = Math.round(
    monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0) * 100,
  );
  const actualBalance = actualIncome - actualExpense;

  // Planned income
  const plannedIncome = ctx.expectedIncomes
    .filter((i) => i.status === "active" && i.confidence === "confirmed")
    .reduce((s, i) => s + i.amountInCents, 0);

  // Planned expense
  const plannedExpense = ctx.recurringCommitments
    .filter((c) => c.status === "active")
    .reduce((s, c) => s + c.amountInCents, 0);

  // Planned breathing room
  const plannedBreathingResult = calculateBreathingRoom({
    currentBalanceInCents: ctx.referenceBalance?.amountInCents ?? 0,
    commitments: ctx.recurringCommitments
      .filter((c) => c.status === "active")
      .map((c) => ({
        id: c.id,
        name: c.name,
        amountInCents: c.amountInCents,
        dueDate: c.nextDueDate,
        status: "pending" as const,
        essential: c.essential,
        priority: c.priority,
        recurrence: c.recurrence,
      })),
    expectedIncomes: ctx.expectedIncomes
      .filter((i) => i.status === "active" && i.confidence === "confirmed")
      .map((i) => ({ ...i, status: "pending" as const })),
    protectedAmountInCents: ctx.protectedGoals
      .filter((g) => g.status === "active")
      .reduce((s, g) => s + g.protectedAmountInCents, 0),
    minimumReserveInCents:
      ctx.minimumReserve.status === "configured"
        ? ctx.minimumReserve.amountInCents
        : 0,
    referenceDate,
    horizonDate,
  });

  // Planned pace
  const paceResult = calculateSafeDailyPace({
    breathingRoomInCents: plannedBreathingResult.breathingRoomInCents,
    expectedIncomes: ctx.expectedIncomes
      .filter((i) => i.status === "active" && i.confidence === "confirmed")
      .map((i) => ({ ...i, status: "pending" as const })),
    referenceDate,
    defaultHorizonDate: horizonDate,
  });

  // Actual breathing room (based on real transactions, no commitments)
  const actualBreathingResult = calculateBreathingRoom({
    currentBalanceInCents: actualBalance,
    commitments: [],
    expectedIncomes: [],
    protectedAmountInCents: 0,
    minimumReserveInCents: 0,
    referenceDate,
    horizonDate,
  });

  const daysInMonth = monthEnd.getDate();
  const dayOfMonth = parseISO(referenceDate).getDate();
  const daysLeft = Math.max(daysInMonth - dayOfMonth, 1);

  const actualPace =
    actualBreathingResult.breathingRoomInCents > 0
      ? Math.floor(actualBreathingResult.breathingRoomInCents / daysLeft)
      : 0;

  return {
    plannedIncome,
    plannedExpense,
    plannedBreathingRoom: plannedBreathingResult.breathingRoomInCents,
    plannedPace: paceResult.safeDailyPaceInCents,
    actualIncome,
    actualExpense,
    actualBreathingRoom: actualBreathingResult.breathingRoomInCents,
    actualPace,
    incomeGap: actualIncome - plannedIncome,
    expenseGap: actualExpense - plannedExpense,
    breathingRoomGap: actualBreathingResult.breathingRoomInCents - plannedBreathingResult.breathingRoomInCents,
    dayOfMonth,
    daysInMonth,
  };
}

function ComparisonRow({
  label,
  planned,
  actual,
  unit = "",
  invertColors = false,
}: {
  label: string;
  planned: number;
  actual: number;
  unit?: string;
  invertColors?: boolean;
}) {
  const diff = actual - planned;
  const isPositive = invertColors ? diff < 0 : diff > 0;
  const isNegative = invertColors ? diff > 0 : diff < 0;

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 line-through">
          {formatMoney(planned)}{unit}
        </span>
        <ArrowRight size={10} className="text-gray-300" />
        <span className="text-sm font-bold text-[#0A0F1E]">
          {formatMoney(actual)}{unit}
        </span>
        {diff !== 0 && (
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              isPositive
                ? "bg-emerald-100 text-emerald-700"
                : isNegative
                ? "bg-rose-100 text-rose-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {diff > 0 ? "+" : ""}{formatMoney(Math.abs(diff))}{unit}
          </span>
        )}
      </div>
    </div>
  );
}

interface MonthReviewCardProps {
  /** If true, shows only the "Revisamos juntos?" prompt. If false, shows full comparison. */
  promptOnly?: boolean;
}

export function MonthReviewCard({ promptOnly = false }: MonthReviewCardProps) {
  const [, navigate] = useLocation();
  const { savedDocument, loadStatus } = usePrepareMonthPersistence();
  const { transactions } = useTransactions();

  const todayIso = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const horizonIso = useMemo(
    () => format(endOfMonth(new Date()), "yyyy-MM-dd"),
    [],
  );

  const hasSaved = loadStatus === "loaded" && savedDocument != null;
  const hasTx = transactions.length > 0;

  // Prompt-only: show when at end of month and user has a saved context
  if (promptOnly) {
    const day = new Date().getDate();
    const isEndOfMonth = day >= 25 || day <= 3;

    if (!isEndOfMonth || !hasSaved) return null;

    return (
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Target size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-amber-900">Revisamos juntos?</p>
              <p className="text-xs text-amber-700/80">
                fim do mês — compare planejado vs. realizado
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/prepare-seu-mes")}
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-xs shrink-0"
          >
            Ver comparativo
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!hasSaved || !hasTx) return null;

  const comparison = useMemo(
    () =>
      computeComparison(savedDocument!, transactions, todayIso, horizonIso),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [savedDocument, transactions, todayIso, horizonIso],
  );

  const progress = Math.round((comparison.dayOfMonth / comparison.daysInMonth) * 100);

  return (
    <Card className="bg-white border-gray-100 shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-extrabold text-[#0A0F1E] flex items-center gap-2">
            <Target size={15} className="text-amber-500" />
            Revisamos juntos
          </CardTitle>
          <span className="text-[10px] text-gray-400 font-medium">
            {comparison.dayOfMonth}/{comparison.daysInMonth} ({progress}%)
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          Comparativo entre seu planejamento e a realidade até hoje
        </p>
      </CardHeader>

      <CardContent className="pt-0 space-y-0">
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-amber-400 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <div className="space-y-0">
          <ComparisonRow
            label="Receitas"
            planned={comparison.plannedIncome}
            actual={comparison.actualIncome}
          />
          <ComparisonRow
            label="Despesas"
            planned={comparison.plannedExpense}
            actual={comparison.actualExpense}
            invertColors
          />
          <ComparisonRow
            label="Respiro"
            planned={comparison.plannedBreathingRoom}
            actual={comparison.actualBreathingRoom}
          />
          <ComparisonRow
            label="Ritmo/dia"
            planned={comparison.plannedPace}
            actual={comparison.actualPace}
            unit="/dia"
          />
        </div>

        {/* Insight */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          {comparison.breathingRoomGap > 0 ? (
            <div className="flex items-start gap-2 bg-emerald-50 rounded-xl p-3">
              <TrendingUp size={15} className="text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                Você está <strong>{formatMoney(comparison.breathingRoomGap)}</strong> acima do
                planejado. Continue assim!
              </p>
            </div>
          ) : comparison.breathingRoomGap < 0 ? (
            <div className="flex items-start gap-2 bg-amber-50 rounded-xl p-3">
              <AlertCircle size={15} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                Você está <strong>{formatMoney(Math.abs(comparison.breathingRoomGap))}</strong>{" "}
                acima do planejado. Considere ajustar seus gastos.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3">
              <TrendingDown size={15} className="text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-800 font-medium leading-relaxed">
                Dentro do planejado. Continue acompanhando!
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={() => navigate("/prepare-seu-mes")}
          variant="outline"
          className="w-full mt-3 rounded-xl text-xs font-semibold h-9"
        >
          Ajustar planejamento
          <ArrowRight size={12} className="ml-1.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
