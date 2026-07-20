import { MoneyInCents, ExpectedIncome } from "./types";
import { differenceInDays, compareDates } from "./dates";

export interface CalculateSafeDailyPaceParams {
  breathingRoomInCents: MoneyInCents;
  expectedIncomes: ExpectedIncome[];
  referenceDate: string;
  defaultHorizonDate: string; // Fim do mês ou horizonte padrão caso não haja renda
}

export const calculateSafeDailyPace = (
  params: CalculateSafeDailyPaceParams
): { safeDailyPaceInCents: MoneyInCents; nextIncomeDate: string | null; explanations: string[] } => {
  const { breathingRoomInCents, expectedIncomes, referenceDate, defaultHorizonDate } = params;
  const explanations: string[] = [];

  // Encontrar a próxima renda confirmada após a data de referência
  const futureConfirmedIncomes = expectedIncomes
    .filter(inc => inc.confidence === "confirmed" && compareDates(inc.expectedDate, referenceDate) > 0)
    .sort((a, b) => compareDates(a.expectedDate, b.expectedDate));

  let targetDate = defaultHorizonDate;
  let nextIncomeDate: string | null = null;

  if (futureConfirmedIncomes.length > 0) {
    nextIncomeDate = futureConfirmedIncomes[0].expectedDate;
    targetDate = nextIncomeDate;
    explanations.push(`Próxima receita confirmada encontrada em ${nextIncomeDate}. Usando como alvo do ritmo.`);
  } else {
    explanations.push(`Nenhuma receita futura confirmada encontrada. Usando horizonte padrão ${defaultHorizonDate}.`);
  }

  // O dia atual conta como 1 dia de gasto. Ex: Se hoje é dia 1 e a renda é dia 2, temos dia 1 (1 dia).
  // A diferença entre dia 1 e dia 2 é 1.
  let daysDiff = differenceInDays(referenceDate, targetDate);

  if (daysDiff < 0) {
    daysDiff = 0; // fallback de segurança
  }
  
  // Garantir que não dividimos por 0. O mínimo de dias é 1 (o próprio dia atual).
  const daysToDivide = Math.max(daysDiff, 1);
  explanations.push(`Dias para diluir o Respiro: ${daysToDivide} dia(s).`);

  // Se o respiro for negativo ou zero, o ritmo é 0.
  if (breathingRoomInCents <= 0) {
    explanations.push(`O Respiro é menor ou igual a zero. O Ritmo é 0.`);
    return { safeDailyPaceInCents: 0, nextIncomeDate, explanations };
  }

  const safeDailyPaceInCents = Math.floor(breathingRoomInCents / daysToDivide);
  explanations.push(`Ritmo diário calculado: ${safeDailyPaceInCents} centavos por dia.`);

  return { safeDailyPaceInCents, nextIncomeDate, explanations };
};
