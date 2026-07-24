import test from "node:test";
import assert from "node:assert";
import { sendWhatsAppTextMessage } from "../sendMessage";

const CONFIG = { accessToken: "test-only-token", phoneNumberId: "test-phone-id" };

test("sendWhatsAppTextMessage", async (t) => {
  await t.test("1. monta URL, headers e corpo corretamente", async () => {
    const originalFetch = globalThis.fetch;
    let capturedUrl: string | undefined;
    let capturedInit: RequestInit | undefined;

    globalThis.fetch = (async (url: string, init: RequestInit) => {
      capturedUrl = url;
      capturedInit = init;
      return new Response(null, { status: 200 });
    }) as typeof fetch;

    try {
      await sendWhatsAppTextMessage("5511999999999", "Registrado! ✅", CONFIG);
    } finally {
      globalThis.fetch = originalFetch;
    }

    assert.strictEqual(capturedUrl, "https://graph.facebook.com/v25.0/test-phone-id/messages");
    assert.strictEqual(capturedInit?.method, "POST");
    const headers = capturedInit?.headers as Record<string, string>;
    assert.strictEqual(headers.Authorization, "Bearer test-only-token");
    const body = JSON.parse(capturedInit?.body as string);
    assert.deepStrictEqual(body, {
      messaging_product: "whatsapp",
      to: "5511999999999",
      type: "text",
      text: { body: "Registrado! ✅" },
    });
  });

  await t.test("2. resposta não-ok lança erro sem vazar o corpo da mensagem", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response(null, { status: 500 })) as typeof fetch;

    try {
      await assert.rejects(
        () => sendWhatsAppTextMessage("5511999999999", "conteúdo financeiro sensível", CONFIG),
        (error: Error) => {
          assert.ok(!error.message.includes("conteúdo financeiro sensível"));
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
