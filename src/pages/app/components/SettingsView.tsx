import { useState } from "react";
import type { Transaction } from "@/hooks/useTransactions";

interface Props {
  transactions: Transaction[];
  onClearAll: () => void;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function SettingsView({ transactions, onClearAll }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);

  const exportCSV = () => {
    if (transactions.length === 0) return;
    const header = "ID,Tipo,Descrição,Categoria,Valor,Data,Vencimento";
    const rows = transactions.map((t) =>
      [t.id, t.type, `"${t.description}"`, t.category, t.amount.toFixed(2), t.date, t.dueDate ?? ""].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emdia_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const income = transactions.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;

  return (
    <div className="px-4 py-6 pb-24 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-forest-900">Ajustes</h2>
        <p className="text-sm text-forest-400 mt-1">Configure seu app</p>
      </div>

      {/* Stats overview */}
      <div className="bg-white border border-slate-100/60 rounded-2xl p-5 shadow-card">
        <h3 className="font-bold text-forest-900 text-sm mb-4 flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-500 text-white">
            <i className="ri-bar-chart-grouped-line text-xs" />
          </div>
          Resumo Geral
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-brand-50 to-mint-50 rounded-xl p-3 text-center shadow-soft">
            <p className="text-2xl font-extrabold text-brand-600">{transactions.length}</p>
            <p className="text-[10px] text-slate-400 font-medium">Transações</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 text-center shadow-soft">
            <p className="text-lg font-extrabold text-emerald-600 truncate">{fmt(income)}</p>
            <p className="text-[10px] text-slate-400 font-medium">Receitas</p>
          </div>
          <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-xl p-3 text-center shadow-soft">
            <p className="text-lg font-extrabold text-rose-500 truncate">{fmt(expenses)}</p>
            <p className="text-[10px] text-slate-400 font-medium">Despesas</p>
          </div>
          <div className={`rounded-xl p-3 text-center shadow-soft ${balance >= 0 ? "bg-gradient-to-br from-brand-50 to-mint-50" : "bg-gradient-to-br from-rose-50 to-red-50"}`}>
            <p className={`text-lg font-extrabold truncate ${balance >= 0 ? "text-brand-600" : "text-rose-500"}`}>{fmt(balance)}</p>
            <p className="text-[10px] text-slate-400 font-medium">Saldo</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={exportCSV}
          disabled={transactions.length === 0}
          className="w-full p-4 bg-white border border-slate-100/60 rounded-2xl text-left font-bold flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-brand-50/50 hover:to-white transition-all shadow-soft hover:shadow-card hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-soft"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-brand-50 to-mint-50 rounded-xl shadow-soft">
              <i className="ri-download-line text-brand-600 text-lg" />
            </div>
            <div>
              <p className="text-sm font-bold text-forest-900">Exportar CSV</p>
              <p className="text-xs text-slate-400">{transactions.length} transações</p>
            </div>
          </div>
          <i className="ri-arrow-right-s-line text-slate-400" />
        </button>

        <button
          onClick={() => setShowConfirm(true)}
          className="w-full p-4 bg-gradient-to-br from-rose-50 to-red-50 border border-rose-100 rounded-2xl text-left font-bold flex items-center justify-between cursor-pointer hover:bg-gradient-to-br hover:from-rose-100 hover:to-red-100 transition-all shadow-soft hover:shadow-card hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-rose-100 to-red-100 rounded-xl shadow-soft">
              <i className="ri-delete-bin-line text-rose-500 text-lg" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-600">Apagar Tudo</p>
              <p className="text-xs text-rose-400">Ação irreversível</p>
            </div>
          </div>
          <i className="ri-arrow-right-s-line text-rose-300" />
        </button>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-white w-full rounded-t-3xl p-6 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-rose-100 to-red-100 rounded-2xl mx-auto mb-4 shadow-soft">
              <i className="ri-delete-bin-line text-rose-500 text-2xl" />
            </div>
            <h3 className="font-extrabold text-forest-900 text-lg mb-2">Apagar tudo?</h3>
            <p className="text-slate-500 text-sm mb-6">
              Todas as suas transações serão removidas permanentemente. Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 bg-gradient-to-br from-slate-100 to-slate-50 text-slate-700 font-bold rounded-xl cursor-pointer whitespace-nowrap hover:shadow-soft transition-shadow"
              >
                Cancelar
              </button>
              <button
                onClick={() => { onClearAll(); setShowConfirm(false); }}
                className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 text-white font-bold rounded-xl cursor-pointer whitespace-nowrap shadow-glow-coral hover:shadow-lg transition-all"
              >
                Sim, apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}