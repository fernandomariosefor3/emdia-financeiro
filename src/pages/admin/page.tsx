import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { usePageSEO } from "@/hooks/usePageSEO";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  isPro: boolean;
  joinedAt: string;
}

export default function AdminPage() {
  usePageSEO({
    title: "Painel Administrativo — EmDia",
    description: "Painel administrativo interno do EmDia Financeiro.",
    canonicalPath: "/admin",
    robots: "noindex, nofollow",
  });

  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const adminSnap = await getDoc(doc(db, "admin_users", user.uid));
      if (!adminSnap.exists()) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);
      loadUsers();
    });
    return unsub;
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const rows: UserRow[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          email: data.email ?? d.id,
          name: data.name ?? null,
          isPro: !!data.isPro,
          joinedAt: data.joinedAt ?? "",
        };
      });
      setUsers(rows);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (userId: string, toPro: boolean) => {
    setUpgrading(userId);
    try {
      await setDoc(doc(db, "users", userId), { isPro: toPro }, { merge: true });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isPro: toPro } : u));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar plano");
    } finally {
      setUpgrading(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.name ?? "").toLowerCase().includes(q)
    );
  });

  const stats = {
    total: users.length,
    pro: users.filter((u) => u.isPro).length,
    free: users.filter((u) => !u.isPro).length,
  };

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 flex items-center justify-center bg-rose-100 rounded-2xl mx-auto mb-4">
            <i className="ri-lock-line text-rose-500 text-3xl" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Acesso Negado</h1>
          <p className="text-slate-500 text-sm mb-6">Você não tem permissão para acessar o painel administrativo.</p>
          <button
            onClick={() => navigate("/app")}
            className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer hover:bg-emerald-700 transition-colors whitespace-nowrap"
          >
            Voltar ao app
          </button>
        </div>
      </div>
    );
  }

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-emerald-600 rounded-lg">
              <i className="ri-shield-star-fill text-white text-sm" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 leading-none">Painel Admin</h1>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">emdia</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/app")}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            Voltar ao app
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Total usuários", value: stats.total, color: "bg-emerald-50 text-emerald-600", icon: "ri-team-line" },
            { label: "Plano Pro", value: stats.pro, color: "bg-amber-50 text-amber-600", icon: "ri-vip-crown-2-line" },
            { label: "Plano Grátis", value: stats.free, color: "bg-slate-50 text-slate-500", icon: "ri-star-line" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">{s.label}</span>
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${s.color.split(" ")[0]}`}>
                  <i className={`${s.icon} ${s.color.split(" ")[1]} text-sm`} />
                </div>
              </div>
              <p className={`text-2xl font-extrabold ${s.color.split(" ")[1]}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search + Refresh */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-400">
              <i className="ri-search-line text-base" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por e-mail ou nome..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>
          <button
            onClick={loadUsers}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
          >
            <i className="ri-refresh-line" /> Atualizar
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
            <i className="ri-error-warning-line text-red-500 text-base mt-0.5 shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Usuário</th>
                  <th className="px-4 py-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Plano</th>
                  <th className="px-4 py-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Cadastro</th>
                  <th className="px-4 py-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400 text-sm">
                      {users.length === 0 ? "Nenhum usuário cadastrado ainda." : "Nenhum usuário encontrado para esta busca."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 flex items-center justify-center bg-emerald-100 rounded-full text-emerald-600 text-xs font-extrabold shrink-0">
                            {u.name?.slice(0, 2).toUpperCase() ?? "U"}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{u.name ?? "Sem nome"}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                            <p className="text-[10px] text-slate-300 mt-0.5 font-mono">{u.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {u.isPro ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-extrabold rounded-full whitespace-nowrap">
                            <i className="ri-vip-crown-2-fill text-[10px]" /> PRO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full whitespace-nowrap">
                            <i className="ri-star-line text-[10px]" /> Grátis
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-slate-600">{u.joinedAt || "—"}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {u.isPro ? (
                            <button
                              onClick={() => handleUpgrade(u.id, false)}
                              disabled={upgrading === u.id}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                            >
                              {upgrading === u.id ? (
                                <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin inline-block" />
                              ) : (
                                <><i className="ri-arrow-down-line" /> Rebaixar</>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpgrade(u.id, true)}
                              disabled={upgrading === u.id}
                              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                            >
                              {upgrading === u.id ? (
                                <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin inline-block" />
                              ) : (
                                <><i className="ri-arrow-up-line" /> Promover</>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
