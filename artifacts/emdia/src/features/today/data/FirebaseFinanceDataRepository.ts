import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { FinanceDataRepository } from "./FinanceDataRepository";
import { FinancialContextResult, FinancialDataQuality } from "./types";
import { mapTransactionsToContext, RawTransaction } from "./financeDataMappers";

export interface FirebaseFinanceDataRepositoryConfig {
  authenticatedUserId: string;
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
    const transactionsRef = collection(db, "users", this.uid, "transactions");
    const q = query(transactionsRef, orderBy("date", "desc"));
    
    const snapshot = await getDocs(q);
    
    const rawTransactions: RawTransaction[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        amount: data.amount,
        category: data.category,
        description: data.description,
        date: data.date,
        createdAt: data.createdAt,
        // Optional confirmed field if it exists in the future
        confirmed: data.confirmed
      };
    });

    const { context, diagnostics } = mapTransactionsToContext(rawTransactions, referenceDate);

    let quality: FinancialDataQuality = "partial";
    if (diagnostics.invalidDocumentCount > 0 || diagnostics.warnings.some(w => w.code === "INCOMPLETE_HISTORY")) {
      quality = "insufficient";
    }

    return {
      context,
      quality,
      diagnostics,
      availability: {
        minimumReserve: "missing",
        protectedGoals: "missing"
      }
    };
  }
}
