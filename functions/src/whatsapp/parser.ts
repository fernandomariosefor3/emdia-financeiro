import { ParsedTransactionIntent, TransactionType } from "./types";

// Deliberately simple keyword + regex matching — no AI/LLM in this phase.
const EXPENSE_KEYWORDS = ["gastei", "paguei", "comprei", "gasto de", "saiu"];
const INCOME_KEYWORDS = ["recebi", "ganhei", "caiu", "entrou", "recebimento de"];

// Captures a full numeric token (with optional thousands/decimal
// separators) as one greedy run, e.g. "38", "1200", "1.200", "38,50",
// "1.200,50" — deciding which separator means what happens afterwards in
// parseAmountToken, not in the regex itself.
const AMOUNT_PATTERN = /\d+(?:[.,]\d+)*/;

function detectType(lowerText: string): TransactionType | null {
  if (INCOME_KEYWORDS.some((kw) => lowerText.includes(kw))) return "income";
  if (EXPENSE_KEYWORDS.some((kw) => lowerText.includes(kw))) return "expense";
  return null;
}

function parseAmountToken(token: string): number | null {
  let normalized = token.trim();
  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (hasComma && hasDot) {
    // "1.200,50" — dot is thousands separator, comma is decimal.
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    // "38,50" — comma is decimal.
    normalized = normalized.replace(",", ".");
  } else if (hasDot) {
    const parts = normalized.split(".");
    if (parts[parts.length - 1].length === 3) {
      // "1.200" — dot is a thousands separator, no decimals.
      normalized = normalized.replace(/\./g, "");
    }
    // else "38.50" — treat the dot as a decimal point, leave as-is.
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

function extractDescription(originalText: string, matchedKeyword: string, amountToken: string): string {
  const lowerText = originalText.toLowerCase();
  const keywordIndex = lowerText.indexOf(matchedKeyword);

  let remainder = originalText;
  if (keywordIndex >= 0) {
    remainder = remainder.slice(0, keywordIndex) + remainder.slice(keywordIndex + matchedKeyword.length);
  }
  remainder = remainder.replace(amountToken, "");
  remainder = remainder.replace(/\br\$\s*/gi, "");
  remainder = remainder.replace(/\s{2,}/g, " ").trim();
  remainder = remainder.replace(/^(de|no|na|em|com|para)\s+/i, "").trim();

  return remainder.length > 0 ? remainder : "Lançamento via WhatsApp";
}

/**
 * Extracts type + amount + description from a free-text WhatsApp message.
 * Returns null whenever the message is ambiguous (no recognizable type
 * keyword, or no numeric amount) — an ambiguous message is never turned
 * into a pending command; the caller asks the user to rephrase instead.
 */
export function parseTransactionIntent(rawText: string): ParsedTransactionIntent | null {
  const text = rawText.trim();
  if (text.length === 0) return null;

  const lowerText = text.toLowerCase();
  const type = detectType(lowerText);
  if (!type) return null;

  const matchedKeyword = (type === "income" ? INCOME_KEYWORDS : EXPENSE_KEYWORDS).find((kw) => lowerText.includes(kw));
  if (!matchedKeyword) return null;

  const amountMatch = text.match(AMOUNT_PATTERN);
  if (!amountMatch) return null;

  const amountInCents = parseAmountToken(amountMatch[0]);
  if (amountInCents === null) return null;

  const description = extractDescription(text, matchedKeyword, amountMatch[0]);

  return { type, amountInCents, description };
}
