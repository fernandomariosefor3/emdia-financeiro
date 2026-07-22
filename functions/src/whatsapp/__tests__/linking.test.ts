process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";

import { before, beforeEach, test } from "node:test";
import assert from "node:assert";
import * as admin from "firebase-admin";
import { generateLinkCode, hashLinkCode, consumeLinkCode, getLinkedUid } from "../linking";

let db: FirebaseFirestore.Firestore;

before(() => {
  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: "emdia-whatsapp-test" });
  }
  db = admin.firestore();
});

beforeEach(async () => {
  for (const name of ["whatsappLinkCodes", "whatsappLinks"]) {
    const snapshot = await db.collection(name).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

const SECRET = "test-only-link-secret-linking";

async function seedCode(code: string, overrides: Partial<{ uid: string; expiresAt: number; used: boolean }> = {}) {
  const hash = hashLinkCode(code, SECRET);
  await db.collection("whatsappLinkCodes").doc(hash).set({
    uid: "user-default",
    expiresAt: Date.now() + 60_000,
    used: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  });
}

test("generateLinkCode", () => {
  const code = generateLinkCode();
  assert.match(code, /^\d{6}$/);
});

test("consumeLinkCode", async (t) => {
  await t.test("1. código válido vincula o número ao uid", async () => {
    const code = "111111";
    await seedCode(code, { uid: "user-1" });

    const result = await consumeLinkCode(code, "5511000000001", SECRET, db);
    assert.deepStrictEqual(result, { status: "linked", uid: "user-1" });

    assert.strictEqual(await getLinkedUid("5511000000001", db), "user-1");
  });

  await t.test("2. código inválido (nunca gerado) é rejeitado", async () => {
    const result = await consumeLinkCode("999999", "5511000000002", SECRET, db);
    assert.deepStrictEqual(result, { status: "invalid" });
  });

  await t.test("3. código expirado é rejeitado", async () => {
    const code = "222222";
    await seedCode(code, { uid: "user-3", expiresAt: Date.now() - 1000 });

    const result = await consumeLinkCode(code, "5511000000003", SECRET, db);
    assert.deepStrictEqual(result, { status: "expired" });
  });

  await t.test("4. código já usado é rejeitado (uso único)", async () => {
    const code = "333333";
    await seedCode(code, { uid: "user-4" });

    const first = await consumeLinkCode(code, "5511000000004", SECRET, db);
    assert.strictEqual(first.status, "linked");

    const second = await consumeLinkCode(code, "5511000000004", SECRET, db);
    assert.deepStrictEqual(second, { status: "already_used" });
  });

  await t.test("5. apenas o hash é armazenado — o código bruto nunca aparece no documento", async () => {
    const code = "444444";
    await seedCode(code, { uid: "user-5" });
    const hash = hashLinkCode(code, SECRET);

    const snapshot = await db.collection("whatsappLinkCodes").doc(hash).get();
    assert.ok(!JSON.stringify(snapshot.data()).includes(code));
  });

  await t.test("6. número nunca vinculado retorna null", async () => {
    assert.strictEqual(await getLinkedUid("5511000000099", db), null);
  });

  await t.test("7. mesmo código com secret diferente não é reconhecido (hash não bate)", async () => {
    const code = "555555";
    await seedCode(code, { uid: "user-7" });

    const result = await consumeLinkCode(code, "5511000000007", "outro-secret-completamente-diferente", db);
    assert.deepStrictEqual(result, { status: "invalid" });
  });
});
