/**
 * Single central config for the Founder annual plan. Mirrors
 * functions/src/billing/config.ts on the backend — kept in sync by hand
 * since functions/ is deployed and typed independently from this
 * workspace (see docs/FOUNDER-ANNUAL-PLAN.md).
 */
export interface FounderAnnualPlan {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  interval: "year";
  recurring: boolean;
  priceVersion: number;
}

export const FOUNDER_ANNUAL_PLAN: FounderAnnualPlan = {
  id: "founder-annual",
  name: "Plano Fundador Emdia",
  priceCents: 999,
  currency: "BRL",
  interval: "year",
  recurring: true,
  priceVersion: 1,
};

export function formatFounderAnnualPrice(plan: FounderAnnualPlan = FOUNDER_ANNUAL_PLAN): string {
  return (plan.priceCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: plan.currency,
  });
}

/**
 * Strict parser: only the literal string "true" enables Checkout. Absent,
 * empty, or any other value means billing stays off — no silent fallback.
 */
export function isBillingEnabled(rawValue: string | undefined): boolean {
  return rawValue === "true";
}
