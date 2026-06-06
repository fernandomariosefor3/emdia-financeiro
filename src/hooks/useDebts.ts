import { useState, useEffect, useCallback } from "react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, doc, updateDoc, deleteDoc, getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Debt {
  id: string;
  user_id: string;
  name?: string;
  creditor: string;
  total_amount: number;
  installment_value: number;
  total_installments: number;
  paid_installments: number;
  start_date: string;
  interest_rate?: number;
  created_at: string;
}

export function useDebts(userId: string | null) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setDebts([]);
      setLoading(false);
      return;
    }

    const col = collection(db, "users", userId, "debts");
    const q = query(col, orderBy("created_at", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDebts(
        snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            user_id: data.user_id ?? userId,
            name: data.name ?? undefined,
            creditor: data.creditor,
            total_amount: Number(data.total_amount ?? 0),
            installment_value: Number(data.installment_value ?? 0),
            total_installments: Number(data.total_installments ?? 0),
            paid_installments: Number(data.paid_installments ?? 0),
            start_date: data.start_date,
            interest_rate: data.interest_rate ?? undefined,
            created_at: data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
          } as Debt;
        })
      );
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const addDebt = async (debt: Omit<Debt, "id" | "user_id" | "created_at" | "paid_installments">) => {
    if (!userId) return;
    await addDoc(collection(db, "users", userId, "debts"), {
      user_id: userId,
      name: debt.name ?? null,
      creditor: debt.creditor,
      total_amount: debt.total_amount,
      installment_value: debt.installment_value,
      total_installments: debt.total_installments,
      paid_installments: 0,
      start_date: debt.start_date,
      interest_rate: debt.interest_rate ?? null,
      created_at: serverTimestamp(),
    });
  };

  const updateDebt = async (id: string, updates: Partial<Omit<Debt, "id" | "user_id" | "created_at">>) => {
    if (!userId) return;
    await updateDoc(doc(db, "users", userId, "debts", id), updates);
  };

  const removeDebt = async (id: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, "users", userId, "debts", id));
  };

  const refresh = useCallback(async () => {
    if (!userId) return;
    const snapshot = await getDocs(collection(db, "users", userId, "debts"));
    setDebts(
      snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          user_id: data.user_id ?? userId,
          name: data.name ?? undefined,
          creditor: data.creditor,
          total_amount: Number(data.total_amount ?? 0),
          installment_value: Number(data.installment_value ?? 0),
          total_installments: Number(data.total_installments ?? 0),
          paid_installments: Number(data.paid_installments ?? 0),
          start_date: data.start_date,
          interest_rate: data.interest_rate ?? undefined,
          created_at: data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        } as Debt;
      })
    );
  }, [userId]);

  const totalDebt = debts.reduce((sum, d) => sum + (d.total_amount ?? 0), 0);
  const totalRemaining = debts.reduce(
    (sum, d) => sum + (d.total_amount - d.installment_value * d.paid_installments),
    0
  );
  const totalInstallmentsRemaining = debts.reduce(
    (sum, d) => sum + (d.total_installments - d.paid_installments),
    0
  );

  return { debts, loading, addDebt, updateDebt, removeDebt, totalDebt, totalRemaining, totalInstallmentsRemaining, refresh };
}
