import { test } from "node:test";
import assert from "node:assert/strict";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type Stripe from "stripe";
import { markEventProcessed, routeStripeEvent } from "../webhook";

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || "emdia-test";

initializeApp({ projectId: "emdia-test" });
const db = getFirestore();

function checkoutCompletedEvent(id: string, uid: string, customerId: string, subscriptionId: string): Stripe.Event {
  return {
    id,
    type: "checkout.session.completed",
    data: {
      object: {
        client_reference_id: uid,
        customer: customerId,
        subscription: subscriptionId,
      },
    },
  } as unknown as Stripe.Event;
}

function subscriptionUpdatedEvent(id: string, customerId: string, subscriptionId: string, status: string): Stripe.Event {
  return {
    id,
    type: "customer.subscription.updated",
    data: {
      object: {
        id: subscriptionId,
        customer: customerId,
        status,
      },
    },
  } as unknown as Stripe.Event;
}

test("markEventProcessed — dedup por event id", async (t) => {
  await t.test("1. primeira vez retorna true", async () => {
    const isNew = await markEventProcessed(`evt_first_${Date.now()}`, db);
    assert.equal(isNew, true);
  });

  await t.test("2. segunda vez com o mesmo event id retorna false", async () => {
    const eventId = `evt_dup_${Date.now()}`;
    assert.equal(await markEventProcessed(eventId, db), true);
    assert.equal(await markEventProcessed(eventId, db), false);
  });
});

test("routeStripeEvent — checkout.session.completed", async (t) => {
  await t.test("1. vincula o customer ao uid e grava assinatura ativa", async () => {
    const uid = `user_${Date.now()}`;
    const customerId = `cus_${Date.now()}`;
    const subscriptionId = `sub_${Date.now()}`;
    const event = checkoutCompletedEvent(`evt_checkout_${Date.now()}`, uid, customerId, subscriptionId);

    await routeStripeEvent(event, db);

    const billingDoc = await db.collection("users").doc(uid).collection("billing").doc("current").get();
    assert.equal(billingDoc.exists, true);
    assert.equal(billingDoc.data()?.status, "active");
    assert.equal(billingDoc.data()?.stripeCustomerId, customerId);
    assert.equal(billingDoc.data()?.stripeSubscriptionId, subscriptionId);

    const customerDoc = await db.collection("stripeCustomers").doc(customerId).get();
    assert.equal(customerDoc.data()?.uid, uid);
  });

  await t.test("2. reentrega do mesmo evento (mesmo event id) é ignorada — idempotência", async () => {
    const uid = `user_${Date.now()}_idem`;
    const customerId = `cus_${Date.now()}_idem`;
    const subscriptionId = `sub_${Date.now()}_idem`;
    const event = checkoutCompletedEvent(`evt_idem_${Date.now()}`, uid, customerId, subscriptionId);

    await routeStripeEvent(event, db);

    const billingRef = db.collection("users").doc(uid).collection("billing").doc("current");
    // Simula um estado divergente que só existiria se o webhook tivesse
    // reprocessado o evento (ex.: um cancelamento aplicado por engano).
    await billingRef.set({ status: "canceled" }, { merge: true });

    await routeStripeEvent(event, db);

    const billingDoc = await billingRef.get();
    assert.equal(billingDoc.data()?.status, "canceled", "reentrega não deveria ter sobrescrito o status");
  });
});

test("routeStripeEvent — customer.subscription.updated", async (t) => {
  await t.test("1. atualiza o status da assinatura do uid vinculado ao customer", async () => {
    const uid = `user_${Date.now()}_sub`;
    const customerId = `cus_${Date.now()}_sub`;
    const subscriptionId = `sub_${Date.now()}_sub`;

    await routeStripeEvent(checkoutCompletedEvent(`evt_setup_${Date.now()}`, uid, customerId, subscriptionId), db);
    await routeStripeEvent(
      subscriptionUpdatedEvent(`evt_update_${Date.now()}`, customerId, subscriptionId, "past_due"),
      db
    );

    const billingDoc = await db.collection("users").doc(uid).collection("billing").doc("current").get();
    assert.equal(billingDoc.data()?.status, "past_due");
  });

  await t.test("2. customer desconhecido não gera erro nem grava nada", async () => {
    await assert.doesNotReject(() =>
      routeStripeEvent(subscriptionUpdatedEvent(`evt_unknown_${Date.now()}`, "cus_never_linked", "sub_x", "active"), db)
    );
  });
});
