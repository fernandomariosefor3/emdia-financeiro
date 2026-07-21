import { describe, it, expect } from "vitest";
import { formatRecommendedActionForUser } from "../formatRecommendedActionForUser";
import { RecommendedAction } from "@/domain/finance/types";

function action(overrides: Partial<RecommendedAction>): RecommendedAction {
  return {
    type: "MAINTAIN_COURSE",
    title: "Tudo sob controle",
    description: "",
    priority: 5,
    amountInCents: null,
    deadline: null,
    reasonCodes: [],
    explanation: "",
    ...overrides,
  };
}

describe("formatRecommendedActionForUser", () => {
  it("6. ação crítica exibe o valor em reais (R$), nunca em centavos crus", () => {
    const formatted = formatRecommendedActionForUser(
      action({
        type: "COVER_CRITICAL_RISK",
        amountInCents: 50000,
        deadline: "2026-07-25",
        reasonCodes: ["CRITICAL_SHORTFALL"],
      })
    );
    expect(formatted.message).toContain("R$");
    expect(formatted.message).toContain("500,00");
    expect(formatted.message).toContain("25/07/2026");
  });

  it("7. ação de risco alto exibe o valor em reais (R$)", () => {
    const formatted = formatRecommendedActionForUser(
      action({
        type: "AVOID_NEGATIVE_BALANCE",
        amountInCents: 12345,
        deadline: "2026-08-01",
        reasonCodes: ["HIGH_RISK_SHORTFALL"],
      })
    );
    expect(formatted.message).toContain("R$");
    expect(formatted.message).toContain("123,45");
  });

  it("ritmo reduzido usa a mensagem amigável esperada", () => {
    const formatted = formatRecommendedActionForUser(
      action({ type: "REDUCE_PACE", deadline: "2026-07-25", reasonCodes: ["LOW_DAILY_PACE"] })
    );
    expect(formatted.message).toBe("Evite gastos não essenciais até a próxima renda.");
  });

  it("manter plano usa uma mensagem amigável, sem mencionar valores tecnicamente", () => {
    const formatted = formatRecommendedActionForUser(
      action({ type: "MAINTAIN_COURSE", amountInCents: 987654, reasonCodes: ["NO_RISK_DETECTED"] })
    );
    expect(formatted.message).toBe("Tudo sob controle. Você pode manter seu ritmo seguro atual.");
  });

  it("8. nenhuma mensagem contém a palavra 'centavos'", () => {
    const scenarios: RecommendedAction[] = [
      action({ type: "COVER_CRITICAL_RISK", amountInCents: 50000, deadline: "2026-07-25" }),
      action({ type: "AVOID_NEGATIVE_BALANCE", amountInCents: 12345, deadline: "2026-08-01" }),
      action({ type: "REDUCE_PACE", deadline: "2026-07-25" }),
      action({ type: "MAINTAIN_COURSE", amountInCents: 987654 }),
    ];
    for (const scenario of scenarios) {
      const formatted = formatRecommendedActionForUser(scenario);
      expect(formatted.message.toLowerCase()).not.toContain("centavos");
    }
  });

  it("9. nenhuma mensagem expõe os reasonCodes técnicos do engine", () => {
    const scenarios: RecommendedAction[] = [
      action({ type: "COVER_CRITICAL_RISK", amountInCents: 50000, deadline: "2026-07-25", reasonCodes: ["CRITICAL_SHORTFALL"] }),
      action({ type: "AVOID_NEGATIVE_BALANCE", amountInCents: 12345, deadline: "2026-08-01", reasonCodes: ["HIGH_RISK_SHORTFALL"] }),
      action({ type: "REDUCE_PACE", deadline: "2026-07-25", reasonCodes: ["LOW_DAILY_PACE"] }),
      action({ type: "MAINTAIN_COURSE", amountInCents: 987654, reasonCodes: ["NO_RISK_DETECTED"] }),
    ];
    const technicalCodes = ["CRITICAL_SHORTFALL", "HIGH_RISK_SHORTFALL", "LOW_DAILY_PACE", "NO_RISK_DETECTED"];
    for (const scenario of scenarios) {
      const formatted = formatRecommendedActionForUser(scenario);
      for (const code of technicalCodes) {
        expect(formatted.message).not.toContain(code);
      }
    }
  });

  it("12. nenhum termo técnico (amountInCents, reasonCodes, snapshot) vaza para a mensagem", () => {
    const formatted = formatRecommendedActionForUser(
      action({ type: "COVER_CRITICAL_RISK", amountInCents: 50000, deadline: "2026-07-25" })
    );
    for (const term of ["amountInCents", "reasonCodes", "snapshot", "shortfallInCents"]) {
      expect(formatted.message).not.toContain(term);
    }
  });
});
