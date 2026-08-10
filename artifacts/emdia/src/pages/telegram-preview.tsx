import { Redirect } from "wouter";
import { TelegramLinkPage } from "@/features/telegram-link";

/**
 * Strict parser: only the literal string "true" enables the experience.
 * Absent, empty, or any other value means disabled — no silent fallback.
 */
export function isTelegramLinkEnabled(rawValue: string | undefined): boolean {
  return rawValue === "true";
}

export default function TelegramPreview() {
  const isEnabled = isTelegramLinkEnabled(import.meta.env.VITE_ENABLE_TELEGRAM_LINK);

  if (!isEnabled) {
    return <Redirect to="/dashboard" />;
  }

  return <TelegramLinkPage />;
}
