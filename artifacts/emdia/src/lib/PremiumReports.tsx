import { useState } from "react";
import { ProGate } from "./ProBadge";
import { UpgradeModal } from "./ProBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Componente de Relatório Premium (apenas Pro)
interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense" | "debt";
  category: string;
  date: Date;
}

interface PremiumReportProps {
  transactions: Transaction[];
}

export function PremiumReports({ transactions }: PremiumReportProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"month" | "quarter" | "year">("month");

  // Calcula estatísticas do período
  const calculateStats = () => {
    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const filteredTransactions = transactions.filter((t) => t.date >= startDate);

    const totalIncome = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDebt = filteredTransactions
      .filter((t) => t.type === "debt")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense - totalDebt;

    // Gastos por categoria
    const expensesByCategory = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const topCategories = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      totalIncome,
      totalExpense,
      totalDebt,
      balance,
      expensesByCategory,
      topCategories,
      transactionCount: filteredTransactions.length,
    };
  };

  const stats = calculateStats();

  return (
    <ProGate
      feature="reports"
      fallback={
        <div className="bg-[#1A1F3A] rounded-2xl p-6 border border-[#1AC87E]/20">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#1AC87E]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#1AC87E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Relatórios Premium</h3>
            <p className="text-gray-400 mb-4">
              Acompanhe seu progresso com análises detalhadas
            </p>
            <button
              onClick={() => setShowUpgrade(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#1AC87E] to-[#15B36D] text-[#0A0F1E] rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              Upgrade para Pro
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Seletor de período */}
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">Período:</span>
          <div className="flex bg-[#1A1F3A] rounded-lg p-1">
            {(["month", "quarter", "year"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? "bg-[#1AC87E] text-[#0A0F1E]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {period === "month" ? "Mês" : period === "quarter" ? "Trimestre" : "Ano"}
              </button>
            ))}
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#1A1F3A] rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">Receitas</p>
            <p className="text-2xl font-bold text-green-400">
              R$ {stats.totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-[#1A1F3A] rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">Despesas</p>
            <p className="text-2xl font-bold text-red-400">
              R$ {stats.totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-[#1A1F3A] rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">Dívidas</p>
            <p className="text-2xl font-bold text-yellow-400">
              R$ {stats.totalDebt.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-[#1A1F3A] rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">Saldo</p>
            <p className={`text-2xl font-bold ${stats.balance >= 0 ? "text-[#1AC87E]" : "text-red-400"}`}>
              R$ {stats.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Top categorias */}
        <div className="bg-[#1A1F3A] rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Top Categorias de Gastos</h3>
          {stats.topCategories.length > 0 ? (
            <div className="space-y-4">
              {stats.topCategories.map(([category, amount]) => {
                const percentage = (amount / stats.totalExpense) * 100;
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{category}</span>
                      <span className="text-sm text-gray-400">
                        R$ {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (
                        {percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-[#0A0F1E] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#1AC87E] to-[#15B36D] rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              Nenhuma despesa registrada neste período
            </p>
          )}
        </div>

        {/* Resumo */}
        <div className="bg-[#1A1F3A] rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Resumo do Período</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-white">{stats.transactionCount}</p>
              <p className="text-sm text-gray-400">Transações</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {stats.topCategories.length}
              </p>
              <p className="text-sm text-gray-400">Categorias</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-400">
                R$ {stats.totalIncome > 0 ? (stats.balance / stats.totalIncome * 100).toFixed(1) : 0}%
              </p>
              <p className="text-sm text-gray-400">Taxa de Economia</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#1AC87E]">
                R$ {stats.totalIncome > 0 ? (stats.totalIncome / stats.transactionCount).toFixed(2) : 0}
              </p>
              <p className="text-sm text-gray-400">Média por Transação</p>
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="reports"
        description="Desbloqueie relatórios detalhados para acompanhar seu progresso financeiro."
      />
    </ProGate>
  );
}

// Componente de Exportação CSV (apenas Pro)
interface CSVExportProps {
  transactions: Transaction[];
}

export function CSVExport({ transactions }: CSVExportProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Cabeçalho CSV
      const headers = ["Data", "Descrição", "Tipo", "Categoria", "Valor"];

      // Dados
      const rows = transactions.map((t) => [
        format(t.date, "dd/MM/yyyy", { locale: ptBR }),
        t.description,
        t.type === "income" ? "Receita" : t.type === "expense" ? "Despesa" : "Dívida",
        t.category,
        t.amount.toFixed(2).replace(".", ","),
      ]);

      // Monta CSV
      const csvContent = [headers, ...rows].map((row) => row.join(";")).join("\n");

      // Adiciona BOM para UTF-8
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

      // Download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `emdia_financeiro_${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();

      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ProGate
      feature="csvExport"
      fallback={
        <div className="bg-[#1A1F3A] rounded-xl p-4 border border-[#1AC87E]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1AC87E]/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#1AC87E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Exportar CSV</p>
                <p className="text-gray-400 text-sm">Para declaração de IR</p>
              </div>
            </div>
            <button
              onClick={() => setShowUpgrade(true)}
              className="px-4 py-2 bg-[#1AC87E] text-[#0A0F1E] rounded-lg font-semibold text-sm hover:bg-[#15B36D] transition-colors"
            >
              Upgrade Pro
            </button>
          </div>
        </div>
      }
    >
      <button
        onClick={handleExport}
        disabled={isExporting || transactions.length === 0}
        className="w-full bg-[#1A1F3A] rounded-xl p-4 border border-[#1AC87E]/20 hover:border-[#1AC87E]/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1AC87E]/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-[#1AC87E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-white font-medium">Exportar CSV</p>
              <p className="text-gray-400 text-sm">
                {transactions.length} transações • Para IR ou planilhas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExporting ? (
              <div className="w-5 h-5 border-2 border-[#1AC87E] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 text-[#1AC87E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
          </div>
        </div>
      </button>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="csvExport"
        description="Exporte suas transações para declaração de IR ou análise em planilhas."
      />
    </ProGate>
  );
}