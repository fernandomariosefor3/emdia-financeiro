import { MAX_MONEY_IN_CENTS, MAX_DESCRIPTION_LENGTH } from "../context/constants";
import {
  FinancialCommand,
  CommandValidationError,
  CommandValidationResult,
} from "./types";

const COMMAND_TYPES: FinancialCommand["type"][] = [
  "record_expense",
  "record_income",
  "ask_financial_status",
  "simulate_purchase",
  "create_commitment",
];

const SOURCES: FinancialCommand["source"][] = ["web", "whatsapp"];
const CONFIDENCES: FinancialCommand["confidence"][] = ["confirmed", "probable", "uncertain"];
const CONFIRMATION_STATUSES: FinancialCommand["confirmationStatus"][] = ["pending", "confirmed", "rejected"];

const RECORD_TYPES: FinancialCommand["type"][] = ["record_expense", "record_income"];

function isCivilDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));
}

function isValidAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && Math.abs(value) <= MAX_MONEY_IN_CENTS;
}

/**
 * Structural + business validation for a channel-neutral FinancialCommand.
 * The only business invariant enforced here is source-agnostic on purpose:
 * a command can never be "confirmed" while its amount or date is still
 * ambiguous — this applies equally to web and WhatsApp, so there is no
 * privileged path that lets a WhatsApp-originated command skip the
 * confirmation gate (see confirmCommand).
 */
export function validateFinancialCommand(input: unknown): CommandValidationResult {
  const errors: CommandValidationError[] = [];

  if (!input || typeof input !== "object") {
    return { success: false, errors: [{ code: "INVALID_COMMAND", message: "Input is not an object", path: [] }] };
  }

  const cmd = input as Partial<FinancialCommand>;

  if (typeof cmd.commandId !== "string" || cmd.commandId.trim().length === 0) {
    errors.push({ code: "INVALID_COMMAND_ID", message: "commandId is required", path: ["commandId"] });
  }
  if (typeof cmd.userId !== "string" || cmd.userId.trim().length === 0) {
    errors.push({ code: "INVALID_USER_ID", message: "userId is required", path: ["userId"] });
  }
  if (!cmd.source || !SOURCES.includes(cmd.source)) {
    errors.push({ code: "INVALID_SOURCE", message: "source must be 'web' or 'whatsapp'", path: ["source"] });
  }
  if (!cmd.type || !COMMAND_TYPES.includes(cmd.type)) {
    errors.push({ code: "INVALID_TYPE", message: "Unknown command type", path: ["type"] });
  }
  if (cmd.amountInCents !== null && cmd.amountInCents !== undefined && !isValidAmount(cmd.amountInCents)) {
    errors.push({ code: "INVALID_AMOUNT", message: "amountInCents must be an integer within range, or null", path: ["amountInCents"] });
  }
  if (typeof cmd.description !== "string" || cmd.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push({ code: "INVALID_DESCRIPTION", message: "description is required and must respect the max length", path: ["description"] });
  }
  if (cmd.categorySuggestion !== null && cmd.categorySuggestion !== undefined && typeof cmd.categorySuggestion !== "string") {
    errors.push({ code: "INVALID_CATEGORY_SUGGESTION", message: "categorySuggestion must be a string or null", path: ["categorySuggestion"] });
  }
  if (cmd.occurredOn !== null && cmd.occurredOn !== undefined && !isCivilDate(cmd.occurredOn)) {
    errors.push({ code: "INVALID_DATE", message: "occurredOn must be a valid civil date or null", path: ["occurredOn"] });
  }
  if (!cmd.confidence || !CONFIDENCES.includes(cmd.confidence)) {
    errors.push({ code: "INVALID_CONFIDENCE", message: "Unknown confidence value", path: ["confidence"] });
  }
  if (!cmd.confirmationStatus || !CONFIRMATION_STATUSES.includes(cmd.confirmationStatus)) {
    errors.push({ code: "INVALID_CONFIRMATION_STATUS", message: "Unknown confirmationStatus value", path: ["confirmationStatus"] });
  }
  if (typeof cmd.createdAt !== "string" || isNaN(Date.parse(cmd.createdAt))) {
    errors.push({ code: "INVALID_CREATED_AT", message: "createdAt must be a valid ISO date string", path: ["createdAt"] });
  }

  if (errors.length > 0) return { success: false, errors };

  const command = cmd as FinancialCommand;

  if (command.confirmationStatus === "confirmed" && (command.amountInCents === null || command.occurredOn === null)) {
    errors.push({
      code: "AMBIGUOUS_COMMAND_CANNOT_BE_CONFIRMED",
      message: "A command with an ambiguous amount or date must stay pending",
      path: ["confirmationStatus"],
    });
  }

  if (errors.length > 0) return { success: false, errors };

  return { success: true, data: command };
}

/**
 * True only when the command is fully unambiguous and has been explicitly
 * confirmed through confirmCommand — regardless of source. There is no
 * write path anywhere in this module; this predicate is what a future
 * writer (out of scope for this phase) would consult before applying the
 * command.
 */
export function canApplyCommand(command: FinancialCommand): boolean {
  if (!RECORD_TYPES.includes(command.type)) return false;
  return (
    command.confirmationStatus === "confirmed" &&
    command.amountInCents !== null &&
    command.occurredOn !== null
  );
}

export function isDuplicateCommand(existing: readonly FinancialCommand[], candidate: FinancialCommand): boolean {
  return existing.some((c) => c.commandId === candidate.commandId);
}

export interface CommandCorrections {
  amountInCents?: number;
  occurredOn?: string;
  categorySuggestion?: string | null;
  description?: string;
}

/**
 * The only sanctioned way to move a command into "confirmed" — always
 * user-driven, always re-validated. Returns a new object; never mutates
 * the input.
 */
export function confirmCommand(command: FinancialCommand, corrections: CommandCorrections = {}): CommandValidationResult {
  const candidate: FinancialCommand = {
    ...command,
    ...corrections,
    confirmationStatus: "confirmed",
  };
  return validateFinancialCommand(candidate);
}

export function rejectCommand(command: FinancialCommand): FinancialCommand {
  return { ...command, confirmationStatus: "rejected" };
}
