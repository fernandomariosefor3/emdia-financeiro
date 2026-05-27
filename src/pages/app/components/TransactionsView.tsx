export default function TransactionsView() {
  return (
    <div className="px-4 py-6 pb-24 lg:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-forest-900">Transações</h2>
          <p className="text-sm text-slate-400 mt-1">Gerencie todas as suas movimentações</p>
        </div>
      </div>
      <div className="bg-gradient-to-br from-brand-50 to-mint-50 rounded-2xl border border-slate-100/60 p-10 text-center shadow-card">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-100 to-mint-100 flex items-center justify-center mx-auto mb-4 shadow-soft">
          <i className="ri-arrow-left-right-line text-brand-400 text-2xl" />
        </div>
        <p className="text-slate-500 text-sm font-medium">Use a aba "+ Nova Transação" ou a página Dashboard para gerenciar transações.</p>
        <p className="text-slate-400 text-xs mt-2">Seu histórico completo está disponível na aba Transações.</p>
      </div>
    </div>
  );
}