export type TelegramLinkState =
  | { kind: "loading" }
  | { kind: "not_connected" }
  | { kind: "generating_code" }
  | { kind: "code_generated"; code: string; expiresInSeconds: number }
  | { kind: "connected"; maskedChat: string; connectedAt: string }
  | { kind: "disconnecting" }
  | { kind: "error"; message: string };

export interface CreateLinkCodeResult {
  code: string;
  expiresInSeconds: number;
}

export interface ConnectionStatusResult {
  connected: boolean;
  maskedChat: string | null;
  connectedAt: string | null;
}

export interface DisconnectResult {
  disconnected: true;
}
