import { useState, useMemo } from "react";
import type { Transaction } from "@/hooks/useTransactions";
import type { DebtAlert } from "@/hooks/useDebtAlerts";
import { getAlertLabel } from "@/hooks/useDebtAlerts";

interface Props {
  transactions: Transaction[];
  onRemove: (id: string) => void;
  debtAlerts: DebtAlert[];
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const TYPE_LABEL: Record<string, string> = {
  receita: "Receita",
  despesa: "Despesa",
  divida: "Dívida",
};

const ALERT_LEVEL_CONFIG = {
  overdue: {
    card: "border-rose-300 bg-gradient-to-br from-rose-50 to-red-50",
    badge: "bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-glow-coral",
    icon: "ri-alarm-warning-fill text-rose-500",
    iconBg: "bg-gradient-to-br from-rose-100 to-red-100",
    pulse: true,
  },
  today: {
    card: "border-gold-300 bg-gradient-to-br from-gold-50 to-amber-50",
    badge: "bg-gradient-to-r from-gold-400 to-amber-500 text-white shadow-glow-gold",
    icon: "ri-time-fill text-gold-500",
    iconBg: "bg-gradient-to-br from-gold-100 to-amber-100",
    pulse: true,
  },
  soon: {
    card: "border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50",
    badge: "bg-gradient-to-r from-orange-400 to-amber-400 text-white",
    icon: "ri-calendar-event-fill text-orange-400",
    iconBg: "bg-gradient-to-br from-orange-100 to-amber-100",
    pulse: false,
  },
};

export default function HistoryView({ transactions, onRemove, debtAlerts }: Props) {
  const [filter, setFilter] = useState<"all" | "receita" | "despesa" | "divida">("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [showAlertBanner, setShowAlertBanner] = useState(true);

  const alertMap = useMemo(() => {
    const map: Record<string, DebtAlert> = {};
    debtAlerts.forEach((a) => { map[a.transaction.id] = a; });
    return map;
  }, [debtAlerts]);

  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const alertA = alertMap[a.id];
      const alertB = alertMap[b.id];
      if (alertA && !alertB) return -1;
      if (!alertA && alertB) return 1;
      if (alertA && alertB) return alertA.daysUntilDue - alertB.daysUntilDue;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [filtered, alertMap]);

  const handleRemove = (id: string) => {
    onRemove(id);
    setConfirmId(null);
  };

  const overdueCount = debtAlerts.filter((a) => a.level === "overdue").length;
  const todayCount = debtAlerts.filter((a) => a.level === "today").length;
  const soonCount = debtAlerts.filter((a) => a.level === "soon").length;

  const bannerConfig = overdueCount > 0
    ? { gradient: "from-rose-50 via-amber-50 to-orange-50", border: "border-rose-200" }
    : todayCount > 0
    ? { gradient: "from-gold-50 via-amber-50 to-orange-50", border: "border-gold-200" }
    : { gradient: "from-amber-50 to-orange-50", border: "border-amber-200" };

  return (
    <div className="px-4 py-5 pb-24">
      <h2 className="font-extrabold text-forest-900 text-xl mb-4">Histórico</h2>

      {/* Alert Banner */}
      {debtAlerts.length > 0 && showAlertBanner && (
        <div className={`mb-4 rounded-2xl overflow-hidden border ${bannerConfig.border} bg-gradient-to-r ${bannerConfig.gradient} shadow-soft animate-slide-up`}>
          <div className="flex items-start gap-3 p-4">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 mt-0.5 rounded-xl bg-gradient-to-br from-rose-400 to-rose-500 text-white shadow-glow-coral">
              <i className="ri-alarm-warning-fill text-lg animate-pulse-soft" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-forest-900 text-sm mb-1">
                {debtAlerts.length === 1 ? "1 dívida precisa de atenção" : `${debtAlerts.length} dívidas precisam de atenção`}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {overdueCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-rose-400 to-red-400 text-white text-[11px] font-bold rounded-full whitespace-nowrap shadow-glow-coral">
                    <i className="ri-error-warning-fill text-xs" />
                    {overdueCount} vencida{overdueCount > 1 ? "s" : ""}
                  </span>
                )}
                {todayCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-gold-400 to-amber-400 text-white text-[11px] font-bold rounded-full whitespace-nowrap shadow-glow-gold">
                    <i className="ri-time-fill text-xs" />
                    {todayCount} vence hoje
                  </span>
                )}
                {soonCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-orange-400 to-amber-400 text-white text-[11px] font-bold rounded-full whitespace-nowrap">
                    <i className="ri-calendar-2-fill text-xs" />
                    {soonCount} em breve
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowAlertBanner(false)}
              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-500 cursor-pointer flex-shrink-0 rounded-lg hover:bg-rose-50 transition-all"
            >
              <i className="ri-close-line text-sm" />
            </button>
          </div>
          {/* Progress bar showing urgency */}
          <div className="h-1 flex">
            {overdueCount > 0 && (
              <div className="bg-gradient-to-r from-rose-400 to-rose-500 transition-all shadow-glow-coral" style={{ width: `${(overdueCount / debtAlerts.length) * 100}%` }} />
            )}
            {todayCount > 0 && (
              <div className="bg-gradient-to-r from-gold-400 to-amber-500 transition-all shadow-glow-gold" style={{ width: `${(todayCount / debtAlerts.length) * 100}%` }} />
            )}
            {soonCount > 0 && (
              <div className="bg-gradient-to-r from-orange-300 to-amber-400 transition-all" style={{ width: `${(soonCount / debtAlerts.length) * 100}%` }} />
            )}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {(["all", "receita", "despesa", "divida"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              filter === f
                ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow-green"
                : "bg-white text-forest-500 hover:bg-brand-50 hover:text-brand-600 shadow-soft"
            }`}
          >
            {f === "all" ? "Todos" : TYPE_LABEL[f]}
            {f === "divida" && debtAlerts.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-gradient-to-br from-rose-400 to-rose-500 text-white text-[9px] font-bold rounded-full shadow-glow-coral">
                {debtAlerts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {sortedFiltered.length === 0 ? (
        <div className="bg-gradient-to-br from-brand-50 to-mint-50 rounded-2xl p-10 text-center shadow-soft">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-100 to-mint-100 flex items-center justify-center mx-auto mb-3 shadow-soft">
            <i className="ri-inbox-line text-brand-400 text-2xl" />
          </div>
          <p className="text-forest-500 text-sm font-medium">Nenhuma transação encontrada</p>
          <p className="text-forest-400 text-xs mt-1">Filtre por categoria ou adicione transações</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedFiltered.map((tx, i) => {
            const alert = alertMap[tx.id];
            const alertCfg = alert ? ALERT_LEVEL_CONFIG[alert.level] : null;

            return (
              <div
                key={tx.id}
                className={`border rounded-xl p-3 flex items-center justify-between gap-3 transition-all shadow-soft hover:shadow-card hover:-translate-y-0.5 ${
                  alertCfg ? `${alertCfg.card} border-2` : "bg-white border-slate-100/60"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 relative shadow-soft ${
                    alertCfg ? alertCfg.iconBg :
                    tx.type === "receita" ? "bg-gradient-to-br from-emerald-50 to-emerald-100" : tx.type === "despesa" ? "bg-gradient-to-br from-rose-50 to-rose-100" : "bg-gradient-to-br from-gold-50 to-amber-50"
                  }`}>
                    {alertCfg ? (
                      <>
                        <i className={`text-lg ${alertCfg.icon}`} />
                        {alertCfg.pulse && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 border-2 border-white animate-ping shadow-glow-coral" />
                        )}
                      </>
                    ) : (
                      <i className={`text-lg ${
                        tx.type === "receita" ? "ri-arrow-up-line text-emerald-500" :
                        tx.type === "despesa" ? "ri-arrow-down-line text-rose-500" :
                        "ri-bank-line text-gold-500"
                      }`} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-forest-900 truncate">{tx.description}</p>
                      {alertCfg && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shadow-soft ${alertCfg.badge}`}>
                          {getAlertLabel(alert)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-forest-400 mt-0.5">
                      {tx.category} · {new Date(`${tx.date}T12:00:00`).toLocaleDateString("pt-BR")}
                      {tx.dueDate && (
                        <span className={`ml-1.5 ${alertCfg ? "font-semibold text-rose-500" : "text-forest-400"}`}>
                          · Venc. {new Date(`${tx.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className={`text-sm font-extrabold ${
                    tx.type === "receita" ? "text-emerald-600" :
                    tx.type === "despesa" ? "text-rose-500" : "text-gold-500"
                  }`}>
                    {tx.type === "receita" ? "+" : "-"}{fmt(tx.amount)}
                  </p>

                  {confirmId === tx.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRemove(tx.id)}
                        className="w-7 h-7 flex items-center justify-center bg-gradient-to-br from-rose-400 to-rose-500 text-white rounded-lg text-xs cursor-pointer whitespace-nowrap shadow-glow-coral"
                      >
                        <i className="ri-check-line" />
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="w-7 h-7 flex items-center justify-center bg-forest-100 text-forest-500 rounded-lg text-xs cursor-pointer whitespace-nowrap hover:bg-forest-200"
                      >
                        <i className="ri-close-line" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(tx.id)}
                      className="w-7 h-7 flex items-center justify-center text-forest-300 hover:text-rose-400 hover:bg-rose-50 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-delete-bin-line" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}