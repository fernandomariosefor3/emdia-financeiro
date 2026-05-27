import { useState, useEffect } from "react";
import Modal from "@/components/base/Modal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; target_amount: number; current_amount: number; deadline?: string; status?: string }) => void;
  onDelete?: () => void;
  initialData?: { name: string; target_amount: number; current_amount: number; deadline?: string; status?: string };
  mode?: "add" | "edit";
}

export default function GoalModal({ isOpen, onClose, onSave, onDelete, initialData, mode = "add" }: Props) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setTargetAmount(initialData.target_amount);
      setCurrentAmount(initialData.current_amount);
      setDeadline(initialData.deadline || "");
    } else {
      setName("");
      setTargetAmount(0);
      setCurrentAmount(0);
      setDeadline("");
    }
    setError("");
    setShowDeleteConfirm(false);
  }, [isOpen, initialData]);

  const handleSave = () => {
    if (!name.trim()) {
      setError("Nome da meta é obrigatório.");
      return;
    }
    if (targetAmount <= 0) {
      setError("Valor alvo deve ser maior que zero.");
      return;
    }
    onSave({
      name: name.trim(),
      target_amount: targetAmount,
      current_amount: currentAmount,
      deadline: deadline || undefined,
      status: initialData?.status || "em_andamento",
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === "add" ? "Nova Meta" : "Editar Meta"}>
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
            <i className="ri-error-warning-line text-rose-500 text-base mt-0.5 shrink-0" />
            <p className="text-rose-600 text-sm">{error}</p>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-forest-700 mb-1.5">Nome da meta</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="Ex: Viagem para Europa"
            className="w-full px-4 py-3 border border-forest-200 rounded-xl text-sm text-forest-800 placeholder-forest-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>

        {/* Target */}
        <div>
          <label className="block text-sm font-semibold text-forest-700 mb-1.5">Valor alvo</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-400 text-sm font-medium">R$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={targetAmount}
              onChange={(e) => { setTargetAmount(parseFloat(e.target.value) || 0); setError(""); }}
              className="w-full pl-12 pr-4 py-3 border border-forest-200 rounded-xl text-sm text-forest-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>
        </div>

        {/* Current amount (only for edit) */}
        {mode === "edit" && (
          <div>
            <label className="block text-sm font-semibold text-forest-700 mb-1.5">Valor atual</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-400 text-sm font-medium">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-12 pr-4 py-3 border border-forest-200 rounded-xl text-sm text-forest-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>
          </div>
        )}

        {/* Deadline */}
        <div>
          <label className="block text-sm font-semibold text-forest-700 mb-1.5">Prazo (opcional)</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-4 py-3 border border-forest-200 rounded-xl text-sm text-forest-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>

        {/* Progress preview for edit */}
        {mode === "edit" && targetAmount > 0 && (
          <div className="bg-forest-50 rounded-xl p-4">
            <p className="text-xs font-bold text-forest-400 uppercase mb-2">Progresso atual</p>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-forest-600 font-medium">{currentAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              <span className="text-forest-400">{targetAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
            <div className="h-2 bg-forest-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min((currentAmount / targetAmount) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-forest-400 mt-1 text-right">{Math.min((currentAmount / targetAmount) * 100, 100).toFixed(0)}% concluído</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            {mode === "add" ? "Criar Meta" : "Salvar Alterações"}
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
            <p className="text-sm text-rose-700 font-medium">Tem certeza que deseja excluir esta meta?</p>
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