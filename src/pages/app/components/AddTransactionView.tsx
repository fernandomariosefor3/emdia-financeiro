import { useState, FormEvent } from "react";
import type { Transaction, TransactionType } from "@/hooks/useTransactions";

interface Props {
  onAdd: (tx: Omit<Transaction, "id">) => Promise<{ success: boolean; error?: string }>;
  onDone: () => void;
}

const CATEGORIES = {
  despesa: ["Alimentação", "Transporte", "Moradia", "Saúde", "Educação", "Lazer", "Outros"],
  receita: ["Salário", "Freelance", "Investimentos", "Aluguel", "Outros"],
  divida: ["Cartão de Crédito", "Empréstimo", "Financiamento", "Outros"],
};

const TYPE_CONFIG = {
  receita: { label: "Receita", color: "bg-emerald-500 text-white", inactive: "text-slate-500 hover:bg-slate-100" },
  despesa: { label: "Despesa", color: "bg-rose-500 text-white", inactive: "text-slate-500 hover:bg-slate-100" },
  divida: { label: "Dívida", color: "bg-amber-500 text-white", inactive: "text-slate-500 hover:bg-slate-100" },
};

export default function AddTransactionView({ onAdd, onDone }: Props) {
  const [type, setType] = useState<TransactionType>("despesa");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES.despesa[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleTypeChange = (t: TransactionType) => {
    setType(t);
    setCategory(CATEGORIES[t][0]);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const numAmount = parseFloat(amount.replace(",", "."));
    if (!numAmount || numAmount <= 0) {
      setError("Informe um valor válido maior que zero.");
      return;
    }

    setSubmitting(true);
    const result = await onAdd({
      type,
      amount: numAmount,
      description: description.trim() || "Sem descrição",
      category,
      date,
      dueDate: dueDate || undefined,
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Erro ao salvar. Tente novamente.");
      return;
    }

    setAmount("");
    setDescription("");
    setCategory(CATEGORIES[type][0]);
    setDate(new Date().toISOString().slice(0, 10));
    setDueDate("");
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onDone();
    }, 1200);
  };

  return (
    <div className="px-4 py-5 pb-24">
      <h2 className="font-extrabold text-white text-xl mb-5">Nova Transação</h2>

      <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-5">
        {/* Type selector */}
        <div className="flex p-1 bg-white/10 rounded-2xl gap-1">
          {(Object.keys(TYPE_CONFIG) as TransactionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                type === t ? TYPE_CONFIG[t].color : "text-white/60 hover:bg-white/10"
              }`}
            >
              {TYPE_CONFIG[t].label}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
            Valor (R$)
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(null); }}
            placeholder="0,00"
            className="w-full text-3xl font-extrabold text-center text-white bg-white/10 border border-white/15 rounded-xl py-4 outline-none focus:border-brand-400 transition-colors text-sm placeholder:text-white/20"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
            Descrição
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => { setDescription(e.target.value); setError(null); }}
            placeholder="Do que se trata?"
            className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-400 transition-colors placeholder:text-white/20"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
            Categoria
          </label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setError(null); }}
            className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-400 transition-colors cursor-pointer appearance-none"
            style={{ backgroundImage: "none" }}
          >
            {CATEGORIES[type].map((c) => (
              <option key={c} value={c} className="text-slate-800">{c}</option>
            ))}
          </select>
        </div>

        {/* Date row */}
        <div className={`grid gap-3 ${type === "divida" ? "grid-cols-2" : "grid-cols-1"}`}>
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-400 transition-colors cursor-pointer"
            />
          </div>
          {type === "divida" && (
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                Vencimento
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-400 transition-colors cursor-pointer"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 disabled:cursor-not-allowed text-white font-extrabold rounded-xl transition-colors cursor-pointer whitespace-nowrap text-base"
        >
          <span className="flex items-center justify-center gap-2">
            {submitting ? (
              <>
                <i className="ri-loader-4-line animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <i className="ri-save-line" /> Salvar Transação
              </>
            )}
          </span>
        </button>

        {success && (
          <div className="flex items-center justify-center gap-2 text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 rounded-xl py-3 text-sm font-bold">
            <i className="ri-checkbox-circle-line text-lg" /> Salvo com sucesso!
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center gap-2 text-rose-400 bg-rose-500/15 border border-rose-500/20 rounded-xl py-3 text-sm font-bold">
            <i className="ri-error-warning-line text-lg" /> {error}
          </div>
        )}
      </form>
    </div>
  );
}