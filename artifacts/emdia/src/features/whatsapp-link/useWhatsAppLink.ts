import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createWhatsAppLinkCode, getWhatsAppConnectionStatus, disconnectWhatsApp } from "./whatsappLinkClient";
import { WhatsAppLinkState } from "./types";

const GENERIC_ERROR_MESSAGE = "Não foi possível completar a ação agora. Tente novamente em instantes.";

export interface UseWhatsAppLinkResult {
  state: WhatsAppLinkState;
  generateCode: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  disconnect: () => Promise<void>;
  retry: () => void;
}

/**
 * Client-side state machine for "Emdia no Zap". Every network call goes
 * through whatsappLinkClient — this hook never sees a token, secret, or
 * full phone number itself.
 */
export function useWhatsAppLink(): UseWhatsAppLinkResult {
  const { user } = useAuth();
  const [state, setState] = useState<WhatsAppLinkState>({ kind: "loading" });
  const busyRef = useRef(false);
  const lastActionRef = useRef<(() => Promise<void>) | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!user) return;
    lastActionRef.current = refreshStatus;
    setState({ kind: "loading" });
    try {
      const status = await getWhatsAppConnectionStatus();
      if (status.connected && status.maskedPhone && status.connectedAt) {
        setState({ kind: "connected", maskedPhone: status.maskedPhone, connectedAt: status.connectedAt });
      } else {
        setState({ kind: "not_connected" });
      }
    } catch {
      setState({ kind: "error", message: GENERIC_ERROR_MESSAGE });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const generateCode = useCallback(async () => {
    if (!user || busyRef.current) return;
    busyRef.current = true;
    lastActionRef.current = generateCode;
    setState({ kind: "generating_code" });
    try {
      const result = await createWhatsAppLinkCode();
      setState({ kind: "code_generated", code: result.code, expiresInSeconds: result.expiresInSeconds });
    } catch {
      setState({ kind: "error", message: GENERIC_ERROR_MESSAGE });
    } finally {
      busyRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const disconnect = useCallback(async () => {
    if (!user || busyRef.current) return;
    busyRef.current = true;
    lastActionRef.current = disconnect;
    setState({ kind: "disconnecting" });
    try {
      await disconnectWhatsApp();
      setState({ kind: "not_connected" });
    } catch {
      setState({ kind: "error", message: GENERIC_ERROR_MESSAGE });
    } finally {
      busyRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const retry = useCallback(() => {
    if (lastActionRef.current) void lastActionRef.current();
  }, []);

  return { state, generateCode, refreshStatus, disconnect, retry };
}
