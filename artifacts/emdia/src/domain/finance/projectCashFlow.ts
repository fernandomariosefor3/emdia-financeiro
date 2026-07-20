import { ExpectedIncome, FinancialCommitment, MoneyInCents } from "./types";
import { compareDates } from "./dates";
import { addMoney, subtractMoney } from "./money";

export interface CashFlowEvent {
  date: string; // YYYY-MM-DD
  type: "income" | "expense";
  id: string;
  description: string;
  amountInCents: MoneyInCents;
  balanceBeforeInCents: MoneyInCents;
  balanceAfterInCents: MoneyInCents;
  source: "expected_income" | "financial_commitment";
  confidenceOrStatus: string;
}

export interface ProjectCashFlowParams {
  currentBalanceInCents: MoneyInCents;
  expectedIncomes: ExpectedIncome[];
  commitments: FinancialCommitment[];
  referenceDate: string;
  horizonDate: string;
}

export const projectCashFlow = (params: ProjectCashFlowParams): CashFlowEvent[] => {
  const { currentBalanceInCents, expectedIncomes, commitments, referenceDate, horizonDate } = params;

  // Filtrar eventos futuros (a partir da data de referência até o horizonte)
  // Receitas
  const futureIncomes = expectedIncomes.filter(
    (inc) => inc.status === "pending" && compareDates(inc.expectedDate, referenceDate) >= 0 && compareDates(inc.expectedDate, horizonDate) <= 0
  ).map(inc => ({
    date: inc.expectedDate,
    type: "income" as const,
    id: inc.id,
    description: inc.description,
    amountInCents: inc.amountInCents,
    source: "expected_income" as const,
    confidenceOrStatus: inc.confidence,
  }));

  // Despesas pendentes
  const futureExpenses = commitments.filter(
    (com) => (com.status === "pending" || com.status === "overdue") && compareDates(com.dueDate, horizonDate) <= 0
  ).map(com => ({
    // Se estiver vencida e antes da data de referência, projetamos para HOJE (referenceDate)
    date: compareDates(com.dueDate, referenceDate) < 0 ? referenceDate : com.dueDate,
    type: "expense" as const,
    id: com.id,
    description: com.name,
    amountInCents: com.amountInCents,
    source: "financial_commitment" as const,
    confidenceOrStatus: com.status,
  }));

  const allEvents = [...futureIncomes, ...futureExpenses];

  // Ordenar por data. Se mesma data, processar receitas PRIMEIRO, depois despesas.
  allEvents.sort((a, b) => {
    const dateCmp = compareDates(a.date, b.date);
    if (dateCmp !== 0) return dateCmp;
    if (a.type === "income" && b.type === "expense") return -1;
    if (a.type === "expense" && b.type === "income") return 1;
    return 0; // Se mesmo tipo e mesma data, mantém a ordem original (estável)
  });

  let currentBalance = currentBalanceInCents;
  const cashFlow: CashFlowEvent[] = [];

  for (const event of allEvents) {
    const balanceBefore = currentBalance;
    // Opcional: ignorar receitas incertas no fluxo de caixa primário, mas por padrão vamos projetar apenas confirmed e probable
    // Ou aplicar a regra estrita: apenas confirmed.
    // Para flexibilidade, a função chamadora já deveria filtrar. Mas vamos aceitar todas passadas.
    
    if (event.type === "income") {
      currentBalance = addMoney(currentBalance, event.amountInCents);
    } else {
      currentBalance = subtractMoney(currentBalance, event.amountInCents);
    }

    cashFlow.push({
      ...event,
      balanceBeforeInCents: balanceBefore,
      balanceAfterInCents: currentBalance,
    });
  }

  return cashFlow;
};
