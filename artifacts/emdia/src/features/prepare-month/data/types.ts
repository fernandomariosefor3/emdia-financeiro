import { FinancialContextDocumentV1, ValidationError } from "@/domain/finance/context/types";

export type GetCurrentResult =
  | { status: "found"; document: FinancialContextDocumentV1 }
  | { status: "not_found" }
  | { status: "error"; message: string };

export type SaveCurrentResult =
  | { status: "saved"; document: FinancialContextDocumentV1 }
  | { status: "revision_conflict"; currentRevision: number }
  | { status: "invalid"; errors: ValidationError[] }
  | { status: "error"; message: string };
