import { Redirect } from "wouter";
import { WhatsAppLinkPage } from "@/features/whatsapp-link";

/**
 * Strict parser: only the literal string "true" enables the experience.
 * Absent, empty, or any other value means disabled — no silent fallback.
 */
export function isWhatsAppLinkEnabled(rawValue: string | undefined): boolean {
  return rawValue === "true";
}

export default function WhatsAppPreview() {
  const isEnabled = isWhatsAppLinkEnabled(import.meta.env.VITE_ENABLE_WHATSAPP_LINK);

  if (!isEnabled) {
    return <Redirect to="/dashboard" />;
  }

  return <WhatsAppLinkPage />;
}
