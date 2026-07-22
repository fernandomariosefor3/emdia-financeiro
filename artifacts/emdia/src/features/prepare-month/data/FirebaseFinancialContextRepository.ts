import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  validateFinancialContextDocument,
  normalizeFinancialContextDocument,
} from "@/domain/finance/context";
import { FinancialContextDocumentV1 } from "@/domain/finance/context/types";
import { FinancialContextRepository } from "./FinancialContextRepository";
import { GetCurrentResult, SaveCurrentResult } from "./types";

export interface FirebaseFinancialContextRepositoryConfig {
  authenticatedUserId: string;
  now?: () => Date;
}

function todayCivilDate(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Builds the document that is actually persisted, listing every field
 * explicitly instead of spreading the input. This guarantees derived
 * fields the domain never persists (breathing room, safe daily pace,
 * risks, recommended action — none of which are part of
 * FinancialContextDocumentV1) cannot leak into storage even if a caller
 * accidentally attaches them to the object.
 */
function toPersistableDocument(
  input: FinancialContextDocumentV1,
  metadata: FinancialContextDocumentV1["metadata"]
): FinancialContextDocumentV1 {
  return {
    schemaVersion: 1,
    metadata,
    profile: input.profile,
    calculationPreferences: input.calculationPreferences,
    referenceBalance: input.referenceBalance,
    minimumReserve: input.minimumReserve,
    expectedIncomes: input.expectedIncomes,
    recurringCommitments: input.recurringCommitments,
    protectedGoals: input.protectedGoals,
  };
}

function isPermissionDeniedError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "permission-denied";
}

export class FirebaseFinancialContextRepository implements FinancialContextRepository {
  private uid: string;
  private now: () => Date;

  constructor(config: FirebaseFinancialContextRepositoryConfig) {
    if (!config.authenticatedUserId) {
      throw new Error("authenticatedUserId is required to instantiate FirebaseFinancialContextRepository.");
    }
    this.uid = config.authenticatedUserId;
    this.now = config.now ?? (() => new Date());
  }

  private docRef(uid: string) {
    return doc(db, "users", uid, "financialContext", "current");
  }

  async getCurrent(uid: string): Promise<GetCurrentResult> {
    try {
      const snapshot = await getDoc(this.docRef(uid));
      if (!snapshot.exists()) {
        return { status: "not_found" };
      }
      const data = snapshot.data();
      const validation = validateFinancialContextDocument(data, todayCivilDate(this.now()));
      if (!validation.success) {
        return { status: "error", message: "Documento salvo está em formato inválido." };
      }
      return { status: "found", document: validation.data };
    } catch (error: unknown) {
      return { status: "error", message: error instanceof Error ? error.message : "Erro ao carregar o contexto financeiro." };
    }
  }

  async saveCurrent(
    uid: string,
    document: FinancialContextDocumentV1,
    expectedRevision: number | null
  ): Promise<SaveCurrentResult> {
    const nowDate = this.now();
    const nowIso = nowDate.toISOString();

    const validation = validateFinancialContextDocument(document, todayCivilDate(nowDate));
    if (!validation.success) {
      return { status: "invalid", errors: validation.errors };
    }
    const normalized = normalizeFinancialContextDocument(validation.data);

    let existing: FinancialContextDocumentV1 | null = null;
    try {
      const snapshot = await getDoc(this.docRef(uid));
      if (snapshot.exists()) {
        const existingValidation = validateFinancialContextDocument(snapshot.data(), todayCivilDate(nowDate));
        existing = existingValidation.success ? existingValidation.data : null;
      }
    } catch (error: unknown) {
      return { status: "error", message: error instanceof Error ? error.message : "Erro ao verificar o contexto financeiro atual." };
    }

    // Idempotent retry: the exact same write was already applied — return
    // the stored result without bumping the revision again (protects
    // against double-click / network retry re-sends).
    const incomingKey = normalized.metadata.idempotencyKey;
    if (incomingKey && existing?.metadata.idempotencyKey === incomingKey) {
      return { status: "saved", document: existing };
    }

    const existingRevision = existing?.metadata.revision ?? 0;
    // null means "caller believes no document exists yet" — equivalent to 0.
    const normalizedExpectedRevision = expectedRevision ?? 0;
    if (normalizedExpectedRevision !== existingRevision) {
      return { status: "revision_conflict", currentRevision: existingRevision };
    }

    const metadata: FinancialContextDocumentV1["metadata"] = {
      ...normalized.metadata,
      schemaVersion: 1,
      createdAt: existing?.metadata.createdAt ?? nowIso,
      updatedAt: nowIso,
      lastConfirmedAt: nowIso,
      revision: existingRevision + 1,
    };

    const toPersist = toPersistableDocument(normalized, metadata);

    try {
      // No Firestore transaction here by design (V1 scope): the write is a
      // plain set, and Firestore Rules enforce
      // metadata.revision == resource.data.metadata.revision + 1 atomically
      // per-document, so a stale write is rejected instead of silently
      // overwriting concurrent changes.
      await setDoc(this.docRef(uid), toPersist);
    } catch (error: unknown) {
      if (isPermissionDeniedError(error)) {
        return { status: "revision_conflict", currentRevision: existingRevision };
      }
      return { status: "error", message: error instanceof Error ? error.message : "Erro ao salvar o contexto financeiro." };
    }

    return { status: "saved", document: toPersist };
  }
}
