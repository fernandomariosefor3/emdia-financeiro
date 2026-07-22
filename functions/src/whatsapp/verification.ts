export interface WebhookVerificationQuery {
  "hub.mode"?: string;
  "hub.verify_token"?: string;
  "hub.challenge"?: string;
}

export type WebhookVerificationResult = { status: "verified"; challenge: string } | { status: "rejected" };

/**
 * Meta's GET handshake for the initial webhook setup: only echo the
 * challenge back when both hub.mode and hub.verify_token match exactly.
 */
export function verifyWebhookSubscription(
  query: WebhookVerificationQuery,
  expectedVerifyToken: string
): WebhookVerificationResult {
  const mode = query["hub.mode"];
  const token = query["hub.verify_token"];
  const challenge = query["hub.challenge"];

  const tokenIsValid = typeof token === "string" && expectedVerifyToken.length > 0 && token === expectedVerifyToken;

  if (mode === "subscribe" && tokenIsValid && typeof challenge === "string") {
    return { status: "verified", challenge };
  }
  return { status: "rejected" };
}
