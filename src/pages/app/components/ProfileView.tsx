import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import type { Transaction } from "@/hooks/useTransactions";
import type { UserProfile } from "@/hooks/useUserProfile";
import { AVATAR_COLORS } from "@/hooks/useUserProfile";

interface Props {
  transactions: Transaction[];
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  initials: string;
  onResetApp: () => void;
  onExportCSV: () => void;
  userId?: string | null;
  isPro?: boolean;
  isAdmin?: boolean;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const monthLabel = (iso: string) => {
  const [year, month] = iso.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
};

export default function ProfileView({
  transactions,
  profile,
  updateProfile,
  initials,
  onResetApp,
  onExportCSV,
  userId,
  isPro,
  isAdmin,
}: Props) {

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [showReset, setShowReset] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const APP_URL = "https://emdia.readdy.co";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Em Dia — Controle Financeiro",
          text: "Controlo minhas finanças com o Em Dia. Experimente grátis!",
          url: APP_URL,
        });
      } catch {
        // usuario cancelou
      }
    } else {
      await navigator.clipboard.writeText(APP_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEditName = () => {
    setNameInput(profile.name);
    setEditingName(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      updateProfile({ name: trimmed });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    }
    setEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSaveName();
    if (e.key === "Escape") setEditingName(false);
  };

  // Stats
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthTxs = transactions.filter((t) => t.date.startsWith(currentMonth));
  const income = thisMonthTxs.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
  const expenses = thisMonthTxs.filter((t) => t.type !== "receita").reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;

  const months = [
    ...new Set(transactions.map((t) => t.date.slice(0, 7))),
  ].length;

  return (
    <div className="pb-24 min-h-screen bg-gradient-to-br from-forest-50 via-white to-mint-50">

      {/* ─── Cover + Avatar ─── */}
      <div className="relative">
        {/* Banner */}
        <div
          className="h-36 w-full relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${profile.avatarColor}dd 0%, ${profile.avatarColor} 50%, ${profile.avatarColor}bb 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-50" />
          {/* decorative rings */}
          <div className="absolute top-4 right-6 w-20 h-20 rounded-full border-2 border-white/20" />
          <div className="absolute top-8 right-12 w-10 h-10 rounded-full border border-white/15" />
          <div className="absolute -top-2 left-10 w-14 h-14 rounded-full border border-white/10" />
        </div>

        {/* Avatar */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full border-4 border-white flex items-center justify-center text-white text-3xl font-extrabold shadow-elevated"
              style={{ backgroundColor: profile.avatarColor }}
            >
              {initials}
            </div>
            {/* Color picker trigger */}
            <button
              onClick={() => setShowColorPicker((p) => !p)}
              className="absolute -bottom-1 -right-1 w-8 h-8 flex items-center justify-center bg-white border-2 border-white rounded-full shadow-card cursor-pointer hover:shadow-elevated transition-shadow"
              style={{ backgroundColor: profile.avatarColor }}
            >
              <i className="ri-palette-line text-white text-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Name + info ─── */}
      <div className="pt-16 px-5 text-center">
        {/* Color picker inline */}
        {showColorPicker && (
          <div className="mb-3 flex items-center justify-center gap-2 flex-wrap">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  updateProfile({ avatarColor: c.value });
                  setShowColorPicker(false);
                }}
                className="w-9 h-9 rounded-full border-3 transition-all hover:scale-115 cursor-pointer shadow-soft hover:shadow-card"
                style={{
                  backgroundColor: c.value,
                  borderColor: profile.avatarColor === c.value ? "#1e293b" : "transparent",
                  borderWidth: profile.avatarColor === c.value ? "3px" : "2px",
                }}
              />
            ))}
          </div>
        )}

        {/* Name */}
        {editingName ? (
          <div className="flex items-center justify-center gap-2 mb-1">
            <input
              ref={inputRef}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={40}
              className="text-xl font-extrabold text-forest-900 text-center bg-white border-2 border-brand-200 rounded-xl px-3 py-1 outline-none focus:border-brand-400 w-48 text-sm shadow-soft"
            />
            <button
              onClick={handleSaveName}
              className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-brand-500 to-brand-600 rounded-full cursor-pointer shadow-glow-green hover:shadow-lg transition-shadow"
            >
              <i className="ri-check-line text-white text-sm" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="text-xl font-extrabold text-forest-900">{profile.name}</h2>
            <button
              onClick={handleEditName}
              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-brand-600 transition-colors cursor-pointer rounded-lg hover:bg-brand-50"
            >
              <i className="ri-pencil-line text-base" />
            </button>
          </div>
        )}

        {/* Saved toast */}
        {saved && (
          <p className="text-xs text-brand-600 font-semibold mb-1 animate-bounce-soft">
            Nome salvo!
          </p>
        )}

        {/* Plan + join date */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {isPro ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-gold-100 to-gold-200 text-gold-800 text-xs font-extrabold rounded-full shadow-soft">
              <i className="ri-vip-crown-2-fill text-xs text-gold-600" /> PRO
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white text-slate-500 text-xs font-bold rounded-full shadow-soft">
              <i className="ri-star-line text-xs" /> Plano Grátis
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-white text-slate-500 text-xs font-medium rounded-full shadow-soft">
            <i className="ri-calendar-line text-xs" />
            Desde {monthLabel(profile.joinedAt)}
          </span>
        </div>
      </div>

      {/* ─── Pro Status Card ─── */}
      <div className="px-4 mt-6">
        {isPro ? (
          <div className="relative overflow-hidden rounded-2xl p-6 shadow-elevated"
            style={{ background: "linear-gradient(135deg, #166534 0%, #1A6B4A 50%, #15803d 100%)" }}
          >
            {/* decorative circles */}
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />

            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-gold-400 to-gold-500 rounded-lg shadow-glow-gold">
                    <i className="ri-vip-crown-2-fill text-amber-900 text-sm" />
                  </div>
                  <span className="text-gold-300 text-xs font-extrabold uppercase tracking-widest">Plano Pro Ativo</span>
                </div>
                <p className="text-white font-extrabold text-base mt-2">Acesso ilimitado</p>
                <p className="text-indigo-300 text-xs mt-0.5">Transações, histórico e exportação sem limites</p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <i className="ri-shield-check-fill text-4xl text-brand-400/60" />
              </div>
            </div>

            <div className="relative mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: "ri-infinity-line", label: "Transações" },
                { icon: "ri-history-line", label: "Histórico" },
                { icon: "ri-file-download-line", label: "Exportação" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-xl">
                    <i className={`${item.icon} text-brand-200 text-base`} />
                  </div>
                  <span className="text-brand-200 text-[10px] font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-brand-200 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-soft">
            <div>
              <p className="text-sm font-extrabold text-forest-900 mb-0.5">Faça upgrade para o Pro</p>
              <p className="text-xs text-slate-400">Transações ilimitadas a partir de R$ 9,99/mês</p>
            </div>
            <button
              onClick={() => {
                const target = window.top || window;
                target.location.href = `${window.location.origin}/#pricing`;
              }}
              className="shrink-0 px-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-glow-green hover:shadow-lg hover:-translate-y-0.5"
            >
              Ver planos
            </button>
          </div>
        )}
      </div>

      {/* ─── Stats ─── */}
      <div className="px-4 mt-6">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 px-1">
          Este mês
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Transações", value: String(thisMonthTxs.length), icon: "ri-swap-line", color: "text-brand-600", bg: "bg-gradient-to-br from-brand-50 to-mint-50" },
            { label: "Receitas",   value: fmt(income),                 icon: "ri-arrow-up-circle-line", color: "text-emerald-600", bg: "bg-gradient-to-br from-emerald-50 to-emerald-100" },
            { label: "Gastos",     value: fmt(expenses),               icon: "ri-arrow-down-circle-line", color: "text-rose-500", bg: "bg-gradient-to-br from-rose-50 to-red-50" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center shadow-soft hover:shadow-card transition-all hover:-translate-y-0.5`}>
              <div className={`w-9 h-9 flex items-center justify-center mx-auto rounded-xl mb-1.5 bg-white/60 shadow-soft`}>
                <i className={`${s.icon} ${s.color} text-base`} />
              </div>
              <p className={`text-sm font-extrabold ${s.color} truncate`}>{s.value}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Total stats ─── */}
      <div className="px-4 mt-3">
        <div className="bg-white border border-slate-100/60 rounded-2xl p-4 flex items-center justify-between shadow-soft hover:shadow-card transition-all hover:-translate-y-0.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 flex items-center justify-center bg-gradient-to-br from-brand-50 to-mint-50 rounded-xl shadow-soft">
              <i className="ri-bar-chart-grouped-line text-brand-600 text-xl" />
            </div>
            <div>
              <p className="text-sm font-bold text-forest-900">Histórico geral</p>
              <p className="text-xs text-slate-400">
                {transactions.length} transações · {months} {months === 1 ? "mês" : "meses"} registrados
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm font-extrabold ${balance >= 0 ? "text-brand-600" : "text-rose-500"}`}>
              {fmt(balance)}
            </p>
            <p className="text-[10px] text-slate-400">saldo do mês</p>
          </div>
        </div>
      </div>

      {/* ─── Ações ─── */}
      <div className="px-4 mt-5">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 px-1">
          Dados
        </h3>
        <div className="space-y-2">
          {/* Compartilhar */}
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-between p-4 bg-white border border-slate-100/60 rounded-2xl hover:bg-gradient-to-r hover:from-brand-50/50 hover:to-white transition-all cursor-pointer shadow-soft hover:shadow-card hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-brand-50 to-mint-50 rounded-xl shadow-soft">
                <i className="ri-share-line text-brand-600 text-lg" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-forest-900">Compartilhar app</p>
                <p className="text-xs text-slate-400">
                  {copied ? "Link copiado!" : "Indique o Em Dia para um amigo"}
                </p>
              </div>
            </div>
            {copied ? (
              <i className="ri-check-line text-brand-500 text-lg" />
            ) : (
              <i className="ri-arrow-right-s-line text-slate-400 text-lg" />
            )}
          </button>

          {/* Exportar CSV */}
          <button
            onClick={onExportCSV}
            disabled={transactions.length === 0}
            className="w-full flex items-center justify-between p-4 bg-white border border-slate-100/60 rounded-2xl hover:bg-gradient-to-r hover:from-brand-50/50 hover:to-white transition-all cursor-pointer shadow-soft hover:shadow-card hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-soft"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-brand-50 to-mint-50 rounded-xl shadow-soft">
                <i className="ri-file-download-line text-brand-600 text-lg" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-forest-900">Exportar CSV</p>
                <p className="text-xs text-slate-400">Baixar {transactions.length} transações</p>
              </div>
            </div>
            <i className="ri-arrow-right-s-line text-slate-400 text-lg" />
          </button>

          {/* Painel Admin */}
          {isAdmin && (
            <Link
              to="/admin"
              className="w-full flex items-center justify-between p-4 bg-white border border-slate-100/60 rounded-2xl hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-white transition-all shadow-soft hover:shadow-card hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-forest-50 to-mint-100 rounded-xl shadow-soft">
                  <i className="ri-shield-star-line text-forest-600 text-lg" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-forest-900">Painel Administrativo</p>
                  <p className="text-xs text-slate-400">Gerenciar usuários e planos</p>
                </div>
              </div>
              <i className="ri-arrow-right-s-line text-slate-400 text-lg" />
            </Link>
          )}
        </div>
      </div>

      {/* ─── Sair / Redefinir ─── */}
      <div className="px-4 mt-5">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 px-1">
          Conta
        </h3>
        <button
          onClick={() => setShowReset(true)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-br from-rose-50 to-red-50 border border-rose-100 rounded-2xl hover:bg-gradient-to-br hover:from-rose-100 hover:to-red-100 transition-all cursor-pointer shadow-soft hover:shadow-card hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-rose-100 to-red-100 rounded-xl shadow-soft">
              <i className="ri-logout-box-r-line text-rose-500 text-lg" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-rose-600">Sair da conta</p>
              <p className="text-xs text-rose-400">Apaga todos os dados locais</p>
            </div>
          </div>
          <i className="ri-arrow-right-s-line text-rose-300 text-lg" />
        </button>
      </div>

      {/* App version */}
      <p className="text-center text-xs text-slate-300 font-medium mt-8">Em Dia v1.0 · Controle financeiro pessoal</p>

      {/* ─── Reset modal ─── */}
      {showReset && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowReset(false)}
        >
          <div
            className="bg-white w-full rounded-t-3xl p-6 max-w-lg mx-auto shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-rose-100 to-red-100 rounded-2xl mx-auto mb-4 shadow-soft">
              <i className="ri-logout-box-r-line text-rose-500 text-2xl" />
            </div>
            <h3 className="font-extrabold text-forest-900 text-lg text-center mb-2">
              Sair da conta?
            </h3>
            <p className="text-slate-500 text-sm text-center leading-relaxed mb-6">
              Todos os dados salvos neste dispositivo serão apagados — transações, perfil e configurações. Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 py-3.5 bg-gradient-to-br from-slate-100 to-slate-50 text-slate-700 font-bold rounded-xl cursor-pointer whitespace-nowrap hover:shadow-soft transition-shadow"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setShowReset(false); onResetApp(); }}
                className="flex-1 py-3.5 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 text-white font-bold rounded-xl cursor-pointer whitespace-nowrap shadow-glow-coral hover:shadow-lg transition-all"
              >
                Sim, sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
