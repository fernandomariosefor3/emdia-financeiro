process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";

import { before, beforeEach, test } from "node:test";
import assert from "node:assert";
import * as admin from "firebase-admin";
import { extractInboundEvent, markMessageProcessed, markMessageCompleted, markMessageFailed, routeMessage, todayCivilDate, formatDate, RouteMessageDeps } from "../webhook";
import { hashLinkCode } from "../linking";

let db: FirebaseFirestore.Firestore;

before(() => {
  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: "emdia-whatsapp-test" });
  }
  db = admin.firestore();
});

beforeEach(async () => {
  for (const name of ["whatsappProcessedMessages", "whatsappLinkCodes", "whatsappLinks", "whatsappPendingCommands"]) {
    const snapshot = await db.collection(name).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
  const usersSnap = await db.collection("users").get();
  for (const userDoc of usersSnap.docs) {
    const txSnap = await userDoc.ref.collection("transactions").get();
    await Promise.all(txSnap.docs.map((doc) => doc.ref.delete()));
  }
});

const LINK_SECRET = "test-only-link-secret-webhook";
const SEND_CONFIG = { accessToken: "test-token", phoneNumberId: "test-phone-id" };

function createSendSpy() {
  const calls: Array<{ waId: string; body: string }> = [];
  const send: RouteMessageDeps["send"] = async (waId, body) => {
    calls.push({ waId, body });
  };
  return { send, calls };
}

function deps(send: RouteMessageDeps["send"]): RouteMessageDeps {
  return { db, config: SEND_CONFIG, linkCodeSecret: LINK_SECRET, send };
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

test("extractInboundEvent", async (t) => {
  await t.test("1. mensagem de texto é extraída corretamente", () => {
    const event = extractInboundEvent({
      entry: [
        {
          changes: [
            {
              value: {
                messages: [{ id: "wamid.1", from: "5511999999999", type: "text", text: { body: "Gastei 38" }, timestamp: "1700000000" }],
              },
            },
          ],
        },
      ],
    });
    assert.deepStrictEqual(event, {
      kind: "message",
      message: { messageId: "wamid.1", waId: "5511999999999", text: "Gastei 38", timestampSeconds: 1700000000 },
    });
  });

  await t.test("2. notificação de status é ignorada", () => {
    const event = extractInboundEvent({
      entry: [{ changes: [{ value: { statuses: [{ id: "wamid.status" }] } }] }],
    });
    assert.deepStrictEqual(event, { kind: "status" });
  });

  await t.test("3. payload vazio ou malformado é 'unsupported'", () => {
    assert.deepStrictEqual(extractInboundEvent({}), { kind: "unsupported" });
    assert.deepStrictEqual(extractInboundEvent(null), { kind: "unsupported" });
    assert.deepStrictEqual(extractInboundEvent("not-an-object"), { kind: "unsupported" });
  });

  await t.test("4. mensagem que não é de texto é ignorada", () => {
    const event = extractInboundEvent({
      entry: [{ changes: [{ value: { messages: [{ id: "wamid.2", from: "5511999999999", type: "image" }] } }] }],
    });
    assert.deepStrictEqual(event, { kind: "unsupported" });
  });
});

test("Date utilities (Fuso America/Fortaleza)", async (t) => {
  await t.test("1. UTC no dia seguinte e Fortaleza ainda no dia anterior (21:00 local, 00:00 UTC)", () => {
    // 2024-05-22T00:00:00Z = 1716336000
    // In Fortaleza: 2024-05-21 21:00:00
    assert.strictEqual(todayCivilDate(1716336000), "2024-05-21");
  });

  await t.test("2. transição antes e depois da meia-noite local", () => {
    // 2024-05-22T02:59:59Z = 1716346799 (23:59:59 em Fortaleza)
    assert.strictEqual(todayCivilDate(1716346799), "2024-05-21");
    // 2024-05-22T03:00:00Z = 1716346800 (00:00:00 em Fortaleza)
    assert.strictEqual(todayCivilDate(1716346800), "2024-05-22");
  });

  await t.test("3. timestamp inválido com fallback seguro", () => {
    const invalidDates = [NaN, Infinity, -Infinity];
    for (const val of invalidDates) {
      const res = todayCivilDate(val);
      assert.match(res, /^\d{4}-\d{2}-\d{2}$/); // Returns YYYY-MM-DD representing Date.now()
    }
  });

  await t.test("4. formato final YYYY-MM-DD", () => {
    const d = new Date("2024-06-05T15:00:00Z");
    assert.strictEqual(formatDate(d), "2024-06-05");
  });
});

test("markMessageProcessed", async (t) => {
  await t.test("1. primeira vez retorna true (entra em processing)", async () => {
    assert.strictEqual(await markMessageProcessed("wamid.dedup1", db), true);
  });

  await t.test("2. segunda vez enquanto processing retorna false", async () => {
    await markMessageProcessed("wamid.dedup2", db);
    assert.strictEqual(await markMessageProcessed("wamid.dedup2", db), false);
  });

  await t.test("3. se falhou antes, permite nova tentativa", async () => {
    await markMessageProcessed("wamid.dedup3", db);
    await markMessageFailed("wamid.dedup3", "error", db);
    assert.strictEqual(await markMessageProcessed("wamid.dedup3", db), true);
  });

  await t.test("4. se está completed, retorna false", async () => {
    await markMessageProcessed("wamid.dedup4", db);
    await markMessageCompleted("wamid.dedup4", db);
    assert.strictEqual(await markMessageProcessed("wamid.dedup4", db), false);
  });

  await t.test("5. execução simultânea: apenas uma thread ganha", async () => {
    const results = await Promise.all([
      markMessageProcessed("wamid.dedup5", db),
      markMessageProcessed("wamid.dedup5", db),
      markMessageProcessed("wamid.dedup5", db),
    ]);
    const trues = results.filter((r) => r === true).length;
    const falses = results.filter((r) => r === false).length;
    assert.strictEqual(trues, 1);
    assert.strictEqual(falses, 2);
  });
});


test("routeMessage", async (t) => {
  await t.test("1. VINCULAR com código válido vincula a conta e confirma por mensagem", async () => {
    const code = "123456";
    const hash = hashLinkCode(code, LINK_SECRET);
    await db
      .collection("whatsappLinkCodes")
      .doc(hash)
      .set({ uid: "user-link", expiresAt: Date.now() + 60_000, used: false, createdAt: new Date().toISOString() });

    const { send, calls } = createSendSpy();
    await routeMessage(
      { messageId: "m1", waId: "5511000000101", text: "VINCULAR 123456", timestampSeconds: nowSeconds() },
      deps(send)
    );

    assert.strictEqual(calls.length, 1);
    assert.match(calls[0].body, /vinculada com sucesso/i);
    const linkSnap = await db.collection("whatsappLinks").doc("5511000000101").get();
    assert.strictEqual(linkSnap.data()?.uid, "user-link");
  });

  await t.test("2. número não vinculado recebe instrução para vincular, sem interpretar a mensagem", async () => {
    const { send, calls } = createSendSpy();
    await routeMessage(
      { messageId: "m2", waId: "5511000000102", text: "Gastei 38 no mercado", timestampSeconds: nowSeconds() },
      deps(send)
    );
    assert.strictEqual(calls.length, 1);
    assert.match(calls[0].body, /vinculei este número/i);
    const pendingSnap = await db.collection("whatsappPendingCommands").doc("5511000000102").get();
    assert.strictEqual(pendingSnap.exists, false);
  });

  await t.test("3. mensagem nova de despesa cria comando pendente e pede confirmação", async () => {
    await db.collection("whatsappLinks").doc("5511000000103").set({ uid: "user-103", linkedAt: new Date().toISOString() });
    const { send, calls } = createSendSpy();
    await routeMessage(
      { messageId: "m3", waId: "5511000000103", text: "Gastei 38 no mercado", timestampSeconds: nowSeconds() },
      deps(send)
    );

    assert.strictEqual(calls.length, 1);
    assert.match(calls[0].body, /Confirma\? Responda SIM ou NÃO/i);
    const pendingSnap = await db.collection("whatsappPendingCommands").doc("5511000000103").get();
    assert.strictEqual(pendingSnap.exists, true);
  });

  await t.test("4. responder SIM registra a transação com o schema real e limpa o pendente", async () => {
    await db.collection("whatsappLinks").doc("5511000000104").set({ uid: "user-104", linkedAt: new Date().toISOString() });
    const first = createSendSpy();
    await routeMessage(
      { messageId: "m4a", waId: "5511000000104", text: "Gastei 38 no mercado", timestampSeconds: nowSeconds() },
      deps(first.send)
    );

    const second = createSendSpy();
    await routeMessage({ messageId: "m4b", waId: "5511000000104", text: "SIM", timestampSeconds: nowSeconds() }, deps(second.send));

    assert.match(second.calls[0].body, /Registrado/i);
    const txSnap = await db.collection("users").doc("user-104").collection("transactions").get();
    assert.strictEqual(txSnap.size, 1);
    const tx = txSnap.docs[0].data();
    assert.strictEqual(tx.amount, 38);
    assert.strictEqual(tx.type, "expense");
    assert.ok(["amount", "type", "category", "description", "date", "createdAt"].every((key) => key in tx));

    const pendingSnap = await db.collection("whatsappPendingCommands").doc("5511000000104").get();
    assert.strictEqual(pendingSnap.exists, false);
  });

  await t.test("5. responder NÃO descarta o pendente sem gravar transação", async () => {
    await db.collection("whatsappLinks").doc("5511000000105").set({ uid: "user-105", linkedAt: new Date().toISOString() });
    const first = createSendSpy();
    await routeMessage(
      { messageId: "m5a", waId: "5511000000105", text: "Recebi 500 de bônus", timestampSeconds: nowSeconds() },
      deps(first.send)
    );

    const second = createSendSpy();
    await routeMessage({ messageId: "m5b", waId: "5511000000105", text: "NÃO", timestampSeconds: nowSeconds() }, deps(second.send));

    assert.match(second.calls[0].body, /não registrei/i);
    const txSnap = await db.collection("users").doc("user-105").collection("transactions").get();
    assert.strictEqual(txSnap.size, 0);
  });

  await t.test("6. mensagem repetida (mesmo messageId, ex.: retry da Meta) não duplica a transação", async () => {
    await db.collection("whatsappLinks").doc("5511000000106").set({ uid: "user-106", linkedAt: new Date().toISOString() });

    async function deliver(messageId: string, text: string): Promise<void> {
      const isNew = await markMessageProcessed(messageId, db);
      if (!isNew) return;
      const { send } = createSendSpy();
      await routeMessage({ messageId, waId: "5511000000106", text, timestampSeconds: nowSeconds() }, deps(send));
    }

    await deliver("m6a", "Gastei 38 no mercado");
    await deliver("m6a", "Gastei 38 no mercado"); // retry da Meta com o mesmo messageId
    await deliver("m6b", "SIM");
    await deliver("m6b", "SIM"); // retry da confirmação também

    const txSnap = await db.collection("users").doc("user-106").collection("transactions").get();
    assert.strictEqual(txSnap.size, 1);
  });

  await t.test("7. resposta ambígua mantém o comando pendente em vez de descartá-lo", async () => {
    await db.collection("whatsappLinks").doc("5511000000107").set({ uid: "user-107", linkedAt: new Date().toISOString() });
    const first = createSendSpy();
    await routeMessage(
      { messageId: "m7a", waId: "5511000000107", text: "Paguei 20 de lanche", timestampSeconds: nowSeconds() },
      deps(first.send)
    );

    const second = createSendSpy();
    await routeMessage({ messageId: "m7b", waId: "5511000000107", text: "talvez", timestampSeconds: nowSeconds() }, deps(second.send));

    assert.match(second.calls[0].body, /Não entendi/i);
    const pendingSnap = await db.collection("whatsappPendingCommands").doc("5511000000107").get();
    assert.strictEqual(pendingSnap.exists, true);
  });

  await t.test("8. mensagem não interpretável pede reformulação sem criar pendente", async () => {
    await db.collection("whatsappLinks").doc("5511000000108").set({ uid: "user-108", linkedAt: new Date().toISOString() });
    const { send, calls } = createSendSpy();
    await routeMessage(
      { messageId: "m8", waId: "5511000000108", text: "oi tudo bem?", timestampSeconds: nowSeconds() },
      deps(send)
    );

    assert.match(calls[0].body, /Não entendi\. Para registrar/i);
    const pendingSnap = await db.collection("whatsappPendingCommands").doc("5511000000108").get();
    assert.strictEqual(pendingSnap.exists, false);
  });
});
