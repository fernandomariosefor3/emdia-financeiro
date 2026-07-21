import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RecommendedAction } from "@/domain/finance/types";
import { formatMoney } from "@/domain/finance/money";
import { parseDate } from "@/domain/finance/dates";

export interface FormattedRecommendedAction {
  type: string;
  priority: number;
  title: string;
  message: string;
}

function formatCivilDate(date: string): string {
  return format(parseDate(date), "dd/MM/yyyy", { locale: ptBR });
}

/**
 * Pure presentation layer: translates a RecommendedAction (Decision Engine
 * output, which may reference raw cent amounts and reasonCodes) into a
 * user-facing sentence. Never recalculates risk or the decision itself —
 * only formats what the engine already decided.
 */
export function formatRecommendedActionForUser(action: RecommendedAction): FormattedRecommendedAction {
  const amountText = action.amountInCents !== null ? formatMoney(action.amountInCents) : null;
  const deadlineText = action.deadline ? formatCivilDate(action.deadline) : null;

  let message: string;
  switch (action.type) {
    case "COVER_CRITICAL_RISK":
      message = deadlineText && amountText
        ? `Reserve ${amountText} até ${deadlineText}.`
        : "Reserve o valor necessário o quanto antes para cobrir este compromisso.";
      break;
    case "AVOID_NEGATIVE_BALANCE":
      message = deadlineText && amountText
        ? `Ajuste seus gastos para cobrir ${amountText} até ${deadlineText}.`
        : "Ajuste seus gastos para evitar ficar com saldo negativo.";
      break;
    case "REDUCE_PACE":
      message = "Evite gastos não essenciais até a próxima renda.";
      break;
    case "MAINTAIN_COURSE":
    default:
      message = "Tudo sob controle. Você pode manter seu ritmo seguro atual.";
      break;
  }

  return {
    type: action.type,
    priority: action.priority,
    title: action.title,
    message,
  };
}
