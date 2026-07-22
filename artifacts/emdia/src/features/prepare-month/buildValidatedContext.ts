import { validateFinancialContextDocument, normalizeFinancialContextDocument } from "@/domain/finance/context";
import { FinancialContextDocumentV1 } from "@/domain/finance/context/types";
import { PrepareMonthFormState } from "./types";
import { buildContextFromForm } from "./buildContextFromForm";

export type BuildValidatedContextResult =
  | { status: "ready"; document: FinancialContextDocumentV1 }
  | { status: "invalid" };

/**
 * Same construct-validate-normalize pipeline buildPrepareMonthPreview uses
 * internally, exposed standalone so the save flow persists exactly the
 * document the preview was computed from — never a re-derived variant.
 */
export function buildValidatedContext(
  formState: PrepareMonthFormState,
  todayIso: string,
  nowIso: string
): BuildValidatedContextResult {
  const rawDoc = buildContextFromForm(formState, nowIso, todayIso);
  if (!rawDoc) return { status: "invalid" };

  const validation = validateFinancialContextDocument(rawDoc, todayIso);
  if (!validation.success) return { status: "invalid" };

  return { status: "ready", document: normalizeFinancialContextDocument(validation.data) };
}
