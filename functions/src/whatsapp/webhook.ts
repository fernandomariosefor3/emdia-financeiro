import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import {
  META_WHATSAPP_ACCESS_TOKEN,
  META_WHATSAPP_APP_SECRET,
  META_WHATSAPP_PHONE_NUMBER_ID,
  META_WHATSAPP_VERIFY_TOKEN,
  WHATSAPP_LINK_CODE_SECRET,
} from "./secrets";
import { isValidMetaSignature } from "./signature";
import { verifyWebhookSubscription } from "./verification";
import { parseTransactionIntent, parseQueryIntent } from "./parser";
import { suggestCategory } from "./categories";
import { consumeLinkCode, ConsumeLinkCodeResult, getLinkedUid } from "./linking";
import { getPendingCommand, savePendingCommand, clearPendingCommand, confirmPendingCommand, interpretReply } from "./commands";
import { sendWhatsAppTextMessage } from "./sendMessage";
import {
  InboundWhatsAppMessage,
  PendingWhatsAppCommand,
  SendWhatsAppTextMessage,
  WebhookInboundEvent,
  WhatsAppSendConfig,
} from "./types";
import {
  getFinancialPulse,
  buildSimulation,
  formatPulseResponse,
  formatSimulationResponse,
} from "./queries";

const PROCESSED_MESSAGES_COLLECTION = "whatsappProcessedMessages";
const LINK_COMMAND_PATTERN = /^vincular\s+(\d{6})$/i;
const FIRESTORE_ALREADY_EXISTS_CODE = 6;

/**
 * Reads only the shape we need from Meta's webhook payload. Never returns
 * or logs the raw payload — callers get a narrow, typed event instead.
 */
export function extractInboundEvent(body: unknown): WebhookInboundEvent {
  try {
    const payload = body as {
      entry?: Array<{ changes?: Array<{ value?: { statuses?: unknown[]; messages?: Array<Record<string, unknown>> } }> }>;
    };
    const value = payload?.entry?.[0]?.changes?.[0]?.value;
    if (!value) return { kind: "unsupported" };

    if (Array.isArray(value.statuses) && value.statuses.length > 0) {
      return { kind: "status" };
    }

    const message = value.messages?.[0];
    if (!message || message.type !== "text") return { kind: "unsupported" };

    const text = (message.text as { body?: string } | undefined)?.body ?? "";
    const messageId = message.id as string | undefined;
    const waId = message.from as string | undefined;
    const timestamp = message.timestamp as string | undefined;

    if (!messageId || !waId || !timestamp) return { kind: "unsupported" };

    return {
      kind: "message",
      message: { messageId, waId, text, timestampSeconds: Number(timestamp) },
    };
  } catch {
    return { kind: "unsupported" };
  }
}

/** Atomic create-if-absent dedup guard, keyed by Meta's own messageId. */
export async function markMessageProcessed(messageId: string, db: Firestore): Promise<boolean> {
  const ref = db.collection(PROCESSED_MESSAGES_COLLECTION).doc(messageId);
  return db.runTransaction(async (t) => {
    const doc = await t.get(ref);
    if (doc.exists) {
      const state = doc.data()?.status;
      if (state === "completed" || state === "processing") return false;
    }
    // Expira em 7 dias
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    t.set(ref, { 
      status: "processing", 
      updatedAt: new Date().toISOString(), 
      expiresAt 
    });
    return true;
  });
}

export async function markMessageCompleted(messageId: string, db: Firestore): Promise<void> {
  const ref = db.collection(PROCESSED_MESSAGES_COLLECTION).doc(messageId);
  await ref.update({ status: "completed", updatedAt: new Date().toISOString() });
}

export async function markMessageFailed(messageId: string, errorString: string, db: Firestore): Promise<void> {
  const ref = db.collection(PROCESSED_MESSAGES_COLLECTION).doc(messageId);
  await ref.update({ status: "failed", lastError: errorString, updatedAt: new Date().toISOString() });
}

export function todayCivilDate(timestampSeconds: number): string {
  const millis = Number.isFinite(timestampSeconds) ? timestampSeconds * 1000 : Date.now();
  const d = new Date(millis);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d); // returns YYYY-MM-DD
}

