interface Props {
  active: string;
  onNavigate: (view: string) => void;
  avatarColor?: string;
  initials?: string;
  userName?: string;
  isPro?: boolean;
  onLogout?: () => void;
}

const NAV_ITEMS = [
  { view: "dashboard", icon: "ri-dashboard-3-line", label: "Dashboard" },
  { view: "transactions", icon: "ri-list-check-3", label: "Transações" },
  { view: "categories", icon: "ri-folder-line", label: "Categorias" },
  { view: "accounts", icon: "ri-bank-card-line", label: "Contas" },
  { view: "goals", icon: "ri-flag-line", label: "Metas" },
  { view: "debts", icon: "ri-secure-payment-line", label: "Dívidas" },
  { view: "reports", icon: "ri-bar-chart-2-line", label: "Relatórios" },
];

export default function Sidebar({ active, onNavigate, avatarColor = "#1A6B4A", initials = "U", userName = "Usuário", isPro = false, onLogout }: Props) {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-forest-800 via-forest-700 to-forest-900 h-screen sticky top-0 left-0 z-40 shadow-elevated">
      {/* Logo */}
      <div className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow-green">
            <i className="ri-wallet-3-line text-white text-xl" />
          </div>
          <div>
            <h1 className="text-white font-extrabold text-lg tracking-tight">EmDia</h1>
            <p className="text-brand-300/60 text-[11px] font-medium">Financeiro</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ view, icon, label }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
              active === view
                ? "bg-gradient-to-r from-brand-600/30 to-brand-500/10 text-brand-300 shadow-soft"
                : "text-white/50 hover:text-white hover:bg-white/8"
            }`}
          >
            <span className="w-5 h-5 flex items-center justify-center">
              <i className={`${icon} text-lg`} />
            </span>
            {label}
          </button>
        ))}

        {/* New Transaction quick button */}
        <button
          onClick={() => onNavigate("add")}
          className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 rounded-xl text-sm font-bold text-white transition-all cursor-pointer whitespace-nowrap shadow-glow-green hover:shadow-lg"
        >
          <i className="ri-add-line text-lg" />
          Nova Transação
        </button>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/8">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-extrabold shrink-0 shadow-soft"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{userName}</p>
            <div className="flex items-center gap-1">
              {isPro ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gold-400/20 text-gold-400 text-[10px] font-bold rounded whitespace-nowrap">
                  <i className="ri-vip-crown-2-fill text-[10px]" /> PRO
                </span>
              ) : (
                <span className="text-white/40 text-[10px] font-medium">Grátis</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => onNavigate("profile")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all cursor-pointer whitespace-nowrap ${
              active === "profile" ? "bg-gradient-to-r from-brand-600/30 to-brand-500/10 text-brand-300 font-medium" : "text-white/40 hover:text-white/70 hover:bg-white/5"
            }`}
          >
            <i className="ri-user-settings-line" /> Perfil
          </button>
          <button
            onClick={() => onNavigate("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all cursor-pointer whitespace-nowrap ${
              active === "settings" ? "bg-gradient-to-r from-brand-600/30 to-brand-500/10 text-brand-300 font-medium" : "text-white/40 hover:text-white/70 hover:bg-white/5"
            }`}
          >
            <i className="ri-settings-3-line" /> Configurações
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer whitespace-nowrap"
          >
            <i className="ri-logout-box-r-line" /> Sair
          </button>
        </div>
      </div>
    </aside>
  );
}