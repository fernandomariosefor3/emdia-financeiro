export type BillingSubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

/**
 * Written exclusively by the backend (checkout + webhook handlers via the
 * Admin SDK) at users/{uid}/billing/current. Firestore rules deny client
 * writes to this subcollection outright — see firestore.rules.
 */
export interface BillingRecord {
  status: BillingSubscriptionStatus;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  priceLookupKey: string;
  updatedAt: string;
}
