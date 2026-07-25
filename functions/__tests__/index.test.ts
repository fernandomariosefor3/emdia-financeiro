import { test } from "node:test";
import assert from "node:assert";
import { processarGastoComIA } from "../index";

test("processarGastoComIA - Authentication Tests", async (t) => {
  // @ts-ignore
  const runFunc = processarGastoComIA.run;

  await t.test("1. fails when called without authentication", async () => {
    try {
      await runFunc({ texto: "Gastei 50 no mercado" }, {});
      assert.fail("Should have thrown an unauthenticated error");
    } catch (error: any) {
      assert.strictEqual(error.message, "Usuário não autenticado.");
    }
  });

  await t.test("2. UID is correctly extracted from context.auth.uid (simulated)", async () => {
    try {
      await runFunc({ texto: "" }, { auth: { uid: "test-user-123" } });
      assert.fail("Should have thrown an invalid-argument error");
    } catch (error: any) {
      assert.strictEqual(error.message, "Texto inválido ou muito longo.");
    }
  });
});
