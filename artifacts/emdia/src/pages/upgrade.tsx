import { useState } from "react";
import { Link } from "wouter";
import { PLAN_INFO } from "@/lib/plans";
import { useUserPlan } from "@/lib/useUserPlan";
import { ProBadge } from "@/lib/ProBadge";

export default function Upgrade() {
  const { userPlan, loading } = useUserPlan();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Se já é Pro, mostra mensagem de sucesso
  if (userPlan.isPro || userPlan.isEnterprise) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1AC87E] to-[#15B36D] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-[#0A0F1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Você já é Pro!</h1>
            <p className="text-gray-400">Aproveite todos os benefícios do seu plano.</p>
            <div className="mt-4">
              <ProBadge className="text-base px-4 py-2" showUpgrade={false} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLAN_INFO.pro.features.map((feature, i) => (
              <div key={i} className="bg-[#1A1F3A] rounded-xl p-4 flex items-center gap-3">
                <svg className="w-5 h-5 text-[#1AC87E] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1AC87E] text-[#0A0F1E] rounded-xl font-bold hover:bg-[#15B36D] transition-colors"
            >
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentPrice = billingPeriod === "monthly"
    ? PLAN_INFO.pro.price
    : PLAN_INFO.pro.annualPrice;
  const period = billingPeriod === "monthly" ? PLAN_INFO.pro.period : PLAN_INFO.pro.annualPeriod;

  async function handleUpgrade() {
    setIsUpgrading(true);

    // Aqui você integraria com Stripe/PagSeguro
    // Por enquanto, simulamos o processo
    alert("Funcionalidade de pagamento será integrada com Stripe em breve!");

    setIsUpgrading(false);
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1A1F3A] to-[#0A0F1E] py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Desbloqueie todo o potencial do{" "}
            <span className="text-[#1AC87E]">emdia</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Tenha controle total das suas finanças com o plano Pro
          </p>

          {/* Toggle de cobrança */}
          <div className="inline-flex items-center gap-4 bg-[#1A1F3A] rounded-full p-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                billingPeriod === "monthly"
                  ? "bg-[#1AC87E] text-[#0A0F1E]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                billingPeriod === "annual"
                  ? "bg-[#1AC87E] text-[#0A0F1E]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Anual
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 pb-12">
        <div className="bg-[#1A1F3A] rounded-3xl p-8 border border-[#1AC87E]/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left side - Plan info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-gradient-to-r from-[#1AC87E] to-[#15B36D] text-[#0A0F1E] px-3 py-1 rounded-full text-sm font-bold">
                  PRO
                </span>
                {billingPeriod === "annual" && (
                  <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
                    Melhor valor
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold mb-2">Plano Pro</h2>
              <p className="text-gray-400 mb-6">{PLAN_INFO.pro.description}</p>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold text-white">
                  R$ {currentPrice?.toFixed(2).replace(".", ",")}
                </span>
                <span className="text-gray-400">/{period}</span>
              </div>

              {billingPeriod === "annual" && (
                <p className="text-sm text-gray-400 mb-4">
                  Equivalente a R$ {(PLAN_INFO.pro.annualPrice! / 12).toFixed(2).replace(".", ",")}/mês
                </p>
              )}

              <button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-[#1AC87E] to-[#15B36D] text-[#0A0F1E] rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpgrading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#0A0F1E] border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Assinar Pro
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>

              <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  7 dias de garantia
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Cancelamento fácil
                </span>
              </div>
            </div>

            {/* Right side - Features */}
            <div className="flex-1 border-t md:border-t-0 md:border-l border-[#2A2F4A] pt-8 md:pt-0 md:pl-8">
              <h3 className="text-lg font-semibold mb-4">Tudo do Gratuito +</h3>
              <ul className="space-y-4">
                {PLAN_INFO.pro.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#1AC87E]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-[#1AC87E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold text-center mb-8">Comparar Planos</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2F4A]">
                <th className="text-left py-4 px-4 text-gray-400 font-normal">Recurso</th>
                <th className="text-center py-4 px-4 text-white">Gratuito</th>
                <th className="text-center py-4 px-4 text-[#1AC87E] font-bold">Pro</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#2A2F4A]/50">
                <td className="py-4 px-4">Transações/mês</td>
                <td className="text-center py-4 px-4">15</td>
                <td className="text-center py-4 px-4 text-[#1AC87E] font-semibold">Ilimitadas</td>
              </tr>
              <tr className="border-b border-[#2A2F4A]/50">
                <td className="py-4 px-4">Categorias</td>
                <td className="text-center py-4 px-4">5</td>
                <td className="text-center py-4 px-4 text-[#1AC87E] font-semibold">Ilimitadas</td>
              </tr>
              <tr className="border-b border-[#2A2F4A]/50">
                <td className="py-4 px-4">Histórico</td>
                <td className="text-center py-4 px-4">30 dias</td>
                <td className="text-center py-4 px-4 text-[#1AC87E] font-semibold">Completo</td>
              </tr>
              <tr className="border-b border-[#2A2F4A]/50">
                <td className="py-4 px-4">Exportação CSV</td>
                <td className="text-center py-4 px-4 text-red-500">
                  <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </td>
                <td className="text-center py-4 px-4 text-[#1AC87E]">
                  <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </td>
              </tr>
              <tr className="border-b border-[#2A2F4A]/50">
                <td className="py-4 px-4">Relatórios mensais</td>
                <td className="text-center py-4 px-4 text-red-500">
                  <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </td>
                <td className="text-center py-4 px-4 text-[#1AC87E]">
                  <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </td>
              </tr>
              <tr className="border-b border-[#2A2F4A]/50">
                <td className="py-4 px-4">Sincronização na nuvem</td>
                <td className="text-center py-4 px-4 text-red-500">
                  <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </td>
                <td className="text-center py-4 px-4 text-[#1AC87E]">
                  <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4">Suporte</td>
                <td className="text-center py-4 px-4">Email</td>
                <td className="text-center py-4 px-4 text-[#1AC87E] font-semibold">Prioritário</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Perguntas Frequentes</h2>

        <div className="space-y-4">
          <details className="bg-[#1A1F3A] rounded-xl overflow-hidden group">
            <summary className="p-4 cursor-pointer font-semibold hover:bg-[#252A4A] transition-colors flex items-center justify-between">
              Como funciona a garantia de 7 dias?
              <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="p-4 pt-0 text-gray-400 text-sm">
              Se você não ficar satisfeito com o plano Pro nos primeiros 7 dias, devolvemos 100% do valor. Sem perguntas.
            </div>
          </details>

          <details className="bg-[#1A1F3A] rounded-xl overflow-hidden group">
            <summary className="p-4 cursor-pointer font-semibold hover:bg-[#252A4A] transition-colors flex items-center justify-between">
              Posso cancelar a qualquer momento?
              <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="p-4 pt-0 text-gray-400 text-sm">
              Sim! Você pode cancelar sua assinatura a qualquer momento. Sua acesso continua até o final do período pago.
            </div>
          </details>

          <details className="bg-[#1A1F3A] rounded-xl overflow-hidden group">
            <summary className="p-4 cursor-pointer font-semibold hover:bg-[#252A4A] transition-colors flex items-center justify-between">
              Quais formas de pagamento são aceitas?
              <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="p-4 pt-0 text-gray-400 text-sm">
              Aceitamos cartão de crédito (Visa, Mastercard, Elo), PIX e boleto bancário. Pagamentos processados com segurança pelo Stripe.
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}