import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatMoney } from "@/domain/finance/money";
import { FinancialRisk, RecommendedAction } from "@/domain/finance/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BreathingRoomCardProps {
  breathingRoomInCents: number;
  onExplainClick?: () => void;
}

export function BreathingRoomCard({ breathingRoomInCents, onExplainClick }: BreathingRoomCardProps) {
  return (
    <Card className="bg-primary text-primary-foreground border-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-primary-foreground/80 flex justify-between items-center">
          Respiro
          <button 
            onClick={onExplainClick}
            className="text-xs underline text-primary-foreground/70 hover:text-primary-foreground"
            aria-label="Como chegamos a este resultado?"
          >
            Entender cálculo
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold mb-2">
          {formatMoney(breathingRoomInCents)}
        </div>
        <CardDescription className="text-primary-foreground/70 text-sm">
          Valor livre depois das contas, reservas e compromissos previstos.
        </CardDescription>
      </CardContent>
    </Card>
  );
}

interface SafeDailyPaceCardProps {
  dailyPaceInCents: number;
  horizonDate: string;
}

export function SafeDailyPaceCard({ dailyPaceInCents, horizonDate }: SafeDailyPaceCardProps) {
  const formattedDate = format(parseISO(horizonDate), "d 'de' MMMM", { locale: ptBR });
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-muted-foreground">Ritmo seguro</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">
          {formatMoney(dailyPaceInCents)} <span className="text-base font-normal text-muted-foreground">por dia</span>
        </div>
        <p className="text-sm text-muted-foreground">até {formattedDate}</p>
      </CardContent>
    </Card>
  );
}

interface PrimaryRiskCardProps {
  risk: FinancialRisk | null;
}

export function PrimaryRiskCard({ risk }: PrimaryRiskCardProps) {
  if (!risk) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-green-700 dark:text-green-400">Cenário tranquilo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600 dark:text-green-500">Nenhum risco detectado no horizonte atual.</p>
        </CardContent>
      </Card>
    );
  }

  const riskTitle = risk.severity === "critical" 
    ? "Atenção com compromisso essencial"
    : risk.severity === "high"
      ? "Alerta de saldo negativo"
      : "Atenção necessária";

  return (
    <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-orange-700 dark:text-orange-400">{riskTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-orange-600 dark:text-orange-500">
          {risk.commitmentId && risk.shortfallInCents
            ? `Mantendo o cenário atual, poderá faltar ${formatMoney(risk.shortfallInCents)} para cobrir um compromisso em ${risk.date}.`
            : "Existe um risco mapeado no seu horizonte financeiro."}
        </p>
      </CardContent>
    </Card>
  );
}

interface RecommendedActionCardProps {
  action: RecommendedAction | null;
}

export function RecommendedActionCard({ action }: RecommendedActionCardProps) {
  if (!action) return null;

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-blue-700 dark:text-blue-400">Ação Prioritária</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-base font-medium text-blue-800 dark:text-blue-300 mb-1">
          {action.title}
        </p>
        <p className="text-sm text-blue-600 dark:text-blue-500">
          {action.description}
        </p>
      </CardContent>
    </Card>
  );
}
