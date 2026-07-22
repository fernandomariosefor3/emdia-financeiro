import { FinancialContextDocumentV1 } from "@/domain/finance/context/types";
import { GetCurrentResult, SaveCurrentResult } from "./types";

/**
 * Pure port for persisting the "Prepare seu mês" Financial Context. No
 * Firebase import here — implementations live alongside this interface
 * (see FirebaseFinancialContextRepository), keeping the domain agnostic of
 * the storage backend.
 *
 * Callers must always pass the uid of the authenticated user (e.g. from
 * useAuth()) — never a uid sourced from form input.
 */
export interface FinancialContextRepository {
  getCurrent(uid: string): Promise<GetCurrentResult>;

  /**
   * expectedRevision is the revision the caller last observed (null when no
   * document is believed to exist yet). A mismatch against the stored
   * revision returns "revision_conflict" instead of silently overwriting.
   */
  saveCurrent(
    uid: string,
    document: FinancialContextDocumentV1,
    expectedRevision: number | null
  ): Promise<SaveCurrentResult>;
}
