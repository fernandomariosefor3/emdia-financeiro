import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, TrendingUp, TrendingDown, Minus, ShoppingBag, ChevronRight, Wind, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PulseData } from "@/hooks/useFinancialPulse";
import { cn } from "@/lib/utils";

interface FinancialPulseWidgetProps {
  pulse: PulseData;
  onSimulate: () => void;
}

function fmt(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function fmtFull(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

const STATUS_CONFIG = {
  excellent: {
    gradient: "from-emerald-600 to-teal-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "Excelente",
    labelColor: "text-emerald-700",
    pulseColor: "text-emerald-400",
  },
  good: {
    gradient: "from-blue-600 to-indigo-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
    label: "Saudável",
    labelColor: "text-blue-700",
    pulseColor: "text-blue-400",
  },
  caution: {
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    label: "Atenção",
    labelColor: "text-amber-700",
    pulseColor: "text-amber-400",
  },
  danger: {
    gradient: "from-red-600 to-rose-600",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
    label: "Apertado",
    labelColor: "text-red-700",
    pulseColor: "text-red-400",
  },
} as const;

export function FinancialPulseWidget({ pulse, onSimulate }: FinancialPulseWidgetProps) {
  const cfg = STATUS_CONFIG[pulse.healthStatus];
  const isPositive = pulse.breathingRoomInCents >= 0;

  const nextIncomeLabel = pulse.nextIncomeDate
    ? format(parseISO(pulse.nextIncomeDate), "EEEE, dd/MM", { locale: ptBR })
    : null;

  return (
    <div className="space-y-3">
      {/* Hero Widget — Respiro Financeiro */}
      <Card
        className={cn(
          "border-0 shadow-xl overflow-hidden",
          "bg-gradient-to-br shadow-2xl",
          cfg.gradient,
        )}
      >
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Wind size={16} className="text-white/70" />
              <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                Seu Pulso Financeiro
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", cfg.dot)} />
              <span className={cn("text-[10px] font-bold uppercase tracking-wide", cfg.labelColor)}>
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Main metric: Breathing Room */}
          <div className="mb-5">
            <p className="text-white/50 text-xs font-medium mb-1">Respiro disponível</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white tracking-tight">
                {fmt(pulse.breathingRoomInCents)}
              </span>
              {isPositive ? (
                <TrendingUp size={20} className="text-emerald-300" />
              ) : (
                <TrendingDown size={20} className="text-rose-300" />
              )}
            </div>
            <p className="text-white/50 text-xs mt-1">
              {isPositive
                ? `${fmtFull(pulse.breathingRoomInCents)} livres para os próximos ${pulse.daysUntilNextIncome} dias`
                : `${fmtFull(Math.abs(pulse.breathingRoomInCents))} acima do orçamento`}
            </p>
          </div>

          {/* Secondary metrics row */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Daily Pace */}
            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity size={12} className="text-white/50" />
                <span className="text-white/50 text-[10px] font-medium uppercase tracking-wide">
                  Ritmo diário
                </span>
              </div>
              <p className="text-xl font-extrabold text-white">
                {fmt(pulse.safeDailyPaceInCents)}
                <span className="text-sm font-medium text-white/60"> /dia</span>
              </p>
              <p className="text-white/40 text-[10px] mt-0.5">
                {pulse.safeDailyPaceInCents > 0
                  ? "você pode gastar isso por dia"
                  : "sem margem para novos gastos"}
              </p>
            </div>

            {/* Balance */}
            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Minus size={12} className="text-white/50" />
                <span className="text-white/50 text-[10px] font-medium uppercase tracking-wide">
                  Saldo do mês
                </span>
              </div>
              <p className="text-xl font-extrabold text-white">
                {fmt(pulse.balanceInCents)}
              </p>
              <p className="text-white/40 text-[10px] mt-0.5">
                {pulse.incomeInCents > 0
                  ? `${fmt(pulse.incomeInCents)} entrada`
                  : "sem receitas registradas"}
              </p>
            </div>
          </div>

          {/* Next income + CTA row */}
          <div className="flex items-center justify-between">
            {nextIncomeLabel ? (
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                <CalendarDays size={14} className="text-white/60" />
                <div>
                  <p className="text-white/50 text-[10px]">Próxima renda</p>
                  <p className="text-white text-xs font-bold">{nextIncomeLabel}</p>
                </div>
              </div>
            ) : (
              <div />
            )}

            <Button
              onClick={onSimulate}
              className={cn(
                "rounded-xl font-semibold text-sm shadow-lg transition-all",
                "bg-white/20 hover:bg-white/30 text-white border-0",
                "flex items-center gap-1.5",
              )}
            >
              <ShoppingBag size={15} />
              Posso comprar?
              <ChevronRight size={14} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compact metrics strip */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Receitas</p>
            <p className="text-sm font-extrabold text-emerald-600 mt-0.5">{fmt(pulse.incomeInCents)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Despesas</p>
            <p className="text-sm font-extrabold text-rose-600 mt-0.5">{fmt(pulse.expenseInCents)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Transações</p>
            <p className="text-sm font-extrabold text-[#0A0F1E] mt-0.5">{pulse.transactionCount}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
