import Stripe from "stripe";

let cachedClient: Stripe | null = null;
let cachedKey: string | null = null;

/**
 * Lazily constructs (and caches) the Stripe client from a secret value
 * resolved at call time. Never invoked in this session — nothing here
 * makes a network call until a real STRIPE_SECRET_KEY is configured and a
 * billing callable actually runs.
 */
export function getStripeClient(secretKey: string): Stripe {
  if (!cachedClient || cachedKey !== secretKey) {
    cachedClient = new Stripe(secretKey);
    cachedKey = secretKey;
  }
  return cachedClient;
}
