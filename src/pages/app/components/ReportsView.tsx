import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import type { Transaction } from "@/hooks/useTransactions";

interface Props {
  transactions: Transaction[];
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
}

export default function ReportsView({ transactions }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const months = getLast6Months();
  const monthLabels = months.map((m) => {
    const [y, mon] = m.split("-");
    return new Date(parseInt(y), parseInt(mon) - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
  });

  // Balance evolution line chart data
  const balanceData = months.map((m) => {
    const monthTxs = transactions.filter((t) => t.date.startsWith(m));
    const income = monthTxs.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
    const expenses = monthTxs.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
    return { month: monthLabels[months.indexOf(m)], income, expenses, balance: income - expenses };
  });

  // Category ranking for selected month
  const selectedMonthTxs = transactions.filter((t) => t.date.startsWith(selectedMonth));
  const categoryMap = new Map<string, number>();
  selectedMonthTxs.filter((t) => t.type === "despesa").forEach((t) => {
    categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + t.amount);
  });
  const categoryRanking = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="px-4 py-6 pb-24 lg:pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-forest-900">Relatórios</h2>
          <p className="text-sm text-forest-400 mt-1">Análise detalhada das suas finanças</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-glow-green hover:shadow-lg hover:-translate-y-0.5"
        >
          <i className="ri-printer-line mr-1" /> Imprimir
        </button>
      </div>

      {/* Month selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {months.map((m) => {
          const label = monthLabels[months.indexOf(m)];
          const isActive = m === selectedMonth;
          return (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow-green"
                  : "bg-white text-forest-500 hover:bg-brand-50 hover:text-brand-600 shadow-soft"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Balance evolution chart */}
      <div className="bg-white rounded-2xl border border-forest-100/40 p-5 shadow-card hover:shadow-elevated transition-shadow">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-500 text-white">
            <i className="ri-line-chart-line text-xs" />
          </div>
          <h3 className="font-bold text-forest-900 text-sm">Evolução dos últimos 6 meses</h3>
        </div>
        <p className="text-xs text-forest-400 mb-4 ml-9">Receitas vs Despesas vs Saldo</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={balanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e1f6e6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#95d9a6" }} />
            <YAxis tick={{ fontSize: 11, fill: "#95d9a6" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(val: number, name: string) => [fmt(val), name === "income" ? "Receitas" : name === "expenses" ? "Despesas" : "Saldo"]}
              contentStyle={{ borderRadius: "14px", border: "none", boxShadow: "0 8px 30px -8px rgba(0,0,0,0.15)", fontSize: "12px", padding: "12px 16px" }}
            />
            <Legend formatter={(value) => <span style={{ fontSize: "12px", color: "#246336", fontWeight: 500 }}>{value === "income" ? "Receitas" : value === "expenses" ? "Despesas" : "Saldo"}</span>} />
            <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: "#22c55e", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: "#f43f5e", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="balance" stroke="#facc15" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: "#facc15", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category ranking */}
      <div className="bg-white rounded-2xl border border-forest-100/40 p-5 shadow-card hover:shadow-elevated transition-shadow">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-br from-coral-400 to-rose-400 text-white">
            <i className="ri-bar-chart-2-line text-xs" />
          </div>
          <h3 className="font-bold text-forest-900 text-sm">Top categorias de gastos</h3>
        </div>
        <p className="text-xs text-forest-400 mb-4 ml-9">
          {new Date(selectedMonth + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </p>
        {categoryRanking.length > 0 ? (
          <div className="space-y-3">
            {categoryRanking.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-forest-50 to-mint-50 text-forest-500 text-xs font-bold flex items-center justify-center shrink-0 shadow-soft">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-forest-900 truncate">{c.name}</span>
                    <span className="text-sm font-bold text-forest-900">{fmt(c.value)}</span>
                  </div>
                  <div className="h-2.5 bg-forest-50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-coral-300 to-rose-400 shadow-soft transition-all duration-500"
                      style={{ width: `${Math.min((c.value / (categoryRanking[0]?.value ?? 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-forest-50 to-mint-50 flex items-center justify-center mx-auto mb-2 shadow-soft">
              <i className="ri-bar-chart-grouped-line text-forest-300 text-xl" />
            </div>
            <p className="text-forest-400 text-sm">Sem despesas neste mês</p>
          </div>
        )}
      </div>

      {/* Monthly table */}
      <div className="bg-white rounded-2xl border border-forest-100/40 p-5 shadow-card hover:shadow-elevated transition-shadow">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-br from-gold-400 to-amber-500 text-white">
            <i className="ri-table-line text-xs" />
          </div>
          <h3 className="font-bold text-forest-900 text-sm">Resumo mensal</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-forest-100">
                <th className="text-left py-2 px-3 text-xs font-bold text-forest-400 uppercase">Mês</th>
                <th className="text-right py-2 px-3 text-xs font-bold text-forest-400 uppercase">Receitas</th>
                <th className="text-right py-2 px-3 text-xs font-bold text-forest-400 uppercase">Despesas</th>
                <th className="text-right py-2 px-3 text-xs font-bold text-forest-400 uppercase">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {balanceData.map((row) => (
                <tr key={row.month} className="border-b border-forest-50 hover:bg-gradient-to-r hover:from-brand-50/50 hover:to-white transition-colors">
                  <td className="py-2.5 px-3 font-medium text-forest-900">{row.month}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">{fmt(row.income)}</td>
                  <td className="py-2.5 px-3 text-right text-rose-500 font-semibold">{fmt(row.expenses)}</td>
                  <td className={`py-2.5 px-3 text-right font-extrabold ${row.balance >= 0 ? "text-brand-600" : "text-rose-600"}`}>
                    {fmt(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}