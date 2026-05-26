import { Link } from "wouter";
import { PLAN_INFO, PRO_FEATURES, FREE_LIMITS } from "./plans";
import { useUserPlan } from "./useUserPlan";

interface ProBadgeProps {
  className?: string;
  showUpgrade?: boolean;
}

export function ProBadge({ className = "", showUpgrade = true }: ProBadgeProps) {
  const { userPlan } = useUserPlan();

  if (userPlan.isPro || userPlan.isEnterprise) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-[#1AC87E] to-[#15B36D] text-[#0A0F1E] text-xs font-bold rounded-full ${className}`}
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        {userPlan.isEnterprise ? "Enterprise" : "Pro"}
      </span>
    );
  }

  if (showUpgrade) {
    return (
      <Link
        href="/upgrade"
        className={`inline-flex items-center gap-1 px-2 py-1 bg-[#1A1F3A] border border-[#1AC87E]/30 text-[#1AC87E] text-xs font-semibold rounded-full hover:border-[#1AC87E] hover:bg-[#1AC87E]/10 transition-all ${className}`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        Upgrade Pro
      </Link>
    );
  }

  return null;
}

// Modal de upgrade para funcionalidades bloqueadas
interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  description?: string;
}

export function UpgradeModal({ isOpen, onClose, feature, description }: UpgradeModalProps) {
  const { userPlan } = useUserPlan();

  if (!isOpen) return null;

  const featureMessages: Record<string, { title: string; desc: string }> = {
    exportCSV: {
      title: "Exportação CSV",
      desc: "Exporte suas transações para declaração de IR ou análise em planilhas.",
    },
    reports: {
      title: "Relatórios Mensais",
      desc: "Receba relatórios detalhados do seu progresso financeiro.",
    },
    unlimited: {
      title: "Transações Ilimitadas",
      desc: "Cadastre quantas transações quiser, sem limites.",
    },
  };

  const info = featureMessages[feature] || { title: feature, desc: description || "" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1A1F3A] rounded-2xl p-6 max-w-md w-full border border-[#1AC87E]/20">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#1AC87E] to-[#15B36D] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#0A0F1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {info.title}
          </h3>
          <p className="text-gray-400">{info.desc}</p>
        </div>

        <div className="bg-[#0A0F1E] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-300">Plano atual</span>
            <span className="text-white font-semibold">Gratuito</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Plano Pro</span>
            <span className="text-[#1AC87E] font-bold">R$ {PLAN_INFO.pro.price}/mês</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Ou R$ {PLAN_INFO.pro.annualPrice}/ano (2 meses grátis!)
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <svg className="w-4 h-4 text-[#1AC87E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Transações ilimitadas
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <svg className="w-4 h-4 text-[#1AC87E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Exportação CSV
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <svg className="w-4 h-4 text-[#1AC87E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Relatórios mensais
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <svg className="w-4 h-4 text-[#1AC87E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Sincronização na nuvem
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[#0A0F1E] text-gray-300 rounded-xl font-semibold hover:bg-[#252A4A] transition-colors"
          >
            Agora não
          </button>
          <Link
            href="/upgrade"
            className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1AC87E] to-[#15B36D] text-[#0A0F1E] rounded-xl font-bold hover:opacity-90 transition-opacity text-center"
          >
            Upgrade Pro
          </Link>
        </div>
      </div>
    </div>
  );
}

// Indicador de uso de transações
export function TransactionUsage() {
  const { userPlan } = useUserPlan();

  if (userPlan.isUnlimited) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#1AC87E]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Transações ilimitadas
        <ProBadge showUpgrade={false} />
      </div>
    );
  }

  const percentage = (userPlan.transactionsUsed / userPlan.transactionsLimit) * 100;
  const isWarning = percentage >= 80;
  const isDanger = percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          {userPlan.transactionsUsed}/{userPlan.transactionsLimit} transações
        </span>
        {!userPlan.isPro && !userPlan.isEnterprise && (
          <Link href="/upgrade" className="text-[#1AC87E] text-xs hover:underline">
            Upgrade para ilimitado
          </Link>
        )}
      </div>
      <div className="h-2 bg-[#0A0F1E] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isDanger
              ? "bg-red-500 w-full"
              : isWarning
              ? "bg-yellow-500"
              : "bg-[#1AC87E]"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}