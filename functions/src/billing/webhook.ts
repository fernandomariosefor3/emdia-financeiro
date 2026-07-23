import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from "./secrets";
import { getStripeClient } from "./stripeClient";
import { FOUNDER_ANNUAL_PRICE } from "./config";
import { BillingRecord, BillingSubscriptionStatus } from "./types";

const PROCESSED_EVENTS_COLLECTION = "stripeProcessedEvents";
const CUSTOMERS_COLLECTION = "stripeCustomers";
const FIRESTORE_ALREADY_EXISTS_CODE = 6;

/** Atomic create-if-absent dedup guard, keyed by Stripe's own event id. */
export async function markEventProcessed(eventId: string, db: Firestore): Promise<boolean> {
  const ref = db.collection(PROCESSED_EVENTS_COLLECTION).doc(eventId);
  try {
    await ref.create({ processedAt: new Date().toISOString() });
    return true;
  } catch (error: unknown) {
    const code = (error as { code?: number })?.code;
    if (code === FIRESTORE_ALREADY_EXISTS_CODE) return false;
    throw error;
  }
}

async function writeBillingRecord(uid: string, record: BillingRecord, db: Firestore): Promise<void> {
  await db.collection("users").doc(uid).collection("billing").doc("current").set(record, { merge: true });
}

async function linkCustomerToUid(customerId: string, uid: string, db: Firestore): Promise<void> {
  await db.collection(CUSTOMERS_COLLECTION).doc(customerId).set({ uid });
}

async function findUidByCustomerId(customerId: string, db: Firestore): Promise<string | null> {
  const snapshot = await db.collection(CUSTOMERS_COLLECTION).doc(customerId).get();
  if (!snapshot.exists) return null;
  return (snapshot.data() as { uid: string }).uid;
}

function resolveId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/**
 * Core event router, independent of the HTTPS/signature-verification
 * transport so it can be unit tested against the Firestore emulator with
 * plain fake Stripe event objects — no real Stripe API calls required.
 * Guarded by markEventProcessed so a redelivered event (Stripe retries on
 * any non-2xx) never re-applies a billing state transition.
 */
export async function routeStripeEvent(event: Stripe.Event, db: Firestore): Promise<void> {
  const isNew = await markEventProcessed(event.id, db);
  if (!isNew) {
    logger.info("Stripe event already processed, skipping", { eventId: event.id, type: event.type });
    return;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.client_reference_id;
      const customerId = resolveId(session.customer);
      if (!uid || !customerId) return;

      await linkCustomerToUid(customerId, uid, db);
      await writeBillingRecord(
        uid,
        {
          status: "active",
          stripeCustomerId: customerId,
          stripeSubscriptionId: resolveId(session.subscription),
          priceLookupKey: FOUNDER_ANNUAL_PRICE.lookupKey,
          updatedAt: new Date().toISOString(),
        },
        db
      );
      return;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = resolveId(subscription.customer);
      if (!customerId) return;

      const uid = await findUidByCustomerId(customerId, db);
      if (!uid) return;

      await writeBillingRecord(
        uid,
        {
          status: subscription.status as BillingSubscriptionStatus,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          priceLookupKey: FOUNDER_ANNUAL_PRICE.lookupKey,
          updatedAt: new Date().toISOString(),
        },
        db
      );
      return;
    }

    default:
      return;
  }
}

/**
 * HTTPS entry point: verifies the Stripe signature over the raw body
 * before trusting the event, then delegates to routeStripeEvent. Requires
 * STRIPE_SECRET_KEY (to construct the client) and STRIPE_WEBHOOK_SECRET
 * (to verify the signature) — both unset in this session, so this handler
 * cannot be exercised end-to-end until they are configured.
 */
export const stripeBillingWebhook = onRequest(
  { secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature || Array.isArray(signature)) {
      res.status(400).send("Missing Stripe signature");
      return;
    }

    const stripe = getStripeClient(STRIPE_SECRET_KEY.value());
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, signature, STRIPE_WEBHOOK_SECRET.value());
    } catch (error) {
      logger.warn("Stripe webhook signature verification failed", { error: (error as Error).message });
      res.status(400).send("Invalid signature");
      return;
    }

    try {
      await routeStripeEvent(event, getFirestore());
      res.status(200).send("ok");
    } catch (error) {
      logger.error("Stripe webhook processing failed", { error: (error as Error).message, eventId: event.id });
      res.status(500).send("Internal error");
    }
  }
);
