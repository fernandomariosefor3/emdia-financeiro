import { MoneyInCents } from "../types";

export type FinancialCommandType =
  | "record_expense"
  | "record_income"
  | "ask_financial_status"
  | "simulate_purchase"
  | "create_commitment";

export type FinancialCommandSource = "web" | "whatsapp";

export type FinancialCommandConfirmationStatus = "pending" | "confirmed" | "rejected";

export type FinancialCommandConfidence = "confirmed" | "probable" | "uncertain";

/**
 * Channel-neutral financial command — the shared shape both the web app and
 * a future WhatsApp integration ("Emdia no Zap") produce. Pure data only:
 * nothing in this module performs I/O, calls an LLM, or reaches WhatsApp.
 */
export interface FinancialCommand {
  commandId: string;
  userId: string;
  source: FinancialCommandSource;
  type: FinancialCommandType;
  /** null when the amount could not be interpreted unambiguously. */
  amountInCents: MoneyInCents | null;
  description: string;
  /** A hint only — never treated as a confirmed category. */
  categorySuggestion: string | null;
  /** null when the date could not be interpreted unambiguously. YYYY-MM-DD. */
  occurredOn: string | null;
  confidence: FinancialCommandConfidence;
  confirmationStatus: FinancialCommandConfirmationStatus;
  createdAt: string; // ISO
}

export interface CommandValidationError {
  code: string;
  message: string;
  path: string[];
}

export type CommandValidationResult =
  | { success: true; data: FinancialCommand }
  | { success: false; errors: CommandValidationError[] };
