import { useState, useEffect } from "react";
import Modal from "@/components/base/Modal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; icon: string; color: string; type: "receita" | "despesa" }) => void;
  onDelete?: () => void;
  initialData?: { name: string; icon: string; color: string; type: "receita" | "despesa" };
  mode?: "add" | "edit";
}

const COLOR_OPTIONS = [
  "#1A6B4A", "#F4A61D", "#F43F5E", "#F97316", "#14B8A6",
  "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#3B82F6",
  "#EF4444", "#6B7280", "#1C1C1E", "#0F2A1E",
];

export default function CategoryModal({ isOpen, onClose, onSave, onDelete, initialData, mode = "add" }: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📁");
  const [color, setColor] = useState("#1A6B4A");
  const [type, setType] = useState<"receita" | "despesa">("despesa");
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setIcon(initialData.icon);
      setColor(initialData.color);
      setType(initialData.type);
    } else {
      setName("");
      setIcon("📁");
      setColor("#1A6B4A");
      setType("despesa");
    }
    setError("");
    setShowDeleteConfirm(false);
  }, [isOpen, initialData]);

  const handleSave = () => {
    if (!name.trim()) {
      setError("Nome da categoria é obrigatório.");
      return;
    }
    onSave({ name: name.trim(), icon, color, type });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === "add" ? "Nova Categoria" : "Editar Categoria"}>
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
            <i className="ri-error-warning-line text-rose-500 text-base mt-0.5 shrink-0" />
            <p className="text-rose-600 text-sm">{error}</p>
          </div>
        )}

        {/* Type toggle */}
        <div>
          <label className="block text-sm font-semibold text-forest-700 mb-2">Tipo</label>
          <div className="flex bg-forest-100 rounded-xl p-1">
            <button
              onClick={() => setType("receita")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                type === "receita" ? "bg-white text-emerald-700 shadow-sm" : "text-forest-500"
              }`}
            >
              <i className="ri-arrow-up-line mr-1" /> Receita
            </button>
            <button
              onClick={() => setType("despesa")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                type === "despesa" ? "bg-white text-rose-600 shadow-sm" : "text-forest-500"
              }`}
            >
              <i className="ri-arrow-down-line mr-1" /> Despesa
            </button>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-forest-700 mb-1.5">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="Ex: Alimentação"
            className="w-full px-4 py-3 border border-forest-200 rounded-xl text-sm text-forest-800 placeholder-forest-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>

        {/* Icon */}
        <div>
          <label className="block text-sm font-semibold text-forest-700 mb-1.5">Ícone (emoji)</label>
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value.slice(0, 2))}
            placeholder="📁"
            className="w-full px-4 py-3 border border-forest-200 rounded-xl text-sm text-forest-800 placeholder-forest-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all text-center text-lg"
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-semibold text-forest-700 mb-2">Cor</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg transition-all cursor-pointer ${
                  color === c ? "ring-2 ring-offset-2 ring-forest-400 scale-110" : "hover:scale-105"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-forest-50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: color + "20", color }}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-forest-700">{name || "Preview"}</p>
            <p className="text-xs text-forest-400">{type === "receita" ? "Receita" : "Despesa"}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            {mode === "add" ? "Criar Categoria" : "Salvar Alterações"}
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

        {/* Delete confirm */}
        {showDeleteConfirm && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-3">
            <p className="text-sm text-rose-700 font-medium">Tem certeza que deseja excluir esta categoria?</p>
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