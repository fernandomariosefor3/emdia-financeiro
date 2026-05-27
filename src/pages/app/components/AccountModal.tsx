import { useState, useEffect } from "react";
import Modal from "@/components/base/Modal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; type: string; bank?: string; initial_balance: number }) => void;
  onDelete?: () => void;
  initialData?: { name: string; type: string; bank?: string; initial_balance: number };
  mode?: "add" | "edit";
}

const TYPE_OPTIONS = [
  { value: "corrente", label: "Conta Corrente", icon: "🏦" },
  { value: "poupanca", label: "Poupança", icon: "💰" },
  { value: "carteira", label: "Carteira", icon: "👛" },
  { value: "credito", label: "Cartão de Crédito", icon: "💳" },
  { value: "outro", label: "Outro", icon: "📁" },
];

export default function AccountModal({ isOpen, onClose, onSave, onDelete, initialData, mode = "add" }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState("corrente");
  const [bank, setBank] = useState("");
  const [initialBalance, setInitialBalance] = useState(0);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setBank(initialData.bank || "");
      setInitialBalance(initialData.initial_balance);
    } else {
      setName("");
      setType("corrente");
      setBank("");
      setInitialBalance(0);
    }
    setError("");
    setShowDeleteConfirm(false);
  }, [isOpen, initialData]);

  const handleSave = () => {
    if (!name.trim()) {
      setError("Nome da conta é obrigatório.");
      return;
    }
    onSave({
      name: name.trim(),
      type,
      bank: bank.trim() || undefined,
      initial_balance: initialBalance,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === "add" ? "Nova Conta" : "Editar Conta"}>
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
            <i className="ri-error-warning-line text-rose-500 text-base mt-0.5 shrink-0" />
            <p className="text-rose-600 text-sm">{error}</p>
          </div>
        )}

        {/* Type */}
        <div>
          <label className="block text-sm font-semibold text-forest-700 mb-2">Tipo de conta</label>
          <div className="grid grid-cols-2 gap-2">
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                  type === t.value
                    ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-700"
                    : "bg-forest-50 border-2 border-transparent text-forest-500 hover:bg-forest-100"
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-forest-700 mb-1.5">Nome da conta</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="Ex: Conta Principal"
            className="w-full px-4 py-3 border border-forest-200 rounded-xl text-sm text-forest-800 placeholder-forest-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>

        {/* Bank */}
        <div>
          <label className="block text-sm font-semibold text-forest-700 mb-1.5">Banco (opcional)</label>
          <input
            type="text"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            placeholder="Ex: Itaú, Nubank, Bradesco..."
            className="w-full px-4 py-3 border border-forest-200 rounded-xl text-sm text-forest-800 placeholder-forest-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>

        {/* Initial balance */}
        <div>
          <label className="block text-sm font-semibold text-forest-700 mb-1.5">Saldo inicial</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-400 text-sm font-medium">R$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={initialBalance}
              onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
              className="w-full pl-12 pr-4 py-3 border border-forest-200 rounded-xl text-sm text-forest-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            {mode === "add" ? "Criar Conta" : "Salvar Alterações"}
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
            <p className="text-sm text-rose-700 font-medium">Tem certeza que deseja excluir esta conta?</p>
            <p className="text-xs text-rose-500">Transações associadas não serão excluídas.</p>
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