import { format, parseISO } from "date-fns";
import { AlertTriangle, AlertCircle, TrendingDown, ShieldAlert, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { FinancialRisk } from "@/domain/finance/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RiskAlertsSectionProps {
  risks: FinancialRisk[];
  onPrepareMonth: () => void;
}

const SEVERITY_CONFIG = {
  critical: {
    icon: ShieldAlert,
    gradient: "from-red-600 to-rose-600",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    label: "Crítico",
    dot: "bg-red-500",
    iconColor: "text-red-600",
  },
  high: {
    icon: AlertTriangle,
    gradient: "from-orange-500 to-amber-500",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    label: "Alto",
    dot: "bg-orange-500",
    iconColor: "text-orange-600",
  },
  medium: {
    icon: AlertCircle,
    gradient: "from-amber-400 to-yellow-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    label: "Médio",
    dot: "bg-amber-500",
    iconColor: "text-amber-600",
  },
  low: {
    icon: AlertCircle,
    gradient: "from-blue-400 to-cyan-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    label: "Baixo",
    dot: "bg-blue-500",
    iconColor: "text-blue-600",
  },
} as const;

function fmt(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function RiskAlertCard({ risk }: { risk: FinancialRisk }) {
  const cfg = SEVERITY_CONFIG[risk.severity];
  const Icon = cfg.icon;

  const dateLabel = risk.date
    ? format(parseISO(risk.date), "dd/MM/yyyy")
    : "Data não definida";

  const shortfallLabel =
    risk.shortfallInCents > 0
      ? `Falta ${fmt(risk.shortfallInCents)}`
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-xl border p-3 flex items-start gap-3",
        cfg.bg,
        cfg.border,
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
          `bg-gradient-to-br ${cfg.gradient}`,
        )}
      >
        <Icon size={15} className="text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn("text-[10px] font-bold uppercase tracking-wide", cfg.text)}>
            {cfg.label}
          </span>
          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", cfg.dot)} />
        </div>
        <p className="text-sm font-semibold text-[#0A0F1E] leading-tight">{risk.reason}</p>
        <div className="flex items-center gap-2 mt-1">
          {shortfallLabel && (
            <span className="text-xs font-medium text-rose-600">{shortfallLabel}</span>
          )}
          <span className="text-[10px] text-gray-400">{dateLabel}</span>
        </div>
      </div>
    </motion.div>
  );
}

export function RiskAlertsSection({ risks, onPrepareMonth }: RiskAlertsSectionProps) {
  if (risks.length === 0) return null;

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedRisks = [...risks].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );

  const criticalCount = risks.filter((r) => r.severity === "critical" || r.severity === "high").length;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown size={16} className="text-rose-500" />
          <h3 className="text-sm font-extrabold text-[#0A0F1E]">
            Alertas de Risco
          </h3>
          {criticalCount > 0 && (
            <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {criticalCount} urgente{criticalCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <Button
          onClick={onPrepareMonth}
          variant="ghost"
          className="text-xs text-gray-500 hover:text-[#0A0F1E] h-7 px-2 rounded-lg"
        >
          Planejar mês
          <ChevronRight size={12} className="ml-1" />
        </Button>
      </div>

      {/* Risk cards */}
      <div className="space-y-2">
        {sortedRisks.map((risk) => (
          <RiskAlertCard key={risk.id} risk={risk} />
        ))}
      </div>

      {/* Tip */}
      <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
        💡 Use "Prepare seu mês" para planejar compromissos e ver como seu saldo pode ficar.
      </p>
    </div>
  );
}
