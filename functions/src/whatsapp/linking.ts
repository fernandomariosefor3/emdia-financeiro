import { createHmac, randomInt } from "node:crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { WHATSAPP_LINK_CODE_SECRET } from "./secrets";

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
