export type MoneyInCents = number;

export type IncomeConfidence = "confirmed" | "probable" | "uncertain";

export type CommitmentStatus = "pending" | "paid" | "overdue" | "cancelled";

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export interface FinancialTransaction {
  id: string;
  type: "income" | "expense";
  amountInCents: MoneyInCents;
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  confirmed: boolean;
}

export interface FinancialCommitment {
  id: string;
  name: string;
  amountInCents: MoneyInCents;
  dueDate: string; // YYYY-MM-DD
  status: CommitmentStatus;
  essential: boolean;
  priority: number;
  installment?: { current: number; total: number };
  recurrence?: string;
}

export interface ExpectedIncome {
  id: string;
  description: string;
  amountInCents: MoneyInCents;
  expectedDate: string; // YYYY-MM-DD
  confidence: IncomeConfidence;
  status: "pending" | "received";
}

export interface FinancialSnapshot {
  referenceDate: string; // YYYY-MM-DD
  currentBalanceInCents: MoneyInCents;
  committedAmountInCents: MoneyInCents;
  protectedAmountInCents: MoneyInCents;
  breathingRoomInCents: MoneyInCents;
  safeDailyPaceInCents: MoneyInCents;
  nextIncomeDate: string | null;
  projectedBalanceInCents: MoneyInCents;
  calculatedAt: string; // ISO 8601 UTC
  explanations: string[];
}

export interface FinancialRisk {
  id: string;
  commitmentId: string | null;
  date: string; // YYYY-MM-DD
  shortfallInCents: MoneyInCents;
  severity: RiskSeverity;
  reason: string;
  suggestedAdjustmentInCents: MoneyInCents | null;
}

export interface PurchaseProposal {
  totalAmountInCents: MoneyInCents;
  paymentMethod: "cash" | "installments";
  installments: number;
  firstDueDate: string; // YYYY-MM-DD
  description: string;
  category: string;
}

export interface FinancialScenario {
  previousSnapshot: FinancialSnapshot;
  simulatedSnapshot: FinancialSnapshot;
  breathingRoomDifferenceInCents: number;
  dailyPaceDifferenceInCents: number;
  newRisks: FinancialRisk[];
  affectedCommitments: string[];
  explanations: string[];
}

export interface RecommendedAction {
  type: string;
  title: string;
  description: string;
  priority: number;
  amountInCents: MoneyInCents | null;
  deadline: string | null; // YYYY-MM-DD
  reasonCodes: string[];
  explanation: string;
}
