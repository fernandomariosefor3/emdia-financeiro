import { useMemo } from "react";
import { useLocation } from "wouter";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, LogOut,
  ArrowUpRight, ArrowDownRight, Plus, ReceiptText, ShieldCheck,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/lib/auth-context";
import { useTransactions } from "@/hooks/use-transactions";
import { DEFAULT_CATEGORIES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function StatCard({
  title, value, sub, icon: Icon, color, positive,
}: {
  title: string; value: string; sub: string;
  icon: React.ElementType; color: string; positive?: boolean;
}) {
  return (
    <Card className="bg-white border border-gray-100 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-2xl font-extrabold text-[#0A0F1E] mt-1">{value}</p>
            <p className={`text-xs mt-1 font-medium ${positive === undefined ? "text-gray-400" : positive ? "text-[#1AC87E]" : "text-red-500"}`}>
              {sub}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
            <Icon size={20} style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user, logOut, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const { transactions, loading } = useTransactions();

  const now = new Date();
  const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
  const lastMonth = { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };

  const thisMonthTx = transactions.filter((t) => isWithinInterval(parseISO(t.date), thisMonth));
  const lastMonthTx = transactions.filter((t) => isWithinInterval(parseISO(t.date), lastMonth));

  const incomeThisMonth = thisMonthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenseThisMonth = thisMonthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balanceThisMonth = incomeThisMonth - expenseThisMonth;
  const expenseLastMonth = lastMonthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const expenseDiff = expenseLastMonth > 0 ? ((expenseThisMonth - expenseLastMonth) / expenseLastMonth) * 100 : 0;

  const chartData = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(now, 5 - i);
    const interval = { start: startOfMonth(month), end: endOfMonth(month) };
    const txs = transactions.filter((t) => isWithinInterval(parseISO(t.date), interval));
    return {
      month: format(month, "MMM", { locale: ptBR }),
      receitas: txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      despesas: txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  }), [transactions]);

  const pieData = useMemo(() => {
    const grouped: Record<string, number> = {};
    thisMonthTx.filter((t) => t.type === "expense").forEach((t) => {
      grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    });
    return Object.entries(grouped).map(([name, value]) => {
      const cat = DEFAULT_CATEGORIES.find((c) => c.name === name);
      return { name, value, color: cat?.color ?? "#6B7280" };
    });
  }, [thisMonthTx]);

  const recent = transactions.slice(0, 5);

  async function handleLogout() {
    await logOut();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1AC87E] flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="font-extrabold text-lg text-[#0A0F1E]">emdia</span>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1AC87E]/10 border border-[#1AC87E]/30 text-[#1AC87E] text-xs font-bold">
              <ShieldCheck size={13} /> Admin
            </span>
          )}
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#0A0F1E] gap-2" onClick={() => navigate("/transacoes")}>
            <ReceiptText size={16} /> Transações
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#0A0F1E] gap-2" onClick={handleLogout}>
            <LogOut size={16} /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-extrabold text-[#0A0F1E]">
            Olá, {user?.displayName?.split(" ")[0] ?? "usuário"} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {format(now, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl bg-gray-200" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Saldo do mês" value={fmt(balanceThisMonth)} sub={balanceThisMonth >= 0 ? "Positivo ✓" : "Atenção: negativo"} icon={DollarSign} color="#1AC87E" positive={balanceThisMonth >= 0} />
            <StatCard title="Receitas" value={fmt(incomeThisMonth)} sub="este mês" icon={TrendingUp} color="#1AC87E" positive={true} />
            <StatCard title="Despesas" value={fmt(expenseThisMonth)} sub={expenseDiff === 0 ? "sem histórico anterior" : `${expenseDiff > 0 ? "+" : ""}${expenseDiff.toFixed(1)}% vs mês anterior`} icon={TrendingDown} color={expenseDiff <= 0 ? "#1AC87E" : "#EF4444"} positive={expenseDiff <= 0} />
          </div>
        )}

        {/* Admin Panel */}
        {isAdmin && !loading && (
          <Card className="bg-[#0A0F1E] border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-[#1AC87E]">
                <ShieldCheck size={18} /> Painel do Administrador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total de transações", value: transactions.length },
                  { label: "Receitas registradas", value: transactions.filter(t => t.type === "income").length },
                  { label: "Despesas registradas", value: transactions.filter(t => t.type === "expense").length },
                  { label: "Categorias usadas", value: new Set(transactions.map(t => t.category)).size },
                ].map((item) => (
                  <div key={item.label} className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-2xl font-extrabold text-[#1AC87E]">{item.value}</p>
                    <p className="text-xs text-white/50 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-white border border-gray-100 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[#0A0F1E]">Receitas vs Despesas (6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-48 bg-gray-100 rounded-xl" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1AC87E" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#1AC87E" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gDesp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,.08)" }} formatter={(v: number) => fmt(v)} />
                    <Area type="monotone" dataKey="receitas" stroke="#1AC87E" fill="url(#gRec)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="despesas" stroke="#EF4444" fill="url(#gDesp)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              <div className="flex gap-5 mt-2">
                {[{ label: "Receitas", color: "#1AC87E" }, { label: "Despesas", color: "#EF4444" }].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: l.color }} /> {l.label}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[#0A0F1E]">Despesas por categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-48 bg-gray-100 rounded-xl" /> : pieData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sem despesas este mês</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={60} dataKey="value" paddingAngle={3}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: 10 }} formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="mt-2 space-y-1.5">
                    {pieData.slice(0, 4).map((item) => (
                      <li key={item.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ background: item.color }} />
                          <span className="text-gray-600">{item.name}</span>
                        </span>
                        <span className="text-gray-400 font-medium">{fmt(item.value)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#0A0F1E]">Transações recentes</CardTitle>
            <Button size="sm" className="bg-[#1AC87E] hover:bg-[#15a868] text-white gap-1.5 shadow-md shadow-[#1AC87E]/20" onClick={() => navigate("/transacoes")}>
              <Plus size={14} /> Nova transação
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 bg-gray-100 rounded-xl" />)}</div>
            ) : recent.length === 0 ? (
              <div className="py-14 text-center text-gray-400">
                <ReceiptText size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhuma transação ainda</p>
                <Button size="sm" className="mt-4 bg-[#1AC87E] hover:bg-[#15a868] text-white" onClick={() => navigate("/transacoes")}>
                  Adicionar primeira transação
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recent.map((tx) => (
                  <li key={tx.id} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.type === "income" ? "bg-[#1AC87E]/10" : "bg-red-50"}`}>
                        {tx.type === "income" ? <ArrowUpRight size={16} className="text-[#1AC87E]" /> : <ArrowDownRight size={16} className="text-red-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0A0F1E]">{tx.description}</p>
                        <p className="text-xs text-gray-400">{tx.category} · {format(parseISO(tx.date), "dd/MM/yyyy")}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${tx.type === "income" ? "text-[#1AC87E]" : "text-red-500"}`}>
                      {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
