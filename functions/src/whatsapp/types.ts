export type TransactionType = "expense" | "income";

export interface InboundWhatsAppMessage {
  messageId: string;
  waId: string;
  text: string;
  timestampSeconds: number;
}

export type WebhookInboundEvent =
  | { kind: "message"; message: InboundWhatsAppMessage }
  | { kind: "status" }
  | { kind: "unsupported" };

export interface ParsedTransactionIntent {
  type: TransactionType;
  amountInCents: number;
  description: string;
}

/**
 * A parsed-but-unconfirmed transaction, keyed by waId (one at a time per
 * phone number in this MVP). Amount is tracked in cents internally to
 * avoid floating-point drift while parsing/confirming; it is only
 * converted to reais at the point the real transaction document is built,
 * to match the existing users/{uid}/transactions schema.
 */
export interface PendingWhatsAppCommand {
  uid: string;
  waId: string;
  type: TransactionType;
  amountInCents: number;
  description: string;
  categorySuggestion: string;
  occurredOn: string; // YYYY-MM-DD
  sourceMessageId: string;
  createdAt: string; // ISO
}

export interface WhatsAppSendConfig {
  accessToken: string;
  phoneNumberId: string;
}

export type SendWhatsAppTextMessage = (waId: string, body: string, config: WhatsAppSendConfig) => Promise<void>;

// ─────────────────────────────────────────────
// TIPOS DE CONSULTA (W5)
// ─────────────────────────────────────────────

export interface ParsedSimulateIntent {
  kind: "simulate";
  amountInCents: number;
  description: string;
  paymentMethod: "cash" | "installments";
  installments: number;
}

export interface ParsedQueryIntent {
  kind: "query";
}

export type ParsedWhatsAppIntent =
  | { kind: "transaction"; data: ParsedTransactionIntent }
  | { kind: "query" }
  | ParsedSimulateIntent
  | null;
