import { ExpectedIncome, FinancialCommitment, MoneyInCents } from "../../../domain/finance/types";

export type FinancialDataQuality = "complete" | "partial" | "insufficient";

export interface FinancialDataWarning {
  code: "INVALID_AMOUNT" | "INVALID_DATE" | "MISSING_TYPE" | "INCOMPLETE_HISTORY" | "NO_FUTURE_INCOME" | "RESERVE_NOT_CONFIGURED" | string;
  message: string;
}

export interface FinancialContext {
  currentBalanceInCents: MoneyInCents;
  commitments: FinancialCommitment[];
  expectedIncomes: ExpectedIncome[];
  protectedAmountInCents: MoneyInCents;
  minimumReserveInCents: MoneyInCents;
}

export interface FinancialContextResult {
  context: FinancialContext;
  quality: FinancialDataQuality;
  diagnostics: {
    validDocumentCount: number;
    invalidDocumentCount: number;
    ignoredDocumentCount: number;
    warnings: FinancialDataWarning[];
    assumptions: string[];
  };
  availability: {
    minimumReserve: "missing" | "available";
    protectedGoals: "missing" | "available";
  };
}
