import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { STRIPE_SECRET_KEY } from "./secrets";
import { getStripeClient } from "./stripeClient";

export interface CreateBillingPortalSessionResult {
  url: string;
}

const BILLING_PORTAL_RETURN_URL = "https://emdiafinanceiro.com.br/planos";

/**
 * Authenticated callable: opens the Stripe-hosted billing portal for the
 * caller's own subscription (cancel, update payment method, view
 * invoices). Never invoked in this session — STRIPE_SECRET_KEY is unset.
 */
export const createBillingPortalSession = onCall(
  { secrets: [STRIPE_SECRET_KEY] },
  async (request): Promise<CreateBillingPortalSessionResult> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Faça login para gerenciar sua assinatura.");
    }

    const uid = request.auth.uid;
    const db = getFirestore();
    const billingDoc = await db.collection("users").doc(uid).collection("billing").doc("current").get();
    const customerId = billingDoc.exists
      ? (billingDoc.data() as { stripeCustomerId?: string }).stripeCustomerId
      : undefined;

    if (!customerId) {
      throw new HttpsError("failed-precondition", "Nenhuma assinatura encontrada para esta conta.");
    }

    const stripe = getStripeClient(STRIPE_SECRET_KEY.value());
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: BILLING_PORTAL_RETURN_URL,
    });

    return { url: session.url };
  }
);
