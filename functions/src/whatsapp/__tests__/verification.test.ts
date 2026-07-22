import test from "node:test";
import assert from "node:assert";
import { verifyWebhookSubscription } from "../verification";

const TOKEN = "test-only-verify-token";

test("verifyWebhookSubscription", async (t) => {
  await t.test("1. mode+token corretos retornam o challenge", () => {
    const result = verifyWebhookSubscription(
      { "hub.mode": "subscribe", "hub.verify_token": TOKEN, "hub.challenge": "challenge-abc" },
      TOKEN
    );
    assert.deepStrictEqual(result, { status: "verified", challenge: "challenge-abc" });
  });

  await t.test("2. token errado é rejeitado", () => {
    const result = verifyWebhookSubscription(
      { "hub.mode": "subscribe", "hub.verify_token": "wrong", "hub.challenge": "challenge-abc" },
      TOKEN
    );
    assert.deepStrictEqual(result, { status: "rejected" });
  });

  await t.test("3. mode diferente de subscribe é rejeitado", () => {
    const result = verifyWebhookSubscription(
      { "hub.mode": "unsubscribe", "hub.verify_token": TOKEN, "hub.challenge": "challenge-abc" },
      TOKEN
    );
    assert.deepStrictEqual(result, { status: "rejected" });
  });

  await t.test("4. challenge ausente é rejeitado mesmo com token correto", () => {
    const result = verifyWebhookSubscription({ "hub.mode": "subscribe", "hub.verify_token": TOKEN }, TOKEN);
    assert.deepStrictEqual(result, { status: "rejected" });
  });

  await t.test("5. token esperado vazio nunca valida (evita bypass por configuração ausente)", () => {
    const result = verifyWebhookSubscription(
      { "hub.mode": "subscribe", "hub.verify_token": "", "hub.challenge": "challenge-abc" },
      ""
    );
    assert.deepStrictEqual(result, { status: "rejected" });
  });

  await t.test("6. query vazia é rejeitada", () => {
    const result = verifyWebhookSubscription({}, TOKEN);
    assert.deepStrictEqual(result, { status: "rejected" });
  });
});
