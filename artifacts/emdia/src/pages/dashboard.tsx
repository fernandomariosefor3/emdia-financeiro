import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, LogOut,
  ArrowUpRight, ArrowDownRight, Plus, ReceiptText, ShieldCheck,
  LayoutDashboard, Zap, Menu,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/lib/auth-context";
import { useTransactions } from "@/hooks/use-transactions";
import { DEFAULT_CATEGORIES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", active: true },
    { icon: ReceiptText, label: "Transações", path: "/transacoes", active: false },
    { icon: Zap, label: "Upgrade Pro", path: "/upgrade", active: false },
  ];

  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden lg:flex w-60 flex-col bg-white border-r border-gray-100 fixed top-0 left-0 bottom-0 z-20 shadow-sm">
        {/* Logo */}
        <div className="p-5 border-b border-gray-50">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#1AC87E] flex items-center justify-center shadow-sm shadow-[#1AC87E]/30">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-extrabold text-lg text-[#0A0F1E]">emdia</span>
          </a>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-3 py-2">Menu</p>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                item.active
                  ? "bg-[#1AC87E]/10 text-[#1AC87E]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-[#0A0F1E]"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User + logout */}
        <div className="p-3 border-t border-gray-50 space-y-1">
          {isAdmin && (
            <div className="flex items-center gap-2 px-3 py-2">
              <ShieldCheck size={13} className="text-[#1AC87E]" />
              <span className="text-xs font-bold text-[#1AC87E]">Administrador</span>
            </div>
          )}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[#1AC87E]/12 flex items-center justify-center text-[#1AC87E] text-xs font-extrabold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#0A0F1E] truncate">{user?.displayName?.split(" ")[0] ?? "Usuário"}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut size={15} /> Sair
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">

        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-gray-100 px-4 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1AC87E] flex items-center justify-center">
              <TrendingUp size={14} className="text-white" />
            </div>
            <span className="font-extrabold text-base text-[#0A0F1E]">emdia</span>
          </div>
          <Button variant="ghost" size="icon" className="text-gray-500" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={20} />
          </Button>
        </header>

        {/* Mobile Sheet drawer */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="right" className="w-64 bg-white p-0">
            <SheetHeader className="p-5 border-b border-gray-50">
              <SheetTitle className="flex items-center gap-2 text-base font-extrabold text-[#0A0F1E]">
                <div className="w-8 h-8 rounded-lg bg-[#1AC87E] flex items-center justify-center">
                  <TrendingUp size={16} className="text-white" />
                </div>
                emdia
              </SheetTitle>
            </SheetHeader>
            <nav className="p-3 space-y-0.5">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    item.active ? "bg-[#1AC87E]/10 text-[#1AC87E]" : "text-gray-500 hover:bg-gray-50 hover:text-[#0A0F1E]"
                  }`}
                >
                  <item.icon size={16} />{item.label}
                </button>
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-50">
              <div className="flex items-center gap-3 px-3 py-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-[#1AC87E]/10 flex items-center justify-center text-[#1AC87E] text-xs font-extrabold flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#0A0F1E] truncate">{user?.displayName?.split(" ")[0] ?? "Usuário"}</p>
                  <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <LogOut size={15} /> Sair
              </button>
            </div>
          </SheetContent>
        </Sheet>

      <main className="max-w-5xl mx-auto px-5 py-7 space-y-7 w-full">
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
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <StatCard title="Saldo do mês" value={fmt(balanceThisMonth)} sub={balanceThisMonth >= 0 ? "Positivo ✓" : "Atenção: negativo"} icon={DollarSign} color="#1AC87E" positive={balanceThisMonth >= 0} />
            <StatCard title="Receitas" value={fmt(incomeThisMonth)} sub="este mês" icon={TrendingUp} color="#1AC87E" positive={true} />
            <StatCard title="Despesas" value={fmt(expenseThisMonth)} sub={expenseDiff === 0 ? "sem histórico anterior" : `${expenseDiff > 0 ? "+" : ""}${expenseDiff.toFixed(1)}% vs mês anterior`} icon={TrendingDown} color={expenseDiff <= 0 ? "#1AC87E" : "#EF4444"} positive={expenseDiff <= 0} />
          </motion.div>
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
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
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
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
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
              <motion.ul
                className="divide-y divide-gray-50"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
              >
                {recent.map((tx) => (
                  <motion.li
                    key={tx.id}
                    className="py-3.5 flex items-center justify-between"
                    variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
                    transition={{ duration: 0.2 }}
                  >
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
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </CardContent>
        </Card>
        </motion.div>
      </main>
      </div>
    </div>
  );
}
