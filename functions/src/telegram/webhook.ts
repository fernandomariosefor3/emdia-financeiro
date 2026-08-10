import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_WEBHOOK_SECRET,
  TELEGRAM_LINK_CODE_SECRET,
} from "./secrets";
// Channel-agnostic domain modules, reused from WhatsApp
import { parseTransactionIntent, parseQueryIntent } from "../whatsapp/parser";
import { suggestCategory } from "../whatsapp/categories";
import {
  getPendingCommand,
  savePendingCommand,
  clearPendingCommand,
  confirmPendingCommand,
  interpretReply,
  buildTransactionDocument,
} from "../whatsapp/commands";
import {
  getFinancialPulse,
  buildSimulation,
  formatPulseResponse,
  formatSimulationResponse,
} from "../whatsapp/queries";
import { sendTelegramTextMessage } from "./sendMessage";
import { consumeLinkCode, ConsumeLinkCodeResult, getLinkedUid } from "./linking";
import {
  InboundTelegramMessage,
  PendingTelegramCommand,
  SendTelegramTextMessage,
  WebhookInboundEvent,
  TelegramSendConfig,
} from "./types";

const PROCESSED_MESSAGES_COLLECTION = "telegramProcessedMessages";
const LINK_COMMAND_PATTERN = /^vincular\s+(\d{6})$/i;

/**
 * Extracts a narrow, typed event from Telegram's webhook payload.
 * Never returns or logs the raw payload — callers get a typed event instead.
 */
export function extractInboundEvent(body: unknown): WebhookInboundEvent {
  try {
    const payload = body as {
      message?: {
        message_id?: number;
        chat?: { id?: number | string };
        text?: string;
        date?: number;
      };
    };

    const message = payload?.message;
    if (!message) return { kind: "unsupported" };

    const text = message.text;
    if (!text || text.trim().length === 0) return { kind: "unsupported" };

    const messageId = message.message_id != null ? String(message.message_id) : undefined;
    const chatId = message.chat?.id != null ? String(message.chat.id) : undefined;
    const timestampSeconds = message.date ?? Math.floor(Date.now() / 1000);

    if (!messageId || !chatId) return { kind: "unsupported" };

    return {
      kind: "message",
      message: { messageId, chatId, text, timestampSeconds },
    };
  } catch {
    return { kind: "unsupported" };
  }
}

const MAX_ATTEMPTS = 3;
const PROCESSING_TIMEOUT_MS = 60 * 1000;

/** Atomic create-if-absent dedup guard, keyed by Telegram's message_id. */
export async function markMessageProcessed(messageId: string, db: Firestore): Promise<boolean> {
  const ref = db.collection(PROCESSED_MESSAGES_COLLECTION).doc(messageId);
  return db.runTransaction(async (t) => {
    const doc = await t.get(ref);
    const now = Date.now();
    const expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000);

    if (doc.exists) {
      const data = doc.data() || {};
      const state = data.status;
      const attempts = data.attempts || 0;

      if (state === "completed") return false;

      if (state === "processing") {
        const updatedAt = new Date(data.updatedAt || now).getTime();
        const isAbandoned = (now - updatedAt) > PROCESSING_TIMEOUT_MS;
        if (!isAbandoned) return false;
      }

      if (attempts >= MAX_ATTEMPTS) return false;

      t.update(ref, {
        status: "processing",
        updatedAt: new Date(now).toISOString(),
        attempts: attempts + 1,
      });
      return true;
    }

    t.set(ref, {
      status: "processing",
      updatedAt: new Date(now).toISOString(),
      expiresAt,
      attempts: 1,
    });
    return true;
  });
}

export async function markMessageCompleted(messageId: string, db: Firestore): Promise<void> {
  const ref = db.collection(PROCESSED_MESSAGES_COLLECTION).doc(messageId);
  await ref.update({ status: "completed", updatedAt: new Date().toISOString() });
}

export async function markMessageFailed(messageId: string, errorCode: string, db: Firestore): Promise<void> {
  const ref = db.collection(PROCESSED_MESSAGES_COLLECTION).doc(messageId);
  await ref.update({ status: "failed", lastError: errorCode, updatedAt: new Date().toISOString() });
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
  return formatter.format(d);
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
  linked: "✅ Conta vinculada com sucesso! Agora você pode me enviar suas despesas e receitas por aqui.\n\nEnvie algo como \"gastei 38 no mercado\" ou \"recebi 2000 de salário\".",
  invalid: "❌ Código inválido. Gere um novo código no app e envie novamente.",
  expired: "⏰ Esse código expirou. Gere um novo no app — ele vale por 10 minutos.",
  already_used: "⚠️ Esse código já foi usado. Gere um novo no app se precisar vincular de novo.",
};

export interface RouteMessageDeps {
  db: Firestore;
  config: TelegramSendConfig;
  linkCodeSecret: string;
  send: SendTelegramTextMessage;
}

/**
 * Core routing logic — takes an already-extracted message plus injected
 * dependencies so it can be unit tested without real Telegram secrets.
 */
