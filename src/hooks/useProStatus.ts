import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const FREE_MONTHLY_LIMIT = 15;

export function useProStatus(userId: string | null) {
  const [isPro, setIsPro] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("emdia_onboarding") === "done";
    }
    return false;
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!userId) return;
    const ref = doc(db, "users", userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      setIsPro(!!data.isPro);
      if (data.onboardingDone) {
        setOnboardingDone(true);
        localStorage.setItem("emdia_onboarding", "done");
      }
    }
    setSettingsLoaded(true);
  }, [userId]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const activatePro = async () => {
    if (!userId) return;
    setIsPro(true);
    await setDoc(doc(db, "users", userId), { isPro: true }, { merge: true });
  };

  const deactivatePro = async () => {
    if (!userId) return;
    setIsPro(false);
    await setDoc(doc(db, "users", userId), { isPro: false }, { merge: true });
  };

  const finishOnboarding = async () => {
    if (!userId) return;
    setOnboardingDone(true);
    localStorage.setItem("emdia_onboarding", "done");
    await setDoc(doc(db, "users", userId), { onboardingDone: true }, { merge: true });
  };

  const checkLimit = (currentMonthCount: number) => isPro || currentMonthCount < FREE_MONTHLY_LIMIT;

  return { isPro, onboardingDone, settingsLoaded, activatePro, deactivatePro, finishOnboarding, checkLimit, FREE_MONTHLY_LIMIT };
}
