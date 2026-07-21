import { describe, it, expect } from "vitest";
import { buildPrepareMonthPreview } from "../buildPrepareMonthPreview";
import { createInitialPrepareMonthState } from "../initialState";
import { PrepareMonthFormState } from "../types";

const TODAY = "2026-07-21";
const NOW_ISO = "2026-07-21T12:00:00.000Z";
const HORIZON = "2026-08-20";

function baseState(overrides: Partial<PrepareMonthFormState> = {}): PrepareMonthFormState {
  return {
    ...createInitialPrepareMonthState(),
    referenceBalance: { amountReaisText: "1000,00", referenceDate: TODAY },
    reserve: { choice: "confirmed_none", amountReaisText: "" },
    ...overrides,
  };
}

describe("buildPrepareMonthPreview — projeção de saldo", () => {
  it("1. projectedBalanceInCents não é um zero fabricado quando há movimento no horizonte", () => {
    const state = baseState({
      incomes: [
        {
          id: "income-1",
          description: "Salário",
          amountReaisText: "500,00",
          expectedDate: "2026-07-25",
          confidenceLabel: "certain",
        },
      ],
    });
    const preview = buildPrepareMonthPreview(state, TODAY, NOW_ISO, HORIZON);
    expect(preview.status).toBe("ready");
    expect(preview.projectedBalanceInCents).toBe(150000);
    expect(preview.projectedBalanceInCents).not.toBe(0);
  });

  it("2. projeção com saldo positivo e nenhum evento futuro permanece igual ao saldo", () => {
    const state = baseState();
    const preview = buildPrepareMonthPreview(state, TODAY, NOW_ISO, HORIZON);
    expect(preview.projectedBalanceInCents).toBe(100000);
  });

  it("3. projeção com compromisso deduz o valor do compromisso no horizonte", () => {
    const state = baseState({
      commitments: [
        {
          id: "commitment-1",
          name: "Cartão",
          amountReaisText: "300,00",
          nextDueDate: "2026-07-28",
          recurrence: "monthly",
          essential: true,
        },
      ],
    });
    const preview = buildPrepareMonthPreview(state, TODAY, NOW_ISO, HORIZON);
    expect(preview.projectedBalanceInCents).toBe(70000);
  });

  it("4. projeção com renda confirmada soma o valor da renda no horizonte", () => {
    const state = baseState({
      incomes: [
        {
          id: "income-1",
          description: "Freela",
          amountReaisText: "200,00",
          expectedDate: "2026-08-01",
          confidenceLabel: "certain",
        },
      ],
    });
    const preview = buildPrepareMonthPreview(state, TODAY, NOW_ISO, HORIZON);
    expect(preview.projectedBalanceInCents).toBe(120000);
  });

  it("5. renda provável permanece ignorada também na projeção de saldo", () => {
    const state = baseState({
      incomes: [
        {
          id: "income-1",
          description: "Bônus incerto",
          amountReaisText: "900,00",
          expectedDate: "2026-07-25",
          confidenceLabel: "probable",
        },
      ],
    });
    const preview = buildPrepareMonthPreview(state, TODAY, NOW_ISO, HORIZON);
    // Sem a renda provável somada, a projeção deve permanecer igual ao saldo informado.
    expect(preview.projectedBalanceInCents).toBe(100000);
  });
});

describe("buildPrepareMonthPreview — pureza", () => {
  it("10. é determinística: mesmas entradas produzem a mesma saída", () => {
    const state = baseState({
      incomes: [
        {
          id: "income-1",
          description: "Salário",
          amountReaisText: "500,00",
          expectedDate: "2026-07-25",
          confidenceLabel: "certain",
        },
      ],
    });
    const first = buildPrepareMonthPreview(state, TODAY, NOW_ISO, HORIZON);
    const second = buildPrepareMonthPreview(state, TODAY, NOW_ISO, HORIZON);
    expect(first).toEqual(second);
  });

  it("11. não altera o formState de entrada", () => {
    const state = baseState({
      commitments: [
        {
          id: "commitment-1",
          name: "Aluguel",
          amountReaisText: "900,00",
          nextDueDate: "2026-08-01",
          recurrence: "monthly",
          essential: true,
        },
      ],
    });
    const snapshotBefore = JSON.parse(JSON.stringify(state));
    buildPrepareMonthPreview(state, TODAY, NOW_ISO, HORIZON);
    expect(state).toEqual(snapshotBefore);
  });
});
