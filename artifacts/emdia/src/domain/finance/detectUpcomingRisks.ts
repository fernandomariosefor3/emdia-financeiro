import { FinancialCommitment, FinancialRisk, ExpectedIncome, MoneyInCents } from "./types";
import { projectCashFlow } from "./projectCashFlow";
import { isOverdue } from "./dates";

export interface DetectUpcomingRisksParams {
  currentBalanceInCents: MoneyInCents;
  expectedIncomes: ExpectedIncome[]; // Geralmente passar apenas confirmed
  commitments: FinancialCommitment[];
  referenceDate: string;
  horizonDate: string;
}

export const detectUpcomingRisks = (params: DetectUpcomingRisksParams): FinancialRisk[] => {
  const { currentBalanceInCents, expectedIncomes, commitments, referenceDate, horizonDate } = params;
  const risks: FinancialRisk[] = [];

  // Risco 1: Compromissos já vencidos
  const overdueCommitments = commitments.filter(
    (com) => com.status === "pending" && isOverdue(com.dueDate, referenceDate)
  );
  
  for (const overdue of overdueCommitments) {
    risks.push({
      id: `risk-overdue-${overdue.id}`,
      commitmentId: overdue.id,
      date: referenceDate,
      shortfallInCents: overdue.amountInCents,
      severity: overdue.essential ? "critical" : "high",
      reason: "Compromisso vencido",
      suggestedAdjustmentInCents: overdue.amountInCents,
    });
  }

  // Risco 2: Insuficiência de fluxo de caixa (Saldo Negativo)
  const cashFlowEvents = projectCashFlow({
    currentBalanceInCents,
    expectedIncomes,
    commitments,
    referenceDate,
    horizonDate,
  });

  for (const event of cashFlowEvents) {
    if (event.type === "expense" && event.balanceAfterInCents < 0) {
      // Existe risco aqui! O saldo ficou negativo ao tentar pagar esta despesa.
      const commitment = commitments.find(c => c.id === event.id);
      const isEssential = commitment ? commitment.essential : false;
      const shortfall = Math.abs(event.balanceAfterInCents); // O quanto faltou (em módulo)

      // Evitar duplicar o risco se já foi marcado como vencido (o vencido usa referenceDate)
      // Mas no fluxo de caixa o vencido tbm aparece na referenceDate.
      const alreadyHasOverdueRisk = risks.some(r => r.commitmentId === event.id && r.reason === "Compromisso vencido");
      
      if (!alreadyHasOverdueRisk) {
        risks.push({
          id: `risk-shortfall-${event.id}-${event.date}`,
          commitmentId: event.id,
          date: event.date,
          shortfallInCents: shortfall,
          severity: isEssential ? "critical" : "high",
          reason: "Sem cobertura financeira (saldo projetado negativo)",
          suggestedAdjustmentInCents: shortfall,
        });
      }
    }
  }

  return risks;
};
