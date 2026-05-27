import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePageSEO } from "@/hooks/usePageSEO";
import SeoJsonLd from "@/pages/login/components/SeoJsonLd";

export default function LoginPage() {
  usePageSEO({
    title: "Entrar — EmDia",
    description: "Acesse seu painel financeiro pessoal.",
    canonicalPath: "/login",
    robots: "noindex, nofollow",
  });

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/app");
    } catch {
      setError("E-mail ou senha incorretos.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const shakeClass = shake ? "animate-shake" : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-mint-50 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <SeoJsonLd />

      {/* Floating decorative orbs */}
      <div className="absolute -top-32 -left-32 w-72 h-72 bg-brand-200/30 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-coral-200/20 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: "2s" }} />

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.45s ease-in-out;
        }
      `}</style>

      {/* Card container */}
      <div className={`w-full max-w-sm bg-white rounded-3xl shadow-elevated border border-forest-100/40 p-8 md:p-10 ${shakeClass} animate-scale-in relative z-10`}>

        {/* Logo / wordmark */}
        <div className="mb-8 text-center animate-fade-in" style={{ animationDelay: "0.05s" }}>
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-forest-600 shadow-glow-green">
              <i className="ri-wallet-3-fill text-white text-lg" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-forest-900">EmDia</h1>
          </div>
          <p className="text-xs text-forest-400 font-semibold tracking-[0.2em] uppercase">Controle Financeiro</p>
        </div>

        <h2 className="text-2xl font-bold text-forest-900 mb-1 animate-slide-up" style={{ animationDelay: "0.15s" }}>Entrar</h2>
        <p className="text-forest-400 text-sm mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>Acesse seu painel financeiro</p>

        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          {/* Email */}
          <div className="relative group">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              required
              id="login-email"
              className="peer w-full pt-5 pb-2.5 px-0 border-b-2 border-forest-100 text-forest-900 text-base bg-transparent focus:outline-none focus:border-brand-500 transition-all duration-300 placeholder-transparent"
              placeholder="seu@email.com"
            />
            <label
              htmlFor="login-email"
              className="absolute left-0 top-5 text-forest-300 text-base transition-all duration-300 pointer-events-none peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-xs peer-focus:text-brand-500 peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wider peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-brand-500 peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wider"
            >
              E-mail
            </label>
            <span className="absolute bottom-0 left-1/2 h-[2px] w-0 bg-gradient-to-r from-brand-400 to-forest-500 transition-all duration-500 ease-out -translate-x-1/2 peer-focus:w-full rounded-full" />
          </div>

          {/* Password */}
          <div className="relative group">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              required
              id="login-password"
              className="peer w-full pt-5 pb-2.5 px-0 border-b-2 border-forest-100 text-forest-900 text-base bg-transparent focus:outline-none focus:border-brand-500 transition-all duration-300 placeholder-transparent"
              placeholder="••••••••"
            />
            <label
              htmlFor="login-password"
              className="absolute left-0 top-5 text-forest-300 text-base transition-all duration-300 pointer-events-none peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-xs peer-focus:text-brand-500 peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wider peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-brand-500 peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wider"
            >
              Senha
            </label>
            <span className="absolute bottom-0 left-1/2 h-[2px] w-0 bg-gradient-to-r from-brand-400 to-forest-500 transition-all duration-500 ease-out -translate-x-1/2 peer-focus:w-full rounded-full" />
          </div>

          {/* Error */}
          <div className="min-h-[24px]">
            {error && (
              <div className="flex items-start gap-2 bg-coral-50 border border-coral-100 rounded-xl px-3 py-2 animate-slide-up">
                <i className="ri-error-warning-line text-coral-500 text-sm mt-0.5 shrink-0" />
                <p className="text-coral-600 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-3.5 bg-gradient-to-r from-brand-600 to-forest-600 hover:from-brand-500 hover:to-forest-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide rounded-xl shadow-glow-green hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 cursor-pointer whitespace-nowrap overflow-hidden group"
          >
            <span className="relative z-10 inline-flex items-center gap-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <i className="ri-login-box-line" /> Entrar
                </>
              )}
            </span>
            <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
          </button>
        </form>

        {/* Links */}
        <div className="mt-8 flex items-center justify-between text-sm animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <a href="/auth" className="text-forest-400 hover:text-brand-600 transition-colors duration-300 cursor-pointer relative after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 hover:after:w-full after:bg-brand-500 after:transition-all after:duration-300 font-medium">
            Criar conta
          </a>
          <a href="/auth" className="text-forest-400 hover:text-brand-600 transition-colors duration-300 cursor-pointer relative after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 hover:after:w-full after:bg-brand-500 after:transition-all after:duration-300 font-medium">
            Esqueceu a senha?
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 text-center animate-fade-in relative z-10" style={{ animationDelay: "0.5s" }}>
        <p className="text-xs text-forest-300">EmDia Financeiro</p>
      </div>
    </div>
  );
}
