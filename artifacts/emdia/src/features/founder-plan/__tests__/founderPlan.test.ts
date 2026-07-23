import { describe, it, expect } from "vitest";
import { FOUNDER_ANNUAL_PLAN, formatFounderAnnualPrice, isBillingEnabled } from "@/lib/founderPlan";

describe("FOUNDER_ANNUAL_PLAN — configuração central", () => {
  it("1. id é founder-annual", () => {
    expect(FOUNDER_ANNUAL_PLAN.id).toBe("founder-annual");
  });

  it("2. nome é Plano Fundador Emdia", () => {
    expect(FOUNDER_ANNUAL_PLAN.name).toBe("Plano Fundador Emdia");
  });

  it("3. preço é 999 centavos em BRL, anual e recorrente", () => {
    expect(FOUNDER_ANNUAL_PLAN.priceCents).toBe(999);
    expect(FOUNDER_ANNUAL_PLAN.currency).toBe("BRL");
    expect(FOUNDER_ANNUAL_PLAN.interval).toBe("year");
    expect(FOUNDER_ANNUAL_PLAN.recurring).toBe(true);
  });

  it("4. versão do preço é 1", () => {
    expect(FOUNDER_ANNUAL_PLAN.priceVersion).toBe(1);
  });

  it("5. formata o preço como R$ 9,99", () => {
    expect(formatFounderAnnualPrice()).toBe("R$ 9,99");
  });
});

describe("isBillingEnabled — parser estrito da feature flag", () => {
  it("1. apenas a string 'true' habilita", () => {
    expect(isBillingEnabled("true")).toBe(true);
  });

  it("2. undefined, vazio ou qualquer outro valor mantém desabilitado", () => {
    expect(isBillingEnabled(undefined)).toBe(false);
    expect(isBillingEnabled("")).toBe(false);
    expect(isBillingEnabled("1")).toBe(false);
    expect(isBillingEnabled("false")).toBe(false);
  });
});
