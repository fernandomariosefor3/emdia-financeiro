import { ExpectedIncome, FinancialCommitment, MoneyInCents } from "../../../domain/finance/types";
import { realsToCents } from "../../../domain/finance/money";
import { compareDates } from "../../../domain/finance/dates";
import { FinancialContext, FinancialDataWarning } from "./types";

export interface RawTransaction {
  id: string;
  type?: string;
  amount?: number | string;
  category?: string;
  description?: string;
  date?: string;
  createdAt?: string;
  confirmed?: boolean;
}

export interface MapTransactionsResult {
  context: FinancialContext;
  diagnostics: {
    validDocumentCount: number;
    invalidDocumentCount: number;
    ignoredDocumentCount: number;
    warnings: FinancialDataWarning[];
    assumptions: string[];
  };
}

function safeParseAmount(amount: any): MoneyInCents | null {
  if (amount === undefined || amount === null) return null;
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (typeof num !== "number" || !Number.isFinite(num) || Number.isNaN(num) || num < 0) {
    return null;
  }
  return realsToCents(num);
}

function safeParseDate(date: any): string | null {
  if (typeof date !== "string") return null;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return null;
  // Extra validation could be added here
  return date;
}

export function mapTransactionsToContext(
  rawTransactions: RawTransaction[],
  referenceDate: string
): MapTransactionsResult {
  let currentBalanceInCents = 0;
  const commitments: FinancialCommitment[] = [];
  const expectedIncomes: ExpectedIncome[] = [];
  const warnings: FinancialDataWarning[] = [];
  const assumptions: string[] = [];

  let validDocumentCount = 0;
  let invalidDocumentCount = 0;
  let ignoredDocumentCount = 0;

  for (const doc of rawTransactions) {
    const amountInCents = safeParseAmount(doc.amount);
    if (amountInCents === null) {
      invalidDocumentCount++;
      warnings.push({ code: "INVALID_AMOUNT", message: `Document ${doc.id} has invalid amount.` });
      continue;
    }

    const date = safeParseDate(doc.date);
    if (!date) {
      invalidDocumentCount++;
      warnings.push({ code: "INVALID_DATE", message: `Document ${doc.id} has invalid date.` });
      continue;
    }

    if (doc.type !== "income" && doc.type !== "expense") {
      invalidDocumentCount++;
      warnings.push({ code: "MISSING_TYPE", message: `Document ${doc.id} has missing or invalid type.` });
      continue;
    }

    validDocumentCount++;

    const isFuture = compareDates(date, referenceDate) > 0;

    if (!isFuture) {
      // Passado ou atual (Saldo Registrado)
      if (doc.type === "income") {
        currentBalanceInCents += amountInCents;
      } else {
        currentBalanceInCents -= amountInCents;
      }
    } else {
      // Futuro (Projeção)
      if (doc.type === "expense") {
        commitments.push({
          id: doc.id,
          name: doc.description || doc.category || "Despesa Futura",
          amountInCents,
          dueDate: date,
          status: "pending",
          essential: false, // Default
          priority: 3, // Default
        });
      } else if (doc.type === "income") {
        expectedIncomes.push({
          id: doc.id,
          description: doc.description || doc.category || "Receita Futura",
          amountInCents,
          expectedDate: date,
          confidence: doc.confirmed ? "confirmed" : "probable",
          status: "pending",
        });
      }
    }
  }

  // Se não tem saldo inicial registrado no banco explicitamente, emitir um assumption
  assumptions.push("Saldo atual calculado apenas pela soma de transações registradas, não reflete o saldo real do banco.");

  if (rawTransactions.length === 0) {
    warnings.push({ code: "INCOMPLETE_HISTORY", message: "Nenhum histórico de transações encontrado." });
  }

  if (expectedIncomes.length === 0) {
    warnings.push({ code: "NO_FUTURE_INCOME", message: "Nenhuma receita futura encontrada." });
  }

  return {
    context: {
      currentBalanceInCents,
      commitments,
      expectedIncomes,
      protectedAmountInCents: 0,
      minimumReserveInCents: 0,
    },
    diagnostics: {
      validDocumentCount,
      invalidDocumentCount,
      ignoredDocumentCount,
      warnings,
      assumptions,
    },
  };
}
