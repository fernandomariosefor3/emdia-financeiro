import { Redirect } from "wouter";
import { PrepareMonthPage } from "@/features/prepare-month";

/**
 * Strict parser: only the literal string "true" enables the experience.
 * Absent, empty, or any other value means disabled — no silent fallback.
 */
export function isPrepareMonthEnabled(rawValue: string | undefined): boolean {
  return rawValue === "true";
}

export default function PrepareSeuMes() {
  const isEnabled = isPrepareMonthEnabled(import.meta.env.VITE_ENABLE_PREPARE_MONTH);

  if (!isEnabled) {
    return <Redirect to="/dashboard" />;
  }

  return <PrepareMonthPage />;
}
