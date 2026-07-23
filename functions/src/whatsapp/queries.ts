/**
 * Motor de consultas financeiras para o WhatsApp (W5).
 *
 * Este módulo é autocontido — não importa do domínio frontend
 * (artifacts/emdia/src/domain/finance/), pois as Firebase Functions
 * são empacotadas isoladamente. Repete a lógica de cálculo necessária
 * para as respostas de consulta.
 *
 * Arquitetura: este arquivo conhece apenas Firestore e o schema de
 * transação do Emdia — nunca expõe credenciais, phone numbers, ou
 * conteúdo de mensagens do WhatsApp.
 */

import { Firestore } from "firebase-admin/firestore";
import { format, parseISO, differenceInDays } from "date-fns";

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export interface WsTransaction {
  id: string;
  amount: number; // reais (não centavos — o schema do Emdia usa reais)
  type: "income" | "expense";
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  createdAt: string;
}

export interface WsExpectedIncome {
  id: string;
  description: string;
  amountInCents: number;
  expectedDate: string; // YYYY-MM-DD
  confidence: "confirmed" | "probable" | "uncertain";
  status: "pending" | "received";
}

export interface WsFinancialCommitment {
  id: string;
  name: string;
  amountInCents: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  essential: boolean;
  priority: number;
}

export interface WsFinancialPulse {
  balanceInCents: number;
  incomeInCents: number;
  expenseInCents: number;
  breathingRoomInCents: number;
  safeDailyPaceInCents: number;
  nextIncomeDate: string | null;
  daysUntilNextIncome: number;
  daysUntilHorizon: number;
  transactionCount: number;
  healthStatus: "excellent" | "good" | "caution" | "danger";
}

export interface WsSimulationResult {
  respiroAntes: number;
  respiroDepois: number;
  ritmoAntes: number;
  ritmoDepois: number;
  diffRespiro: number;
  diffRitmo: number;
  novoRisco: boolean;
  purchaseAmountInCents: number;
  paymentMethod: "cash" | "installments";
  installments: number;
  amountPerInstallmentInCents: number;
}

// ─────────────────────────────────────────────
// HELPERS DE DATA (pure functions, same logic as frontend domain)
// ─────────────────────────────────────────────

function compareDates(a: string, b: string): number {
  return parseISO(a).getTime() - parseISO(b).getTime();
}

function daysBetween(a: string, b: string): number {
  return differenceInDays(parseISO(b), parseISO(a));
}

// ─────────────────────────────────────────────
// HELPERS DE DINHEIRO (pure functions)
// ─────────────────────────────────────────────

function formatCentsShort(cents: number): string {
  const reals = cents / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(reals);
}

// ─────────────────────────────────────────────
// MOTOR DE CÁLCULO DE RESPRO
// ─────────────────────────────────────────────

function calculateBreathingRoom(params: {
  currentBalanceInCents: number;
  commitments: WsFinancialCommitment[];
  expectedIncomes: WsExpectedIncome[];
  protectedAmountInCents: number;
  minimumReserveInCents: number;
  referenceDate: string;
  horizonDate: string;
}): { breathingRoomInCents: number; committedAmountInCents: number } {
  const {
    currentBalanceInCents,
    commitments,
    expectedIncomes,
    protectedAmountInCents,
    minimumReserveInCents,
    referenceDate,
    horizonDate,
  } = params;

  // Receitas confirmadas dentro do horizonte
  let totalConfirmedIncome = 0;
  for (const income of expectedIncomes) {
    if (income.confidence === "confirmed" && income.status === "pending") {
      if (
        compareDates(income.expectedDate, referenceDate) >= 0 &&
        compareDates(income.expectedDate, horizonDate) <= 0
      ) {
        totalConfirmedIncome += income.amountInCents;
      }
    }
  }

  // Compromissos pendentes no horizonte
  let committedAmountInCents = 0;
  for (const com of commitments) {
    if (com.status === "pending" || com.status === "overdue") {
      if (compareDates(com.dueDate, horizonDate) <= 0) {
        committedAmountInCents += com.amountInCents;
      }
    }
  }

  const totalProtections = protectedAmountInCents + minimumReserveInCents;
  const breathingRoomInCents =
    currentBalanceInCents + totalConfirmedIncome - committedAmountInCents - totalProtections;

  return { breathingRoomInCents, committedAmountInCents };
}

