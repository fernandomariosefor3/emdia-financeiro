import { useMemo } from "react";
import { startOfMonth, endOfMonth, parseISO, isWithinInterval, format, addMonths } from "date-fns";
import { Transaction } from "@/lib/types";
import { calculateBreathingRoom } from "@/domain/finance/calculateBreathingRoom";
import { calculateSafeDailyPace } from "@/domain/finance/calculateSafeDailyPace";
import { detectUpcomingRisks } from "@/domain/finance/detectUpcomingRisks";
import { simulatePurchase } from "@/domain/finance/simulatePurchase";
import type { PurchaseProposal, FinancialScenario } from "@/domain/finance/types";

export interface PulseData {
  /** Saldo do mês: receitas - despesas */
  balanceInCents: number;
  /** Receita total do mês */
  incomeInCents: number;
  /** Despesa total do mês */
  expenseInCents: number;
  /** Respiro financeiro em centavos */
  breathingRoomInCents: number;
  /** Ritmo seguro diário em centavos */
  safeDailyPaceInCents: number;
  /** Próxima data de renda (YYYY-MM-DD) */
  nextIncomeDate: string | null;
  /** Dias até a próxima renda */
  daysUntilNextIncome: number;
  /** Compromissos pendentes (despesas do mês) em centavos */
  committedAmountInCents: number;
  /** Quantidade de transações do mês */
  transactionCount: number;
  /** Riscos detectados */
  risks: ReturnType<typeof detectUpcomingRisks> extends infer T ? T extends never[] ? never[] : T : never[];
  /** Classificação do estado financeiro */
  healthStatus: "excellent" | "good" | "caution" | "danger";
  /** Data de referência atual */
  referenceDate: string;
  /** Horizonte (fim do mês) */
  horizonDate: string;
}

export interface UseFinancialPulseOptions {
  /** Converter transações em compromissos pendentes (default: true) */
  deriveCommitments?: boolean;
  /** Incluir receitas futuras projetadas (default: false) */
  includeProjectedIncome?: boolean;
}

/**
 * Deriva o "pulso financeiro" do usuário a partir das transações do Firebase.
 *
 * Usa o motor de domínio (`calculateBreathingRoom`, `calculateSafeDailyPace`,
 * `detectUpcomingRisks`) para calcular métricas que antes só existiam no
 * "Prepare seu Mês" — agora disponíveis no dashboard com dados reais.
 */
