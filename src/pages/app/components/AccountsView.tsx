import { useState } from "react";
import AccountModal from "@/pages/app/components/AccountModal";
import type { Account } from "@/hooks/useAccounts";

interface Props {
  accounts: Account[];
  onAdd: (acc: Omit<Account, "id" | "user_id" | "created_at" | "current_balance">) => void;
  onUpdate: (id: string, updates: Partial<Omit<Account, "id" | "user_id" | "created_at">>) => void;
  onRemove: (id: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  corrente: "Conta Corrente",
  poupanca: "Poupança",
  carteira: "Carteira",
  credito: "Cartão de Crédito",
  outro: "Outro",
};

const TYPE_ICONS: Record<string, string> = {
  corrente: "🏦",
  poupanca: "💰",
  carteira: "👛",
  credito: "💳",
  outro: "📁",
};

const TYPE_GRADIENTS: Record<string, string> = {
  corrente: "from-sky-soft to-sky",
  poupanca: "from-gold-50 to-gold-200",
  carteira: "from-emerald-50 to-emerald-100",
  credito: "from-rose-50 to-rose-100",
  outro: "from-slate-50 to-slate-100",
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AccountsView({ accounts, onAdd, onUpdate, onRemove }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const total = accounts.reduce((s, a) => s + (a.current_balance ?? a.initial_balance ?? 0), 0);

  const handleAdd = () => {
    setModalMode("add");
    setEditingAccount(null);
    setModalOpen(true);
  };

  const handleEdit = (acc: Account) => {
    setModalMode("edit");
    setEditingAccount(acc);
    setModalOpen(true);
  };

  const handleSave = (data: { name: string; type: string; bank?: string; initial_balance: number }) => {
    if (modalMode === "add") {
      onAdd(data);
    } else if (editingAccount) {
      onUpdate(editingAccount.id, data);
    }
  };

  const handleDelete = () => {
    if (editingAccount) {
      onRemove(editingAccount.id);
    }
  };

  return (
    <div className="px-4 py-6 pb-24 lg:pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-forest-900">Contas</h2>
          <p className="text-sm text-slate-400 mt-1">Gerencie suas contas bancárias</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-glow-green hover:shadow-lg hover:-translate-y-0.5"
        >
          <i className="ri-add-line mr-1" /> Nova Conta
        </button>
      </div>

      {/* Total balance card */}
      <div className="bg-gradient-to-r from-forest-700 via-forest-600 to-forest-700 rounded-2xl p-6 text-white shadow-elevated relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <p className="text-white/60 text-sm font-medium mb-1 relative">Saldo total consolidado</p>
        <p className="text-3xl font-extrabold relative">{fmt(total)}</p>
        <p className="text-white/40 text-xs mt-2 relative">Soma de todas as contas ativas</p>
      </div>

      {/* Accounts list */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((a) => (
          <div
            key={a.id}
            onClick={() => handleEdit(a)}
            className="bg-white rounded-2xl border border-slate-100/60 p-5 hover:border-brand-200 transition-all group cursor-pointer shadow-soft hover:shadow-card hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${TYPE_GRADIENTS[a.type] ?? "from-slate-50 to-slate-100"} flex items-center justify-center text-2xl shadow-soft`}>
                  {TYPE_ICONS[a.type] ?? "📁"}
                </div>
                <div>
                  <p className="text-sm font-bold text-forest-900">{a.name}</p>
                  <p className="text-xs text-slate-400">{TYPE_LABELS[a.type] ?? a.type}{a.bank ? ` · ${a.bank}` : ""}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-brand-500 rounded-lg hover:bg-brand-50 cursor-pointer">
                  <i className="ri-pencil-line text-sm" />
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-1">Saldo atual</p>
              <p className="text-lg font-extrabold text-forest-900">{fmt(a.current_balance ?? a.initial_balance ?? 0)}</p>
            </div>
          </div>
        ))}
      </div>

      <AccountModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={modalMode === "edit" ? handleDelete : undefined}
        initialData={editingAccount ?? undefined}
        mode={modalMode}
      />
    </div>
  );
}