import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

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

export async function initAnalytics() {
  if (await isSupported()) {
    return getAnalytics(app);
  }
  return null;
}
