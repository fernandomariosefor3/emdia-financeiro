import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UserProfile {
  name: string;
  avatarColor: string;
  joinedAt: string;
}

export const AVATAR_COLORS = [
  { label: "Indigo",  value: "#6366f1" },
  { label: "Emerald", value: "#10b981" },
  { label: "Rose",    value: "#f43f5e" },
  { label: "Amber",   value: "#f59e0b" },
  { label: "Teal",    value: "#14b8a6" },
  { label: "Coral",   value: "#ef4444" },
];

const DEFAULT_PROFILE: UserProfile = {
  name: "Usuário",
  avatarColor: "#6366f1",
  joinedAt: new Date().toISOString().slice(0, 7),
};

export function useUserProfile(userId: string | null) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    const ref = doc(db, "users", userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      setProfile({
        name: data.name ?? "Usuário",
        avatarColor: data.avatarColor ?? "#6366f1",
        joinedAt: data.joinedAt ?? new Date().toISOString().slice(0, 7),
      });
    } else {
      setProfile(DEFAULT_PROFILE);
    }
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userId) return;
    const next = { ...profile, ...updates };
    setProfile(next);
    await setDoc(
      doc(db, "users", userId),
      { name: next.name, avatarColor: next.avatarColor, joinedAt: next.joinedAt },
      { merge: true }
    );
  };

  const initials =
    profile.name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "").join("") || "U";

  return { profile, updateProfile, initials };
}
