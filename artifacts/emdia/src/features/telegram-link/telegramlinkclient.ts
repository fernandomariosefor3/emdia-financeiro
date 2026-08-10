import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { CreateLinkCodeResult, ConnectionStatusResult, DisconnectResult } from "./types";

/**
 * Thin wrappers around the three authenticated Telegram callables.
 * No secret or token ever passes through this layer — only what the
 * callables themselves return.
 */
export async function createTelegramLinkCode(): Promise<CreateLinkCodeResult> {
  const callable = httpsCallable<void, CreateLinkCodeResult>(functions, "createTelegramLinkCode");
  const response = await callable();
  return response.data;
}

export async function getTelegramConnectionStatus(): Promise<ConnectionStatusResult> {
  const callable = httpsCallable<void, ConnectionStatusResult>(functions, "getTelegramConnectionStatus");
  const response = await callable();
  return response.data;
}

export async function disconnectTelegram(): Promise<DisconnectResult> {
  const callable = httpsCallable<void, DisconnectResult>(functions, "disconnectTelegram");
  const response = await callable();
  return response.data;
}
