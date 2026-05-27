import { useState, useEffect } from "react";
import Modal from "@/components/base/Modal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name?: string;
    creditor: string;
    total_amount: number;
    installment_value: number;
    total_installments: number;
    start_date: string;
    interest_rate?: number;
  }) => void;
  onDelete?: () => void;
  initialData?: {
    name?: string;
    creditor: string;
    total_amount: number;
    installment_value: number;
    total_installments: number;
    paid_installments: number;
    start_date: string;
    interest_rate?: number;
  };
  mode?: "add" | "edit";
}

export default function DebtModal({ isOpen, onClose, onSave, onDelete, initialData, mode = "add" }: Props) {
  const [name, setName] = useState("");
  const [creditor, setCreditor] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [installmentValue, setInstallmentValue] = useState(0);
  const [totalInstallments, setTotalInstallments] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [interestRate, setInterestRate] = useState<number | undefined>(undefined);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setCreditor(initialData.creditor);
      setTotalAmount(initialData.total_amount);
      setInstallmentValue(initialData.installment_value);
      setTotalInstallments(initialData.total_installments);
      setStartDate(initialData.start_date);
      setInterestRate(initialData.interest_rate);
    } else {
      setName("");
      setCreditor("");
      setTotalAmount(0);
      setInstallmentValue(0);
      setTotalInstallments(1);
      setStartDate("");
      setInterestRate(undefined);
    }
    setError("");
    setShowDeleteConfirm(false);
  }, [isOpen, initialData]);

  const handleSave = () => {
    if (!creditor.trim()) {
      setError("Nome do credor é obrigatório.");
      return;
    }
    if (totalAmount <= 0) {
      setError("Valor total deve ser maior que zero.");
      return;
    }
    if (!startDate) {
      setError("Data de início é obrigatória.");
      return;
    }
    onSave({
      name: name.trim() || undefined,
      creditor: creditor.trim(),
      total_amount: totalAmount,
      installment_value: installmentValue,
      total_installments: totalInstallments,
      start_date: startDate,
      interest_rate: interestRate,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === "add" ? "Nova Dívida" : "Editar Dívida"}>
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
            <i className="ri-error-warning-line text-rose-500 text-base mt-0.5 shrink-0" />
            <p className="text-rose-600 text-sm">{error}</p>
          </div>
        )}

        {/* Creditor */}
        <div>
          <label className="block text-sm font-semibold text-forest-700 mb-1.5">Credor <span className="text-rose-400">*</span></label>
          <input
            type="text"
            value={creditor}
            onChange={(e) => { setCreditor(e.target.value); setError(""); }}
            placeholder="Ex: Banco Itaú, Loja XYZ..."
            className="w-full px-4 py-3 border border-forest-200 rounded-xl text-sm text-forest-800 placeholder-forest-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>

        {/* Name (optional) */}
        <div>
          <label className="block text-sm font-semibold text-forest-700 mb-1.5">Apelido (opcional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Financiamento Casa, Empréstimo..."
            className="w-full px-4 py-3 border border-forest-200 rounded-xl text-sm text-forest-800 placeholder-forest-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>

        {/* Total amount */}
        <div>
          <label className="block text-sm font-semibold text-forest-700 mb-1.5">Valor total <span className="text-rose-400">*</span></label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-400 text-sm font-medium">R$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={totalAmount}
              onChange={(e) => { setTotalAmount(parseFloat(e.target.value) || 0); setError(""); }}
              className="w-full pl-12 pr-4 py-3 border border-forest-200 rounded-xl text-sm text-forest-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Installment value */}
          <div>
            <label className="block text-sm font-semibold text-forest-700 mb-1.5">Valor parcela</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-400 text-sm font-medium">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={installmentValue}
                onChange={(e) => setInstallmentValue(parseFloat(e.target.value) || 0)}
                className="w-full pl-12 pr-4 py-3 border border-forest-200 rounded-xl text-sm text-forest-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>
          </div>

          {/* Total installments */}
          <div>
            <label className="block text-sm font-semibold text-forest-700 mb-1.5">Total parcelas</label>
            <input
              type="number"
              min="1"
              value={totalInstallments}
              onChange={(e) => setTotalInstallments(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 border border-forest-200 rounded-xl text-sm text-forest-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Start date */}
          <div>
            <label className="block text-sm font-semibold text-forest-700 mb-1.5">Data início <span className="text-rose-400">*</span></label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setError(""); }}
              className="w-full px-4 py-3 border border-forest-200 rounded-xl text-sm text-forest-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>

          {/* Interest rate */}
          <div>
            <label className="block text-sm font-semibold text-forest-700 mb-1.5">Juros % (opcional)</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={interestRate ?? ""}
                onChange={(e) => setInterestRate(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
                className="w-full pl-4 pr-10 py-3 border border-forest-200 rounded-xl text-sm text-forest-800 placeholder-forest-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-forest-400 text-sm">%</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            {mode === "add" ? "Criar Dívida" : "Salvar Alterações"}
          </button>
          {mode === "edit" && onDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-delete-bin-line" />
            </button>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-3">
            <p className="text-sm text-rose-700 font-medium">Tem certeza que deseja excluir esta dívida?</p>
            <p className="text-xs text-rose-500">Todas as informações serão perdidas.</p>
            <div className="flex gap-2">
              <button
                onClick={() => { onDelete?.(); onClose(); }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer"
              >
                Sim, excluir
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 bg-white border border-forest-200 hover:bg-forest-50 text-forest-600 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}