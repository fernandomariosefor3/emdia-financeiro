import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCjFOi9uQOgymbpeaNkSB8PT3maaW11tIU",
  authDomain: "emdiafinanceiro-13483.firebaseapp.com",
  projectId: "emdiafinanceiro-13483",
  storageBucket: "emdiafinanceiro-13483.firebasestorage.app",
  messagingSenderId: "36020370725",
  appId: "1:36020370725:web:2c08999b4a6131f7d1eecc",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

export { app };

export async function initAnalytics() {
  if (await isSupported()) {
    return getAnalytics(app);
  }
  return null;
}
