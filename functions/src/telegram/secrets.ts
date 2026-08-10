import { defineSecret } from "firebase-functions/params";

// Declared via Firebase Secret Manager (firebase functions:secrets:set) —
// never given a value here, in docs, in tests, or logged.
// TELEGRAM_BOT_TOKEN: O token do bot obtido via @BotFather
// TELEGRAM_WEBHOOK_SECRET: Segredo usado para validar o header X-Telegram-Bot-Api-Secret-Token
// TELEGRAM_LINK_CODE_SECRET: Segredo interno para gerar hash HMAC dos códigos de vinculação
export const TELEGRAM_BOT_TOKEN = defineSecret("TELEGRAM_BOT_TOKEN");
export const TELEGRAM_WEBHOOK_SECRET = defineSecret("TELEGRAM_WEBHOOK_SECRET");
export const TELEGRAM_LINK_CODE_SECRET = defineSecret("TELEGRAM_LINK_CODE_SECRET");
