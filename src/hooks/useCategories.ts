import { useState, useEffect, useCallback } from "react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, doc, updateDoc, deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  type: "receita" | "despesa";
  created_at: string;
}

const DEFAULT_CATEGORIES: Omit<Category, "id" | "user_id" | "created_at">[] = [
  { name: "Salário", icon: "💰", color: "#1A6B4A", type: "receita" },
  { name: "Freelance", icon: "💻", color: "#F4A61D", type: "receita" },
  { name: "Investimentos", icon: "📈", color: "#1A6B4A", type: "receita" },
  { name: "Outros (Receita)", icon: "📥", color: "#6B7280", type: "receita" },
  { name: "Moradia", icon: "🏠", color: "#F43F5E", type: "despesa" },
  { name: "Alimentação", icon: "🍽️", color: "#F97316", type: "despesa" },
  { name: "Transporte", icon: "🚗", color: "#14B8A6", type: "despesa" },
  { name: "Saúde", icon: "💊", color: "#10B981", type: "despesa" },
  { name: "Educação", icon: "📚", color: "#F59E0B", type: "despesa" },
  { name: "Lazer", icon: "🎮", color: "#EC4899", type: "despesa" },
  { name: "Vestuário", icon: "👕", color: "#8B5CF6", type: "despesa" },
  { name: "Dívidas", icon: "💳", color: "#EF4444", type: "despesa" },
  { name: "Outros (Despesa)", icon: "📤", color: "#6B7280", type: "despesa" },
];

export function useCategories(userId: string | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);

  const seedDefaults = useCallback(async (uid: string) => {
    const col = collection(db, "users", uid, "categories");
    for (const c of DEFAULT_CATEGORIES) {
      await addDoc(col, { ...c, user_id: uid, created_at: serverTimestamp() });
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    const col = collection(db, "users", userId, "categories");
    const q = query(col, orderBy("name"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty && !seeded) {
        setSeeded(true);
        await seedDefaults(userId);
        return;
      }
      setCategories(
        snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            user_id: data.user_id ?? userId,
            name: data.name,
            icon: data.icon,
            color: data.color,
            type: data.type,
            created_at: data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
          } as Category;
        })
      );
      setLoading(false);
    });

    return unsubscribe;
  }, [userId, seeded, seedDefaults]);

  const addCategory = async (cat: Omit<Category, "id" | "user_id" | "created_at">) => {
    if (!userId) return;
    await addDoc(collection(db, "users", userId, "categories"), {
      ...cat,
      user_id: userId,
      created_at: serverTimestamp(),
    });
  };

  const updateCategory = async (id: string, updates: Partial<Omit<Category, "id" | "user_id" | "created_at">>) => {
    if (!userId) return;
    await updateDoc(doc(db, "users", userId, "categories", id), updates);
  };

  const removeCategory = async (id: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, "users", userId, "categories", id));
  };

  const refresh = useCallback(() => {}, []);

  return { categories, loading, addCategory, updateCategory, removeCategory, refresh };
}
