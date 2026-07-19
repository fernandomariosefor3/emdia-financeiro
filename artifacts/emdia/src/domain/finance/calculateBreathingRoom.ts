import { FinancialCommitment, ExpectedIncome, MoneyInCents, FinancialSnapshot } from "./types";
import { compareDates } from "./dates";
import { addMoney, subtractMoney } from "./money";

export interface CalculateBreathingRoomParams {
  currentBalanceInCents: MoneyInCents;
  commitments: FinancialCommitment[];
  expectedIncomes: ExpectedIncome[];
  protectedAmountInCents: MoneyInCents; // metas
  minimumReserveInCents: MoneyInCents; // reserva mínima
  referenceDate: string;
  horizonDate: string; // até quando calcular (ex: fim do mês ou próxima renda)
}

export const calculateBreathingRoom = (
  params: CalculateBreathingRoomParams
): Pick<FinancialSnapshot, 'breathingRoomInCents' | 'committedAmountInCents' | 'protectedAmountInCents' | 'explanations'> => {
  const {
    currentBalanceInCents,
    commitments,
    expectedIncomes,
    protectedAmountInCents,
    minimumReserveInCents,
    referenceDate,
    horizonDate,
  } = params;

  const explanations: string[] = [];
  explanations.push(`Cálculo iniciado para a data base ${referenceDate} com horizonte até ${horizonDate}.`);
  explanations.push(`Saldo atual: ${currentBalanceInCents} centavos.`);

  // Filtra receitas confirmadas dentro do horizonte
  let totalConfirmedIncome = 0;
  for (const income of expectedIncomes) {
    if (income.confidence === "confirmed" && income.status === "pending") {
      if (compareDates(income.expectedDate, referenceDate) >= 0 && compareDates(income.expectedDate, horizonDate) <= 0) {
        totalConfirmedIncome = addMoney(totalConfirmedIncome, income.amountInCents);
        explanations.push(`Receita confirmada somada: ${income.description} (${income.amountInCents} centavos) na data ${income.expectedDate}.`);
      }
    }
  }

  // Filtra compromissos pendentes no horizonte (ou vencidos)
  let committedAmountInCents = 0;
  for (const commitment of commitments) {
    if (commitment.status === "pending" || commitment.status === "overdue") {
      if (compareDates(commitment.dueDate, horizonDate) <= 0) {
        committedAmountInCents = addMoney(committedAmountInCents, commitment.amountInCents);
        explanations.push(`Compromisso deduzido: ${commitment.name} (${commitment.amountInCents} centavos) vencendo em ${commitment.dueDate}.`);
      }
    }
  }

  const totalProtections = addMoney(protectedAmountInCents, minimumReserveInCents);
  if (protectedAmountInCents > 0) {
    explanations.push(`Metas protegidas deduzidas: ${protectedAmountInCents} centavos.`);
  }
  if (minimumReserveInCents > 0) {
    explanations.push(`Reserva mínima deduzida: ${minimumReserveInCents} centavos.`);
  }

  // Breathing Room = Saldo + Receitas Confirmadas - Compromissos - Proteções
  const balanceWithIncome = addMoney(currentBalanceInCents, totalConfirmedIncome);
  const totalDeductions = addMoney(committedAmountInCents, totalProtections);
  const breathingRoomInCents = subtractMoney(balanceWithIncome, totalDeductions);

  explanations.push(`Respiro final calculado: ${breathingRoomInCents} centavos.`);

  return {
    breathingRoomInCents,
    committedAmountInCents,
    protectedAmountInCents: totalProtections,
    explanations
  };
};
