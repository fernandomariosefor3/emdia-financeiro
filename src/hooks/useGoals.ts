import { useState, useEffect, useCallback } from "react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, doc, updateDoc, deleteDoc, getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  status: "em_andamento" | "concluida" | "atrasada";
  created_at: string;
}

export function useGoals(userId: string | null) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setGoals([]);
      setLoading(false);
      return;
    }

    const col = collection(db, "users", userId, "goals");
    const q = query(col, orderBy("created_at", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGoals(
        snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            user_id: data.user_id ?? userId,
            name: data.name,
            target_amount: Number(data.target_amount ?? 0),
            current_amount: Number(data.current_amount ?? 0),
            deadline: data.deadline ?? undefined,
            status: data.status ?? "em_andamento",
            created_at: data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
          } as Goal;
        })
      );
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const addGoal = async (goal: Omit<Goal, "id" | "user_id" | "created_at" | "status">) => {
    if (!userId) return;
    await addDoc(collection(db, "users", userId, "goals"), {
      user_id: userId,
      name: goal.name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      deadline: goal.deadline ?? null,
      status: "em_andamento",
      created_at: serverTimestamp(),
    });
  };

  const updateGoal = async (id: string, updates: Partial<Omit<Goal, "id" | "user_id" | "created_at">>) => {
    if (!userId) return;
    await updateDoc(doc(db, "users", userId, "goals", id), updates);
  };

  const removeGoal = async (id: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, "users", userId, "goals", id));
  };

  const refresh = useCallback(async () => {
    if (!userId) return;
    const snapshot = await getDocs(collection(db, "users", userId, "goals"));
    setGoals(
      snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          user_id: data.user_id ?? userId,
          name: data.name,
          target_amount: Number(data.target_amount ?? 0),
          current_amount: Number(data.current_amount ?? 0),
          deadline: data.deadline ?? undefined,
          status: data.status ?? "em_andamento",
          created_at: data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        } as Goal;
      })
    );
  }, [userId]);

  return { goals, loading, addGoal, updateGoal, removeGoal, refresh };
}
