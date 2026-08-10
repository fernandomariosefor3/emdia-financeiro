import { TelegramSendConfig } from "./types";

/**
 * Sends a plain text Telegram message via the Bot API.
 * Uses the Node 20 global fetch — no extra HTTP dependency needed.
 */
export async function sendTelegramTextMessage(chatId: string, body: string, config: TelegramSendConfig): Promise<void> {
  const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: body,
      parse_mode: "HTML",
    }),
  });

  if (!response.ok) {
    // Never log `body` — it may contain financial details or phone context.
    throw new Error(`Telegram send failed with status ${response.status}`);
  }
}
