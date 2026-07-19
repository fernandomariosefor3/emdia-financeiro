import { 
  FinancialCommitment, 
  FinancialScenario, 
  FinancialSnapshot, 
  PurchaseProposal, 
  MoneyInCents,
  ExpectedIncome
} from "./types";
import { addDays, compareDates } from "./dates";
import { calculateBreathingRoom } from "./calculateBreathingRoom";
import { calculateSafeDailyPace } from "./calculateSafeDailyPace";
import { detectUpcomingRisks } from "./detectUpcomingRisks";
import { subtractMoney } from "./money";

export interface SimulatePurchaseParams {
  currentBalanceInCents: MoneyInCents;
  commitments: FinancialCommitment[];
  expectedIncomes: ExpectedIncome[];
  protectedAmountInCents: MoneyInCents;
  minimumReserveInCents: MoneyInCents;
  referenceDate: string;
  horizonDate: string;
  proposal: PurchaseProposal;
}

export const simulatePurchase = (params: SimulatePurchaseParams): FinancialScenario => {
  const {
    currentBalanceInCents,
    commitments,
    expectedIncomes,
    protectedAmountInCents,
    minimumReserveInCents,
    referenceDate,
    horizonDate,
    proposal
  } = params;

  // 1. Calcula o estado atual (Before)
  const previousBreathingRoom = calculateBreathingRoom({
    currentBalanceInCents, commitments, expectedIncomes, protectedAmountInCents, minimumReserveInCents, referenceDate, horizonDate
  });
  
  const previousPace = calculateSafeDailyPace({
    breathingRoomInCents: previousBreathingRoom.breathingRoomInCents,
    expectedIncomes,
    referenceDate,
    defaultHorizonDate: horizonDate
  });

  const previousSnapshot: FinancialSnapshot = {
    referenceDate,
    currentBalanceInCents,
    committedAmountInCents: previousBreathingRoom.committedAmountInCents,
    protectedAmountInCents: previousBreathingRoom.protectedAmountInCents,
    breathingRoomInCents: previousBreathingRoom.breathingRoomInCents,
    safeDailyPaceInCents: previousPace.safeDailyPaceInCents,
    nextIncomeDate: previousPace.nextIncomeDate,
    projectedBalanceInCents: 0, // Simplificação
    calculatedAt: new Date().toISOString(),
    explanations: [...previousBreathingRoom.explanations, ...previousPace.explanations]
  };

  // 2. Constrói a lista de compromissos simulada
  let simulatedCommitments = [...commitments];
  const affectedCommitments: string[] = [];
  const explanations: string[] = [];

  if (proposal.paymentMethod === "cash") {
    // Para compras à vista (cash), se a data for hoje, afeta diretamente o saldo.
    // Mas para manter as funções puras e a simulação simples, podemos tratar como um novo compromisso pendente
    // com data de hoje ou abater o saldo. Tratando como compromisso mantém a lógica unificada.
    const newId = `sim-purchase-cash-${Date.now()}`;
    simulatedCommitments.push({
      id: newId,
      name: proposal.description,
      amountInCents: proposal.totalAmountInCents,
      dueDate: proposal.firstDueDate,
      status: "pending",
      essential: false,
      priority: 3
    });
    affectedCommitments.push(newId);
    explanations.push(`Simulando compra à vista de ${proposal.totalAmountInCents} centavos para o dia ${proposal.firstDueDate}.`);
  } else if (proposal.paymentMethod === "installments") {
    // Compras parceladas
    const amountPerInstallment = Math.floor(proposal.totalAmountInCents / proposal.installments);
    let currentDate = proposal.firstDueDate;

    for (let i = 1; i <= proposal.installments; i++) {
      // Se a parcela cair após o horizonte, será ignorada pelo calculateBreathingRoom,
      // mas deve ser adicionada à lista para corretude.
      const newId = `sim-purchase-inst-${i}`;
      simulatedCommitments.push({
        id: newId,
        name: `${proposal.description} (${i}/${proposal.installments})`,
        amountInCents: amountPerInstallment,
        dueDate: currentDate,
        status: "pending",
        essential: false,
        priority: 3,
        installment: { current: i, total: proposal.installments }
      });
      affectedCommitments.push(newId);
      
      // Adicionar ~30 dias para a próxima parcela
      // Para ser simples e exato, usamos addDays(30)
      currentDate = addDays(currentDate, 30); 
    }
    explanations.push(`Simulando compra parcelada em ${proposal.installments} vezes de ${amountPerInstallment} centavos.`);
  }

  // 3. Calcula o estado simulado (After)
  const simulatedBreathingRoom = calculateBreathingRoom({
    currentBalanceInCents, commitments: simulatedCommitments, expectedIncomes, protectedAmountInCents, minimumReserveInCents, referenceDate, horizonDate
  });

  const simulatedPace = calculateSafeDailyPace({
    breathingRoomInCents: simulatedBreathingRoom.breathingRoomInCents,
    expectedIncomes,
    referenceDate,
    defaultHorizonDate: horizonDate
  });

  const simulatedSnapshot: FinancialSnapshot = {
    referenceDate,
    currentBalanceInCents,
    committedAmountInCents: simulatedBreathingRoom.committedAmountInCents,
    protectedAmountInCents: simulatedBreathingRoom.protectedAmountInCents,
    breathingRoomInCents: simulatedBreathingRoom.breathingRoomInCents,
    safeDailyPaceInCents: simulatedPace.safeDailyPaceInCents,
    nextIncomeDate: simulatedPace.nextIncomeDate,
    projectedBalanceInCents: 0,
    calculatedAt: new Date().toISOString(),
    explanations: [...simulatedBreathingRoom.explanations, ...simulatedPace.explanations]
  };

  // 4. Calcula novos riscos
  // Pega os riscos originais para comparação
  const previousRisks = detectUpcomingRisks({
    currentBalanceInCents, expectedIncomes, commitments, referenceDate, horizonDate
  });

  const simulatedRisks = detectUpcomingRisks({
    currentBalanceInCents, expectedIncomes, commitments: simulatedCommitments, referenceDate, horizonDate
  });

  // Novos riscos são os que aparecem no cenário simulado e não existiam no original
  // ou os riscos existentes cuja severidade ou shortfall aumentou
  const previousRiskIds = previousRisks.map(r => r.id);
  const newRisks = simulatedRisks.filter(r => !previousRiskIds.includes(r.id));

  const breathingRoomDiff = subtractMoney(simulatedSnapshot.breathingRoomInCents, previousSnapshot.breathingRoomInCents);
  const paceDiff = subtractMoney(simulatedSnapshot.safeDailyPaceInCents, previousSnapshot.safeDailyPaceInCents);

  if (newRisks.length > 0) {
    explanations.push(`Atenção: A simulação gerou ${newRisks.length} novo(s) risco(s).`);
  }

  return {
    previousSnapshot,
    simulatedSnapshot,
    breathingRoomDifferenceInCents: breathingRoomDiff,
    dailyPaceDifferenceInCents: paceDiff,
    newRisks,
    affectedCommitments,
    explanations
  };
};
