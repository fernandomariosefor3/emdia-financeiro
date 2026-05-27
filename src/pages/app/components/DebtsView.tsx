import { useState } from "react";
import DebtModal from "@/pages/app/components/DebtModal";
import type { Debt } from "@/hooks/useDebts";

interface Props {
  debts: Debt[];
  onAdd: (debt: Omit<Debt, "id" | "user_id" | "created_at" | "paid_installments">) => void;
  onUpdate: (id: string, updates: Partial<Omit<Debt, "id" | "user_id" | "created_at">>) => void;
  onRemove: (id: string) => void;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function DebtsView({ debts, onAdd, onUpdate, onRemove }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const totalDebt = debts.reduce((s, d) => s + d.total_amount, 0);
  const totalPaid = debts.reduce((s, d) => s + d.installment_value * d.paid_installments, 0);
  const totalRemaining = totalDebt - totalPaid;

  const handleAdd = () => {
    setModalMode("add");
    setEditingDebt(null);
    setModalOpen(true);
  };

  const handleEdit = (d: Debt) => {
    setModalMode("edit");
    setEditingDebt(d);
    setModalOpen(true);
  };

  const handleSave = (data: { name?: string; creditor: string; total_amount: number; installment_value: number; total_installments: number; start_date: string; interest_rate?: number }) => {
    if (modalMode === "add") {
      onAdd(data);
    } else if (editingDebt) {
      onUpdate(editingDebt.id, data);
    }
  };

  const handleDelete = () => {
    if (editingDebt) {
      onRemove(editingDebt.id);
    }
  };

  const summaryCards = [
    { label: "Total em dívidas", value: totalDebt, text: "text-forest-900", bg: "bg-gradient-to-br from-white to-slate-50", icon: "ri-file-list-3-line", iconBg: "bg-gradient-to-br from-slate-400 to-slate-500" },
    { label: "Já pago", value: totalPaid, text: "text-brand-600", bg: "bg-gradient-to-br from-brand-50 to-mint-50", icon: "ri-check-line", iconBg: "bg-gradient-to-br from-brand-400 to-brand-500" },
    { label: "Restante", value: totalRemaining, text: "text-rose-600", bg: "bg-gradient-to-br from-rose-50 to-red-50", icon: "ri-time-line", iconBg: "bg-gradient-to-br from-rose-400 to-rose-500" },
    { label: "Parcelas restantes", value: debts.reduce((s, d) => s + (d.total_installments - d.paid_installments), 0), text: "text-gold-600", bg: "bg-gradient-to-br from-gold-50 to-amber-50", icon: "ri-calendar-line", iconBg: "bg-gradient-to-br from-gold-400 to-amber-500", isNumber: true },
  ];

  return (
    <div className="px-4 py-6 pb-24 lg:pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-forest-900">Dívidas & Parcelamentos</h2>
          <p className="text-sm text-slate-400 mt-1">Acompanhe seus débitos</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-glow-green hover:shadow-lg hover:-translate-y-0.5"
        >
          <i className="ri-add-line mr-1" /> Nova Dívida
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((c) => (
          <div key={c.label} className={`${c.bg} rounded-2xl p-4 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-0.5`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 flex items-center justify-center rounded-lg ${c.iconBg} text-white shadow-soft`}>
                <i className={`${c.icon} text-xs`} />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</p>
            </div>
            <p className={`text-lg font-extrabold ${c.text} truncate`}>
              {c.isNumber ? c.value : fmt(c.value as number)}
            </p>
          </div>
        ))}
      </div>

      {/* Debts list */}
      <div className="space-y-3">
        {debts.map((d) => {
          const progress = d.total_installments > 0 ? (d.paid_installments / d.total_installments) * 100 : 0;
          const remaining = d.total_installments - d.paid_installments;
          return (
            <div
              key={d.id}
              onClick={() => handleEdit(d)}
              className="bg-white rounded-2xl border border-slate-100/60 p-5 hover:border-brand-200 transition-all group cursor-pointer shadow-soft hover:shadow-card hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-forest-900 text-sm">{d.name || d.creditor}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Credor: {d.creditor}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-brand-500 rounded-lg hover:bg-brand-50 cursor-pointer">
                    <i className="ri-pencil-line text-sm" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Valor total</p>
                  <p className="text-sm font-bold text-forest-900">{fmt(d.total_amount)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Parcela</p>
                  <p className="text-sm font-bold text-forest-900">{fmt(d.installment_value)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Progresso</p>
                  <p className="text-sm font-bold text-brand-600">{d.paid_installments}/{d.total_installments}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Início</p>
                  <p className="text-sm font-bold text-forest-900">{new Date(d.start_date).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">{remaining} parcela{remaining !== 1 ? "s" : ""} restante{remaining !== 1 ? "s" : ""}</span>
                  <span className="text-slate-500 font-medium">{progress.toFixed(0)}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500 shadow-soft transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {debts.length === 0 && (
          <div className="bg-gradient-to-br from-brand-50 to-mint-50 rounded-2xl border border-slate-100/60 p-8 text-center shadow-soft">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-100 to-mint-100 flex items-center justify-center mx-auto mb-3 shadow-soft">
              <i className="ri-secure-payment-line text-brand-400 text-2xl" />
            </div>
            <p className="text-slate-500 text-sm font-medium">Nenhuma dívida cadastrada</p>
            <p className="text-slate-400 text-xs mt-1">Adicione suas dívidas para acompanhá-las</p>
          </div>
        )}
      </div>

      <DebtModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={modalMode === "edit" ? handleDelete : undefined}
        initialData={editingDebt ?? undefined}
        mode={modalMode}
      />
    </div>
  );
}