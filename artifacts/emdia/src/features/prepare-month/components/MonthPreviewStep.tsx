import { RefObject } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RotateCcw } from "lucide-react";
import { formatMoney } from "@/domain/finance/money";
import { FinancialRisk } from "@/domain/finance/types";
import { DataQuality } from "@/domain/finance/context/types";
import { FormattedRecommendedAction } from "../formatRecommendedActionForUser";

const DATA_QUALITY_LABELS: Record<DataQuality, string> = {
  complete: "Completa",
  partial: "Parcial",
  insufficient: "Insuficiente",
  stale: "Desatualizada",
};

export interface MonthPreviewData {
  status: "insufficient" | "ready";
  blockingMessages: string[];
  dataQuality?: DataQuality;
  breathingRoomInCents?: number;
  safeDailyPaceInCents?: number;
  projectedBalanceInCents?: number;
  /** Civil date (YYYY-MM-DD) the calculation was based on. */
  referenceDate?: string;
  topRisk?: FinancialRisk | null;
  recommendedAction?: FormattedRecommendedAction;
  assumptions: string[];
  ignoredNotes: string[];
}

export type PrepareMonthSaveStatus = "idle" | "saving" | "success" | "error";

interface MonthPreviewStepProps {
  preview: MonthPreviewData;
  onRestart: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
  canSave: boolean;
  saveStatus: PrepareMonthSaveStatus;
  saveErrorMessage: string | null;
  onSave: () => void;
  onRetrySave: () => void;
  onBackToStart: () => void;
  onReviewPlan: () => void;
}

function formatReferenceDate(referenceDate: string): string {
  return format(parseISO(referenceDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function MonthPreviewStep({
  preview,
  onRestart,
  headingRef,
  canSave,
  saveStatus,
  saveErrorMessage,
  onSave,
  onRetrySave,
  onBackToStart,
  onReviewPlan,
}: MonthPreviewStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          Seu mês preparado
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {canSave ? "Revise os valores antes de confirmar." : "Faça login para salvar seu planejamento."}
        </p>
      </div>

      {preview.status === "insufficient" ? (
        <Alert variant="destructive" role="alert" aria-live="polite">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Ainda não é possível preparar seu mês</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 space-y-1">
              {preview.blockingMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : (
        <div role="status" aria-live="polite" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Dinheiro livre estimado (Respiro)
              </p>
              <p className="text-2xl font-bold mt-1">{formatMoney(preview.breathingRoomInCents ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Estimativa com os dados informados. Pode mudar quando novos lançamentos forem
                incluídos.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Ritmo seguro diário</p>
              <p className="text-2xl font-bold mt-1">{formatMoney(preview.safeDailyPaceInCents ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Estimativa, não uma garantia.</p>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Saldo projetado</p>
            <p className="text-2xl font-bold mt-1">{formatMoney(preview.projectedBalanceInCents ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Estimativa para o fim do período considerado, com os dados informados.
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Próximo risco</p>
            {preview.topRisk ? (
              <p className="mt-1 text-sm">
                {preview.topRisk.reason} em {preview.topRisk.date} (
                {formatMoney(preview.topRisk.shortfallInCents)})
              </p>
            ) : (
              <p className="mt-1 text-sm">Nenhum risco identificado no cenário informado.</p>
            )}
          </div>

          {preview.recommendedAction && (
            <div className="border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Ação recomendada</p>
              <p className="mt-1 font-medium text-sm">{preview.recommendedAction.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{preview.recommendedAction.message}</p>
            </div>
          )}

          <div className="border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Qualidade dos dados</p>
            <p className="mt-1 text-sm">{DATA_QUALITY_LABELS[preview.dataQuality ?? "insufficient"]}</p>
          </div>

          {preview.referenceDate && (
            <div className="border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Data considerada no cálculo</p>
              <p className="mt-1 text-sm">{formatReferenceDate(preview.referenceDate)}</p>
            </div>
          )}

          {preview.assumptions.length > 0 && (
            <div className="border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Hipóteses consideradas</p>
              <ul className="mt-1 text-sm list-disc pl-4 space-y-1">
                {preview.assumptions.map((assumption) => (
                  <li key={assumption}>{assumption}</li>
                ))}
              </ul>
            </div>
          )}

          {preview.ignoredNotes.length > 0 && (
            <div className="border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Itens ignorados</p>
              <ul className="mt-1 text-sm list-disc pl-4 space-y-1">
                {preview.ignoredNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {canSave && preview.status === "ready" && (
        <div className="border rounded-lg p-4 space-y-3">
          {saveStatus === "success" ? (
            <div className="space-y-3">
              <p role="status" aria-live="polite" className="text-sm font-medium">
                Seu mês está preparado.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="button" variant="outline" onClick={onBackToStart}>
                  Voltar ao início
                </Button>
                <Button type="button" onClick={onReviewPlan}>
                  Revisar planejamento
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Salvar planejamento</p>

              {saveStatus === "error" && (
                <p role="alert" aria-live="polite" className="text-sm text-destructive">
                  {saveErrorMessage ?? "Não foi possível salvar agora. Seus dados continuam nesta tela."}
                </p>
              )}

              <Button
                type="button"
                onClick={saveStatus === "error" ? onRetrySave : onSave}
                disabled={saveStatus === "saving"}
                aria-busy={saveStatus === "saving"}
              >
                {saveStatus === "saving"
                  ? "Salvando..."
                  : saveStatus === "error"
                    ? "Tentar novamente"
                    : "Salvar meu planejamento"}
              </Button>
            </>
          )}
        </div>
      )}

      {saveStatus !== "success" && (
        <Button type="button" variant="outline" onClick={onRestart}>
          <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
          Recomeçar planejamento
        </Button>
      )}
    </div>
  );
}
