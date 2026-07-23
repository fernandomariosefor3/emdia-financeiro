/**
 * Single source of truth for the Founder annual plan's Stripe-side price
 * shape. Mirrors artifacts/emdia/src/lib/founderPlan.ts on the frontend —
 * the two are kept in sync by hand since functions/ is deployed and typed
 * independently from the pnpm workspace (see docs/FOUNDER-ANNUAL-PLAN.md).
 */
export const FOUNDER_ANNUAL_PRICE = {
  unitAmount: 999,
  currency: "brl",
  interval: "year" as const,
  lookupKey: "emdia_founder_annual_brl_999_v1",
};
