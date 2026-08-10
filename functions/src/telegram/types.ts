// Reusing the domain types from WhatsApp — they are channel-agnostic.
// Only channel-specific types (like Telegram's chatId instead of waId,
// TelegramSendConfig instead of WhatsAppSendConfig) are defined here.
export type { TransactionType, ParsedTransactionIntent, PendingWhatsAppCommand, ParsedQueryIntent } from "../whatsapp/types";

/** Pending command, re-exported with alias for clarity */
import type { PendingWhatsAppCommand as _Pending } from "../whatsapp/types";
export type PendingTelegramCommand = _Pending; // same shape, channel-agnostic

export interface InboundTelegramMessage {
  messageId: string;
  chatId: string;
  text: string;
  timestampSeconds: number;
}

export type WebhookInboundEvent =
  | { kind: "message"; message: InboundTelegramMessage }
  | { kind: "unsupported" };

export interface TelegramSendConfig {
  botToken: string;
}

export type SendTelegramTextMessage = (chatId: string, body: string, config: TelegramSendConfig) => Promise<void>;
