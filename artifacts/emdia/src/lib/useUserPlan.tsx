import { useState, useEffect, createContext, useContext, type ReactNode } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "./auth-context";
import { db } from "./firebase";
import { PLAN_INFO, FREE_LIMITS, PRO_FEATURES, type PlanType } from "./plans";

interface UserPlan {
  plan: PlanType;
  isPro: boolean;
  isEnterprise: boolean;
  features: typeof FREE_LIMITS;
  transactionsUsed: number;
  transactionsLimit: number;
  isUnlimited: boolean;
}

interface UserPlanContextType {
  userPlan: UserPlan;
  loading: boolean;
  isFeatureEnabled: (feature: keyof typeof FREE_LIMITS) => boolean;
  canPerformAction: (action: "addTransaction" | "exportCSV" | "viewReports") => boolean;
}

const UserPlanContext = createContext<UserPlanContextType | null>(null);

export function UserPlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userPlan, setUserPlan] = useState<UserPlan>({
    plan: "free",
    isPro: false,
    isEnterprise: false,
    features: FREE_LIMITS,
    transactionsUsed: 0,
    transactionsLimit: FREE_LIMITS.transactionsPerMonth,
    isUnlimited: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserPlan() {
      if (!user) {
        setUserPlan({
          plan: "free",
          isPro: false,
          isEnterprise: false,
          features: FREE_LIMITS,
          transactionsUsed: 0,
          transactionsLimit: FREE_LIMITS.transactionsPerMonth,
          isUnlimited: false,
        });
        setLoading(false);
        return;
      }

      try {
        // Busca dados do usuário no Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userPlanType: PlanType = userData.plan || "free";
          const isPro = userPlanType === "pro";
          const isEnterprise = userPlanType === "enterprise";
          const transactionsThisMonth = userData.transactionsThisMonth || 0;

          // Determina features baseado no plano
          let features = FREE_LIMITS;
          if (isPro || isEnterprise) {
            features = PRO_FEATURES;
          }

          setUserPlan({
            plan: userPlanType,
            isPro,
            isEnterprise,
            features,
            transactionsUsed: transactionsThisMonth,
            transactionsLimit: isPro || isEnterprise ? -1 : FREE_LIMITS.transactionsPerMonth,
            isUnlimited: isPro || isEnterprise,
          });
        }
      } catch (error) {
        console.error("Erro ao carregar plano do usuário:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUserPlan();
  }, [user]);

  // Verifica se uma feature está habilitada
  const isFeatureEnabled = (feature: keyof typeof FREE_LIMITS): boolean => {
    const value = userPlan.features[feature];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    return false;
  };

  // Verifica se uma ação pode ser realizada
  const canPerformAction = (
    action: "addTransaction" | "exportCSV" | "viewReports"
  ): boolean => {
    switch (action) {
      case "addTransaction":
        if (userPlan.isUnlimited) return true;
        return userPlan.transactionsUsed < userPlan.transactionsLimit;
      case "exportCSV":
      case "viewReports":
        return userPlan.isPro || userPlan.isEnterprise;
      default:
        return false;
    }
  };

  return (
    <UserPlanContext.Provider value={{ userPlan, loading, isFeatureEnabled, canPerformAction }}>
      {children}
    </UserPlanContext.Provider>
  );
}

export function useUserPlan() {
  const ctx = useContext(UserPlanContext);
  if (!ctx) throw new Error("useUserPlan must be used within UserPlanProvider");
  return ctx;
}

// Componente para verificar acesso a funcionalidades Pro
interface ProGateProps {
  children: ReactNode;
  feature?: "csvExport" | "reports" | "unlimited";
  fallback?: ReactNode;
}

export function ProGate({ children, feature, fallback }: ProGateProps) {
  const { userPlan, isFeatureEnabled, canPerformAction } = useUserPlan();

  // Se é Pro ou Enterprise, permite tudo
  if (userPlan.isPro || userPlan.isEnterprise) {
    return <>{children}</>;
  }

  // Verifica feature específica
  if (feature) {
    const featureMap: Record<string, () => boolean> = {
      csvExport: () => isFeatureEnabled("csvExport"),
      reports: () => isFeatureEnabled("reports"),
      unlimited: () => isFeatureEnabled("transactionsPerMonth"),
    };

    if (featureMap[feature]?.()) {
      return <>{children}</>;
    }
  }

  // Se tem fallback definido, mostra ele
  if (fallback) return <>{fallback}</>;

  // Por padrão, mostra upgrade prompt
  return null;
}

// Mensagem de limite atingido
export function LimitMessage({ type }: { type: "transactions" | "features" }) {
  const { userPlan } = useUserPlan();

  if (type === "transactions" && !userPlan.isUnlimited) {
    const remaining = userPlan.transactionsLimit - userPlan.transactionsUsed;
    return (
      <div className="text-center py-4 text-gray-400">
        <p className="mb-2">
          Você usou <span className="text-[#1AC87E] font-semibold">{userPlan.transactionsUsed}</span> de{" "}
          <span className="font-semibold">{userPlan.transactionsLimit}</span> transações este mês
        </p>
        <p className="text-sm">Plano Pro: transações ilimitadas + muito mais!</p>
      </div>
    );
  }

  return null;
}

export { PLAN_INFO, FREE_LIMITS, PRO_FEATURES };