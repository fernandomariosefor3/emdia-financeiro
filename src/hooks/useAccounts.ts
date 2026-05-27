import { useState, useEffect, useCallback } from "react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, doc, updateDoc, deleteDoc, getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: "corrente" | "poupanca" | "carteira" | "credito" | "outro";
  bank?: string;
  initial_balance: number;
  current_balance: number;
  created_at: string;
}

const DEFAULT_ACCOUNTS: Omit<Account, "id" | "user_id" | "created_at">[] = [
  { name: "Conta Corrente", type: "corrente", bank: "Itaú", initial_balance: 0, current_balance: 0 },
  { name: "Poupança", type: "poupanca", bank: "Itaú", initial_balance: 0, current_balance: 0 },
  { name: "Carteira", type: "carteira", bank: undefined, initial_balance: 0, current_balance: 0 },
  { name: "Cartão de Crédito", type: "credito", bank: "Nubank", initial_balance: 0, current_balance: 0 },
];

export function useAccounts(userId: string | null) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);

  const seedDefaults = useCallback(async (uid: string) => {
    const col = collection(db, "users", uid, "accounts");
    for (const a of DEFAULT_ACCOUNTS) {
      await addDoc(col, {
        user_id: uid,
        name: a.name,
        type: a.type,
        bank: a.bank ?? null,
        initial_balance: a.initial_balance,
        current_balance: a.current_balance,
        created_at: serverTimestamp(),
      });
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    const col = collection(db, "users", userId, "accounts");
    const q = query(col, orderBy("name"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty && !seeded) {
        setSeeded(true);
        await seedDefaults(userId);
        return;
      }
      setAccounts(
        snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            user_id: data.user_id ?? userId,
            name: data.name,
            type: data.type,
            bank: data.bank ?? undefined,
            initial_balance: Number(data.initial_balance ?? 0),
            current_balance: Number(data.current_balance ?? 0),
            created_at: data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
          } as Account;
        })
      );
      setLoading(false);
    });

    return unsubscribe;
  }, [userId, seeded, seedDefaults]);

  const addAccount = async (acc: Omit<Account, "id" | "user_id" | "created_at">) => {
    if (!userId) return;
    await addDoc(collection(db, "users", userId, "accounts"), {
      user_id: userId,
      name: acc.name,
      type: acc.type,
      bank: acc.bank ?? null,
      initial_balance: acc.initial_balance,
      current_balance: acc.current_balance,
      created_at: serverTimestamp(),
    });
  };

  const updateAccount = async (id: string, updates: Partial<Omit<Account, "id" | "user_id" | "created_at">>) => {
    if (!userId) return;
    const { bank, ...rest } = updates;
    await updateDoc(doc(db, "users", userId, "accounts", id), {
      ...rest,
      ...(bank !== undefined ? { bank: bank ?? null } : {}),
    });
  };

  const removeAccount = async (id: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, "users", userId, "accounts", id));
  };

  const refresh = useCallback(async () => {
    if (!userId) return;
    const snapshot = await getDocs(collection(db, "users", userId, "accounts"));
    setAccounts(
      snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          user_id: data.user_id ?? userId,
          name: data.name,
          type: data.type,
          bank: data.bank ?? undefined,
          initial_balance: Number(data.initial_balance ?? 0),
          current_balance: Number(data.current_balance ?? 0),
          created_at: data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        } as Account;
      })
    );
  }, [userId]);

  const totalBalance = accounts.reduce((sum, a) => sum + (a.current_balance ?? a.initial_balance ?? 0), 0);

  return { accounts, loading, addAccount, updateAccount, removeAccount, totalBalance, refresh };
}
