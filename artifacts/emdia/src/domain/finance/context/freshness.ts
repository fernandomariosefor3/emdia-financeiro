import { CivilDate, FinancialContextDocumentV1 } from "./types";
import { STALE_CONTEXT_THRESHOLD_DAYS } from "./constants";

export type FreshnessStatus = "fresh" | "expiring_soon" | "stale";

function daysBetween(start: string, end: string): number {
  const d1 = new Date(start).getTime();
  const d2 = new Date(end).getTime();
  return Math.floor((d2 - d1) / (1000 * 3600 * 24));
}

export function determineContextFreshness(
  doc: FinancialContextDocumentV1,
  currentIsoDate: string
): FreshnessStatus {
  if (!doc.metadata.lastConfirmedAt) return "stale";

  const diff = daysBetween(doc.metadata.lastConfirmedAt, currentIsoDate);

  if (diff >= STALE_CONTEXT_THRESHOLD_DAYS) {
    return "stale";
  }

  if (diff >= STALE_CONTEXT_THRESHOLD_DAYS - 3) {
    return "expiring_soon";
  }

  return "fresh";
}

export function isReferenceBalanceStale(
  doc: FinancialContextDocumentV1,
  currentIsoDate: string
): boolean {
  if (!doc.referenceBalance) return true;
  const diff = daysBetween(doc.referenceBalance.lastConfirmedAt, currentIsoDate);
  return diff >= STALE_CONTEXT_THRESHOLD_DAYS;
}
