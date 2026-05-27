import { useState, useEffect } from "react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, deleteDoc, doc, getDocs, writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type TransactionType = "receita" | "despesa" | "divida";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string;
  dueDate?: string;
}

export function useTransactions(userId: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const col = collection(db, "users", userId, "transactions");
    const q = query(col, orderBy("created_at", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(
        snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            type: data.type as TransactionType,
            amount: Number(data.amount),
            description: data.description,
            category: data.category,
            date: data.date,
            dueDate: data.due_date ?? undefined,
          };
        })
      );
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const addTransaction = async (tx: Omit<Transaction, "id">): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: "Usuário não autenticado" };
    try {
      await addDoc(collection(db, "users", userId, "transactions"), {
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        category: tx.category,
        date: tx.date,
        due_date: tx.dueDate ?? null,
        created_at: serverTimestamp(),
      });
      return { success: true };
    } catch (err) {
      console.error("[addTransaction]", err);
      return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
  };

  const removeTransaction = async (id: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, "users", userId, "transactions", id));
  };

  const clearAll = async () => {
    if (!userId) return;
    const snapshot = await getDocs(collection(db, "users", userId, "transactions"));
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  };

  const getMonthlyStats = (month?: string) => {
    const now = month ?? new Date().toISOString().slice(0, 7);
    const monthly = transactions.filter((t) => t.date.startsWith(now));
    const income = monthly.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
    const expenses = monthly.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
    const debts = monthly.filter((t) => t.type === "divida").reduce((s, t) => s + t.amount, 0);
    return { income, expenses, debts, balance: income - expenses - debts };
  };

  const getCategoryData = (month?: string) => {
    const now = month ?? new Date().toISOString().slice(0, 7);
    const monthly = transactions.filter((t) => t.date.startsWith(now) && t.type === "despesa");
    const map: Record<string, number> = {};
    monthly.forEach((t) => { map[t.category] = (map[t.category] ?? 0) + t.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  };

  return { transactions, loading, addTransaction, removeTransaction, clearAll, getMonthlyStats, getCategoryData };
}
