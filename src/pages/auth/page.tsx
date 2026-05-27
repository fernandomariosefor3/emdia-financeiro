import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePageSEO } from "@/hooks/usePageSEO";
import SeoJsonLd from "@/pages/auth/components/SeoJsonLd";

type Mode = "login" | "signup" | "forgot";

export default function AuthPage() {
  usePageSEO({
    title: "Acessar emdia — Login e Cadastro Grátis",
    description:
      "Entre ou crie sua conta grátis no emdia. Controle despesas, receitas e dívidas com gráficos em tempo real. App de controle financeiro pessoal simples e inteligente.",
    keywords: "login emdia, cadastro app financeiro, acessar controle financeiro, conta emdia",
    canonicalPath: "/auth",
    robots: "noindex, follow",
  });

  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const resetForm = () => {
    setError("");
    setSuccessMsg("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleModeChange = (m: Mode) => {
    setMode(m);
    resetForm();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (mode === "signup" && password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6 && mode !== "forgot") {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/app");
      } else if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
        navigate("/app");
      } else if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("E-mail ou senha incorretos.");
      } else if (code === "auth/email-already-in-use") {
        setError("Este e-mail já está cadastrado. Faça login.");
      } else if (code === "auth/invalid-email") {
        setError("E-mail inválido.");
      } else if (code === "auth/too-many-requests") {
        setError("Muitas tentativas. Tente novamente mais tarde.");
      } else {
        setError("Ocorreu um erro. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/app");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // user dismissed — no error shown
      } else {
        setError("Não foi possível fazer login com Google. Tente novamente.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <SeoJsonLd />

      {/* ── Left panel — hero visual ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://readdy.ai/api/search-image?query=modern%20minimalist%20financial%20workspace%20with%20laptop%20showing%20green%20charts%20and%20graphs%2C%20clean%20desk%20with%20coffee%20cup%2C%20soft%20warm%20natural%20light%20coming%20through%20window%2C%20premium%20lifestyle%20photography%2C%20personal%20finance%20management%2C%20elegant%20and%20sophisticated%20atmosphere%2C%20warm%20neutral%20tones%20with%20emerald%20green%20accents%2C%20bokeh%20background%2C%20high-end%20professional%20photography&width=900&height=1200&seq=auth-hero-v3&orientation=portrait"
          alt="emdia background"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-slate-900/70 to-black/60" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <a href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-white/20 group-hover:scale-105 transition-all duration-300">
              <img
                src="https://storage.readdy-site.link/project_files/39e7c9d0-c363-4d2c-9178-5149cb0274e0/c8d6296c-cf8b-434b-af6a-a4cf98876b89_1775334459022.jpg?v=482e543bd3ecee30f7eb14ce04149a24"
                alt="emdia logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-5xl font-bold text-white tracking-tight group-hover:translate-x-1 transition-transform duration-300">emdia</span>
          </a>

          <div>
            <div className="w-10 h-1 bg-gradient-to-r from-emerald-400 to-brand-400 rounded-full mb-6" />
            <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Seu dinheiro,<br />
              <span className="text-emerald-400">sob controle.</span>
            </h2>
            <p className="text-white/70 text-base leading-relaxed max-w-sm">
              Registre receitas, despesas e dívidas. Veja gráficos em tempo real. Tome decisões financeiras mais inteligentes.
            </p>

            <div className="flex items-center gap-8 mt-10">
              {[
                { value: "10k+", label: "Usuários" },
                { value: "R$ 5M+", label: "Gerenciados" },
                { value: "99%", label: "Satisfação" },
              ].map((s) => (
                <div key={s.label} className="hover:scale-105 transition-transform duration-300 cursor-default">
                  <p className="text-2xl font-extrabold text-white">{s.value}</p>
                  <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 hover:bg-white/15 hover:border-white/30 transition-all duration-300">
            <div className="flex items-center gap-0.5 mb-3">
              {[1,2,3,4,5].map((s) => (
                <i key={s} className="ri-star-fill text-amber-400 text-sm hover:scale-110 transition-transform duration-200" />
              ))}
            </div>
            <p className="text-white/90 text-sm leading-relaxed italic">
              &ldquo;Finalmente entendi pra onde ia meu dinheiro. Em 2 semanas já guardei R$ 400 que antes sumiam.&rdquo;
            </p>
            <p className="text-white/50 text-xs mt-3">— Ana Paula F., Professora · Belo Horizonte</p>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-br from-forest-50/80 via-white to-mint-50/80 lg:overflow-y-auto relative">

        {/* Decorative orbs */}
        <div className="absolute top-20 right-10 w-40 h-40 bg-brand-200/20 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-coral-200/15 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: "3s" }} />

        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-8 animate-fade-in">
          <a href="/" className="inline-flex items-center gap-3 cursor-pointer group">
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-forest-600 shadow-glow-green group-hover:scale-105 transition-transform duration-300">
              <img
                src="https://storage.readdy-site.link/project_files/39e7c9d0-c363-4d2c-9178-5149cb0274e0/c8d6296c-cf8b-434b-af6a-a4cf98876b89_1775334459022.jpg?v=482e543bd3ecee30f7eb14ce04149a24"
                alt="emdia logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-5xl font-bold text-forest-900 tracking-tight">emdia</span>
          </a>
        </div>

        <div className="w-full max-w-sm bg-white/90 backdrop-blur-md rounded-3xl shadow-elevated border border-forest-100/40 p-8 animate-scale-in relative z-10">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            {mode === "forgot" ? (
              <>
                <button
                  onClick={() => handleModeChange("login")}
                  className="flex items-center gap-2 text-forest-400 hover:text-brand-600 text-sm font-medium cursor-pointer transition-colors mb-6 group"
                >
                  <i className="ri-arrow-left-line group-hover:-translate-x-1 transition-transform duration-200" /> Voltar ao login
                </button>
                <h1 className="text-2xl font-extrabold text-forest-900">Recuperar senha</h1>
                <p className="text-forest-400 text-sm mt-1">Enviaremos um link para redefinir sua senha.</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold text-forest-900 mb-1">
                  {mode === "login" ? "Bem-vindo de volta!" : "Crie sua conta grátis"}
                </h1>
                <p className="text-forest-400 text-sm">
                  {mode === "login"
                    ? "Entre para acessar seu painel financeiro."
                    : "Comece a controlar suas finanças hoje mesmo."}
                </p>
              </>
            )}
          </div>

          {/* Tabs */}
          {mode !== "forgot" && (
            <div className="flex bg-forest-50 rounded-2xl p-1 mb-7 animate-slide-up">
              <button
                onClick={() => handleModeChange("login")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer whitespace-nowrap hover:scale-[1.02] active:scale-95 ${
                  mode === "login" ? "bg-white text-forest-900 shadow-soft" : "text-forest-400 hover:text-forest-700"
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => handleModeChange("signup")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer whitespace-nowrap hover:scale-[1.02] active:scale-95 ${
                  mode === "signup" ? "bg-white text-forest-900 shadow-soft" : "text-forest-400 hover:text-forest-700"
                }`}
              >
                Criar conta
              </button>
            </div>
          )}

          {/* Google button */}
          {mode !== "forgot" && (
            <>
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 border-2 border-forest-100 rounded-xl text-forest-700 font-semibold text-sm hover:border-brand-300 hover:bg-brand-50/50 hover:-translate-y-0.5 hover:shadow-soft transition-all duration-300 cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {googleLoading ? (
                  <span className="w-5 h-5 border-2 border-forest-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                )}
                {mode === "login" ? "Entrar com Google" : "Cadastrar com Google"}
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-forest-200 to-transparent" />
                <span className="text-forest-300 text-xs font-medium">ou com e-mail</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-forest-200 to-transparent" />
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="animate-slide-up" style={{ animationDelay: "0.05s" }}>
              <label className="block text-sm font-semibold text-forest-700 mb-1.5">E-mail</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-forest-300 group-focus-within:text-brand-500 transition-colors duration-300">
                  <i className="ri-mail-line text-base" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-forest-100 rounded-xl text-sm text-forest-900 placeholder-forest-300 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100/60 focus:shadow-glow-green/30 transition-all duration-300 bg-forest-50/30 hover:bg-white"
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
                <label className="block text-sm font-semibold text-forest-700 mb-1.5">Senha</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-forest-300 group-focus-within:text-brand-500 transition-colors duration-300">
                    <i className="ri-lock-line text-base" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-12 py-3 border border-forest-100 rounded-xl text-sm text-forest-900 placeholder-forest-300 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100/60 focus:shadow-glow-green/30 transition-all duration-300 bg-forest-50/30 hover:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-forest-300 hover:text-brand-500 cursor-pointer transition-colors duration-200"
                  >
                    <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} />
                  </button>
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
                <label className="block text-sm font-semibold text-forest-700 mb-1.5">Confirmar senha</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-forest-300 group-focus-within:text-brand-500 transition-colors duration-300">
                    <i className="ri-lock-2-line text-base" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repita a senha"
                    className="w-full pl-10 pr-4 py-3 border border-forest-100 rounded-xl text-sm text-forest-900 placeholder-forest-300 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100/60 focus:shadow-glow-green/30 transition-all duration-300 bg-forest-50/30 hover:bg-white"
                  />
                </div>
              </div>
            )}

            {mode === "login" && (
              <div className="text-right animate-slide-up" style={{ animationDelay: "0.15s" }}>
                <button
                  type="button"
                  onClick={() => handleModeChange("forgot")}
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold cursor-pointer transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 hover:after:w-full after:bg-brand-600 after:transition-all after:duration-300"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            {/* Error / Success */}
            {error && (
              <div className="flex items-start gap-2 bg-coral-50 border border-coral-100 rounded-xl px-4 py-3 animate-slide-up">
                <i className="ri-error-warning-line text-coral-500 text-base mt-0.5 shrink-0" />
                <p className="text-coral-600 text-sm">{error}</p>
              </div>
            )}
            {successMsg && (
              <div className="flex items-start gap-2 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 animate-slide-up">
                <i className="ri-checkbox-circle-line text-brand-500 text-base mt-0.5 shrink-0" />
                <p className="text-brand-700 text-sm">{successMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-forest-600 hover:from-brand-500 hover:to-forest-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 text-sm cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 mt-2 shadow-glow-green hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] overflow-hidden group relative"
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Aguarde...
                  </>
                ) : mode === "login" ? (
                  <><i className="ri-login-box-line" /> Entrar</>
                ) : mode === "signup" ? (
                  <><i className="ri-user-add-line" /> Criar conta grátis</>
                ) : (
                  <><i className="ri-send-plane-line" /> Enviar link de recuperação</>
                )}
              </span>
              <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
            </button>
          </form>

          {/* Signup terms */}
          {mode === "signup" && (
            <p className="text-center text-xs text-forest-400 mt-5 leading-relaxed animate-fade-in">
              Ao criar uma conta, você concorda com nossos{" "}
              <span className="text-brand-600 cursor-pointer hover:underline font-medium">Termos de Uso</span>{" "}
              e{" "}
              <span className="text-brand-600 cursor-pointer hover:underline font-medium">Política de Privacidade</span>.
            </p>
          )}

          {/* Back to home */}
          <div className="text-center mt-8 animate-fade-in">
            <a href="/" className="text-forest-400 hover:text-brand-600 text-sm font-medium transition-colors duration-300 cursor-pointer inline-flex items-center gap-1 group">
              <i className="ri-arrow-left-line text-xs group-hover:-translate-x-1 transition-transform duration-200" /> Voltar ao site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
