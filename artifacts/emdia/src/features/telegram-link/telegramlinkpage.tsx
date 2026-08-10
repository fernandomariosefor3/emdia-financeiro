import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTelegramLink } from "./useTelegramLink";

export function TelegramLinkPage() {
  const { state, generateCode, refreshStatus, disconnect, retry } = useTelegramLink();

  useEffect(() => {
    void refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-xl mx-auto px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Emdia no Telegram</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Registre despesas e receitas conversando com o Emdia pelo Telegram.
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
              <p className="text-sm">
                Conecte seu Telegram para começar. Você vai precisar do
                @emdiabot (ou o nome que você der ao seu bot).
              </p>
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
              <p className="text-sm">
                Abra o Telegram e envie esta mensagem para o bot:
              </p>
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
                Telegram conectado (chat {state.maskedChat}).
              </p>
              <p className="text-xs text-muted-foreground">
                Ao desconectar, novas mensagens desse chat não serão registradas no Emdia.
              </p>
              <Button type="button" variant="outline" onClick={() => void disconnect()}>
                Desconectar Telegram
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

        <div className="border-t pt-4">
          <details className="text-sm text-muted-foreground">
            <summary className="cursor-pointer font-medium mb-2">
              Como funciona?
            </summary>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Crie um bot no Telegram usando o @BotFather</li>
              <li>Configure o token do bot como secret TELEGRAM_BOT_TOKEN no Firebase</li>
              <li>Gere um código de vinculação aqui</li>
              <li>Envie "VINCULAR 123456" para o bot no Telegram</li>
              <li>Pronto! Agora você pode registrar gastos e consultar seu respiro pelo Telegram</li>
            </ol>
          </details>
        </div>
      </div>
    </div>
  );
}
