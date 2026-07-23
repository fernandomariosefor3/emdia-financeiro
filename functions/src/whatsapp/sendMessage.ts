import { WhatsAppSendConfig } from "./types";

const GRAPH_API_VERSION = "v20.0";

/**
 * Sends a plain text WhatsApp message via the Meta Cloud API. Uses the
 * Node 20 global fetch — no extra HTTP dependency needed.
 */
export async function sendWhatsAppTextMessage(waId: string, body: string, config: WhatsAppSendConfig): Promise<void> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${config.phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: waId,
      type: "text",
      text: { body },
    }),
  });

  if (!response.ok) {
    // Never log `body` — it may contain financial details (amounts,
    // descriptions) or the phone number context of a real conversation.
    throw new Error(`WhatsApp send failed with status ${response.status}`);
  }
}
