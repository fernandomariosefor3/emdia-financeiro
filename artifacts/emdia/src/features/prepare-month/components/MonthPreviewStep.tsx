import { RefObject } from "react";
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
  topRisk?: FinancialRisk | null;
  recommendedAction?: FormattedRecommendedAction;
  assumptions: string[];
  ignoredNotes: string[];
}

interface MonthPreviewStepProps {
  preview: MonthPreviewData;
  onRestart: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

export function MonthPreviewStep({ preview, onRestart, headingRef }: MonthPreviewStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          Veja como seu mês pode ficar
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Esta é uma simulação. Nada será salvo.
        </p>
      </div>

      {preview.status === "insufficient" ? (
        <Alert variant="destructive" role="alert" aria-live="polite">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Ainda não é possível montar uma prévia</AlertTitle>
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

      <Button type="button" variant="outline" onClick={onRestart}>
        <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
        Reiniciar simulação
      </Button>
    </div>
  );
}
