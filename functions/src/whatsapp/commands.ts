import { Firestore } from "firebase-admin/firestore";
import { PendingWhatsAppCommand } from "./types";

const PENDING_COMMANDS_COLLECTION = "whatsappPendingCommands";
const TRANSACTIONS_SUBCOLLECTION = "transactions";

export type ReplyIntent = "confirm" | "reject" | "unclear";

const CONFIRM_WORDS = ["sim", "s", "confirmo", "confirmar", "ok"];
const REJECT_WORDS = ["não", "nao", "n", "cancelar", "cancela"];

export function interpretReply(rawText: string): ReplyIntent {
  const normalized = rawText.trim().toLowerCase();
  if (CONFIRM_WORDS.includes(normalized)) return "confirm";
  if (REJECT_WORDS.includes(normalized)) return "reject";
  return "unclear";
}

export async function getPendingCommand(waId: string, db: Firestore): Promise<PendingWhatsAppCommand | null> {
  const snapshot = await db.collection(PENDING_COMMANDS_COLLECTION).doc(waId).get();
  if (!snapshot.exists) return null;
  return snapshot.data() as PendingWhatsAppCommand;
}

export async function savePendingCommand(pending: PendingWhatsAppCommand, db: Firestore): Promise<void> {
  await db.collection(PENDING_COMMANDS_COLLECTION).doc(pending.waId).set(pending);
}

export async function clearPendingCommand(waId: string, db: Firestore): Promise<void> {
  await db.collection(PENDING_COMMANDS_COLLECTION).doc(waId).delete();
}

/**
 * Maps a pending command onto the *existing* users/{uid}/transactions
 * schema (amount in reais, YYYY-MM-DD date) — the same shape
 * processarGastoComIA and the web app already read and write.
 */
export function buildTransactionDocument(pending: PendingWhatsAppCommand) {
  return {
    amount: pending.amountInCents / 100,
    type: pending.type,
    category: pending.categorySuggestion,
    description: pending.description,
    date: pending.occurredOn,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Confirms a pending command: writes the transaction and clears the
 * pending state atomically. If the pending doc is already gone (a
 * concurrent retry already confirmed or discarded it), this is a safe
 * no-op — it never writes a second transaction for the same command.
 */
export async function confirmPendingCommand(pending: PendingWhatsAppCommand, db: Firestore): Promise<void> {
  const pendingRef = db.collection(PENDING_COMMANDS_COLLECTION).doc(pending.waId);
  const transactionRef = db.collection("users").doc(pending.uid).collection(TRANSACTIONS_SUBCOLLECTION).doc();

  await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(pendingRef);
    if (!snapshot.exists) return;
    tx.set(transactionRef, buildTransactionDocument(pending));
    tx.delete(pendingRef);
  });
}
