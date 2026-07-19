import test, { describe, it } from "node:test";
import assert from "node:assert";

import { 
  calculateBreathingRoom, 
  calculateSafeDailyPace, 
  projectCashFlow, 
  detectUpcomingRisks, 
  simulatePurchase, 
  buildRecommendedAction,
  ExpectedIncome,
  FinancialCommitment,
  PurchaseProposal
} from "../index";

describe("Decision Engine", () => {
  const referenceDate = "2026-07-19";
  const horizonDate = "2026-07-31";

  const basicCommitments: FinancialCommitment[] = [];
  const basicIncomes: ExpectedIncome[] = [];

  it("1. saldo positivo sem compromissos", () => {
    const res = calculateBreathingRoom({
      currentBalanceInCents: 100000,
      commitments: [],
      expectedIncomes: [],
      protectedAmountInCents: 0,
      minimumReserveInCents: 0,
      referenceDate,
      horizonDate
    });
    assert.strictEqual(res.breathingRoomInCents, 100000);
  });

  it("2. saldo positivo com contas futuras", () => {
    const com: FinancialCommitment = { id: "1", name: "Luz", amountInCents: 15000, dueDate: "2026-07-25", status: "pending", essential: true, priority: 1 };
    const res = calculateBreathingRoom({
      currentBalanceInCents: 50000,
      commitments: [com],
      expectedIncomes: [],
      protectedAmountInCents: 0,
      minimumReserveInCents: 0,
      referenceDate,
      horizonDate
    });
    assert.strictEqual(res.breathingRoomInCents, 35000); // 500 - 150
  });

  it("3. saldo insuficiente", () => {
    const com: FinancialCommitment = { id: "1", name: "Luz", amountInCents: 60000, dueDate: "2026-07-25", status: "pending", essential: true, priority: 1 };
    const res = calculateBreathingRoom({
      currentBalanceInCents: 50000,
      commitments: [com],
      expectedIncomes: [],
      protectedAmountInCents: 0,
      minimumReserveInCents: 0,
      referenceDate,
      horizonDate
    });
    assert.strictEqual(res.breathingRoomInCents, -10000);
  });

  it("4. saldo negativo", () => {
    const res = calculateBreathingRoom({
      currentBalanceInCents: -5000,
      commitments: [],
      expectedIncomes: [],
      protectedAmountInCents: 0,
      minimumReserveInCents: 0,
      referenceDate,
      horizonDate
    });
    assert.strictEqual(res.breathingRoomInCents, -5000);
  });

  it("5. próxima renda confirmada", () => {
    const income: ExpectedIncome = { id: "1", description: "Salário", amountInCents: 200000, expectedDate: "2026-07-25", confidence: "confirmed", status: "pending" };
    const res = calculateSafeDailyPace({
      breathingRoomInCents: 60000, // 600 reais
      expectedIncomes: [income],
      referenceDate,
      defaultHorizonDate: horizonDate
    });
    assert.strictEqual(res.nextIncomeDate, "2026-07-25");
    // dias de 19 a 25 = 6 dias. max(6, 1) = 6. 60000 / 6 = 10000.
    assert.strictEqual(res.safeDailyPaceInCents, 10000);
  });

  it("6. renda provável", () => {
    const income: ExpectedIncome = { id: "1", description: "Frila", amountInCents: 50000, expectedDate: "2026-07-25", confidence: "probable", status: "pending" };
    const res = calculateSafeDailyPace({
      breathingRoomInCents: 60000,
      expectedIncomes: [income],
      referenceDate,
      defaultHorizonDate: horizonDate
    });
    // probable não conta como próxima renda para o Ritmo seguro base.
    assert.strictEqual(res.nextIncomeDate, null);
    // vai pro default (31 - 19 = 12). 60000 / 12 = 5000
    assert.strictEqual(res.safeDailyPaceInCents, 5000);
  });

  it("7. renda incerta", () => {
    const income: ExpectedIncome = { id: "1", description: "Frila", amountInCents: 50000, expectedDate: "2026-07-25", confidence: "uncertain", status: "pending" };
    const resRoom = calculateBreathingRoom({
      currentBalanceInCents: 10000,
      commitments: [],
      expectedIncomes: [income],
      protectedAmountInCents: 0,
      minimumReserveInCents: 0,
      referenceDate,
      horizonDate
    });
    // Não soma
    assert.strictEqual(resRoom.breathingRoomInCents, 10000);
  });

  it("8. usuário sem próxima renda", () => {
    const res = calculateSafeDailyPace({
      breathingRoomInCents: 12000,
      expectedIncomes: [],
      referenceDate,
      defaultHorizonDate: horizonDate
    });
    assert.strictEqual(res.nextIncomeDate, null);
    assert.strictEqual(res.safeDailyPaceInCents, 1000); // 12000 / 12 (19 a 31)
  });

  it("9. compromisso vencido", () => {
    const com: FinancialCommitment = { id: "1", name: "Luz", amountInCents: 15000, dueDate: "2026-07-15", status: "pending", essential: true, priority: 1 };
    const risks = detectUpcomingRisks({
      currentBalanceInCents: 50000,
      expectedIncomes: [],
      commitments: [com],
      referenceDate,
      horizonDate
    });
    assert.strictEqual(risks.some(r => r.reason === "Compromisso vencido"), true);
  });

  it("10. compromisso essencial sem cobertura", () => {
    const com: FinancialCommitment = { id: "1", name: "Luz", amountInCents: 60000, dueDate: "2026-07-25", status: "pending", essential: true, priority: 1 };
    const risks = detectUpcomingRisks({
      currentBalanceInCents: 50000,
      expectedIncomes: [],
      commitments: [com],
      referenceDate,
      horizonDate
    });
    const risk = risks.find(r => r.commitmentId === "1");
    assert.ok(risk);
    assert.strictEqual(risk?.severity, "critical");
    assert.strictEqual(risk?.shortfallInCents, 10000);
  });

  it("11. compromissos na mesma data", () => {
    const com1: FinancialCommitment = { id: "1", name: "A", amountInCents: 10000, dueDate: "2026-07-25", status: "pending", essential: true, priority: 1 };
    const inc1: ExpectedIncome = { id: "i1", description: "Sal", amountInCents: 50000, expectedDate: "2026-07-25", confidence: "confirmed", status: "pending" };
    const flow = projectCashFlow({
      currentBalanceInCents: 0,
      expectedIncomes: [inc1],
      commitments: [com1],
      referenceDate,
      horizonDate
    });
    // Income deve processar antes da expense na mesma data
    assert.strictEqual(flow[0].type, "income");
    assert.strictEqual(flow[0].balanceAfterInCents, 50000);
    assert.strictEqual(flow[1].type, "expense");
    assert.strictEqual(flow[1].balanceAfterInCents, 40000);
  });

  it("12. horizonte de um dia", () => {
    const res = calculateSafeDailyPace({
      breathingRoomInCents: 5000,
      expectedIncomes: [],
      referenceDate,
      defaultHorizonDate: referenceDate
    });
    // diff 0 -> max(0, 1) = 1
    assert.strictEqual(res.safeDailyPaceInCents, 5000);
  });

  it("13. compra à vista", () => {
    const sim = simulatePurchase({
      currentBalanceInCents: 50000,
      commitments: [],
      expectedIncomes: [],
      protectedAmountInCents: 0,
      minimumReserveInCents: 0,
      referenceDate,
      horizonDate,
      proposal: {
        totalAmountInCents: 20000,
        paymentMethod: "cash",
        installments: 1,
        firstDueDate: referenceDate,
        description: "Tênis",
        category: "Compras"
      }
    });
    assert.strictEqual(sim.breathingRoomDifferenceInCents, -20000);
  });

  it("14. compra em três parcelas", () => {
    const sim = simulatePurchase({
      currentBalanceInCents: 50000,
      commitments: [],
      expectedIncomes: [],
      protectedAmountInCents: 0,
      minimumReserveInCents: 0,
      referenceDate,
      horizonDate: "2026-08-31", // Horizonte mais longo para cobrir mais parcelas
      proposal: {
        totalAmountInCents: 30000,
        paymentMethod: "installments",
        installments: 3,
        firstDueDate: referenceDate,
        description: "Celular",
        category: "Eletrônicos"
      }
    });
    // 30000 / 3 = 10000. 1ª dia 19/07, 2ª dia 18/08 (dentro do horizonte 31/08), 3ª 17/09 (fora)
    // Então apenas 2 parcelas (20000) caem no horizonte.
    assert.strictEqual(sim.breathingRoomDifferenceInCents, -20000);
  });

  it("15. compra cuja primeira parcela ocorre no mês seguinte", () => {
    const sim = simulatePurchase({
      currentBalanceInCents: 50000,
      commitments: [],
      expectedIncomes: [],
      protectedAmountInCents: 0,
      minimumReserveInCents: 0,
      referenceDate,
      horizonDate: "2026-07-31", // Horizonte do mês atual
      proposal: {
        totalAmountInCents: 10000,
        paymentMethod: "installments",
        installments: 1,
        firstDueDate: "2026-08-05", // mês seguinte
        description: "Algo",
        category: "Compras"
      }
    });
    // Não afeta o respiro do mês atual
    assert.strictEqual(sim.breathingRoomDifferenceInCents, 0);
  });

  it("16. compra que cria novo risco", () => {
    const sim = simulatePurchase({
      currentBalanceInCents: 15000,
      commitments: [],
      expectedIncomes: [],
      protectedAmountInCents: 0,
      minimumReserveInCents: 0,
      referenceDate,
      horizonDate,
      proposal: {
        totalAmountInCents: 20000,
        paymentMethod: "cash",
        installments: 1,
        firstDueDate: "2026-07-25",
        description: "Excedente",
        category: "Geral"
      }
    });
    assert.strictEqual(sim.newRisks.length, 1);
    assert.strictEqual(sim.newRisks[0].shortfallInCents, 5000);
  });

  it("17. meta protegida", () => {
    const res = calculateBreathingRoom({
      currentBalanceInCents: 100000,
      commitments: [],
      expectedIncomes: [],
      protectedAmountInCents: 20000,
      minimumReserveInCents: 0,
      referenceDate,
      horizonDate
    });
    assert.strictEqual(res.breathingRoomInCents, 80000);
  });

  it("18. reserva mínima", () => {
    const res = calculateBreathingRoom({
      currentBalanceInCents: 100000,
      commitments: [],
      expectedIncomes: [],
      protectedAmountInCents: 0,
      minimumReserveInCents: 30000,
      referenceDate,
      horizonDate
    });
    assert.strictEqual(res.breathingRoomInCents, 70000);
  });

  it("19. valores com centavos", () => {
    const res = calculateBreathingRoom({
      currentBalanceInCents: 10050, // R$ 100,50
      commitments: [{ id: "1", name: "A", amountInCents: 1033, dueDate: "2026-07-25", status: "pending", essential: false, priority: 1 }], // R$ 10,33
      expectedIncomes: [],
      protectedAmountInCents: 0,
      minimumReserveInCents: 0,
      referenceDate,
      horizonDate
    });
    assert.strictEqual(res.breathingRoomInCents, 9017); // R$ 90,17
  });

  it("20. valor zero", () => {
    const res = calculateSafeDailyPace({
      breathingRoomInCents: 0,
      expectedIncomes: [],
      referenceDate,
      defaultHorizonDate: horizonDate
    });
    assert.strictEqual(res.safeDailyPaceInCents, 0);
  });

  it("21. entrada inválida", () => {
    assert.throws(() => {
      calculateBreathingRoom({
        currentBalanceInCents: 10.5, // Deve ser inteiro
        commitments: [],
        expectedIncomes: [],
        protectedAmountInCents: 0,
        minimumReserveInCents: 0,
        referenceDate,
        horizonDate
      });
    }, /Invalid money value/);
  });

  it("22. data inválida", () => {
    assert.throws(() => {
      calculateBreathingRoom({
        currentBalanceInCents: 100,
        commitments: [{ id: "1", name: "A", amountInCents: 100, dueDate: "2026-13-40", status: "pending", essential: false, priority: 1 }],
        expectedIncomes: [],
        protectedAmountInCents: 0,
        minimumReserveInCents: 0,
        referenceDate: "INVALID",
        horizonDate
      });
    }, /Invalid date value/);
  });

  it("23. arrays em ordens diferentes gerando o mesmo resultado", () => {
    const com1: FinancialCommitment = { id: "1", name: "A", amountInCents: 1000, dueDate: "2026-07-25", status: "pending", essential: false, priority: 1 };
    const com2: FinancialCommitment = { id: "2", name: "B", amountInCents: 2000, dueDate: "2026-07-20", status: "pending", essential: false, priority: 1 };
    
    const res1 = detectUpcomingRisks({ currentBalanceInCents: 500, expectedIncomes: [], commitments: [com1, com2], referenceDate, horizonDate });
    const res2 = detectUpcomingRisks({ currentBalanceInCents: 500, expectedIncomes: [], commitments: [com2, com1], referenceDate, horizonDate });
    
    assert.deepStrictEqual(res1, res2);
  });

  it("24. ausência de mutação das entradas", () => {
    const originalComs: FinancialCommitment[] = [{ id: "1", name: "A", amountInCents: 1000, dueDate: "2026-07-25", status: "pending", essential: false, priority: 1 }];
    const copyStr = JSON.stringify(originalComs);
    
    simulatePurchase({
      currentBalanceInCents: 50000,
      commitments: originalComs,
      expectedIncomes: [],
      protectedAmountInCents: 0,
      minimumReserveInCents: 0,
      referenceDate,
      horizonDate,
      proposal: { totalAmountInCents: 100, paymentMethod: "cash", installments: 1, firstDueDate: referenceDate, description: "A", category: "A" }
    });

    assert.strictEqual(JSON.stringify(originalComs), copyStr);
  });

  it("25. construção da ação prioritária correta", () => {
    const risk: any = { id: "1", severity: "critical", shortfallInCents: 500, date: "2026-07-20", reason: "Sem cobertura" };
    const action = buildRecommendedAction(
      { safeDailyPaceInCents: 1000, nextIncomeDate: null, breathingRoomInCents: 0 } as any,
      [risk]
    );
    assert.strictEqual(action.type, "COVER_CRITICAL_RISK");
    assert.strictEqual(action.priority, 1);
  });

});
