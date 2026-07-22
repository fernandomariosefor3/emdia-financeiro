import test from "node:test";
import assert from "node:assert";
import { createHmac } from "node:crypto";
import { isValidMetaSignature } from "../signature";

const SECRET = "test-only-app-secret-not-real";

function sign(body: Buffer, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

test("isValidMetaSignature", async (t) => {
  await t.test("1. assinatura correta é aceita", () => {
    const body = Buffer.from(JSON.stringify({ hello: "world" }));
    const header = sign(body, SECRET);
    assert.strictEqual(isValidMetaSignature(body, header, SECRET), true);
  });

  await t.test("2. assinatura com segredo errado é rejeitada", () => {
    const body = Buffer.from(JSON.stringify({ hello: "world" }));
    const header = sign(body, "wrong-secret");
    assert.strictEqual(isValidMetaSignature(body, header, SECRET), false);
  });

  await t.test("3. corpo alterado após assinatura é rejeitado", () => {
    const original = Buffer.from(JSON.stringify({ hello: "world" }));
    const header = sign(original, SECRET);
    const tampered = Buffer.from(JSON.stringify({ hello: "tampered" }));
    assert.strictEqual(isValidMetaSignature(tampered, header, SECRET), false);
  });

  await t.test("4. header ausente é rejeitado", () => {
    const body = Buffer.from("{}");
    assert.strictEqual(isValidMetaSignature(body, undefined, SECRET), false);
  });

  await t.test("5. header sem prefixo sha256= é rejeitado", () => {
    const body = Buffer.from("{}");
    const raw = createHmac("sha256", SECRET).update(body).digest("hex");
    assert.strictEqual(isValidMetaSignature(body, raw, SECRET), false);
  });

  await t.test("6. header com caracteres não hexadecimais é rejeitado", () => {
    const body = Buffer.from("{}");
    assert.strictEqual(isValidMetaSignature(body, "sha256=not-hex-zzzz", SECRET), false);
  });

  await t.test("7. header truncado é rejeitado", () => {
    const body = Buffer.from(JSON.stringify({ a: 1 }));
    const header = sign(body, SECRET);
    assert.strictEqual(isValidMetaSignature(body, header.slice(0, -4), SECRET), false);
  });
});
