import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, LogOut,
  ArrowUpRight, Plus, ReceiptText, ShieldCheck,
  LayoutDashboard, Zap, Menu, Mic, Send, Sparkles, Loader2, Brain, ArrowRight,
  Calendar
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/lib/auth-context";
import { useTransactions } from "@/hooks/use-transactions";
import { useFinancialPulse } from "@/hooks/useFinancialPulse";
import { DEFAULT_CATEGORIES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PrepareMonthEntryCard } from "@/features/prepare-month";
import { MonthReviewCard } from "@/features/prepare-month/MonthReviewCard";
import { FinancialPulseWidget } from "@/features/dashboard-smart/FinancialPulseWidget";
import { RiskAlertsSection } from "@/features/dashboard-smart/RiskAlertsSection";
import { QuickSimulatorSheet } from "@/features/dashboard-smart/QuickSimulatorSheet";

// ==========================================
// COMPONENTE: INPUT DE CHAT COM IA
// ==========================================

function AIChatInput({ onSendMessage }: { onSendMessage: (text: string) => Promise<void> }) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSend() {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      await onSendMessage(text);
      setText("");
    } catch {
      console.error("Erro ao enviar mensagem");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-2 flex items-end gap-2 relative">
      <div className="absolute -top-3 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
        <Sparkles size={10} /> Assistente de Bolso
      </div>
      <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0">
        <Mic size={20} />
      </button>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Ex: Comprei 15 reais de pão na padaria agora"
        className="flex-1 max-h-32 min-h-[44px] resize-none outline-none py-3 text-sm text-[#0A0F1E] bg-transparent"
        rows={1}
      />
      <Button
        onClick={handleSend}
        disabled={!text.trim() || isLoading}
        className={`h-11 w-11 rounded-xl p-0 shrink-0 transition-all ${
          text.trim() && !isLoading
            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-1" />}
      </Button>
    </div>
  );
}

// ==========================================
// COMPONENTE: CARD INTELIGENTE (insight de IA)
// ==========================================

function CardInteligente({ category, amount, percentage }: { category: string; amount: number; percentage: number }) {
  const formattedAmount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);

  return (
    <div className="bg-gradient-to-r from-[#0A0F1E] to-[#141E3A] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Brain size={120} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3 text-[#1AC87E]">
          <Zap size={18} className="fill-[#1AC87E]" />
          <span className="font-bold text-sm tracking-wide uppercase">Copilot Financeiro</span>
        </div>
        <h3 className="text-xl font-extrabold mb-2 text-white">
          Atenção aos gastos com {category} 🎯
        </h3>
        <p className="text-gray-300 text-sm mb-5 max-w-lg leading-relaxed">
          Nossa IA notou que {category} representa <strong className="text-white">{percentage.toFixed(0)}%</strong> das suas despesas totais neste mês, totalizando <strong className="text-white">{formattedAmount}</strong>. Considere reduzir esses gastos nos próximos dias.
        </p>
        <div className="flex items-center gap-3">
          <Button className="bg-[#1AC87E] hover:bg-[#15A86A] text-white rounded-xl font-semibold border-none">
            Ver detalhes
          </Button>
          <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 rounded-xl group">
            Dispensar
            <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// DASHBOARD PRINCIPAL
// ==========================================

export default function Dashboard() {
  const { user, logOut, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const { transactions, loading } = useTransactions();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  const now = new Date();
  const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
  const lastMonth = { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };

  // Dados do pulso financeiro (motor de domínio)
  const pulse = useFinancialPulse(transactions);

  // Transações do mês atual
  const thisMonthTx = transactions.filter((t) => isWithinInterval(parseISO(t.date), thisMonth));
  const lastMonthTx = transactions.filter((t) => isWithinInterval(parseISO(t.date), lastMonth));

  const incomeThisMonth = thisMonthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenseThisMonth = thisMonthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const expenseLastMonth = lastMonthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const expenseDiff = expenseLastMonth > 0 ? ((expenseThisMonth - expenseLastMonth) / expenseLastMonth) * 100 : 0;

  // Insight do Copilot
  const biggestExpenseInsight = useMemo(() => {
    const expenses = thisMonthTx.filter((t) => t.type === "expense");
    if (expenses.length === 0 || expenseThisMonth === 0) return null;

    const categoryTotals = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const biggestCategory = Object.keys(categoryTotals).reduce((a, b) =>
      categoryTotals[a] > categoryTotals[b] ? a : b
    );

    const amount = categoryTotals[biggestCategory];
    const percentage = (amount / expenseThisMonth) * 100;
    if (percentage < 20) return null;

    return { category: biggestCategory, amount, percentage };
  }, [thisMonthTx, expenseThisMonth]);

  // Chat com IA
  const handleSendMessage = async (text: string) => {
    try {
      const urlServidorIA = "https://us-central1-emdiafinanceiro-13483.cloudfunctions.net/processarGastoComIA";
      const resposta = await fetch(urlServidorIA, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: text, userId: user?.uid }),
      });
      const resultado = await resposta.json();
      if (!resposta.ok) throw new Error(resultado.error || "Erro do servidor");
      alert(`Cadastrado pela Inteligência Artificial:\n${resultado.dados.description} - R$ ${resultado.dados.amount}`);
    } catch {
      alert("A Inteligência Artificial ainda está inicializando ou indisponível.");
    }
  };

  // Dados dos gráficos
  const chartData = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(now, 5 - i);
    const interval = { start: startOfMonth(month), end: endOfMonth(month) };
    const tx = transactions.filter((t) => isWithinInterval(parseISO(t.date), interval));
    return {
      name: format(month, "MMM", { locale: ptBR }),
      receitas: tx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      despesas: tx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  }), [transactions, now]);

  const pieData = useMemo(() => {
    const expenses = thisMonthTx.filter((t) => t.type === "expense");
    const grouped = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value,
        color: DEFAULT_CATEGORIES.find((c) => c.name === name)?.color || "#6B7280"
      }))
      .sort((a, b) => b.value - a.value);
  }, [thisMonthTx]);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", active: true },
    { icon: Calendar, label: "Planeje seu mês", path: "/prepare-seu-mes", active: false },
    { icon: ReceiptText, label: "Transações", path: "/transacoes", active: false },
    { icon: Zap, label: "Upgrade Pro", path: "/upgrade", active: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-white border-r border-gray-100 fixed top-0 left-0 bottom-0 z-20 shadow-sm">
        <div className="p-5 border-b border-gray-50">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#1AC87E] flex items-center justify-center shadow-sm shadow-[#1AC87E]/30">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-extrabold text-lg text-[#0A0F1E]">emdia</span>
          </a>
        </div>

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

        <div className="p-3 border-t border-gray-50 space-y-1">
          {isAdmin && (
            <div className="flex items-center gap-2 px-3 py-2">
              <ShieldCheck size={13} className="text-[#1AC87E]" />
              <span className="text-xs font-bold text-[#1AC87E]">Administrador</span>
            </div>
          )}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#0A0F1E] truncate">{user?.displayName || "Usuário"}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-5 z-20">
        <a href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1AC87E] flex items-center justify-center">
            <TrendingUp size={14} className="text-white" />
          </div>
          <span className="font-extrabold text-[#0A0F1E]">emdia</span>
        </a>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 -mr-2 text-gray-500">
            <Menu size={24} />
          </button>
          <SheetContent side="left" className="w-[280px] p-0 border-r-0 flex flex-col">
            <SheetHeader className="p-5 text-left border-b border-gray-50">
              <SheetTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1AC87E] flex items-center justify-center">
                  <TrendingUp size={16} className="text-white" />
                </div>
                <span className="font-extrabold text-lg text-[#0A0F1E]">emdia</span>
              </SheetTitle>
            </SheetHeader>

            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { setMobileMenuOpen(false); navigate(item.path); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                    item.active ? "bg-[#1AC87E]/10 text-[#1AC87E]" : "text-gray-500"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="p-5 border-t border-gray-50 space-y-4 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 shadow-sm">
                  {user?.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#0A0F1E] truncate">{user?.displayName || "Usuário"}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
              <Button onClick={logOut} variant="outline" className="w-full text-red-500 border-red-100 hover:bg-red-50 hover:text-red-600">
                <LogOut size={16} className="mr-2" /> Sair da conta
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main content */}
      <div className="flex-1 lg:ml-60 pt-16 lg:pt-0">
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

          {/* Card inteligente (copilot) */}
          {!loading && biggestExpenseInsight && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <CardInteligente
                category={biggestExpenseInsight.category}
                amount={biggestExpenseInsight.amount}
                percentage={biggestExpenseInsight.percentage}
              />
            </motion.div>
          )}

          {/* Financial Pulse Widget — NOVO! */}
          {!loading && pulse && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <FinancialPulseWidget
                pulse={pulse}
                onSimulate={() => setSimulatorOpen(true)}
              />
            </motion.div>
          )}

          {/* Loading skeleton for pulse */}
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-48 rounded-2xl bg-gray-200" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-16 rounded-xl bg-gray-200" />
                <Skeleton className="h-16 rounded-xl bg-gray-200" />
                <Skeleton className="h-16 rounded-xl bg-gray-200" />
              </div>
            </div>
          )}

          {/* Risk Alerts — NOVO! */}
          {!loading && pulse && pulse.risks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <RiskAlertsSection
                risks={pulse.risks}
                onPrepareMonth={() => navigate("/prepare-seu-mes")}
              />
            </motion.div>
          )}

          {/* AI Chat Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <AIChatInput onSendMessage={handleSendMessage} />
          </motion.div>

          {/* Admin panel */}
          {isAdmin && (
            <div className="bg-[#1AC87E]/10 border border-[#1AC87E]/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1AC87E]/20 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-[#1AC87E]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0A0F1E]">Painel Admin</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Visão geral do sistema</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="text-[#1AC87E] border-[#1AC87E]/30 hover:bg-[#1AC87E]/10">
                Acessar
              </Button>
            </div>
          )}

          {/* Charts row */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
              <Skeleton className="lg:col-span-2 h-[340px] rounded-2xl bg-gray-200" />
              <Skeleton className="h-[340px] rounded-2xl bg-gray-200" />
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-3 gap-7"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              {/* Fluxo de Caixa */}
              <Card className="lg:col-span-2 bg-white border-gray-100 shadow-sm">
                <CardHeader className="pb-2 border-b border-gray-50">
                  <CardTitle className="text-sm font-extrabold text-[#0A0F1E]">Fluxo de Caixa (6 meses)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1AC87E" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#1AC87E" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorDes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF", fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF", fontWeight: 600 }} tickFormatter={(v) => `R$${v / 1000}k`} />
                        <Tooltip
                          contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", fontWeight: 600, fontSize: "13px" }}
                          formatter={(val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)}
                        />
                        <Area type="monotone" dataKey="receitas" name="Receitas" stroke="#1AC87E" strokeWidth={3} fillOpacity={1} fill="url(#colorRec)" />
                        <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorDes)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Despesas por Categoria */}
              <Card className="bg-white border-gray-100 shadow-sm flex flex-col">
                <CardHeader className="pb-2 border-b border-gray-50">
                  <CardTitle className="text-sm font-extrabold text-[#0A0F1E]">Despesas por Categoria</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 flex-1 flex flex-col items-center justify-center">
                  {pieData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-gray-400 space-y-2 h-full py-10">
                      <PieChart className="opacity-20" width={40} height={40} />
                      <p className="text-xs font-medium">Sem despesas este mês</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-[180px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                              {pieData.map((e, i) => (
                                <Cell key={`cell-${i}`} fill={e.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)} contentStyle={{ borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: "bold" }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</span>
                        </div>
                      </div>
                      <div className="w-full mt-4 space-y-2 max-h-[100px] overflow-y-auto pr-1">
                        {pieData.slice(0, 4).map((d) => (
                          <div key={d.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                              <span className="font-semibold text-gray-600 truncate max-w-[90px]">{d.name}</span>
                            </div>
                            <span className="font-bold text-[#0A0F1E]">
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(d.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Month Review — comparativo planejado vs real */}
          <MonthReviewCard promptOnly />

          {/* Prepare Month entry */}
          <PrepareMonthEntryCard />

          {/* Shortcuts */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
            <h3 className="font-extrabold text-[#0A0F1E]">Atalhos Rápidos</h3>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button onClick={() => navigate("/transacoes")} className="flex-1 sm:flex-none bg-[#1AC87E] hover:bg-[#15A86A] text-white rounded-xl shadow-sm shadow-[#1AC87E]/20">
                <Plus size={16} className="mr-2" /> Nova Transação
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Quick Simulator Sheet */}
      {pulse && (
        <QuickSimulatorSheet
          open={simulatorOpen}
          onOpenChange={setSimulatorOpen}
          pulse={pulse}
        />
      )}
    </div>
  );
}
