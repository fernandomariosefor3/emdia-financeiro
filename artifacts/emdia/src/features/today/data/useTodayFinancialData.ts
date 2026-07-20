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

type TodayDataSourceState =
  | { kind: "demo" }
  | { kind: "firebase" }
  | { kind: "configuration-error"; message: string };

export type TodayDataSource = "demo" | "firebase" | "error";

export interface UseTodayFinancialDataResult {
  loading: boolean;
  error: string | null;
  data: FinancialContextResult | null;
  source: TodayDataSource;
}

function resolveDataSource(envSource: unknown): TodayDataSourceState {
  if (envSource === "demo") return { kind: "demo" };
  if (envSource === "firebase") return { kind: "firebase" };
  return { 
    kind: "configuration-error", 
    message: "Fonte de dados ausente ou inválida. Configure VITE_TODAY_DATA_SOURCE com 'demo' ou 'firebase'."
  };
}

export function useTodayFinancialData(referenceDate: string): UseTodayFinancialDataResult {
  const { user } = useAuth();
  const [data, setData] = useState<FinancialContextResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const envSource = import.meta.env.VITE_TODAY_DATA_SOURCE;
  const sourceState = resolveDataSource(envSource);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      if (sourceState.kind === "configuration-error") {
        if (isMounted) {
          setError(sourceState.message);
          setLoading(false);
        }
        return;
      }

      if (sourceState.kind === "demo") {
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

      if (sourceState.kind === "firebase") {
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
        } catch (err: unknown) {
          if (isMounted) {
            const message = err instanceof Error ? err.message : "Erro ao carregar dados financeiros.";
            setError(message);
            setLoading(false);
          }
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
      setData(null);
    };
  }, [user, sourceState.kind, sourceState.kind === "configuration-error" ? sourceState.message : null, referenceDate]);

  return {
    loading,
    error,
    data,
    source: sourceState.kind === "configuration-error" ? "error" : sourceState.kind,
  };
}
// Source narrowing aligned