function calculateSafeDailyPace(params: {
  breathingRoomInCents: number;
  expectedIncomes: WsExpectedIncome[];
  referenceDate: string;
  defaultHorizonDate: string;
}): { safeDailyPaceInCents: number; nextIncomeDate: string | null } {
  const { breathingRoomInCents, expectedIncomes, referenceDate, defaultHorizonDate } = params;

  const futureConfirmedIncomes = expectedIncomes
    .filter((inc) => inc.confidence === "confirmed" && compareDates(inc.expectedDate, referenceDate) > 0)
    .sort((a, b) => compareDates(a.expectedDate, b.expectedDate));

  let targetDate = defaultHorizonDate;
  let nextIncomeDate: string | null = null;

  if (futureConfirmedIncomes.length > 0) {
    nextIncomeDate = futureConfirmedIncomes[0].expectedDate;
    targetDate = nextIncomeDate;
  }

  let daysDiff = daysBetween(referenceDate, targetDate);
  if (daysDiff < 0) daysDiff = 0;

  if (breathingRoomInCents <= 0 || daysDiff <= 0) {
    return { safeDailyPaceInCents: 0, nextIncomeDate };
  }

  const safeDailyPaceInCents = Math.floor(breathingRoomInCents / Math.max(daysDiff, 1));
  return { safeDailyPaceInCents, nextIncomeDate };
}

// ─────────────────────────────────────────────
// CONSULTA PRINCIPAL: getFinancialPulse
// ─────────────────────────────────────────────

/**
 * Consulta todas as transações do usuário no mês atual e calcula
 * o pulso financeiro (respiro, ritmo, saúde).
 */
export async function getFinancialPulse(
  uid: string,
  db: Firestore,
): Promise<WsFinancialPulse> {
  const now = new Date();
  const referenceDate = format(now, "yyyy-MM-dd");

  // Primeiro dia do mês atual e último dia do próximo mês
  const thisMonthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
  const nextMonthEnd = format(new Date(now.getFullYear(), now.getMonth() + 2, 0), "yyyy-MM-dd");
  const horizonDate = nextMonthEnd;

  // Busca transações do Firestore
  const snapshot = await db
    .collection("users")
    .doc(uid)
    .collection("transactions")
    .get();

  const allTx: WsTransaction[] = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      amount: typeof data.amount === "number" ? data.amount : 0,
      type: data.type === "income" || data.type === "expense" ? data.type : "expense",
      date: typeof data.date === "string" ? data.date.slice(0, 10) : referenceDate,
      category: data.category ?? "",
      description: data.description ?? "",
      createdAt: data.createdAt ?? "",
    };
  });

  // Filtra transações do mês atual
  const thisMonthTx = allTx.filter(
    (t) => t.date >= thisMonthStart && t.date <= referenceDate,
  );

  // Transações futuras (próximo mês) que são receitas
  const futureIncomeTx = allTx.filter(
    (t) => t.date > referenceDate && t.date <= horizonDate && t.type === "income",
  );

  // Cálculos básicos
  const incomeInCents = Math.round(
    thisMonthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0) * 100,
  );
  const expenseInCents = Math.round(
    thisMonthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0) * 100,
  );
  const balanceInCents = incomeInCents - expenseInCents;

  // Compromissos: despesas do mês (já registradas = paid)
  const commitments: WsFinancialCommitment[] = thisMonthTx
    .filter((t) => t.type === "expense")
    .map((t) => ({
      id: t.id,
      name: t.description || t.category,
      amountInCents: Math.round(t.amount * 100),
      dueDate: t.date,
      status: "paid" as const,
      essential: false,
      priority: 3,
    }));

  // Receitas confirmadas
  const confirmedIncomes: WsExpectedIncome[] = thisMonthTx
    .filter((t) => t.type === "income")
    .map((t) => ({
      id: t.id,
      description: t.description || t.category,
      amountInCents: Math.round(t.amount * 100),
      expectedDate: t.date,
      confidence: "confirmed" as const,
      status: "pending" as const,
    }));

  // Receitas futuras do próximo mês
  const futureIncomes: WsExpectedIncome[] = futureIncomeTx.map((t) => ({
    id: t.id,
    description: t.description || t.category,
    amountInCents: Math.round(t.amount * 100),
    expectedDate: t.date,
    confidence: "confirmed" as const,
    status: "pending" as const,
  }));

  const allExpectedIncomes = [...confirmedIncomes, ...futureIncomes];

  // Respiro
  const { breathingRoomInCents } = calculateBreathingRoom({
    currentBalanceInCents: balanceInCents,
    commitments,
    expectedIncomes: allExpectedIncomes,
    protectedAmountInCents: 0,
    minimumReserveInCents: 0,
    referenceDate,
    horizonDate,
  });

  // Ritmo diário
  const { safeDailyPaceInCents, nextIncomeDate } = calculateSafeDailyPace({
    breathingRoomInCents,
    expectedIncomes: allExpectedIncomes,
    referenceDate,
    defaultHorizonDate: horizonDate,
  });

  // Dias até próxima renda
  let daysUntilNextIncome = 0;
  if (nextIncomeDate) {
    daysUntilNextIncome = Math.max(daysBetween(referenceDate, nextIncomeDate), 0);
  }

  const daysUntilHorizon = Math.max(daysBetween(referenceDate, horizonDate), 1);

  // Classificação
  let healthStatus: WsFinancialPulse["healthStatus"] = "good";
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
    daysUntilHorizon,
    transactionCount: thisMonthTx.length,
    healthStatus,
  };
}

