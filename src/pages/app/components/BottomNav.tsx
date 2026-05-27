export type View = "dashboard" | "transactions" | "categories" | "accounts" | "goals" | "debts" | "reports" | "add" | "settings" | "profile";

interface NavItem {
  view: View;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { view: "dashboard", icon: "ri-dashboard-3-line", label: "Início" },
  { view: "transactions", icon: "ri-list-check-3", label: "Transações" },
  { view: "categories", icon: "ri-folder-line", label: "Categorias" },
  { view: "accounts", icon: "ri-bank-card-line", label: "Contas" },
  { view: "goals", icon: "ri-flag-line", label: "Metas" },
  { view: "debts", icon: "ri-secure-payment-line", label: "Dívidas" },
  { view: "reports", icon: "ri-bar-chart-2-line", label: "Relatórios" },
  { view: "settings", icon: "ri-settings-3-line", label: "Ajustes" },
  { view: "profile", icon: "ri-user-line", label: "Perfil" },
];

interface Props {
  active: View;
  onNavigate: (view: View) => void;
  avatarColor?: string;
  initials?: string;
  isPro?: boolean;
}

export { NAV_ITEMS };
export default function BottomNav({ active, onNavigate, avatarColor = "#1A6B4A", initials = "U", isPro = false }: Props) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-forest-950/90 backdrop-blur-xl border-t border-white/8 h-16 flex items-center justify-around px-1 z-50 lg:hidden shadow-elevated">
      {NAV_ITEMS.slice(0, 5).map(({ view, icon, label }) => (
        <button
          key={view}
          onClick={() => onNavigate(view)}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 cursor-pointer transition-all duration-300 ${
            active === view
              ? "text-brand-400 scale-105"
              : "text-white/30 hover:text-white/60"
          }`}
        >
          <span className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${active === view ? "bg-brand-500/15" : ""}`}>
            <i className={`${icon} text-xl`} />
          </span>
          <span className="text-[10px] font-bold whitespace-nowrap">{label}</span>
        </button>
      ))}

      {/* Center add button */}
      <button onClick={() => onNavigate("add")} className="-mt-5 cursor-pointer relative z-10">
        <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-700 hover:from-brand-400 hover:to-brand-600 transition-all rounded-2xl flex items-center justify-center shadow-glow-green hover:shadow-elevated hover:scale-105 active:scale-95">
          <i className="ri-add-line text-white text-2xl" />
        </div>
      </button>

      {NAV_ITEMS.slice(5).map(({ view, icon, label }) => (
        <button
          key={view}
          onClick={() => onNavigate(view)}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 cursor-pointer transition-all duration-300 ${
            active === view
              ? "text-brand-400 scale-105"
              : "text-white/30 hover:text-white/60"
          }`}
        >
          <span className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${active === view ? "bg-brand-500/15" : ""}`}>
            <i className={`${icon} text-xl`} />
          </span>
          <span className="text-[10px] font-bold whitespace-nowrap">{label}</span>
        </button>
      ))}
    </nav>
  );
}