import { FinancialContextResult } from "./types";

export interface FinanceDataRepository {
  getFinancialContext(referenceDate: string): Promise<FinancialContextResult>;
}
