import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { CreateLinkCodeResult, ConnectionStatusResult, DisconnectResult } from "./types";

/**
 * Thin wrappers around the three authenticated WhatsApp callables. No
 * secret, token, or webhook detail ever passes through this layer — only
 * what the callables themselves return (code, masked phone, connection
 * flags).
 */
export async function createWhatsAppLinkCode(): Promise<CreateLinkCodeResult> {
  const callable = httpsCallable<void, CreateLinkCodeResult>(functions, "createWhatsAppLinkCode");
  const response = await callable();
  return response.data;
}

export async function getWhatsAppConnectionStatus(): Promise<ConnectionStatusResult> {
  const callable = httpsCallable<void, ConnectionStatusResult>(functions, "getWhatsAppConnectionStatus");
  const response = await callable();
  return response.data;
}

export async function disconnectWhatsApp(): Promise<DisconnectResult> {
  const callable = httpsCallable<void, DisconnectResult>(functions, "disconnectWhatsApp");
  const response = await callable();
  return response.data;
}
