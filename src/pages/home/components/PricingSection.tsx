import { useState } from "react";
import { Link } from "react-router-dom";

const features = [
  "Gráfico de pizza mensal em tempo real",
  "Categorias ilimitadas de gastos",
  "Histórico completo de transações",
  "Exportação em CSV",
  "Login com Google",
  "Dados salvos na nuvem",
  "Relatórios mensais detalhados",
  "Suporte prioritário por e-mail",
];

const freeFeatures = [
  "Até 15 transações por mês",
  "Gráfico de pizza básico",
  "Histórico dos últimos 30 dias",
];

export default function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  const handleSubscribe = (billingType: "monthly" | "annual") => {
    const price = billingType === "annual" ? "R$ 78,99/ano" : "R$ 9,99/mês";
    const subject = encodeURIComponent(`Upgrade Pro ${price} — EmDia`);
    const body = encodeURIComponent(
      `Olá! Gostaria de assinar o plano Pro ${price}.\n\nMeu e-mail de cadastro: `
    );
    window.open(`mailto:contato@emdiafinanceiro.com.br?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <section id="pricing" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full uppercase tracking-widest mb-4">
            Planos & Preços
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
            Simples assim. Sem surpresas.
          </h2>
          <p className="text-slate-500 text-base max-w-xl mx-auto">
            Comece grátis e faça upgrade quando quiser ter controle total das suas finanças.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-full px-1 py-1 mt-8">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                billing === "monthly"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                billing === "annual"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Anual
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${billing === "annual" ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                -34%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Free */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-8 shadow-soft hover:shadow-card transition-all hover:-translate-y-1">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2">Grátis</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-extrabold text-forest-900">R$ 0</span>
            </div>
            <p className="text-slate-400 text-sm mb-8">Para sempre gratuito</p>

            <Link
              to="/auth"
              className="block w-full py-3.5 border-2 border-slate-200 text-forest-700 font-bold rounded-xl hover:border-brand-400 hover:bg-brand-50 transition-all duration-200 text-sm whitespace-nowrap cursor-pointer mb-8 text-center shadow-soft hover:shadow-card"
            >
              Começar grátis
            </Link>

            <ul className="space-y-3">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="w-5 h-5 flex items-center justify-center shrink-0 rounded-full bg-brand-50">
                    <i className="ri-check-line text-brand-500 text-base" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro — destaque */}
          <div className="relative bg-gradient-to-b from-forest-900 via-forest-800 to-forest-900 rounded-2xl p-8 shadow-elevated scale-105 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="inline-block bg-gradient-to-r from-gold-400 to-gold-500 text-forest-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-glow-gold">
                Mais Popular
              </span>
            </div>

            <p className="text-sm font-semibold text-brand-300 uppercase tracking-widest mb-2">Pro</p>

            <div className="flex items-end gap-1 mb-1">
              {billing === "monthly" ? (
                <>
                  <span className="text-4xl font-extrabold text-white">R$ 9</span>
                  <span className="text-2xl font-bold text-white">,99</span>
                  <span className="text-brand-300/60 text-sm mb-1">/mês</span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-extrabold text-white">R$ 78</span>
                  <span className="text-2xl font-bold text-white">,99</span>
                  <span className="text-brand-300/60 text-sm mb-1">/ano</span>
                </>
              )}
            </div>

            {billing === "annual" && (
              <p className="text-gold-400 text-xs font-medium mb-6">
                Equivale a R$ 6,58/mês — você economiza R$ 40,89!
              </p>
            )}
            {billing === "monthly" && (
              <p className="text-brand-300/50 text-xs mb-6">Cancele a qualquer momento</p>
            )}

            <button
              onClick={() => handleSubscribe(billing)}
              className="w-full py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-bold rounded-xl transition-all duration-300 text-sm whitespace-nowrap cursor-pointer mb-6 shadow-glow-green hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <i className="ri-mail-send-line" />
              {billing === "annual" ? "Solicitar Plano Anual" : "Solicitar Plano Mensal"}
            </button>

            <ul className="space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-brand-100/80">
                  <span className="w-5 h-5 flex items-center justify-center shrink-0 rounded-full bg-brand-500/20">
                    <i className="ri-check-line text-brand-300 text-base" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Empresas */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-8 shadow-soft hover:shadow-card transition-all hover:-translate-y-1">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2">Empresas</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-extrabold text-forest-900">Custom</span>
            </div>
            <p className="text-slate-400 text-sm mb-8">Preço sob consulta</p>

            <button
              onClick={() => {
                const el = document.getElementById("contact");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full py-3.5 border-2 border-brand-200 text-brand-600 font-bold rounded-xl hover:border-brand-400 hover:bg-brand-50 transition-all duration-200 text-sm whitespace-nowrap cursor-pointer mb-8 shadow-soft hover:shadow-card"
            >
              Falar com a equipe
            </button>

            <ul className="space-y-3">
              {[
                "Tudo do plano Pro",
                "Multi-usuários",
                "Relatórios corporativos",
                "Integração com ERP",
                "SLA e suporte dedicado",
                "Onboarding personalizado",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="w-5 h-5 flex items-center justify-center shrink-0 rounded-full bg-brand-50">
                    <i className="ri-check-line text-brand-500 text-base" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-slate-400 text-sm">
          <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-full shadow-soft">
            <i className="ri-shield-check-line text-brand-500 text-lg" />
            <span>Pagamento 100% seguro</span>
          </div>
          <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-full shadow-soft">
            <i className="ri-refund-2-line text-brand-500 text-lg" />
            <span>7 dias de garantia</span>
          </div>
          <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-full shadow-soft">
            <i className="ri-lock-line text-brand-500 text-lg" />
            <span>Cancele quando quiser</span>
          </div>
          <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-full shadow-soft">
            <i className="ri-customer-service-2-line text-brand-500 text-lg" />
            <span>Suporte em português</span>
          </div>
        </div>
      </div>
    </section>
  );
}
