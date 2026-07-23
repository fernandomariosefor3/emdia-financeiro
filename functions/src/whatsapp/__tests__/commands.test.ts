process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";

import { before, beforeEach, test } from "node:test";
import assert from "node:assert";
import * as admin from "firebase-admin";
import {
  interpretReply,
  buildTransactionDocument,
  getPendingCommand,
  savePendingCommand,
  clearPendingCommand,
  confirmPendingCommand,
} from "../commands";
import { PendingWhatsAppCommand } from "../types";

let db: FirebaseFirestore.Firestore;

before(() => {
  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: "emdia-whatsapp-test" });
  }
  db = admin.firestore();
});

beforeEach(async () => {
  const pendingSnap = await db.collection("whatsappPendingCommands").get();
  await Promise.all(pendingSnap.docs.map((doc) => doc.ref.delete()));

  const usersSnap = await db.collection("users").get();
  for (const userDoc of usersSnap.docs) {
    const txSnap = await userDoc.ref.collection("transactions").get();
    await Promise.all(txSnap.docs.map((doc) => doc.ref.delete()));
  }
});

function pendingFixture(overrides: Partial<PendingWhatsAppCommand> = {}): PendingWhatsAppCommand {
  return {
    uid: "user-1",
    waId: "5511000000001",
    type: "expense",
    amountInCents: 3800,
    description: "mercado",
    categorySuggestion: "Alimentação",
    occurredOn: "2026-07-22",
    sourceMessageId: "wamid.fixture",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

test("interpretReply", async (t) => {
  await t.test("1. SIM confirma", () => assert.strictEqual(interpretReply("SIM"), "confirm"));
  await t.test("2. sim minúsculo confirma", () => assert.strictEqual(interpretReply("sim"), "confirm"));
  await t.test("3. NÃO rejeita", () => assert.strictEqual(interpretReply("NÃO"), "reject"));
  await t.test("4. nao sem acento rejeita", () => assert.strictEqual(interpretReply("nao"), "reject"));
  await t.test("5. mensagem ambígua não confirma nem rejeita", () =>
    assert.strictEqual(interpretReply("talvez"), "unclear")
  );
});

test("buildTransactionDocument", async (t) => {
  await t.test("1. converte centavos para reais e usa o schema real de transactions", () => {
    const doc = buildTransactionDocument(pendingFixture({ amountInCents: 3800 }));
    assert.strictEqual(doc.amount, 38);
    assert.strictEqual(doc.type, "expense");
    assert.strictEqual(doc.category, "Alimentação");
    assert.strictEqual(doc.description, "mercado");
    assert.strictEqual(doc.date, "2026-07-22");
    assert.strictEqual(typeof doc.createdAt, "string");
  });
});

test("pending command lifecycle", async (t) => {
  await t.test("1. salvar e depois carregar o comando pendente", async () => {
    const pending = pendingFixture({ waId: "5511000000010" });
    await savePendingCommand(pending, db);
    const loaded = await getPendingCommand(pending.waId, db);
    assert.deepStrictEqual(loaded, pending);
  });

  await t.test("2. limpar remove o comando pendente", async () => {
    const pending = pendingFixture({ waId: "5511000000011" });
    await savePendingCommand(pending, db);
    await clearPendingCommand(pending.waId, db);
    assert.strictEqual(await getPendingCommand(pending.waId, db), null);
  });

  await t.test("3. confirmar grava a transação e limpa o pendente", async () => {
    const pending = pendingFixture({ waId: "5511000000012", uid: "user-confirm" });
    await savePendingCommand(pending, db);
    await confirmPendingCommand(pending, db);

    assert.strictEqual(await getPendingCommand(pending.waId, db), null);

    const txSnap = await db.collection("users").doc("user-confirm").collection("transactions").get();
    assert.strictEqual(txSnap.size, 1);
    assert.strictEqual(txSnap.docs[0].data().amount, 38);
  });

  await t.test("4. confirmar duas vezes não duplica a transação (idempotência)", async () => {
    const pending = pendingFixture({ waId: "5511000000013", uid: "user-idempotent" });
    await savePendingCommand(pending, db);

    await confirmPendingCommand(pending, db);
    await confirmPendingCommand(pending, db); // pendente já removido — deve ser no-op

    const txSnap = await db.collection("users").doc("user-idempotent").collection("transactions").get();
    assert.strictEqual(txSnap.size, 1);
  });

  await t.test("5. comando nunca salvo retorna null ao carregar", async () => {
    assert.strictEqual(await getPendingCommand("5511000000099", db), null);
  });
});