export async function routeMessage(message: InboundTelegramMessage, deps: RouteMessageDeps): Promise<void> {
  const { db, config, linkCodeSecret, send } = deps;
  const { chatId, text, messageId, timestampSeconds } = message;

  const linkMatch = text.trim().match(LINK_COMMAND_PATTERN);
  if (linkMatch) {
    const result = await consumeLinkCode(linkMatch[1], chatId, linkCodeSecret, db);
    await send(chatId, LINK_REPLY_MESSAGES[result.status], config);
    return;
  }

  // Handle /start with embedded code (deep link)
  const startMatch = text.trim().match(/^\/start\s+(\d{6})$/i);
  if (startMatch) {
    const result = await consumeLinkCode(startMatch[1], chatId, linkCodeSecret, db);
    await send(chatId, LINK_REPLY_MESSAGES[result.status], config);
    return;
  }

  // Welcome message for bare /start
  if (text.trim().toLowerCase() === "/start") {
    await send(
      chatId,
      "👋 Olá! Eu sou a Lia, sua assessora financeira.\n\n" +
        'Para começar, gere um código de vinculação no app Emdia e envie "VINCULAR 123456" aqui.\n\n' +
        "Depois de vinculado, você pode:\n" +
        '• Registrar gastos: "gastei 38 no mercado"\n' +
        '• Registrar receitas: "recebi 2000 de salário"\n' +
        '• Consultar respiro: "quanto posso gastar?"\n' +
        '• Simular compras: "simular 350 no tênis"',
      config
    );
    return;
  }

  const uid = await getLinkedUid(chatId, db);
  if (!uid) {
    await send(
      chatId,
      'Ainda não vinculei este Telegram a nenhuma conta Emdia.\n\nGere um código no app e envie "VINCULAR 123456" aqui.',
      config
    );
    return;
  }

  const pending = await getPendingCommand(chatId, db);
  if (pending) {
    await handleConfirmationReply(pending, text, db, config, send);
    return;
  }

  await handleNewTransactionMessage({ uid, chatId, text, messageId, timestampSeconds }, db, config, send);
}

async function handleConfirmationReply(
  pending: PendingTelegramCommand,
  text: string,
  db: Firestore,
  config: TelegramSendConfig,
  send: SendTelegramTextMessage
): Promise<void> {
  const intent = interpretReply(text);

  if (intent === "confirm") {
    await confirmPendingCommand(pending, db);
    await send(pending.waId, "✅ Registrado!", config);
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
 * Handles query intents (breathing room, pace, simulation).
 * These do NOT create transactions — they only query and respond.
 */
async function handleQueryMessage(
  input: { uid: string; chatId: string; text: string },
  db: Firestore,
  config: TelegramSendConfig,
  send: SendTelegramTextMessage
): Promise<void> {
  const queryIntent = parseQueryIntent(input.text);

  if (!queryIntent) return;

  if (queryIntent.kind === "simulate") {
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
    await send(input.chatId, response, config);
    return;
  }

  const pulse = await getFinancialPulse(input.uid, db);
  const response = formatPulseResponse(pulse);
  await send(input.chatId, response, config);
}

async function handleNewTransactionMessage(
  input: { uid: string; chatId: string; text: string; messageId: string; timestampSeconds: number },
  db: Firestore,
  config: TelegramSendConfig,
  send: SendTelegramTextMessage
): Promise<void> {
  // First: check if it's a query intent
  const queryIntent = parseQueryIntent(input.text);
  if (queryIntent) {
    await handleQueryMessage(input, db, config, send);
    return;
  }

  // Second: parse as transaction
  const intent = parseTransactionIntent(input.text);

  if (!intent) {
    await send(
      input.chatId,
      'Não entendi. Para registrar gastos/receitas: "Gastei 38 no mercado". Para consultar: "Quanto posso gastar?"',
      config
    );
    return;
  }

  const category = suggestCategory(intent.type, intent.description);
  const pending: PendingTelegramCommand = {
    uid: input.uid,
    waId: input.chatId,
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
    input.chatId,
    `Entendi: ${typeLabel} de R$ ${reaisText} em "${intent.description}", categoria sugerida: ${category}. Confirma? Responda SIM ou NÃO.`,
    config
  );
}

export const telegramWebhook = onRequest(
  {
    secrets: [TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_LINK_CODE_SECRET],
  },
  async (req, res) => {
    // Telegram only sends POST to webhooks — no GET handshake needed.
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    // Verify the secret token header (set when registering the webhook)
    const secretHeader = req.get("X-Telegram-Bot-Api-Secret-Token");
    const expectedSecret = TELEGRAM_WEBHOOK_SECRET.value();
    if (!secretHeader || secretHeader !== expectedSecret) {
      logger.warn("telegram.webhook.invalid_secret_token");
      res.status(401).send("Unauthorized");
      return;
    }

    // Never log req.body — it may carry free-text financial content.
    const event = extractInboundEvent(req.body);
    if (event.kind !== "message") {
      // Silently acknowledge non-message updates (edits, etc.)
      res.status(200).send("OK");
      return;
    }

    const db = getFirestore();
    const isNewMessage = await markMessageProcessed(event.message.messageId, db);
    if (!isNewMessage) {
      logger.info("telegram.webhook.duplicate_message", { messageId: event.message.messageId });
      res.status(200).send("OK");
      return;
    }

    logger.info("telegram.webhook.message_received", { messageId: event.message.messageId });

    try {
      await routeMessage(event.message, {
        db,
        config: {
          botToken: TELEGRAM_BOT_TOKEN.value(),
        },
        linkCodeSecret: TELEGRAM_LINK_CODE_SECRET.value(),
        send: sendTelegramTextMessage,
      });
      await markMessageCompleted(event.message.messageId, db);
    } catch (error) {
      const errorCode = error instanceof Error && error.message.includes("TIMEOUT") ? "TIMEOUT" : "INTERNAL_ERROR";
      await markMessageFailed(event.message.messageId, errorCode, db);
      logger.error("telegram.webhook.processing_failed", {
        messageId: event.message.messageId,
        errorCode,
      });
    }

    res.status(200).send("OK");
  }
);
