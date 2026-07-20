import { FinancialSnapshot, FinancialRisk, RecommendedAction } from "./types";
import { compareDates, differenceInDays } from "./dates";

export const buildRecommendedAction = (
  snapshot: FinancialSnapshot,
  risks: FinancialRisk[]
): RecommendedAction => {
  // Ordenar riscos por severidade (critical -> high -> medium -> low)
  // e depois por data (mais próximo primeiro)
  const severityScore = { critical: 4, high: 3, medium: 2, low: 1 };
  
  const sortedRisks = [...risks].sort((a, b) => {
    if (severityScore[a.severity] !== severityScore[b.severity]) {
      return severityScore[b.severity] - severityScore[a.severity];
    }
    return compareDates(a.date, b.date);
  });

  const topRisk = sortedRisks.length > 0 ? sortedRisks[0] : null;

  // 1. Cobrir compromisso essencial crítico (Vencido ou sem cobertura iminente)
  if (topRisk && topRisk.severity === "critical") {
    return {
      type: "COVER_CRITICAL_RISK",
      title: "Atenção: Risco Crítico Iminente",
      description: `O compromisso associado a este risco necessita de ${topRisk.shortfallInCents} centavos adicionais para ser coberto na data ${topRisk.date}.`,
      priority: 1,
      amountInCents: topRisk.shortfallInCents,
      deadline: topRisk.date,
      reasonCodes: ["CRITICAL_SHORTFALL"],
      explanation: `Existe um risco crítico (ex: conta essencial vencendo ou saldo insuficiente). Você deve guardar imediatamente ${topRisk.shortfallInCents} centavos para evitar juros ou cortes.`
    };
  }

  // 2. Corrigir saldo negativo próximo (Risco alto)
  if (topRisk && topRisk.severity === "high") {
    return {
      type: "AVOID_NEGATIVE_BALANCE",
      title: "Cuidado: Risco de Saldo Negativo",
      description: `Risco de saldo negativo ou insuficiência em conta não-essencial na data ${topRisk.date}.`,
      priority: 2,
      amountInCents: topRisk.shortfallInCents,
      deadline: topRisk.date,
      reasonCodes: ["HIGH_RISK_SHORTFALL"],
      explanation: `O saldo projetado ficará negativo ou uma conta ficará sem fundos. Reduza os gastos agora para poupar ${topRisk.shortfallInCents} centavos.`
    };
  }

  // 3. Reduzir Ritmo se não houver risco imediato, mas o ritmo diário for muito baixo (< R$ 20/dia por ex, mas aqui não usamos valor hardcoded em reais)
  // Como as regras indicam ser determinístico sem "texto livre gerado pela IA", vamos usar um limite baixo de Respiro
  if (snapshot.safeDailyPaceInCents < 2000) { // Se o ritmo for menor que R$ 20 (apenas como fallback heurístico, o ideal é ser configurável)
    return {
      type: "REDUCE_PACE",
      title: "Ritmo de Gastos Baixo",
      description: `Seu ritmo seguro é de apenas ${snapshot.safeDailyPaceInCents} centavos por dia.`,
      priority: 4,
      amountInCents: null,
      deadline: snapshot.nextIncomeDate,
      reasonCodes: ["LOW_DAILY_PACE"],
      explanation: `Seu ritmo diário está restrito. Evite gastos não essenciais até a próxima renda.`
    };
  }

  // 4. Manter o plano atual quando não houver risco
  return {
    type: "MAINTAIN_COURSE",
    title: "Tudo sob controle",
    description: `Não há riscos críticos detectados no horizonte atual. Você tem um ritmo diário de ${snapshot.safeDailyPaceInCents} centavos.`,
    priority: 5,
    amountInCents: snapshot.breathingRoomInCents,
    deadline: snapshot.nextIncomeDate,
    reasonCodes: ["NO_RISK_DETECTED"],
    explanation: `Seu fluxo de caixa está positivo e os compromissos estão cobertos. Siga o seu Ritmo seguro.`
  };
};
