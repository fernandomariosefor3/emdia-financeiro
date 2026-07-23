import { useEffect, useState } from "react";
import { usePrepareMonthPersistence } from "./data/usePrepareMonthPersistence";
import { Calendar, ChevronRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PrepareMonthEntryCardProps {
  variant?: "compact" | "full";
}

function fmtDate(iso: string): string {
  try {
    return format(parseISO(iso), "d 'de' MMMM", { locale: ptBR });
  } catch {
    return iso;
  }
}

export function PrepareMonthEntryCard({ variant = "full" }: PrepareMonthEntryCardProps) {
  const [, navigate] = useLocation();
  const persistence = usePrepareMonthPersistence();
  const [now, setNow] = useState(new Date());

  // Refresh "now" every minute so day-based logic stays accurate
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const { savedDocument, loadStatus } = persistence;

  // Determine card state
  const isLoading = loadStatus === "loading" || loadStatus === "idle";
  const hasSavedContext = loadStatus === "loaded" && savedDocument != null;
  const lastUpdatedAt = hasSavedContext ? savedDocument.metadata.updatedAt : null;

  // Days since last update
  const daysSinceUpdate = lastUpdatedAt
    ? Math.floor((now.getTime() - parseISO(lastUpdatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Should prompt for review? (end of month or more than 7 days since last update)
  const currentDay = now.getDate();
  const isEndOfMonth = currentDay >= 25 || currentDay <= 3;
  const needsReview = hasSavedContext && (daysSinceUpdate === null || daysSinceUpdate > 7 || isEndOfMonth);

  // Compact variant: just a nav-like badge
  if (variant === "compact") {
    return (
      <Button
        variant="ghost"
        onClick={() => navigate("/prepare-seu-mes")}
        className="w-full justify-between text-sm font-medium text-gray-600 hover:text-[#0A0F1E] hover:bg-gray-50 rounded-xl"
      >
        <span className="flex items-center gap-2">
          <Calendar size={15} className="text-[#1AC87E]" />
          Planeje seu mês
        </span>
        <ChevronRight size={14} className="text-gray-400" />
      </Button>
    );
  }

  // Full variant
  return (
    <Card className="bg-white border-gray-100 shadow-sm overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center shrink-0
            ${needsReview
              ? "bg-amber-50"
              : hasSavedContext
              ? "bg-emerald-50"
              : "bg-gray-50"
            }
          `}>
            {needsReview ? (
              <AlertCircle size={20} className="text-amber-500" />
            ) : hasSavedContext ? (
              <CheckCircle2 size={20} className="text-emerald-500" />
            ) : (
              <Calendar size={20} className="text-gray-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-[#0A0F1E]">Prepare seu mês</h3>
              {hasSavedContext && daysSinceUpdate !== null && (
                <span className={`
                  text-[10px] font-bold px-1.5 py-0.5 rounded-full
                  ${daysSinceUpdate > 14
                    ? "bg-rose-100 text-rose-600"
                    : daysSinceUpdate > 7
                    ? "bg-amber-100 text-amber-600"
                    : "bg-emerald-100 text-emerald-600"
                  }
                `}>
                  {daysSinceUpdate === 0
                    ? "Atualizado hoje"
                    : `${daysSinceUpdate}d atrás`}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {isLoading && "Carregando..."}
              {!isLoading && !hasSavedContext && (
                <>
                  Organize seu saldo, receitas e compromissos para saber quanto pode gastar
                  com segurança.
                </>
              )}
              {!isLoading && hasSavedContext && needsReview && (
                <>
                  Seu último planejamento foi há {daysSinceUpdate} dia{daysSinceUpdate !== 1 ? "s" : ""}.
                  {isEndOfMonth && " Este é um bom momento para revisar."}
                </>
              )}
              {!isLoading && hasSavedContext && !needsReview && (
                <>
                  Planejamento salvo em {lastUpdatedAt ? fmtDate(lastUpdatedAt) : "—"}.{" "}
                  Planeje o próximo mês quando quiser.
                </>
              )}
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={() => navigate("/prepare-seu-mes")}
            size="sm"
            className={`
              shrink-0 rounded-xl font-semibold text-xs h-8 px-3
              ${needsReview
                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                : hasSavedContext
                ? "bg-[#1AC87E] hover:bg-[#15A86A] text-white shadow-sm"
                : "bg-[#1AC87E] hover:bg-[#15A86A] text-white shadow-sm shadow-[#1AC87E]/20"
              }
            `}
          >
            {hasSavedContext ? "Revisar" : "Planejar"}
            <ChevronRight size={12} className="ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
