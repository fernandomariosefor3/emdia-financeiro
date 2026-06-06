import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useTransactions } from "@/hooks/useTransactions";
import { useProStatus } from "@/hooks/useProStatus";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useDebtAlerts } from "@/hooks/useDebtAlerts";
import { usePageSEO } from "@/hooks/usePageSEO";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { useGoals } from "@/hooks/useGoals";
import { useDebts } from "@/hooks/useDebts";

import Sidebar from "@/pages/app/components/Sidebar";
import TopBar from "@/pages/app/components/TopBar";
import BottomNav from "@/pages/app/components/BottomNav";
import DashboardView from "@/pages/app/components/DashboardView";
import CategoriesView from "@/pages/app/components/CategoriesView";
import AccountsView from "@/pages/app/components/AccountsView";
import GoalsView from "@/pages/app/components/GoalsView";
import DebtsView from "@/pages/app/components/DebtsView";
import ReportsView from "@/pages/app/components/ReportsView";
import AddTransactionView from "@/pages/app/components/AddTransactionView";
import HistoryView from "@/pages/app/components/HistoryView";
import SettingsView from "@/pages/app/components/SettingsView";
import ProfileView from "@/pages/app/components/ProfileView";
import Onboarding from "@/pages/app/components/Onboarding";
import UpgradeProModal from "@/pages/app/components/UpgradeProModal";

import type { View } from "@/pages/app/components/BottomNav";

