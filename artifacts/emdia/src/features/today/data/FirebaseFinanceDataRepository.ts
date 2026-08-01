import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { FinanceDataRepository } from "./FinanceDataRepository";
import {
  FinancialContextResult,
  FinancialDataQuality,
  FinancialDataWarning,
} from "./types";
import { mapTransactionsToContext, RawTransaction } from "./financeDataMappers";
import {
  buildDecisionContext,
  validateFinancialContextDocument,
} from "../../../domain/finance/context";
import { FinancialContextDocumentV1 } from "../../../domain/finance/context/types";
import { FinancialTransaction } from "../../../domain/finance/types";
import { realsToCents } from "../../../domain/finance/money";
import { addDays, validateDate } from "../../../domain/finance/dates";

export interface FirebaseFinanceDataRepositoryConfig {
  authenticatedUserId: string;
}

/**
 * Nudge shown when the user has transactions but no confirmed monthly context
 * yet. The screen still works from transactions alone (hybrid fallback), but
 * reserve and protected goals stay unknown until "Preparar seu mês" runs.
 */
const PREPARE_MONTH_NUDGE =
  "Prepare seu mês para dados mais precisos (saldo de referência, reserva e metas).";

function toCivilDate(value: unknown): string | null {
  if (typeof value !== "string" || value.length < 10) return null;
  const civil = value.slice(0, 10);
  try {
    validateDate(civil);
    return civil;
  } catch {
    return null;
  }
}

function toAmountInCents(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (typeof num !== "number" || !Number.isFinite(num) || num < 0) return null;
  return realsToCents(num);
}

/**
 * Maps raw Firestore transactions (Reais + ISO datetime) into the domain
 * FinancialTransaction shape (cents + civil date) the decision engine expects.
 * Invalid documents are skipped and counted so callers can report data quality.
 */
function mapRawToFinancialTransactions(raw: RawTransaction[]): {
  transactions: FinancialTransaction[];
  invalidCount: number;
} {
  const transactions: FinancialTransaction[] = [];
  let invalidCount = 0;

  for (const t of raw) {
    const amountInCents = toAmountInCents(t.amount);
    const date = toCivilDate(t.date);
    if (amountInCents === null || date === null || (t.type !== "income" && t.type !== "expense")) {
      invalidCount++;
      continue;
    }
    transactions.push({
      id: t.id,
      type: t.type,
      amountInCents,
      date,
      category: t.category ?? "",
      description: t.description ?? "",
      confirmed: t.confirmed ?? false,
    });
  }

  return { transactions, invalidCount };
}

function mapDataQuality(quality: string): FinancialDataQuality {
  if (quality === "complete") return "complete";
  if (quality === "insufficient") return "insufficient";
  // "partial" and "stale" both surface as partial to the UI.
  return "partial";
}

export class FirebaseFinanceDataRepository implements FinanceDataRepository {
  private uid: string;

  constructor(config: FirebaseFinanceDataRepositoryConfig) {
    if (!config.authenticatedUserId) {
      throw new Error("authenticatedUserId is required to instantiate FirebaseFinanceDataRepository.");
    }
    this.uid = config.authenticatedUserId;
  }

  async getFinancialContext(referenceDate: string): Promise<FinancialContextResult> {
    // 1. Load the confirmed monthly context snapshot (may not exist yet).
    const contextSnapshot = await getDoc(
      doc(db, "users", this.uid, "financialContext", "current")
    );

    // 2. Load raw transactions.
    const transactionsRef = collection(db, "users", this.uid, "transactions");
    const snapshot = await getDocs(query(transactionsRef, orderBy("date", "desc")));
    const rawTransactions: RawTransaction[] = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        type: data.type,
        amount: data.amount,
        category: data.category,
        description: data.description,
        date: data.date,
        createdAt: data.createdAt,
        confirmed: data.confirmed,
      };
    });

    const confirmedDocument = this.readConfirmedDocument(contextSnapshot, referenceDate);

    // 3a. Confirmed context present -> full decision context via the adapter.
    if (confirmedDocument) {
      return this.buildFromConfirmedContext(confirmedDocument, rawTransactions, referenceDate);
    }

    // 3b. No confirmed context -> hybrid fallback derived from transactions.
    return this.buildFromTransactionsOnly(rawTransactions, referenceDate);
  }

  private readConfirmedDocument(
    snapshot: { exists: () => boolean; data: () => unknown },
    referenceDate: string
  ): FinancialContextDocumentV1 | null {
    if (!snapshot || !snapshot.exists()) return null;
    const validation = validateFinancialContextDocument(snapshot.data(), referenceDate);
    return validation.success ? validation.data : null;
  }

  private buildFromConfirmedContext(
    document: FinancialContextDocumentV1,
    rawTransactions: RawTransaction[],
    referenceDate: string
  ): FinancialContextResult {
    const { transactions, invalidCount } = mapRawToFinancialTransactions(rawTransactions);
    const horizonEndDate = addDays(referenceDate, document.calculationPreferences.planningHorizonDays);

    const result = buildDecisionContext(document, transactions, referenceDate, horizonEndDate);

    const warnings: FinancialDataWarning[] = [];
    if (invalidCount > 0) {
      warnings.push({
        code: "INVALID_AMOUNT",
        message: `${invalidCount} transação(ões) ignorada(s) por dados inválidos.`,
      });
    }

    const reserveAvailable = document.minimumReserve.status === "configured";
    const goalsAvailable = document.protectedGoals.some((g) => g.status === "active");

    return {
      context: {
        currentBalanceInCents: result.currentBalanceInCents,
        commitments: result.commitments,
        expectedIncomes: result.expectedIncomes,
        protectedAmountInCents: result.protectedAmountInCents,
        minimumReserveInCents: result.minimumReserveInCents,
      },
      quality: mapDataQuality(result.diagnostics.quality),
      diagnostics: {
        validDocumentCount: result.diagnostics.appliedTransactionsCount,
        invalidDocumentCount: invalidCount,
        ignoredDocumentCount: result.diagnostics.ignoredTransactionsCount,
        warnings,
        assumptions: ["Contexto financeiro confirmado carregado."],
      },
      availability: {
        minimumReserve: reserveAvailable ? "available" : "missing",
        protectedGoals: goalsAvailable ? "available" : "missing",
      },
    };
  }

  private buildFromTransactionsOnly(
    rawTransactions: RawTransaction[],
    referenceDate: string
  ): FinancialContextResult {
    const { context, diagnostics } = mapTransactionsToContext(rawTransactions, referenceDate);

    let quality: FinancialDataQuality = "partial";
    if (
      diagnostics.invalidDocumentCount > 0 ||
      diagnostics.warnings.some((w) => w.code === "INCOMPLETE_HISTORY")
    ) {
      quality = "insufficient";
    }

    return {
      context,
      quality,
      diagnostics: {
        ...diagnostics,
        assumptions: [...diagnostics.assumptions, PREPARE_MONTH_NUDGE],
      },
      availability: {
        minimumReserve: "missing",
        protectedGoals: "missing",
      },
    };
  }
}
