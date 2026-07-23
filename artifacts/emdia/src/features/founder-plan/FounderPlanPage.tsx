import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { FOUNDER_ANNUAL_PLAN, formatFounderAnnualPrice, isBillingEnabled } from "@/lib/founderPlan";
import { createAnnualCheckoutSession } from "./billingClient";
import { FounderPlanCheckoutState } from "./types";

const FOUNDER_FEATURES = [
  "Receitas e despesas",
  "Dashboard financeiro",
  "Prepare seu mês",
  "Respiro e Ritmo seguro",
  "Atualizações do aplicativo durante a assinatura",
];

const RENEWAL_NOTICE = "Assinatura anual com renovação automática. Você poderá cancelar antes da próxima renovação.";
const GENERIC_ERROR_MESSAGE = "Não foi possível iniciar a assinatura agora. Tente novamente em instantes.";

export function FounderPlanPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [checkoutState, setCheckoutState] = useState<FounderPlanCheckoutState>({ kind: "idle" });
  const billingEnabled = isBillingEnabled(import.meta.env.VITE_ENABLE_BILLING);

  async function handleSubscribe() {
    if (!billingEnabled || checkoutState.kind === "redirecting") return;

    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent("/planos")}`);
      return;
    }

    setCheckoutState({ kind: "redirecting" });
    try {
      const { url } = await createAnnualCheckoutSession();
      window.location.href = url;
    } catch {
      setCheckoutState({ kind: "error", message: GENERIC_ERROR_MESSAGE });
    }
  }

  const isRedirecting = checkoutState.kind === "redirecting";
  const buttonLabel = billingEnabled ? (isRedirecting ? "Redirecionando..." : "Assinar Plano Fundador") : "Assinaturas em breve";

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <span className="bg-gradient-to-r from-[#1AC87E] to-[#15B36D] text-[#0A0F1E] px-3 py-1 rounded-full text-sm font-bold">
            FUNDADOR
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mt-4">{FOUNDER_ANNUAL_PLAN.name}</h1>
          <div className="flex items-baseline justify-center gap-2 mt-6">
            <span className="text-5xl font-bold">{formatFounderAnnualPrice()}</span>
            <span className="text-gray-400">por ano</span>
          </div>
          <p className="text-gray-400 mt-2">Menos de R$ 1 por mês.</p>
        </div>

        <div className="bg-[#1A1F3A] rounded-3xl p-8 border border-[#1AC87E]/20">
          <h2 className="text-lg font-semibold mb-4">O que está incluído</h2>
          <ul className="space-y-3 mb-8">
            {FOUNDER_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#1AC87E]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-[#1AC87E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleSubscribe}
            disabled={!billingEnabled || isRedirecting}
            className="w-full px-8 py-4 bg-gradient-to-r from-[#1AC87E] to-[#15B36D] text-[#0A0F1E] rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buttonLabel}
          </button>

          {checkoutState.kind === "error" && (
            <p role="alert" className="text-sm text-red-400 mt-3 text-center">
              {checkoutState.message}
            </p>
          )}

          <p className="text-xs text-gray-500 mt-4 text-center">{RENEWAL_NOTICE}</p>
        </div>

        <div className="mt-8 bg-[#1A1F3A]/50 rounded-2xl p-6 border border-white/5">
          <h2 className="text-base font-semibold text-gray-300">Emdia no Zap — em preparação</h2>
          <p className="text-sm text-gray-500 mt-1">
            Registrar receitas e despesas direto pelo WhatsApp está em preparação e será ativado assim que o número
            oficial do Emdia estiver pronto.
          </p>
        </div>
      </div>
    </div>
  );
}