// ─────────────────────────────────────────────
// CONSULTA: simular compra
// ─────────────────────────────────────────────

export interface SimulatePurchaseParams {
  purchaseAmountInCents: number;
  paymentMethod: "cash" | "installments";
  installments: number;
  firstDueDate: string;
  description: string;
}

export function buildSimulation(
  pulse: WsFinancialPulse,
  params: SimulatePurchaseParams,
): WsSimulationResult {
  const { purchaseAmountInCents, paymentMethod, installments } = params;

  // Compromissos simulados
  let simulatedCommitments: WsFinancialCommitment[] = [];

  if (paymentMethod === "cash") {
    simulatedCommitments = [
      {
        id: "sim-cash",
        name: params.description || "Compra simulada",
        amountInCents: purchaseAmountInCents,
        dueDate: params.firstDueDate,
        status: "pending",
        essential: false,
        priority: 3,
      },
    ];
  } else {
    // Parcelado — uma entrada por parcela
    const amountPerInstallment = Math.floor(purchaseAmountInCents / installments);
    let currentDate = params.firstDueDate;

    for (let i = 1; i <= installments; i++) {
      simulatedCommitments.push({
        id: `sim-inst-${i}`,
        name: `${params.description || "Compra"} (${i}/${installments})`,
        amountInCents: amountPerInstallment,
        dueDate: currentDate,
        status: "pending",
        essential: false,
        priority: 3,
      });
      // Avança ~30 dias por parcela
      const next = new Date(parseISO(currentDate));
      next.setDate(next.getDate() + 30);
      currentDate = format(next, "yyyy-MM-dd");
    }
  }

  // Respiro antes (já calculado no pulse)
  const respiroAntes = pulse.breathingRoomInCents;
  const ritmoAntes = pulse.safeDailyPaceInCents;

  // Respiro depois
  const respiroDepois = respiroAntes - purchaseAmountInCents;

  // Ritmo depois (recalcular com novo respiro e horizonte)
  const daysToDivide = Math.max(pulse.daysUntilNextIncome || pulse.daysUntilHorizon, 1);
  const ritmoDepois = Math.max(Math.floor(respiroDepois / daysToDivide), 0);

  // Novo risco?
  const novoRisco = respiroDepois < 0;

  return {
    respiroAntes,
    respiroDepois,
    ritmoAntes,
    ritmoDepois,
    diffRespiro: respiroDepois - respiroAntes,
    diffRitmo: ritmoDepois - ritmoAntes,
    novoRisco,
    purchaseAmountInCents,
    paymentMethod,
    installments,
    amountPerInstallmentInCents:
      paymentMethod === "installments" ? Math.floor(purchaseAmountInCents / installments) : purchaseAmountInCents,
  };
}

