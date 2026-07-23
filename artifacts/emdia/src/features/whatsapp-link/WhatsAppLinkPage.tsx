import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useWhatsAppLink } from "./useWhatsAppLink";

export function WhatsAppLinkPage() {
  const { state, generateCode, refreshStatus, disconnect, retry } = useWhatsAppLink();

  useEffect(() => {
    void refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-xl mx-auto px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Emdia no Zap</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Registre despesas e receitas conversando com o Emdia pelo WhatsApp.
          </p>
        </div>

        <div className="border rounded-lg p-4 space-y-4 bg-white">
          {state.kind === "loading" && (
            <p className="text-sm text-muted-foreground" role="status">
              Carregando status da conexão...
            </p>
          )}

          {state.kind === "not_connected" && (
            <div className="space-y-3">
              <p className="text-sm">Conecte seu WhatsApp para começar.</p>
              <Button type="button" onClick={() => void generateCode()}>
                Gerar código
              </Button>
            </div>
          )}

          {state.kind === "generating_code" && (
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
              Gerando código...
            </p>
          )}

          {state.kind === "code_generated" && (
            <div className="space-y-3">
              <p className="text-sm">Envie esta mensagem para o número oficial do Emdia:</p>
              <p className="font-mono text-lg font-bold">VINCULAR {state.code}</p>
              <p className="text-xs text-muted-foreground">
                O código expira em 10 minutos e só pode ser usado uma vez.
              </p>
              <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                Aguardando vinculação...
              </p>
              <Button type="button" variant="outline" onClick={() => void refreshStatus()}>
                Já vinculei, verificar
              </Button>
            </div>
          )}

          {state.kind === "connected" && (
            <div className="space-y-3">
              <p className="text-sm font-medium" role="status">
                WhatsApp conectado com final {state.maskedPhone}.
              </p>
              <p className="text-xs text-muted-foreground">
                Ao desconectar, novas mensagens desse número não serão registradas no Emdia.
              </p>
              <Button type="button" variant="outline" onClick={() => void disconnect()}>
                Desconectar WhatsApp
              </Button>
            </div>
          )}

          {state.kind === "disconnecting" && (
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
              Desconectando...
            </p>
          )}

          {state.kind === "error" && (
            <div className="space-y-3">
              <p className="text-sm text-destructive" role="alert" aria-live="polite">
                {state.message}
              </p>
              <Button type="button" variant="outline" onClick={retry}>
                Tentar novamente
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
