import { useState } from "react";
import CategoryModal from "@/pages/app/components/CategoryModal";
import type { Category } from "@/hooks/useCategories";

interface Props {
  categories: Category[];
  onAdd: (cat: Omit<Category, "id" | "user_id" | "created_at">) => void;
  onUpdate: (id: string, updates: Partial<Omit<Category, "id" | "user_id" | "created_at">>) => void;
  onRemove: (id: string) => void;
}

export default function CategoriesView({ categories, onAdd, onUpdate, onRemove }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleAdd = () => {
    setModalMode("add");
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleEdit = (cat: Category) => {
    setModalMode("edit");
    setEditingCategory(cat);
    setModalOpen(true);
  };

  const handleSave = (data: Omit<Category, "id" | "user_id" | "created_at">) => {
    if (modalMode === "add") {
      onAdd(data);
    } else if (editingCategory) {
      onUpdate(editingCategory.id, data);
    }
  };

  const handleDelete = () => {
    if (editingCategory) {
      onRemove(editingCategory.id);
    }
  };

  const income = categories.filter((c) => c.type === "receita");
  const expense = categories.filter((c) => c.type === "despesa");

  return (
    <div className="px-4 py-6 pb-24 lg:pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-forest-900">Categorias</h2>
          <p className="text-sm text-slate-400 mt-1">Organize suas receitas e despesas</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-glow-green hover:shadow-lg hover:-translate-y-0.5"
        >
          <i className="ri-add-line mr-1" /> Nova
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Income categories */}
        <div className="bg-white rounded-2xl border border-slate-100/60 p-5 shadow-card hover:shadow-elevated transition-shadow">
          <h3 className="font-bold text-forest-900 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-glow-green" /> Receitas
            <span className="ml-auto text-xs text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded-full">{income.length}</span>
          </h3>
          <div className="space-y-2">
            {income.map((c) => (
              <div
                key={c.id}
                onClick={() => handleEdit(c)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-white transition-all group cursor-pointer border border-transparent hover:border-emerald-100"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-soft" style={{ backgroundColor: c.color + "25", color: c.color }}>
                  {c.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-forest-900">{c.name}</p>
                </div>
                <button className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-brand-500 rounded-lg hover:bg-brand-50 transition-all cursor-pointer opacity-0 group-hover:opacity-100">
                  <i className="ri-pencil-line" />
                </button>
              </div>
            ))}
            {income.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-sm">Nenhuma categoria de receita</div>
            )}
          </div>
        </div>

        {/* Expense categories */}
        <div className="bg-white rounded-2xl border border-slate-100/60 p-5 shadow-card hover:shadow-elevated transition-shadow">
          <h3 className="font-bold text-forest-900 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 shadow-glow-coral" /> Despesas
            <span className="ml-auto text-xs text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded-full">{expense.length}</span>
          </h3>
          <div className="space-y-2">
            {expense.map((c) => (
              <div
                key={c.id}
                onClick={() => handleEdit(c)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-rose-50/50 hover:to-white transition-all group cursor-pointer border border-transparent hover:border-rose-100"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-soft" style={{ backgroundColor: c.color + "25", color: c.color }}>
                  {c.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-forest-900">{c.name}</p>
                </div>
                <button className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-brand-500 rounded-lg hover:bg-brand-50 transition-all cursor-pointer opacity-0 group-hover:opacity-100">
                  <i className="ri-pencil-line" />
                </button>
              </div>
            ))}
            {expense.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-sm">Nenhuma categoria de despesa</div>
            )}
          </div>
        </div>
      </div>

      <CategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={modalMode === "edit" ? handleDelete : undefined}
        initialData={editingCategory ?? undefined}
        mode={modalMode}
      />
    </div>
  );
}