export default function AppPage() {
  usePageSEO({
    title: "Dashboard — EmDia Financeiro",
    description: "Painel de controle financeiro pessoal do EmDia.",
    canonicalPath: "/app",
    robots: "noindex, nofollow",
  });

  const navigate = useNavigate();
  const [view, setView] = useState<View>("dashboard");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setAuthLoading(false);
        const adminSnap = await getDoc(doc(db, "admin_users", user.uid));
        setIsAdmin(adminSnap.exists());
      } else {
        navigate("/auth");
      }
    });
    return unsubscribe;
  }, [navigate]);

  const { transactions, loading: txLoading, addTransaction, removeTransaction, clearAll, getMonthlyStats, getCategoryData } =
    useTransactions(userId);
  const { isPro, onboardingDone, settingsLoaded, finishOnboarding, FREE_MONTHLY_LIMIT, activatePro } = useProStatus(userId);
  const { profile, updateProfile, initials } = useUserProfile(userId);
  const debtAlerts = useDebtAlerts(transactions);
  const { categories, addCategory, updateCategory, removeCategory } = useCategories(userId);
  const { accounts, addAccount, updateAccount, removeAccount } = useAccounts(userId);
  const { goals, addGoal, updateGoal, removeGoal } = useGoals(userId);
  const { debts, addDebt, updateDebt, removeDebt } = useDebts(userId);

  // Handle payment success redirect from Stripe
  useEffect(() => {
    const payment = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");
    if (payment === "success" && sessionId && userId) {
      activatePro().then(() => {
        setShowPaymentSuccess(true);
        setSearchParams({});
        setTimeout(() => setShowPaymentSuccess(false), 5000);
      });
    }
  }, [searchParams, userId, activatePro, setSearchParams]);

  const isLoading = authLoading || txLoading || !settingsLoaded;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyCount = transactions.filter((t) => t.date.startsWith(currentMonth)).length;

  const handleAdd = async (tx: Parameters<typeof addTransaction>[0]) => {
    if (!isPro && monthlyCount >= FREE_MONTHLY_LIMIT) { setShowUpgrade(true); return { success: false } as const; }
    const result = await addTransaction(tx);
    return result;
  };

  const handleNavigateAdd = () => {
    if (!isPro && monthlyCount >= FREE_MONTHLY_LIMIT) { setShowUpgrade(true); return; }
    setView("add");
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const header = "ID,Tipo,Descrição,Categoria,Valor,Data,Vencimento";
    const rows = transactions.map((t) =>
      [t.id, t.type, `"${t.description}"`, t.category, t.amount.toFixed(2), t.date, t.dueDate ?? ""].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emdia_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetApp = async () => {
    await clearAll();
    window.location.reload();
  };

  const handleLogout = useCallback(async () => {
    await signOut(auth);
    navigate("/auth");
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-950 via-forest-900 to-forest-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-glow-green">
            <i className="ri-wallet-3-line text-white text-2xl animate-bounce-soft" />
          </div>
          <p className="text-brand-300/60 text-sm font-medium">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-950 via-forest-900 to-forest-950 flex flex-col lg:flex-row">
      {!onboardingDone && <Onboarding onFinish={finishOnboarding} />}
      {showUpgrade && (
        <UpgradeProModal onClose={() => setShowUpgrade(false)} transactionCount={monthlyCount} />
      )}

      {/* Payment success toast */}
      {showPaymentSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-3 rounded-2xl shadow-elevated flex items-center gap-3 animate-slide-up">
          <i className="ri-vip-crown-2-line text-xl" />
          <div>
            <p className="font-bold text-sm">Bem-vindo ao Pro!</p>
            <p className="text-xs text-white/80">Seu plano foi ativado com sucesso.</p>
          </div>
          <button onClick={() => setShowPaymentSuccess(false)} className="ml-2 cursor-pointer hover:text-white/80">
            <i className="ri-close-line" />
          </button>
        </div>
      )}

      {/* Desktop Sidebar */}
      <Sidebar
        active={view}
        onNavigate={setView}
        avatarColor={profile.avatarColor}
        initials={initials}
        userName={profile.name}
        isPro={isPro}
        onLogout={handleLogout}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          userName={profile.name}
          avatarColor={profile.avatarColor}
          initials={initials}
          isPro={isPro}
          debts={debts}
          onNavigate={setView}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto relative">
          {/* Subtle grid pattern like hero */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* Ambient glow orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-600/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-forest-600/5 blur-3xl pointer-events-none" />

          <div className="relative max-w-5xl mx-auto w-full">
            {view === "dashboard" && (
              <DashboardView
                userName={profile.name}
                transactions={transactions}
                getMonthlyStats={getMonthlyStats}
                getCategoryData={getCategoryData}
                onNavigateAdd={handleNavigateAdd}
                isPro={isPro}
                monthlyCount={monthlyCount}
                freeLimit={FREE_MONTHLY_LIMIT}
              />
            )}
            {view === "transactions" && (
              <HistoryView transactions={transactions} onRemove={removeTransaction} debtAlerts={debtAlerts} />
            )}
            {view === "categories" && (
              <CategoriesView
                categories={categories}
                onAdd={addCategory}
                onUpdate={updateCategory}
                onRemove={removeCategory}
              />
            )}
            {view === "accounts" && (
              <AccountsView
                accounts={accounts}
                onAdd={addAccount}
                onUpdate={updateAccount}
                onRemove={removeAccount}
              />
            )}
            {view === "goals" && (
              <GoalsView
                goals={goals}
                onAdd={addGoal}
                onUpdate={updateGoal}
                onRemove={removeGoal}
              />
            )}
            {view === "debts" && (
              <DebtsView
                debts={debts}
                onAdd={addDebt}
                onUpdate={updateDebt}
                onRemove={removeDebt}
              />
            )}
            {view === "reports" && <ReportsView transactions={transactions} />}
            {view === "add" && (
              <AddTransactionView onAdd={handleAdd} onDone={() => setView("dashboard")} />
            )}
            {view === "settings" && (
              <SettingsView transactions={transactions} onClearAll={clearAll} />
            )}
            {view === "profile" && (
              <ProfileView
                transactions={transactions}
                profile={profile}
                updateProfile={updateProfile}
                initials={initials}
                onResetApp={handleResetApp}
                onExportCSV={handleExportCSV}
                userId={userId}
                isPro={isPro}
                isAdmin={isAdmin}
              />
            )}
          </div>
        </main>

        {/* Mobile BottomNav */}
        <BottomNav
          active={view}
          onNavigate={setView}
          avatarColor={profile.avatarColor}
          initials={initials}
          isPro={isPro}
        />
      </div>
    </div>
  );
}