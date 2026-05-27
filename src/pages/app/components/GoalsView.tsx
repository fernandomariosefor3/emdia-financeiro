import { useState } from "react";
import GoalModal from "@/pages/app/components/GoalModal";
import type { Goal } from "@/hooks/useGoals";

interface Props {
  goals: Goal[];
  onAdd: (goal: Omit<Goal, "id" | "user_id" | "created_at" | "status">) => void;
  onUpdate: (id: string, updates: Partial<Omit<Goal, "id" | "user_id" | "created_at">>) => void;
  onRemove: (id: string) => void;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_CONFIG: Record<string, { label: string; gradient: string; text: string; badgeBg: string; barColor: string }> = {
  em_andamento: {
    label: "Em andamento",
    gradient: "from-brand-50 to-mint-50",
    text: "text-brand-600",
    badgeBg: "bg-brand-100 text-brand-700",
    barColor: "bg-gradient-to-r from-brand-400 to-brand-500",
  },
  concluida: {
    label: "Concluída",
    gradient: "from-emerald-50 to-emerald-100",
    text: "text-emerald-600",
    badgeBg: "bg-emerald-100 text-emerald-700",
    barColor: "bg-gradient-to-r from-emerald-400 to-emerald-500",
  },
  atrasada: {
    label: "Atrasada",
    gradient: "from-rose-50 to-red-50",
    text: "text-rose-600",
    badgeBg: "bg-rose-100 text-rose-700",
    barColor: "bg-gradient-to-r from-rose-400 to-rose-500",
  },
};

export default function GoalsView({ goals, onAdd, onUpdate, onRemove }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleAdd = () => {
    setModalMode("add");
    setEditingGoal(null);
    setModalOpen(true);
  };

  const handleEdit = (g: Goal) => {
    setModalMode("edit");
    setEditingGoal(g);
    setModalOpen(true);
  };

  const handleSave = (data: { name: string; target_amount: number; current_amount: number; deadline?: string; status?: string }) => {
    if (modalMode === "add") {
      onAdd(data);
    } else if (editingGoal) {
      onUpdate(editingGoal.id, data);
    }
  };

  const handleDelete = () => {
    if (editingGoal) {
      onRemove(editingGoal.id);
    }
  };

  return (
    <div className="px-4 py-6 pb-24 lg:pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-forest-900">Metas</h2>
          <p className="text-sm text-slate-400 mt-1">Acompanhe seus objetivos financeiros</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-glow-green hover:shadow-lg hover:-translate-y-0.5"
        >
          <i className="ri-add-line mr-1" /> Nova Meta
        </button>
      </div>

      {/* Goals list */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((g) => {
          const progress = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
          const statusCfg = STATUS_CONFIG[g.status] ?? STATUS_CONFIG.em_andamento;
          return (
            <div
              key={g.id}
              onClick={() => handleEdit(g)}
              className={`bg-gradient-to-br ${statusCfg.gradient} rounded-2xl border border-slate-100/60 p-5 hover:border-brand-200 transition-all group cursor-pointer shadow-soft hover:shadow-card hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${statusCfg.badgeBg}`}>
                  {statusCfg.label}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-brand-500 rounded-lg hover:bg-white/60 cursor-pointer">
                    <i className="ri-pencil-line text-sm" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-forest-900 text-sm mb-1">{g.name}</h3>
              {g.deadline && (
                <p className="text-xs text-slate-400 mb-3">
                  <i className="ri-calendar-line mr-1" />
                  Prazo: {new Date(g.deadline).toLocaleDateString("pt-BR")}
                </p>
              )}

              {/* Progress bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500 font-medium">{fmt(g.current_amount)}</span>
                  <span className="text-slate-400">{fmt(g.target_amount)}</span>
                </div>
                <div className="h-2.5 bg-white/60 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full ${statusCfg.barColor} shadow-soft transition-all duration-500`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1 text-right font-semibold">{progress.toFixed(0)}%</p>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="col-span-full bg-gradient-to-br from-brand-50 to-mint-50 rounded-2xl border border-slate-100/60 p-8 text-center shadow-soft">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-100 to-mint-100 flex items-center justify-center mx-auto mb-3 shadow-soft">
              <i className="ri-flag-line text-brand-400 text-2xl" />
            </div>
            <p className="text-slate-500 text-sm font-medium">Nenhuma meta ainda</p>
            <p className="text-slate-400 text-xs mt-1">Crie sua primeira meta de economia</p>
          </div>
        )}
      </div>

      <GoalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={modalMode === "edit" ? handleDelete : undefined}
        initialData={editingGoal ?? undefined}
        mode={modalMode}
      />
    </div>
  );
}