export type FounderPlanCheckoutState =
  | { kind: "idle" }
  | { kind: "redirecting" }
  | { kind: "error"; message: string };
