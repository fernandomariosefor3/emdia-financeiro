import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import type { Transaction } from "@/lib/types";

type NewTransaction = Omit<Transaction, "id" | "createdAt">;

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const ref = collection(db, "users", user.uid, "transactions");
    const q = query(ref, orderBy("date", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Transaction, "id">),
      }));
      setTransactions(docs);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  async function addTransaction(data: NewTransaction) {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "transactions"), {
      ...data,
      createdAt: Timestamp.now().toDate().toISOString(),
    });
  }

  async function updateTransaction(id: string, data: Partial<NewTransaction>) {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "transactions", id), data);
  }

  async function deleteTransaction(id: string) {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "transactions", id));
  }

  return { transactions, loading, addTransaction, updateTransaction, deleteTransaction };
}