// ─────────────────────────────────────────────
// FORMATADORES DE RESPOSTA (textos enviados ao WhatsApp)
// ─────────────────────────────────────────────

export function formatPulseResponse(pulse: WsFinancialPulse): string {
  const { healthStatus, breathingRoomInCents, safeDailyPaceInCents, nextIncomeDate, daysUntilNextIncome, balanceInCents, incomeInCents, expenseInCents } = pulse;

  const statusEmoji = {
    excellent: "🌟",
    good: "✅",
    caution: "⚠️",
    danger: "🚨",
  };

  const statusText = {
    excellent: "Excelente",
    good: "Saudável",
    caution: "Atenção",
    danger: "Apertado",
  };

  const respiroLabel = breathingRoomInCents >= 0
    ? `Você tem ${formatCentsShort(breathingRoomInCents)} livres`
    : `Você está ${formatCentsShort(Math.abs(breathingRoomInCents))} acima do orçamento`;

  const ritmoLabel = safeDailyPaceInCents > 0
    ? `Pode gastar até ${formatCentsShort(safeDailyPaceInCents)} por dia`
    : "Sem margem para novos gastos hoje";

  const nextIncomeLabel = nextIncomeDate
    ? `Próxima renda em ${daysUntilNextIncome} dia${daysUntilNextIncome !== 1 ? "s" : ""}`
    : "Sem renda futura registrada";

  return [
    `${statusEmoji[healthStatus]} Situação: ${statusText[healthStatus]}`,
    "",
    `💰 Respiro: ${respiroLabel}`,
    `📊 Ritmo: ${ritmoLabel}`,
    `📅 ${nextIncomeLabel}`,
    "",
    `💵 Saldo do mês: ${formatCentsShort(balanceInCents)} (${formatCentsShort(incomeInCents)} entrada, ${formatCentsShort(expenseInCents)} saida)`,
    "",
    "Digite \"simular 350\" para testar uma compra.",
  ].join("\n");
}

export function formatSimulationResponse(
  pulse: WsFinancialPulse,
  sim: WsSimulationResult,
  description: string,
): string {
  const { paymentMethod, installments, amountPerInstallmentInCents } = sim;

  const emoji = sim.novoRisco ? "🚨" : sim.respiroDepois < pulse.expenseInCents * 0.1 ? "⚠️" : "✅";

  let verdict = "";
  if (sim.novoRisco) {
    verdict = `${emoji} Cuidado! Esta compra coloca você no vermelho.`;
  } else if (sim.respiroDepois < pulse.expenseInCents * 0.1) {
    verdict = `${emoji} Atenção! Seu respiro fica bem apertado.`;
  } else {
    verdict = `${emoji} Tudo certo! Seu respiro aguenta essa compra.`;
  }

  const installmentLabel =
    paymentMethod === "installments"
      ? `Parcelado em ${installments}x de ${formatCentsShort(amountPerInstallmentInCents)}`
      : "À vista";

  return [
    verdict,
    "",
    `💸 Compra: ${formatCentsShort(sim.purchaseAmountInCents)} (${installmentLabel})`,
    `   Descrição: ${description || "sem descrição"}`,
    "",
    `📊 Seu respiro:`,
    `   Antes: ${formatCentsShort(sim.respiroAntes)}`,
    `   Depois: ${formatCentsShort(sim.respiroDepois)} (${sim.diffRespiro >= 0 ? "+" : ""}${formatCentsShort(sim.diffRespiro)})`,
    "",
    `📈 Ritmo diário:`,
    `   Antes: ${formatCentsShort(sim.ritmoAntes)}/dia`,
    `   Depois: ${formatCentsShort(sim.ritmoDepois)}/dia (${sim.diffRitmo >= 0 ? "+" : ""}${formatCentsShort(sim.diffRitmo)})`,
  ].join("\n");
}
