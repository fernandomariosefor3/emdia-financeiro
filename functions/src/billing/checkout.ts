import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { STRIPE_SECRET_KEY } from "./secrets";
import { getStripeClient } from "./stripeClient";
import { FOUNDER_ANNUAL_PRICE } from "./config";

export interface CreateCheckoutSessionResult {
  url: string;
}

const CHECKOUT_SUCCESS_URL = "https://emdiafinanceiro.com.br/planos?checkout=success";
const CHECKOUT_CANCEL_URL = "https://emdiafinanceiro.com.br/planos?checkout=cancelled";

async function getExistingStripeCustomerId(uid: string, db: Firestore): Promise<string | undefined> {
  const snapshot = await db.collection("users").doc(uid).collection("billing").doc("current").get();
  if (!snapshot.exists) return undefined;
  return (snapshot.data() as { stripeCustomerId?: string }).stripeCustomerId;
}

/**
 * Authenticated callable: creates a Stripe Checkout Session for the
 * Founder annual plan (unit_amount 999, brl, yearly — resolved from Stripe
 * by FOUNDER_ANNUAL_PRICE.lookupKey rather than hardcoding a price id).
 * Never invoked in this session — STRIPE_SECRET_KEY is unset, and the
 * frontend only calls this when VITE_ENABLE_BILLING is "true".
 */
export const createAnnualCheckoutSession = onCall(
  { secrets: [STRIPE_SECRET_KEY] },
  async (request): Promise<CreateCheckoutSessionResult> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Faça login para assinar o Plano Fundador.");
    }

    const uid = request.auth.uid;
    const db = getFirestore();
    const stripe = getStripeClient(STRIPE_SECRET_KEY.value());

    const prices = await stripe.prices.list({ lookup_keys: [FOUNDER_ANNUAL_PRICE.lookupKey], limit: 1 });
    const price = prices.data[0];
    if (!price) {
      throw new HttpsError("failed-precondition", "Plano Fundador ainda não está configurado no Stripe.");
    }

    const existingCustomerId = await getExistingStripeCustomerId(uid, db);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      client_reference_id: uid,
      customer: existingCustomerId,
      customer_email: existingCustomerId ? undefined : request.auth.token.email,
      success_url: CHECKOUT_SUCCESS_URL,
      cancel_url: CHECKOUT_CANCEL_URL,
    });

    if (!session.url) {
      throw new HttpsError("internal", "Não foi possível iniciar o checkout.");
    }

    return { url: session.url };
  }
);
