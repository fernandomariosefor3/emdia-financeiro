import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { FinancialContextDocumentV1 } from "@/domain/finance/context/types";
import { FinancialContextRepository } from "./FinancialContextRepository";
import { FirebaseFinancialContextRepository } from "./FirebaseFinancialContextRepository";

export type PrepareMonthLoadStatus = "idle" | "loading" | "loaded" | "not_found" | "error";
export type PrepareMonthSaveStatus = "idle" | "saving" | "success" | "error";

export interface UsePrepareMonthPersistenceResult {
  canPersist: boolean;
  loadStatus: PrepareMonthLoadStatus;
  savedDocument: FinancialContextDocumentV1 | null;
  saveStatus: PrepareMonthSaveStatus;
  saveErrorMessage: string | null;
  save: (document: FinancialContextDocumentV1) => Promise<void>;
  retrySave: () => Promise<void>;
}

function defaultRepositoryFactory(uid: string): FinancialContextRepository {
  return new FirebaseFinancialContextRepository({ authenticatedUserId: uid });
}

/**
 * Loads and saves the "Prepare seu mês" Financial Context for the
 * authenticated user only — uid always comes from useAuth(), never from a
 * caller-supplied value, so nothing here can be pointed at another user's
 * document.
 */
export function usePrepareMonthPersistence(
  createRepository: (uid: string) => FinancialContextRepository = defaultRepositoryFactory
): UsePrepareMonthPersistenceResult {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [loadStatus, setLoadStatus] = useState<PrepareMonthLoadStatus>("idle");
  const [savedDocument, setSavedDocument] = useState<FinancialContextDocumentV1 | null>(null);
  const [currentRevision, setCurrentRevision] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<PrepareMonthSaveStatus>("idle");
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const lastAttemptedDocumentRef = useRef<FinancialContextDocumentV1 | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!uid) {
      setLoadStatus("idle");
      setSavedDocument(null);
      setCurrentRevision(null);
      return;
    }

    let cancelled = false;
    setLoadStatus("loading");
    const repository = createRepository(uid);

    repository.getCurrent(uid).then((result) => {
      if (cancelled) return;
      if (result.status === "found") {
        setSavedDocument(result.document);
        setCurrentRevision(result.document.metadata.revision);
        setLoadStatus("loaded");
      } else if (result.status === "not_found") {
        setSavedDocument(null);
        setCurrentRevision(0);
        setLoadStatus("not_found");
      } else {
        setLoadStatus("error");
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- createRepository is a stable factory by contract
  }, [uid]);

  const performSave = useCallback(
    async (document: FinancialContextDocumentV1) => {
      if (!uid || savingRef.current) return;
      savingRef.current = true;
      lastAttemptedDocumentRef.current = document;
      setSaveStatus("saving");
      setSaveErrorMessage(null);

      try {
        const repository = createRepository(uid);
        const result = await repository.saveCurrent(uid, document, currentRevision);

        if (result.status === "saved") {
          setSavedDocument(result.document);
          setCurrentRevision(result.document.metadata.revision);
          setSaveStatus("success");
        } else if (result.status === "revision_conflict") {
          setCurrentRevision(result.currentRevision);
          setSaveStatus("error");
          setSaveErrorMessage("Este planejamento foi atualizado em outro lugar. Recarregue antes de salvar novamente.");
        } else {
          setSaveStatus("error");
          setSaveErrorMessage("Não foi possível salvar agora. Seus dados continuam nesta tela.");
        }
      } catch {
        setSaveStatus("error");
        setSaveErrorMessage("Não foi possível salvar agora. Seus dados continuam nesta tela.");
      } finally {
        savingRef.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- createRepository is a stable factory by contract
    [uid, currentRevision]
  );

  const retrySave = useCallback(async () => {
    if (lastAttemptedDocumentRef.current) {
      await performSave(lastAttemptedDocumentRef.current);
    }
  }, [performSave]);

  return {
    canPersist: uid !== null,
    loadStatus,
    savedDocument,
    saveStatus,
    saveErrorMessage,
    save: performSave,
    retrySave,
  };
}