export function useFinancialPulse(
  transactions: Transaction[],
  options: UseFinancialPulseOptions = {},
): PulseData | null {
  const { deriveCommitments = true, includeProjectedIncome = false } = options;

  return useMemo(() => {
    if (transactions.length === 0) return null;

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const nextMonthEnd = endOfMonth(addMonths(now, 1));

    const referenceDate = format(now, "yyyy-MM-dd");
    const horizonDate = format(nextMonthEnd, "yyyy-MM-dd");

    // Transações do mês atual
    const thisMonthTx = transactions.filter((t) =>
      isWithinInterval(parseISO(t.date), { start: thisMonthStart, end: thisMonthEnd }),
    );

    const incomeInCents = Math.round(
      thisMonthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0) * 100,
    );
    const expenseInCents = Math.round(
      thisMonthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0) * 100,
    );
    const balanceInCents = incomeInCents - expenseInCents;

    // Transações futuras (próximo mês) — projetadas como ExpectedIncome
    const futureTx = transactions.filter((t) =>
      isWithinInterval(parseISO(t.date), { start: thisMonthStart, end: nextMonthEnd }) &&
      parseISO(t.date) > now &&
      t.type === "income",
    );

    // Transações futuras do próximo mês
    const nextMonthTx = transactions.filter((t) =>
      isWithinInterval(parseISO(t.date), { start: addMonths(thisMonthStart, 1), end: nextMonthEnd }) &&
      t.type === "income",
    );

    const expectedIncomes = [
      // Receitas já confirmadas (transações registradas)
      ...thisMonthTx
        .filter((t) => t.type === "income")
        .map((t) => ({
          id: t.id,
          description: t.description || t.category,
          amountInCents: Math.round(t.amount * 100),
          expectedDate: t.date,
          confidence: "confirmed" as const,
          status: "pending" as const,
        })),
      // Receitas projetadas do próximo mês (só se ativado)
      ...(includeProjectedIncome
        ? nextMonthTx.map((t) => ({
            id: t.id,
            description: t.description || t.category,
            amountInCents: Math.round(t.amount * 100),
            expectedDate: t.date,
            confidence: "confirmed" as const,
            status: "pending" as const,
          }))
        : []),
    ];

    // Compromissos: despesas do mês (já pagas/registradas = "paid")
    // Se deriveCommitments=false, lista vazia (respiro = saldo puro)
    const commitments = deriveCommitments
      ? thisMonthTx
          .filter((t) => t.type === "expense")
          .map((t) => ({
            id: t.id,
            name: t.description || t.category,
            amountInCents: Math.round(t.amount * 100),
            dueDate: t.date,
            status: "paid" as const,
            essential: false,
            priority: 3,
          }))
      : [];

    // Cálculo do respiro (usando o motor de domínio)
    const breathingResult = calculateBreathingRoom({
      currentBalanceInCents: balanceInCents,
      commitments,
      expectedIncomes,
      protectedAmountInCents: 0,
      minimumReserveInCents: 0,
      referenceDate,
      horizonDate,
    });

    const breathingRoomInCents = breathingResult.breathingRoomInCents;

    // Ritmo diário seguro
    const paceResult = calculateSafeDailyPace({
      breathingRoomInCents,
      expectedIncomes,
      referenceDate,
      defaultHorizonDate: horizonDate,
    });

    const safeDailyPaceInCents = paceResult.safeDailyPaceInCents;
    const nextIncomeDate = paceResult.nextIncomeDate;

    // Dias até próxima renda
    let daysUntilNextIncome = 0;
    if (nextIncomeDate) {
      daysUntilNextIncome = Math.ceil(
        (parseISO(nextIncomeDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
    }

    // Riscos
    const risks = detectUpcomingRisks({
      currentBalanceInCents: balanceInCents,
      expectedIncomes,
      commitments,
      referenceDate,
      horizonDate,
    });

    // Classificação de saúde
    let healthStatus: PulseData["healthStatus"] = "good";
    if (breathingRoomInCents < 0) {
      healthStatus = "danger";
    } else if (breathingRoomInCents < expenseInCents * 0.1) {
      healthStatus = "caution";
    } else if (breathingRoomInCents > expenseInCents * 0.5) {
      healthStatus = "excellent";
    }

    return {
      balanceInCents,
      incomeInCents,
      expenseInCents,
      breathingRoomInCents,
      safeDailyPaceInCents,
      nextIncomeDate,
      daysUntilNextIncome,
      committedAmountInCents: breathingResult.committedAmountInCents,
      transactionCount: thisMonthTx.length,
      risks,
      healthStatus,
      referenceDate,
      horizonDate,
    };
  }, [transactions, deriveCommitments, includeProjectedIncome]);
}

/**
 * Wrapper para simular uma compra usando o motor de decisão.
 * Retorna o cenário antes/depois da compra.
 */
export function simulatePurchaseFromPulse(
  pulse: PulseData,
  proposal: Omit<PurchaseProposal, "category"> & { category: string },
): FinancialScenario {
  const { nextIncomeDate = pulse.horizonDate } = pulse;

  return simulatePurchase({
    currentBalanceInCents: pulse.balanceInCents,
    commitments: [], // compromissos já pagos no mês
    expectedIncomes: pulse.incomeInCents > 0 && nextIncomeDate
      ? [
          {
            id: "next-income",
            description: "Próxima renda",
            amountInCents: pulse.incomeInCents,
            expectedDate: nextIncomeDate,
            confidence: "confirmed" as const,
            status: "pending" as const,
          },
        ]
      : [],
    protectedAmountInCents: 0,
    minimumReserveInCents: 0,
    referenceDate: pulse.referenceDate,
    horizonDate: pulse.horizonDate,
    proposal: {
      ...proposal,
      totalAmountInCents: Math.round(proposal.totalAmountInCents * 100),
      installments: proposal.installments,
      firstDueDate: proposal.firstDueDate || pulse.referenceDate,
    },
  });
}
