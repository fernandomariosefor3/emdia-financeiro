import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Transaction } from "@/hooks/useTransactions";

interface Props {
  transactions: Transaction[];
  getMonthlyStats: (month?: string) => { income: number; expenses: number; debts: number; balance: number };
  getCategoryData: (month?: string) => { name: string; value: number }[];
  onNavigateAdd: () => void;
  isPro: boolean;
  monthlyCount: number;
  freeLimit: number;
  userName?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Alimentação: "#f97054",
  Transporte: "#3a9f54",
  Moradia: "#e11d48",
  Saúde: "#16a34a",
  Educação: "#facc15",
  Lazer: "#a855f7",
  Outros: "#94a3b8",
};
const FALLBACK_COLORS = ["#f97054", "#3a9f54", "#e11d48", "#16a34a", "#facc15", "#a855f7", "#94a3b8"];

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const OVERVIEW_COLORS = ["#16a34a", "#e11d48", "#facc15"];

export default function DashboardView({ transactions, getMonthlyStats, getCategoryData, onNavigateAdd, isPro, monthlyCount, freeLimit, userName = "" }: Props) {
  const stats = getMonthlyStats();
  const categoryData = getCategoryData();
  const recent = transactions.slice(0, 5);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const usagePercent = Math.min((monthlyCount / freeLimit) * 100, 100);
  const showBanner = !isPro && monthlyCount >= 10;
  const isFull = monthlyCount >= freeLimit;
  const isDanger = monthlyCount >= 13;

  const bannerConfig = isFull
    ? {
        gradient: "from-rose-50 to-red-50",
        bar: "bg-gradient-to-r from-rose-500 to-red-500",
        text: "text-rose-700",
        subtext: "text-rose-500",
        icon: "ri-error-warning-fill text-rose-500",
        label: "Limite atingido! Faça upgrade para continuar.",
        btn: "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 text-white shadow-glow-coral",
      }
    : isDanger
    ? {
        gradient: "from-gold-50 to-amber-50",
        bar: "bg-gradient-to-r from-gold-400 to-amber-500",
        text: "text-gold-800",
        subtext: "text-gold-600",
        icon: "ri-alarm-warning-fill text-gold-500",
        label: `Quase lá! Só mais ${freeLimit - monthlyCount} transação${freeLimit - monthlyCount > 1 ? "ões" : ""} disponível${freeLimit - monthlyCount > 1 ? "s" : ""}.`,
        btn: "bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-300 hover:to-amber-400 text-white shadow-glow-gold",
      }
    : {
        gradient: "from-brand-50 to-mint-50",
        bar: "bg-gradient-to-r from-brand-400 to-brand-500",
        text: "text-brand-700",
        subtext: "text-brand-400",
        icon: "ri-information-fill text-brand-400",
        label: `Você usou ${monthlyCount} de ${freeLimit} transações este mês.`,
        btn: "bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white shadow-glow-green",
      };

  const overviewData = [
    { name: "Receitas", value: stats.income },
    { name: "Despesas", value: stats.expenses },
    { name: "Dívidas", value: stats.debts },
  ].filter((d) => d.value > 0);

  const hasData = overviewData.length > 0;
  const hasCategoryData = categoryData.length > 0;

  const now = new Date();
  const monthLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  // Greeting based on time
  const hour = now.getHours();
  let greeting = "Olá";
  if (hour >= 5 && hour < 12) greeting = "Bom dia";
  else if (hour >= 12 && hour < 18) greeting = "Boa tarde";
  else greeting = "Boa noite";

  // Today's transactions
  const todayStr = now.toISOString().slice(0, 10);
  const todayTransactions = transactions.filter((t) => t.date === todayStr);
  const todayIncome = todayTransactions.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
  const todayExpense = todayTransactions.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);

  const summaryCards = [
    {
      label: "Receitas",
      value: stats.income,
      color: "text-emerald-400",
      bg: "",
      icon: "ri-arrow-up-circle-line",
      iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-500",
      accent: "text-emerald-400",
    },
    {
      label: "Despesas",
      value: stats.expenses,
      color: "text-rose-400",
      bg: "",
      icon: "ri-arrow-down-circle-line",
      iconBg: "bg-gradient-to-br from-rose-400 to-rose-500",
      accent: "text-rose-400",
    },
    {
      label: "Dívidas",
      value: stats.debts,
      color: "text-gold-400",
      bg: "",
      icon: "ri-error-warning-line",
      iconBg: "bg-gradient-to-br from-gold-400 to-amber-500",
      accent: "text-gold-400",
    },
    {
      label: "Saldo",
      value: stats.balance,
      color: stats.balance >= 0 ? "text-brand-300" : "text-rose-400",
      bg: "",
      icon: "ri-wallet-3-line",
      iconBg: stats.balance >= 0 ? "bg-gradient-to-br from-brand-400 to-brand-500" : "bg-gradient-to-br from-rose-400 to-rose-500",
      accent: stats.balance >= 0 ? "text-brand-300" : "text-rose-400",
    },
  ];

  return (
    <div className="px-4 py-5 pb-24 space-y-5">

      {/* Usage banner */}
      {showBanner && (
        <div className={`rounded-2xl border border-white/10 bg-gradient-to-r ${bannerConfig.gradient} p-4 shadow-soft animate-slide-up`}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 flex items-center justify-center shrink-0">
                <i className={`${bannerConfig.icon} text-base`} />
              </span>
              <p className={`text-xs font-semibold leading-snug ${bannerConfig.text}`}>
                {bannerConfig.label}
              </p>
            </div>
            <button
              onClick={onNavigateAdd}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${bannerConfig.btn}`}
            >
              Fazer upgrade
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${bannerConfig.bar}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <span className={`text-[11px] font-bold shrink-0 ${bannerConfig.text}`}>
              {monthlyCount}/{freeLimit}
            </span>
          </div>
        </div>
      )}

      {/* Welcome header — personalized */}
      <div className="bg-gradient-to-r from-brand-500/15 to-forest-600/15 backdrop-blur-md border border-white/10 rounded-2xl p-5 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-brand-500/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-gold-400/10 blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{hour >= 5 && hour < 12 ? "☀️" : hour >= 12 && hour < 18 ? "🌤️" : "🌙"}</span>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">
              {greeting}
            </p>
          </div>
          <h2 className="font-extrabold text-white text-xl md:text-2xl tracking-tight mb-3">
            {userName ? `${userName}!` : "Seja bem-vindo!"}
          </h2>

          {/* Daily summary */}
          {todayTransactions.length > 0 ? (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-emerald-500/15 px-3 py-1.5 rounded-full">
                <i className="ri-arrow-up-line text-emerald-400 text-xs" />
                <span className="text-emerald-400 text-xs font-bold">{fmt(todayIncome)}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-rose-500/15 px-3 py-1.5 rounded-full">
                <i className="ri-arrow-down-line text-rose-400 text-xs" />
                <span className="text-rose-400 text-xs font-bold">{fmt(todayExpense)}</span>
              </div>
              <span className="text-white/30 text-xs">hoje</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-white/40 text-xs">Nenhuma transação hoje ainda.</p>
              <button
                onClick={onNavigateAdd}
                className="text-brand-400 text-xs font-bold hover:text-brand-300 transition-colors cursor-pointer flex items-center gap-1"
              >
                <i className="ri-add-line" />
                Adicionar
              </button>
            </div>
          )}

          {/* Month badge */}
          <div className="absolute top-0 right-0">
            <span className="text-xs text-white/30 font-medium bg-white/5 px-3 py-1 rounded-full">
              {monthLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Summary cards with gradients */}
      <div className="grid grid-cols-2 gap-3">
        {summaryCards.map((c) => (
          <div key={c.label} className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/12 transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${c.iconBg} text-white shadow-soft`}>
                <i className={`${c.icon} text-sm`} />
              </div>
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider">{c.label}</p>
            </div>
            <p className={`text-lg font-extrabold ${c.color} truncate`}>{fmt(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Overview Pie Chart - elevated card */}
      <div className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all duration-300">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-500 text-white">
            <i className="ri-pie-chart-2-line text-xs" />
          </div>
          <h3 className="font-bold text-white/90 text-sm">Situação Financeira do Mês</h3>
        </div>
        <p className="text-xs text-white/40 mb-4 ml-9">Visão geral das suas finanças</p>

        {hasData ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={overviewData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {overviewData.map((entry, index) => (
                  <Cell key={entry.name} fill={OVERVIEW_COLORS[index % OVERVIEW_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => [fmt(val), ""]}
                contentStyle={{ borderRadius: "14px", border: "none", backgroundColor: "#1c4127", boxShadow: "0 8px 30px -8px rgba(0,0,0,0.4)", fontSize: "12px", padding: "12px 16px", color: "#fff" }}
              />
              <Legend
                iconType="circle"
                iconSize={10}
                formatter={(value) => <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-white/8 rounded-2xl mb-3">
              <i className="ri-pie-chart-2-line text-brand-400 text-2xl" />
            </div>
            <p className="text-white/60 text-sm font-medium">Nenhum dado ainda</p>
            <p className="text-white/30 text-xs mt-1">Adicione transações para ver seu gráfico</p>
            <button
              onClick={onNavigateAdd}
              className="mt-4 px-5 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-bold rounded-full cursor-pointer whitespace-nowrap shadow-glow-green hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              Adicionar agora
            </button>
          </div>
        )}
      </div>

      {/* Category Pie Chart */}
      <div className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all duration-300">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-br from-coral-400 to-rose-400 text-white">
            <i className="ri-pie-chart-line text-xs" />
          </div>
          <h3 className="font-bold text-white/90 text-sm">Gastos por Categoria</h3>
        </div>
        <p className="text-xs text-white/40 mb-4 ml-9">Distribuição das suas despesas</p>

        {hasCategoryData ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                stroke="none"
              >
                {categoryData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={CATEGORY_COLORS[entry.name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => [fmt(val), ""]}
                contentStyle={{ borderRadius: "14px", border: "none", backgroundColor: "#1c4127", boxShadow: "0 8px 30px -8px rgba(0,0,0,0.4)", fontSize: "12px", padding: "12px 16px", color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-32 flex items-center justify-center">
            <p className="text-white/40 text-sm">Adicione despesas para ver a distribuição</p>
          </div>
        )}
      </div>

      {/* Recent transactions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-forest-500 text-white">
            <i className="ri-time-line text-xs" />
          </div>
          <h3 className="font-bold text-white/90 text-sm">Transações Recentes</h3>
        </div>
        {recent.length === 0 ? (
          <div className="bg-white/8 border border-white/10 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/8 flex items-center justify-center mx-auto mb-3">
              <i className="ri-inbox-line text-brand-400 text-2xl" />
            </div>
            <p className="text-white/60 text-sm font-medium">Nenhuma transação ainda</p>
            <p className="text-white/30 text-xs mt-1">Adicione transações para começar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((tx, i) => (
              <div
                key={tx.id}
                className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-xl p-3 flex items-center justify-between hover:bg-white/12 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${
                    tx.type === "receita"
                      ? "bg-emerald-500/15"
                      : tx.type === "despesa"
                      ? "bg-rose-500/15"
                      : "bg-gold-500/15"
                  }`}>
                    <i className={`text-lg ${
                      tx.type === "receita" ? "ri-arrow-up-line text-emerald-400" :
                      tx.type === "despesa" ? "ri-arrow-down-line text-rose-400" :
                      "ri-bank-line text-gold-400"
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/90 truncate max-w-[140px]">{tx.description}</p>
                    <p className="text-[11px] text-white/40">{tx.category}</p>
                  </div>
                </div>
                <p className={`text-sm font-extrabold ${
                  tx.type === "receita" ? "text-emerald-400" :
                  tx.type === "despesa" ? "text-rose-400" : "text-gold-400"
                }`}>
                  {tx.type === "receita" ? "+" : "-"}{fmt(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}