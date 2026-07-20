import { useState, useEffect } from "react";
import { useAuth } from "../../../lib/auth-context";
import { FirebaseFinanceDataRepository } from "./FirebaseFinanceDataRepository";
import { FinancialContextResult } from "./types";
import { 
  mockReferenceDate,
  mockInitialBalanceInCents,
  mockCommitments,
  mockConfirmedIncome,
  mockMinimumReserveInCents
} from "../fixtures";

export type TodayDataSource = "demo" | "firebase";

export interface UseTodayFinancialDataResult {
  loading: boolean;
  error: string | null;
  data: FinancialContextResult | null;
  source: TodayDataSource;
}

export function useTodayFinancialData(referenceDate: string): UseTodayFinancialDataResult {
  const { user } = useAuth();
  const [data, setData] = useState<FinancialContextResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const envSource = import.meta.env.VITE_TODAY_DATA_SOURCE;
  const isDemo = envSource !== "firebase";

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      if (isDemo) {
        // Modo Demo
        if (isMounted) {
          setData({
            context: {
              currentBalanceInCents: mockInitialBalanceInCents,
              commitments: mockCommitments,
              expectedIncomes: mockConfirmedIncome,
              protectedAmountInCents: 0,
              minimumReserveInCents: mockMinimumReserveInCents,
            },
            quality: "complete",
            diagnostics: {
              validDocumentCount: 10,
              invalidDocumentCount: 0,
              ignoredDocumentCount: 0,
              warnings: [],
              assumptions: ["Dados fictícios carregados."],
            },
            availability: {
              minimumReserve: "available",
              protectedGoals: "missing",
            }
          });
          setLoading(false);
        }
        return;
      }

      // Modo Firebase
      if (!user) {
        if (isMounted) {
          setError("Usuário não autenticado.");
          setLoading(false);
        }
        return;
      }

      try {
        const repo = new FirebaseFinanceDataRepository({
          authenticatedUserId: user.uid,
        });

        const result = await repo.getFinancialContext(referenceDate);

        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Erro ao carregar dados financeiros.");
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
      setData(null); // Limpa ao desmontar ou trocar dependências
    };
  }, [user, isDemo, referenceDate]);

  return {
    loading,
    error,
    data,
    source: isDemo ? "demo" : "firebase",
  };
}
