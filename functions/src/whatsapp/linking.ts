import { createHmac, randomInt } from "node:crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { WHATSAPP_LINK_CODE_SECRET } from "./secrets";
import { clearPendingCommand } from "./commands";

const LINK_CODE_TTL_MS = 10 * 60 * 1000;
const LINK_CODES_COLLECTION = "whatsappLinkCodes";
const LINKS_COLLECTION = "whatsappLinks";

export function generateLinkCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** The raw code is never stored — only this hash is. */
export function hashLinkCode(code: string, secret: string): string {
  return createHmac("sha256", secret).update(code).digest("hex");
}

/**
 * Authenticated callable: the logged-in Emdia user asks for a code to type
 * into WhatsApp. Only the caller ever sees the raw code (returned once,
 * over the authenticated HTTPS channel) — it is never logged.
 */
export const createWhatsAppLinkCode = onCall({ secrets: [WHATSAPP_LINK_CODE_SECRET] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Faça login para gerar um código de vinculação.");
  }

  const uid = request.auth.uid;
  const code = generateLinkCode();
  const hash = hashLinkCode(code, WHATSAPP_LINK_CODE_SECRET.value());
  const now = Date.now();

  await getFirestore()
    .collection(LINK_CODES_COLLECTION)
    .doc(hash)
    .set({
      uid,
      expiresAt: now + LINK_CODE_TTL_MS,
      used: false,
      createdAt: new Date(now).toISOString(),
    });

  return { code, expiresInSeconds: LINK_CODE_TTL_MS / 1000 };
});

export type ConsumeLinkCodeResult =
  | { status: "linked"; uid: string }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "already_used" };

interface LinkCodeRecord {
  uid: string;
  expiresAt: number;
  used: boolean;
}

/**
 * Verifies + consumes a "VINCULAR 123456" code sent from WhatsApp. Runs in
 * a transaction so a code can never be redeemed twice, even if the same
 * message is somehow raced against itself.
 */
export async function consumeLinkCode(
  rawCode: string,
  waId: string,
  secret: string,
  db: Firestore
): Promise<ConsumeLinkCodeResult> {
  const hash = hashLinkCode(rawCode, secret);
  const codeRef = db.collection(LINK_CODES_COLLECTION).doc(hash);
  const linkRef = db.collection(LINKS_COLLECTION).doc(waId);

  return db.runTransaction(async (tx): Promise<ConsumeLinkCodeResult> => {
    const snapshot = await tx.get(codeRef);
    if (!snapshot.exists) return { status: "invalid" };

    const data = snapshot.data() as LinkCodeRecord;
    if (data.used) return { status: "already_used" };
    if (Date.now() > data.expiresAt) return { status: "expired" };

    tx.update(codeRef, { used: true });
    tx.set(linkRef, { uid: data.uid, linkedAt: new Date().toISOString() });

    return { status: "linked", uid: data.uid };
  });
}

export async function getLinkedUid(waId: string, db: Firestore): Promise<string | null> {
  const snapshot = await db.collection(LINKS_COLLECTION).doc(waId).get();
  if (!snapshot.exists) return null;
  return (snapshot.data() as { uid: string }).uid;
}

interface WhatsAppLinkRecord {
  uid: string;
  linkedAt: string;
}

/** "5511999999999" -> "****9999" — never expose the full number. */
export function maskPhoneNumber(waId: string): string {
  const last4 = waId.slice(-4);
  return `****${last4}`;
}

async function findLinkByUid(uid: string, db: Firestore) {
  const snapshot = await db.collection(LINKS_COLLECTION).where("uid", "==", uid).limit(1).get();
  return snapshot.empty ? null : snapshot.docs[0];
}

export interface WhatsAppConnectionStatus {
  connected: boolean;
  maskedPhone: string | null;
  connectedAt: string | null;
}

/**
 * Core logic behind getWhatsAppConnectionStatus, independent of the
 * callable transport so it can be unit tested against the Firestore
 * emulator without needing to invoke the wrapped onCall handler. Reports
 * only what the UI needs — never the full phone number, waId, or
 * anything else internal.
 */
export async function resolveConnectionStatus(uid: string, db: Firestore): Promise<WhatsAppConnectionStatus> {
  const linkDoc = await findLinkByUid(uid, db);
  if (!linkDoc) {
    return { connected: false, maskedPhone: null, connectedAt: null };
  }

  const data = linkDoc.data() as WhatsAppLinkRecord;
  return { connected: true, maskedPhone: maskPhoneNumber(linkDoc.id), connectedAt: data.linkedAt };
}

export interface DisconnectWhatsAppResult {
  disconnected: true;
}

/**
 * Core logic behind disconnectWhatsApp: removes the given uid's own
 * WhatsApp link, looked up strictly by uid — a caller can never reach
 * another account's link document through this function. Idempotent:
 * calling it again after the link is already gone still succeeds.
 */
export async function performDisconnect(uid: string, db: Firestore): Promise<DisconnectWhatsAppResult> {
  const linkDoc = await findLinkByUid(uid, db);
  if (linkDoc) {
    await linkDoc.ref.delete();
    await clearPendingCommand(linkDoc.id, db);
  }
  return { disconnected: true };
}

/** Authenticated callable wrapper for resolveConnectionStatus. */
export const getWhatsAppConnectionStatus = onCall(async (request): Promise<WhatsAppConnectionStatus> => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Faça login para consultar a conexão com o WhatsApp.");
  }
  return resolveConnectionStatus(request.auth.uid, getFirestore());
});

/** Authenticated callable wrapper for performDisconnect. */
export const disconnectWhatsApp = onCall(async (request): Promise<DisconnectWhatsAppResult> => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Faça login para desconectar o WhatsApp.");
  }
  return performDisconnect(request.auth.uid, getFirestore());
});
