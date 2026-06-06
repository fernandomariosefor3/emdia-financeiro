import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCjFOi9uQOgymbpeaNkSB8PT3maaW11tIU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "emdiafinanceiro-13483.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "emdiafinanceiro-13483",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "emdiafinanceiro-13483.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "36020370725",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:36020370725:web:2c08999b4a6131f7d1eecc",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);

export async function initAnalytics() {
  if (await isSupported()) {
    return getAnalytics(app);
  }
  return null;
}