export function formatDate(d: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d);
}

const LINK_REPLY_MESSAGES: Record<ConsumeLinkCodeResult["status"], string> = {
  linked: "Conta vinculada com sucesso! Agora você pode me enviar suas despesas e receitas por aqui.",
  invalid: "Código inválido. Gere um novo código no app e envie novamente.",
  expired: "Esse código expirou. Gere um novo no app — ele vale por 10 minutos.",
  already_used: "Esse código já foi usado. Gere um novo no app se precisar vincular de novo.",
};

export interface RouteMessageDeps {
  db: Firestore;
  config: WhatsAppSendConfig;
  linkCodeSecret: string;
  send: SendWhatsAppTextMessage;
}

/**
 * Core routing logic, independent of the HTTPS transport — takes an
 * already-extracted message plus injected config/dependencies so it can be
 * unit tested against the Firestore emulator without needing real Meta
 * secrets or the Functions emulator.
 */
export async function routeMessage(message: InboundWhatsAppMessage, deps: RouteMessageDeps): Promise<void> {
  const { db, config, linkCodeSecret, send } = deps;
  const { waId, text, messageId, timestampSeconds } = message;

  const linkMatch = text.trim().match(LINK_COMMAND_PATTERN);
  if (linkMatch) {
    const result = await consumeLinkCode(linkMatch[1], waId, linkCodeSecret, db);
    await send(waId, LINK_REPLY_MESSAGES[result.status], config);
    return;
  }

  const uid = await getLinkedUid(waId, db);
  if (!uid) {
    await send(
      waId,
      'Ainda não vinculei este número a nenhuma conta Emdia. Gere um código no app e envie "VINCULAR 123456" aqui.',
      config
    );
    return;
  }

  const pending = await getPendingCommand(waId, db);
  if (pending) {
    await handleConfirmationReply(pending, text, db, config, send);
    return;
  }

  await handleNewTransactionMessage({ uid, waId, text, messageId, timestampSeconds }, db, config, send);
}

async function handleConfirmationReply(
  pending: PendingWhatsAppCommand,
  text: string,
  db: Firestore,
  config: WhatsAppSendConfig,
  send: SendWhatsAppTextMessage
): Promise<void> {
  const intent = interpretReply(text);

  if (intent === "confirm") {
    await confirmPendingCommand(pending, db);
    await send(pending.waId, "Registrado! ✅", config);
    return;
  }
  if (intent === "reject") {
    await clearPendingCommand(pending.waId, db);
    await send(pending.waId, "Ok, não registrei. Pode me mandar de novo quando quiser.", config);
    return;
  }
  await send(pending.waId, "Não entendi. Responda SIM para confirmar ou NÃO para cancelar.", config);
}

/**
 * W5: Trata intenções de consulta (respiro, ritmo, simulação).
 * Estas mensagens NÃO criam transações — apenas consultam e respondem.
 */
async function handleQueryMessage(
  input: { uid: string; waId: string; text: string },
  db: Firestore,
  config: WhatsAppSendConfig,
  send: SendWhatsAppTextMessage
): Promise<void> {
  const queryIntent = parseQueryIntent(input.text);

  if (!queryIntent) return;

  if (queryIntent.kind === "simulate") {
    // ── Simulação de compra ──
    const pulse = await getFinancialPulse(input.uid, db);
    const firstDueDate = queryIntent.paymentMethod === "cash"
      ? todayCivilDate(Date.now() / 1000)
      : formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    const sim = buildSimulation(pulse, {
      purchaseAmountInCents: queryIntent.amountInCents,
      paymentMethod: queryIntent.paymentMethod,
      installments: queryIntent.installments,
      firstDueDate,
      description: queryIntent.description,
    });

    const response = formatSimulationResponse(pulse, sim, queryIntent.description);
    await send(input.waId, response, config);
    return;
  }

  // ── Consulta pura de respiro ──
  const pulse = await getFinancialPulse(input.uid, db);
  const response = formatPulseResponse(pulse);
  await send(input.waId, response, config);
}

