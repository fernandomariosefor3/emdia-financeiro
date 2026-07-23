import { defineSecret } from "firebase-functions/params";

// Declared via Firebase Secret Manager (firebase functions:secrets:set) —
// never given a value here, in docs, in tests, or logged. See
// docs/EMDIA-WHATSAPP-VISION.md for the operational setup checklist.
export const META_WHATSAPP_ACCESS_TOKEN = defineSecret("META_WHATSAPP_ACCESS_TOKEN");
export const META_WHATSAPP_APP_SECRET = defineSecret("META_WHATSAPP_APP_SECRET");
export const META_WHATSAPP_VERIFY_TOKEN = defineSecret("META_WHATSAPP_VERIFY_TOKEN");
export const META_WHATSAPP_PHONE_NUMBER_ID = defineSecret("META_WHATSAPP_PHONE_NUMBER_ID");
export const WHATSAPP_LINK_CODE_SECRET = defineSecret("WHATSAPP_LINK_CODE_SECRET");
