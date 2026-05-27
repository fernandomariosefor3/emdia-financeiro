import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Debt } from "@/hooks/useDebts";

interface Props {
  userName: string;
  avatarColor: string;
  initials: string;
  isPro: boolean;
  debts: Debt[];
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export default function TopBar({ userName, avatarColor, initials, isPro, debts, onNavigate, onLogout }: Props) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const overdueCount = debts.filter((d) => {
    const start = new Date(d.start_date);
    const paidMonths = d.paid_installments;
    const nextDue = new Date(start.getFullYear(), start.getMonth() + paidMonths + 1, 1);
    return nextDue < new Date();
  }).length;

  return (
    <header className="h-14 bg-forest-900/80 backdrop-blur-md border-b border-white/8 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shrink-0">
      {/* Mobile: logo + title */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-glow-green">
          <i className="ri-wallet-3-line text-white text-sm" />
        </div>
        <span className="text-white font-extrabold text-lg tracking-tight">EmDia</span>
        {isPro && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gold-400/15 text-gold-400 text-[10px] font-bold rounded whitespace-nowrap">
            <i className="ri-vip-crown-2-fill text-[10px]" /> PRO
          </span>
        )}
      </div>

      {/* Desktop: greeting */}
      <div className="hidden lg:block">
        <p className="text-white/40 text-xs font-medium">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          onClick={() => onNavigate("debts")}
          className="relative w-9 h-9 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/8 rounded-xl transition-all cursor-pointer"
        >
          <i className="ri-notification-3-line text-lg" />
          {overdueCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-gradient-to-br from-rose-500 to-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-soft animate-pulse-soft">
              {overdueCount}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/8 transition-all cursor-pointer"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-extrabold shrink-0 ring-2 ring-white/10"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
            <span className="hidden md:block text-sm font-semibold text-white/80 truncate max-w-[100px]">
              {userName}
            </span>
            <i className="ri-arrow-down-s-line text-white/30" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-forest-900 border border-white/10 rounded-xl shadow-elevated z-50 overflow-hidden">
                <button
                  onClick={() => { setShowMenu(false); onNavigate("profile"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
                >
                  <i className="ri-user-line text-white/30" /> Perfil
                </button>
                <button
                  onClick={() => { setShowMenu(false); onNavigate("settings"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
                >
                  <i className="ri-settings-3-line text-white/30" /> Configurações
                </button>
                <button
                  onClick={() => { setShowMenu(false); navigate("/"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
                >
                  <i className="ri-home-4-line text-white/30" /> Site
                </button>
                <div className="border-t border-white/8" />
                <button
                  onClick={() => { setShowMenu(false); onLogout(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <i className="ri-logout-box-r-line" /> Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}