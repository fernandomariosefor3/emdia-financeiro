import { defineSecret } from "firebase-functions/params";

// Declared via Firebase Secret Manager (firebase functions:secrets:set) —
// never given a value here, in docs, in tests, or logged. See
// docs/FOUNDER-ANNUAL-PLAN.md for the operational setup checklist.
export const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
export const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");
