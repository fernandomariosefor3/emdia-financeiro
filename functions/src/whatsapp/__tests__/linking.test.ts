process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";

import { before, beforeEach, test } from "node:test";
import assert from "node:assert";
import * as admin from "firebase-admin";
import {
  generateLinkCode,
  hashLinkCode,
  consumeLinkCode,
  getLinkedUid,
  maskPhoneNumber,
  resolveConnectionStatus,
  performDisconnect,
} from "../linking";
import { savePendingCommand, getPendingCommand } from "../commands";
import { PendingWhatsAppCommand } from "../types";

let db: FirebaseFirestore.Firestore;

before(() => {
  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: "emdia-whatsapp-test" });
  }
  db = admin.firestore();
});

beforeEach(async () => {
  for (const name of ["whatsappLinkCodes", "whatsappLinks", "whatsappPendingCommands"]) {
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

test("maskPhoneNumber", async (t) => {
  await t.test("1. mantém apenas os 4 últimos dígitos", () => {
    assert.strictEqual(maskPhoneNumber("5511999991234"), "****1234");
  });

  await t.test("2. nunca inclui o número completo no resultado", () => {
    const waId = "5511999991234";
    assert.ok(!maskPhoneNumber(waId).includes(waId));
  });
});

test("resolveConnectionStatus", async (t) => {
  await t.test("1. usuário sem vínculo aparece como não conectado", async () => {
    const status = await resolveConnectionStatus("user-no-link", db);
    assert.deepStrictEqual(status, { connected: false, maskedPhone: null, connectedAt: null });
  });

  await t.test("2. usuário vinculado aparece como conectado com telefone mascarado", async () => {
    const linkedAt = new Date().toISOString();
    await db.collection("whatsappLinks").doc("5511000000201").set({ uid: "user-status", linkedAt });

    const status = await resolveConnectionStatus("user-status", db);
    assert.strictEqual(status.connected, true);
    assert.strictEqual(status.maskedPhone, "****0201");
    assert.strictEqual(status.connectedAt, linkedAt);
  });

  await t.test("3. resposta nunca contém o telefone completo (waId)", async () => {
    await db.collection("whatsappLinks").doc("5511000000202").set({ uid: "user-status-2", linkedAt: new Date().toISOString() });
    const status = await resolveConnectionStatus("user-status-2", db);
    assert.ok(!JSON.stringify(status).includes("5511000000202"));
  });
});

test("performDisconnect", async (t) => {
  await t.test("1. remove o vínculo do próprio usuário", async () => {
    await db.collection("whatsappLinks").doc("5511000000301").set({ uid: "user-disc-1", linkedAt: new Date().toISOString() });

    const result = await performDisconnect("user-disc-1", db);
    assert.deepStrictEqual(result, { disconnected: true });

    const status = await resolveConnectionStatus("user-disc-1", db);
    assert.strictEqual(status.connected, false);
  });

  await t.test("2. é idempotente — desconectar de novo continua retornando sucesso", async () => {
    await db.collection("whatsappLinks").doc("5511000000302").set({ uid: "user-disc-2", linkedAt: new Date().toISOString() });

    await performDisconnect("user-disc-2", db);
    const second = await performDisconnect("user-disc-2", db);
    assert.deepStrictEqual(second, { disconnected: true });
  });

  await t.test("3. nunca remove o vínculo de outro usuário", async () => {
    await db.collection("whatsappLinks").doc("5511000000303").set({ uid: "user-victim", linkedAt: new Date().toISOString() });

    await performDisconnect("user-attacker", db);

    const status = await resolveConnectionStatus("user-victim", db);
    assert.strictEqual(status.connected, true);
  });

  await t.test("4. limpa um comando pendente órfão do número desconectado", async () => {
    await db.collection("whatsappLinks").doc("5511000000304").set({ uid: "user-disc-4", linkedAt: new Date().toISOString() });
    const pending: PendingWhatsAppCommand = {
      uid: "user-disc-4",
      waId: "5511000000304",
      type: "expense",
      amountInCents: 1000,
      description: "teste",
      categorySuggestion: "Outros (saída)",
      occurredOn: "2026-07-22",
      sourceMessageId: "wamid.disc-test",
      createdAt: new Date().toISOString(),
    };
    await savePendingCommand(pending, db);

    await performDisconnect("user-disc-4", db);

    assert.strictEqual(await getPendingCommand("5511000000304", db), null);
  });
});
