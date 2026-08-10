import { createHmac, randomInt } from "node:crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { TELEGRAM_LINK_CODE_SECRET } from "./secrets";

const LINK_CODE_TTL_MS = 10 * 60 * 1000;
const LINK_CODES_COLLECTION = "telegramLinkCodes";
const LINKS_COLLECTION = "telegramLinks";

export function generateLinkCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** The raw code is never stored — only this hash is. */
export function hashLinkCode(code: string, secret: string): string {
  return createHmac("sha256", secret).update(code).digest("hex");
}

/**
 * Authenticated callable: the logged-in Emdia user asks for a code to type
 * into Telegram. The caller never sees the raw code again after this response —
 * it is never logged or stored server-side.
 */
export const createTelegramLinkCode = onCall({ secrets: [TELEGRAM_LINK_CODE_SECRET] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Faça login para gerar um código de vinculação.");
  }

  const uid = request.auth.uid;
  const code = generateLinkCode();
  const hash = hashLinkCode(code, TELEGRAM_LINK_CODE_SECRET.value());
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
 * Verifies + consumes a "VINCULAR 123456" code sent from Telegram. Runs in
 * a transaction so a code can never be redeemed twice.
 */
export async function consumeLinkCode(
  rawCode: string,
  chatId: string,
  secret: string,
  db: Firestore
): Promise<ConsumeLinkCodeResult> {
  const hash = hashLinkCode(rawCode, secret);
  const codeRef = db.collection(LINK_CODES_COLLECTION).doc(hash);
  const linkRef = db.collection(LINKS_COLLECTION).doc(chatId);

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

export async function getLinkedUid(chatId: string, db: Firestore): Promise<string | null> {
  const snapshot = await db.collection(LINKS_COLLECTION).doc(chatId).get();
  if (!snapshot.exists) return null;
  return (snapshot.data() as { uid: string }).uid;
}

interface TelegramLinkRecord {
  uid: string;
  linkedAt: string;
}

/** "123456789" -> "****6789" — never expose the full chat id. */
export function maskChatId(chatId: string): string {
  const last4 = chatId.slice(-4);
  return `****${last4}`;
}

async function findLinkByUid(uid: string, db: Firestore) {
  const snapshot = await db.collection(LINKS_COLLECTION).where("uid", "==", uid).limit(1).get();
  return snapshot.empty ? null : snapshot.docs[0];
}

export interface TelegramConnectionStatus {
  connected: boolean;
  maskedChat: string | null;
  connectedAt: string | null;
}

export async function resolveConnectionStatus(uid: string, db: Firestore): Promise<TelegramConnectionStatus> {
  const linkDoc = await findLinkByUid(uid, db);
  if (!linkDoc) {
    return { connected: false, maskedChat: null, connectedAt: null };
  }

  const data = linkDoc.data() as TelegramLinkRecord;
  return { connected: true, maskedChat: maskChatId(linkDoc.id), connectedAt: data.linkedAt };
}

export interface DisconnectTelegramResult {
  disconnected: true;
}

export async function performDisconnect(uid: string, db: Firestore): Promise<DisconnectTelegramResult> {
  const linkDoc = await findLinkByUid(uid, db);
  if (linkDoc) {
    await linkDoc.ref.delete();
  }
  return { disconnected: true };
}

/** Authenticated callable wrapper for resolveConnectionStatus. */
export const getTelegramConnectionStatus = onCall(async (request): Promise<TelegramConnectionStatus> => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Faça login para consultar a conexão com o Telegram.");
  }
  return resolveConnectionStatus(request.auth.uid, getFirestore());
});

/** Authenticated callable wrapper for performDisconnect. */
export const disconnectTelegram = onCall(async (request): Promise<DisconnectTelegramResult> => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Faça login para desconectar o Telegram.");
  }
  return performDisconnect(request.auth.uid, getFirestore());
});
