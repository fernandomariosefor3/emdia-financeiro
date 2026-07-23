import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info, CheckCircle2, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/lib/auth-context";
import { usePrepareMonthPersistence } from "./data/usePrepareMonthPersistence";
import { PrepareMonthWizard } from "./PrepareMonthWizard";

function fmtDate(iso: string): string {
  try {
    return format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return iso;
  }
}

const DATA_QUALITY_LABEL: Record<string, string> = {
  complete: "Completo",
  partial: "Parcial",
  insufficient: "Insuficiente",
  stale: "Desatualizado",
};

export function PrepareMonthPage() {
  const { user } = useAuth();
  const persistence = usePrepareMonthPersistence();
  const { savedDocument, loadStatus } = persistence;

  const [lastUpdatedLabel, setLastUpdatedLabel] = useState<string | null>(null);

  useEffect(() => {
    if (savedDocument?.metadata?.updatedAt) {
      try {
        const d = parseISO(savedDocument.metadata.updatedAt);
        setLastUpdatedLabel(format(d, "d 'de' MMMM", { locale: ptBR }));
      } catch {
        setLastUpdatedLabel(null);
      }
    }
  }, [savedDocument]);

  const hasSaved = loadStatus === "loaded" && savedDocument != null;
  const quality = savedDocument?.metadata?.dataQuality;
  const completeness = savedDocument?.metadata?.completeness;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Prepare seu mês</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Informe sua situação financeira para o Emdia calcular seu Respiro, seu Ritmo seguro e os
          compromissos que precisam de atenção.
        </p>

        {/* Saved context status banner */}
        {hasSaved && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={`
                text-xs font-semibold gap-1.5 px-2.5 py-1
                ${quality === "complete"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : quality === "partial"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
                }
              `}
            >
              {quality === "complete" ? (
                <CheckCircle2 size={11} />
              ) : (
                <Clock size={11} />
              )}
              Planejamento {quality ? DATA_QUALITY_LABEL[quality] : ""}
            </Badge>

            {lastUpdatedLabel && (
              <span className="text-xs text-gray-400">
                Atualizado em {lastUpdatedLabel}
              </span>
            )}

            {completeness && (
              <div className="flex gap-1 ml-1">
                {completeness.referenceBalance && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Saldo</span>
                )}
                {completeness.expectedIncome && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Rendas</span>
                )}
                {completeness.recurringCommitments && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Compromissos</span>
                )}
                {completeness.protectedGoals && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Metas</span>
                )}
              </div>
            )}
          </div>
        )}

        <Alert className="mt-4 bg-blue-50/50 border-blue-100 text-blue-900">
          <Info className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <AlertDescription className="text-blue-700/90 text-sm">
            {user
              ? hasSaved
                ? "Seu planejamento foi carregado. Você pode revisá-lo, ajustar valores e salvar novamente."
                : "Seus dados só são salvos quando você confirmar em \"Salvar meu planejamento\", na última etapa."
              : "Faça login para salvar seu planejamento."}
          </AlertDescription>
        </Alert>
      </div>
      <PrepareMonthWizard />
    </div>
  );
}