async function handleNewTransactionMessage(
  input: { uid: string; waId: string; text: string; messageId: string; timestampSeconds: number },
  db: Firestore,
  config: WhatsAppSendConfig,
  send: SendWhatsAppTextMessage
): Promise<void> {
  // Primeiro: verifica se é uma intenção de consulta (W5)
  const queryIntent = parseQueryIntent(input.text);
  if (queryIntent) {
    await handleQueryMessage(input, db, config, send);
    return;
  }

  // Segundo: parsing de transação
  const intent = parseTransactionIntent(input.text);

  if (!intent) {
    await send(
      input.waId,
      'Não entendi. Para registrar gastos/receitas: "Gastei 38 no mercado". Para consultar: "Quanto posso gastar?"',
      config
    );
    return;
  }

  const category = suggestCategory(intent.type, intent.description);
  const pending: PendingWhatsAppCommand = {
    uid: input.uid,
    waId: input.waId,
    type: intent.type,
    amountInCents: intent.amountInCents,
    description: intent.description,
    categorySuggestion: category,
    occurredOn: todayCivilDate(input.timestampSeconds),
    sourceMessageId: input.messageId,
    createdAt: new Date().toISOString(),
  };
  await savePendingCommand(pending, db);

  const reaisText = (intent.amountInCents / 100).toFixed(2).replace(".", ",");
  const typeLabel = intent.type === "expense" ? "despesa" : "receita";
  await send(
    input.waId,
    `Entendi: ${typeLabel} de R$ ${reaisText} em "${intent.description}", categoria sugerida: ${category}. Confirma? Responda SIM ou NÃO.`,
    config
  );
}

export const whatsappWebhook = onRequest(
  {
    secrets: [
      META_WHATSAPP_ACCESS_TOKEN,
      META_WHATSAPP_APP_SECRET,
      META_WHATSAPP_PHONE_NUMBER_ID,
      META_WHATSAPP_VERIFY_TOKEN,
      WHATSAPP_LINK_CODE_SECRET,
    ],
  },
  async (req, res) => {
    if (req.method === "GET") {
      const result = verifyWebhookSubscription(
        req.query as Record<string, string>,
        META_WHATSAPP_VERIFY_TOKEN.value()
      );
      if (result.status === "verified") {
        res.status(200).send(result.challenge);
      } else {
        res.status(403).send("Forbidden");
      }
      return;
    }

    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const signatureHeader = req.get("X-Hub-Signature-256");
    if (!isValidMetaSignature(req.rawBody, signatureHeader, META_WHATSAPP_APP_SECRET.value())) {
      logger.warn("whatsapp.webhook.invalid_signature");
      res.status(401).send("Invalid signature");
      return;
    }

    // Never log req.body / req.rawBody here — it may carry free-text
    // financial content and the sender's phone number.
    const event = extractInboundEvent(req.body);
    if (event.kind !== "message") {
      res.status(200).send("OK");
      return;
    }

    const db = getFirestore();
    const isNewMessage = await markMessageProcessed(event.message.messageId, db);
    if (!isNewMessage) {
      logger.info("whatsapp.webhook.duplicate_message", { messageId: event.message.messageId });
      res.status(200).send("OK");
      return;
    }

    logger.info("whatsapp.webhook.message_received", { messageId: event.message.messageId });

    try {
      await routeMessage(event.message, {
        db,
        config: {
          accessToken: META_WHATSAPP_ACCESS_TOKEN.value(),
          phoneNumberId: META_WHATSAPP_PHONE_NUMBER_ID.value(),
        },
        linkCodeSecret: WHATSAPP_LINK_CODE_SECRET.value(),
        send: sendWhatsAppTextMessage,
      });
      await markMessageCompleted(event.message.messageId, db);
    } catch (error) {
      const errorString = error instanceof Error ? error.message : "unknown";
      await markMessageFailed(event.message.messageId, errorString, db);
      logger.error("whatsapp.webhook.processing_failed", {
        messageId: event.message.messageId,
        error: errorString,
      });
    }

    res.status(200).send("OK");
  }
);
