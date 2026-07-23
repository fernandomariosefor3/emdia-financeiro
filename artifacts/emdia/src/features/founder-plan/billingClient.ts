import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export interface CreateCheckoutSessionResult {
  url: string;
}

/**
 * Thin wrapper around the authenticated createAnnualCheckoutSession
 * callable. Only called when VITE_ENABLE_BILLING is "true" — while the
 * flag is off, nothing in this module is ever invoked.
 */
export async function createAnnualCheckoutSession(): Promise<CreateCheckoutSessionResult> {
  const callable = httpsCallable<void, CreateCheckoutSessionResult>(functions, "createAnnualCheckoutSession");
  const response = await callable();
  return response.data;
}
