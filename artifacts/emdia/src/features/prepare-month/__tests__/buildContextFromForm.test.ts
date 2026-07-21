import { describe, it, expect } from "vitest";
import { buildContextFromForm, parseReaisInputToCents } from "../buildContextFromForm";
import { createInitialPrepareMonthState } from "../initialState";
import { PrepareMonthFormState } from "../types";

const NOW_ISO = "2026-07-21T12:00:00.000Z";
const TODAY = "2026-07-21";

function baseState(overrides: Partial<PrepareMonthFormState> = {}): PrepareMonthFormState {
  return {
    ...createInitialPrepareMonthState(),
    referenceBalance: { amountReaisText: "1500,00", referenceDate: TODAY },
    ...overrides,
  };
}

describe("buildContextFromForm — saldo de referência", () => {
  it("4. saldo positivo é convertido corretamente para centavos", () => {
    const state = baseState({ referenceBalance: { amountReaisText: "1500,00", referenceDate: TODAY } });
    const doc = buildContextFromForm(state, NOW_ISO, TODAY);
    expect(doc?.referenceBalance?.amountInCents).toBe(150000);
  });

  it("5. saldo zero é aceito", () => {
    const state = baseState({ referenceBalance: { amountReaisText: "0", referenceDate: TODAY } });
    const doc = buildContextFromForm(state, NOW_ISO, TODAY);
    expect(doc?.referenceBalance?.amountInCents).toBe(0);
  });

  it("6. saldo negativo é aceito", () => {
    const state = baseState({ referenceBalance: { amountReaisText: "-200,50", referenceDate: TODAY } });
    const doc = buildContextFromForm(state, NOW_ISO, TODAY);
    expect(doc?.referenceBalance?.amountInCents).toBe(-20050);
  });
});

describe("buildContextFromForm — reserva mínima", () => {
  it("8. reserva ausente vira status missing", () => {
    const state = baseState({ reserve: { choice: "undecided", amountReaisText: "" } });
    const doc = buildContextFromForm(state, NOW_ISO, TODAY);
    expect(doc?.minimumReserve).toEqual({ status: "missing" });
  });

  it("9. reserva positiva vira status configured com explicitZero false", () => {
    const state = baseState({ reserve: { choice: "want_to_protect", amountReaisText: "500,00" } });
    const doc = buildContextFromForm(state, NOW_ISO, TODAY);
    expect(doc?.minimumReserve).toEqual({
      status: "configured",
      amountInCents: 50000,
      explicitZero: false,
      lastConfirmedAt: NOW_ISO,
    });
  });

  it("10. reserva zero explícita vira status configured com explicitZero true", () => {
    const state = baseState({ reserve: { choice: "confirmed_none", amountReaisText: "" } });
    const doc = buildContextFromForm(state, NOW_ISO, TODAY);
    expect(doc?.minimumReserve).toEqual({
      status: "configured",
      amountInCents: 0,
      explicitZero: true,
      lastConfirmedAt: NOW_ISO,
    });
  });

  it("11. campo de valor vazio ao escolher proteger não vira zero silenciosamente", () => {
    const state = baseState({ reserve: { choice: "want_to_protect", amountReaisText: "" } });
    const doc = buildContextFromForm(state, NOW_ISO, TODAY);
    expect(doc).toBeNull();
  });
});

describe("buildContextFromForm — renda esperada", () => {
  it("12. renda com confiança 'certain' mapeia para confirmed", () => {
    const state = baseState({
      incomes: [
        {
          id: "income-1",
          description: "Salário",
          amountReaisText: "3000,00",
          expectedDate: "2026-07-25",
          confidenceLabel: "certain",
        },
      ],
    });
    const doc = buildContextFromForm(state, NOW_ISO, TODAY);
    expect(doc?.expectedIncomes[0].confidence).toBe("confirmed");
  });

  it("13. renda com confiança 'probable' mapeia para probable", () => {
    const state = baseState({
      incomes: [
        {
          id: "income-1",
          description: "Freela",
          amountReaisText: "800,00",
          expectedDate: "2026-07-25",
          confidenceLabel: "probable",
        },
      ],
    });
    const doc = buildContextFromForm(state, NOW_ISO, TODAY);
    expect(doc?.expectedIncomes[0].confidence).toBe("probable");
  });

  it("14. renda com confiança 'uncertain' mapeia para uncertain", () => {
    const state = baseState({
      incomes: [
        {
          id: "income-1",
          description: "Bônus",
          amountReaisText: "500,00",
          expectedDate: "2026-07-25",
          confidenceLabel: "uncertain",
        },
      ],
    });
    const doc = buildContextFromForm(state, NOW_ISO, TODAY);
    expect(doc?.expectedIncomes[0].confidence).toBe("uncertain");
  });
});

describe("buildContextFromForm — compromissos", () => {
  function commitmentState(recurrence: "monthly" | "weekly" | "yearly") {
    return baseState({
      commitments: [
        {
          id: "commitment-1",
          name: "Aluguel",
          amountReaisText: "900,00",
          nextDueDate: "2026-08-01",
          recurrence,
          essential: true,
        },
      ],
    });
  }

  it("15. compromisso mensal preserva recorrência monthly", () => {
    const doc = buildContextFromForm(commitmentState("monthly"), NOW_ISO, TODAY);
    expect(doc?.recurringCommitments[0].recurrence).toBe("monthly");
  });

  it("16. compromisso semanal preserva recorrência weekly", () => {
    const doc = buildContextFromForm(commitmentState("weekly"), NOW_ISO, TODAY);
    expect(doc?.recurringCommitments[0].recurrence).toBe("weekly");
  });

  it("17. compromisso anual preserva recorrência yearly", () => {
    const doc = buildContextFromForm(commitmentState("yearly"), NOW_ISO, TODAY);
    expect(doc?.recurringCommitments[0].recurrence).toBe("yearly");
  });

  it("18. custom_interval nunca aparece nos compromissos gerados", () => {
    const doc = buildContextFromForm(commitmentState("monthly"), NOW_ISO, TODAY);
    const recurrences = doc?.recurringCommitments.map((c) => c.recurrence) ?? [];
    expect(recurrences.every((r) => r === "monthly" || r === "weekly" || r === "yearly")).toBe(true);
    expect(recurrences).not.toContain("custom_interval");
  });
});

describe("buildContextFromForm — imutabilidade", () => {
  it("30. não muta o estado original informado", () => {
    const state = baseState({
      incomes: [
        {
          id: "income-1",
          description: "Salário",
          amountReaisText: "3000,00",
          expectedDate: "2026-07-25",
          confidenceLabel: "certain",
        },
      ],
    });
    const snapshotBefore = JSON.parse(JSON.stringify(state));
    buildContextFromForm(state, NOW_ISO, TODAY);
    expect(state).toEqual(snapshotBefore);
  });
});

describe("parseReaisInputToCents", () => {
  it("retorna null para entrada vazia em vez de zero", () => {
    expect(parseReaisInputToCents("")).toBeNull();
  });

  it("retorna null para entrada não numérica", () => {
    expect(parseReaisInputToCents("abc")).toBeNull();
  });
});
