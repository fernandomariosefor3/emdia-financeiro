import { 
  CivilDate,
  FinancialContextDocumentV1,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from "./types";
import {
  MAX_MONEY_IN_CENTS,
  MAX_EXPECTED_INCOMES,
  MAX_RECURRING_COMMITMENTS,
  MAX_PROTECTED_GOALS,
  MAX_DESCRIPTION_LENGTH,
  MAX_NAME_LENGTH
} from "./constants";

function isCivilDate(date: unknown): date is CivilDate {
  return typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}

function isValidMoney(amount: unknown): boolean {
  return typeof amount === "number" && Number.isInteger(amount) && Math.abs(amount) <= MAX_MONEY_IN_CENTS;
}

export function validateFinancialContextDocument(
  input: unknown,
  referenceDate: CivilDate
): ValidationResult<FinancialContextDocumentV1> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const normalizedFields: string[] = [];

  if (!input || typeof input !== "object") {
    errors.push({ code: "INVALID_DOCUMENT", message: "Input is not an object", path: [] });
    return { success: false, errors, warnings };
  }

  const doc = input as Partial<FinancialContextDocumentV1>;

  if (!doc.schemaVersion) {
    errors.push({ code: "MISSING_SCHEMA_VERSION", message: "Schema version is missing", path: ["schemaVersion"] });
  } else if (doc.schemaVersion !== 1) {
    errors.push({ code: "INVALID_SCHEMA_VERSION", message: "Schema version must be 1", path: ["schemaVersion"] });
  }

  if (doc.metadata) {
    if (doc.metadata.idempotencyKey !== undefined) {
      if (typeof doc.metadata.idempotencyKey !== "string" || doc.metadata.idempotencyKey.length === 0 || doc.metadata.idempotencyKey.length > 100) {
        errors.push({ code: "INVALID_IDEMPOTENCY_KEY", message: "Idempotency key must be a valid string up to 100 chars", path: ["metadata", "idempotencyKey"] });
      }
    }
  }

  if (!doc.referenceBalance) {
    warnings.push({ code: "MISSING_REFERENCE_BALANCE", message: "Reference balance is missing", path: ["referenceBalance"] });
  } else {
    const rb = doc.referenceBalance;
    if (!isValidMoney(rb.amountInCents)) {
      errors.push({ code: "INVALID_MONEY", message: "Invalid amountInCents in referenceBalance", path: ["referenceBalance", "amountInCents"] });
    }
    if (!isCivilDate(rb.referenceDate)) {
      errors.push({ code: "INVALID_DATE", message: "Invalid referenceDate", path: ["referenceBalance", "referenceDate"] });
    } else if (rb.referenceDate > referenceDate) {
      errors.push({ code: "FUTURE_REFERENCE_BALANCE_DATE", message: "Reference date cannot be in the future", path: ["referenceBalance", "referenceDate"] });
    }
  }

  if (!doc.minimumReserve || (doc.minimumReserve.status !== "missing" && doc.minimumReserve.status !== "configured")) {
    errors.push({ code: "INVALID_RESERVE_STATUS", message: "Invalid minimum reserve status", path: ["minimumReserve"] });
  } else if (doc.minimumReserve.status === "configured") {
    const res = doc.minimumReserve;
    if (!isValidMoney(res.amountInCents)) {
      errors.push({ code: "INVALID_MONEY", message: "Invalid minimum reserve amount", path: ["minimumReserve", "amountInCents"] });
    } else {
      if (res.amountInCents === 0 && !res.explicitZero) {
        errors.push({ code: "INVALID_EXPLICIT_ZERO", message: "Reserve amount is 0 but explicitZero is false", path: ["minimumReserve", "explicitZero"] });
      }
      if (res.amountInCents > 0 && res.explicitZero) {
        errors.push({ code: "INVALID_EXPLICIT_ZERO", message: "Reserve amount is > 0 but explicitZero is true", path: ["minimumReserve", "explicitZero"] });
      }
    }
  }

  if (Array.isArray(doc.expectedIncomes)) {
    if (doc.expectedIncomes.length > MAX_EXPECTED_INCOMES) {
      errors.push({ code: "TOO_MANY_EXPECTED_INCOMES", message: `Max expected incomes exceeded (${MAX_EXPECTED_INCOMES})`, path: ["expectedIncomes"] });
    }
    const incomeIds = new Set<string>();
    doc.expectedIncomes.forEach((inc, index) => {
      if (incomeIds.has(inc.id)) errors.push({ code: "DUPLICATE_ID", message: `Duplicate ID: ${inc.id}`, path: ["expectedIncomes", String(index)] });
      incomeIds.add(inc.id);

      if (!isValidMoney(inc.amountInCents) || inc.amountInCents <= 0) {
        errors.push({ code: "INVALID_MONEY", message: "Income amount must be greater than zero", path: ["expectedIncomes", String(index), "amountInCents"] });
      }
      if (inc.description && inc.description.length > MAX_DESCRIPTION_LENGTH) {
        errors.push({ code: "INVALID_DESCRIPTION", message: "Description too long", path: ["expectedIncomes", String(index), "description"] });
      }
      if (!isCivilDate(inc.expectedDate)) {
        errors.push({ code: "INVALID_DATE", message: "Invalid expected date", path: ["expectedIncomes", String(index), "expectedDate"] });
      }
    });
  }

  if (Array.isArray(doc.recurringCommitments)) {
    if (doc.recurringCommitments.length > MAX_RECURRING_COMMITMENTS) {
      errors.push({ code: "TOO_MANY_COMMITMENTS", message: `Max recurring commitments exceeded (${MAX_RECURRING_COMMITMENTS})`, path: ["recurringCommitments"] });
    }
    const commitIds = new Set<string>();
    doc.recurringCommitments.forEach((cmt, index) => {
      if (commitIds.has(cmt.id)) errors.push({ code: "DUPLICATE_ID", message: `Duplicate ID: ${cmt.id}`, path: ["recurringCommitments", String(index)] });
      commitIds.add(cmt.id);

      if (!isValidMoney(cmt.amountInCents) || cmt.amountInCents <= 0) {
        errors.push({ code: "INVALID_MONEY", message: "Commitment amount must be greater than zero", path: ["recurringCommitments", String(index), "amountInCents"] });
      }
      if (cmt.name && cmt.name.length > MAX_NAME_LENGTH) {
        errors.push({ code: "INVALID_NAME", message: "Name too long", path: ["recurringCommitments", String(index), "name"] });
      }
      if (!isCivilDate(cmt.nextDueDate)) {
        errors.push({ code: "INVALID_DATE", message: "Invalid due date", path: ["recurringCommitments", String(index), "nextDueDate"] });
      }
      if (!["monthly", "weekly", "yearly", "custom_interval"].includes(cmt.recurrence)) {
        errors.push({ code: "INVALID_RECURRENCE", message: "Invalid recurrence type", path: ["recurringCommitments", String(index), "recurrence"] });
      }
      if (cmt.recurrence === "custom_interval") {
        errors.push({ code: "UNSUPPORTED_CUSTOM_INTERVAL", message: "Custom interval is not supported in V1", path: ["recurringCommitments", String(index), "recurrence"] });
      }
    });
  }

  if (Array.isArray(doc.protectedGoals)) {
    if (doc.protectedGoals.length > MAX_PROTECTED_GOALS) {
      errors.push({ code: "TOO_MANY_GOALS", message: `Max protected goals exceeded (${MAX_PROTECTED_GOALS})`, path: ["protectedGoals"] });
    }
    const goalIds = new Set<string>();
    doc.protectedGoals.forEach((goal, index) => {
      if (goalIds.has(goal.id)) errors.push({ code: "DUPLICATE_ID", message: `Duplicate ID: ${goal.id}`, path: ["protectedGoals", String(index)] });
      goalIds.add(goal.id);

      if (!isValidMoney(goal.targetAmountInCents) || goal.targetAmountInCents <= 0) {
        errors.push({ code: "INVALID_MONEY", message: "Goal target amount must be > 0", path: ["protectedGoals", String(index), "targetAmountInCents"] });
      }
      if (!isValidMoney(goal.protectedAmountInCents) || goal.protectedAmountInCents < 0) {
        errors.push({ code: "INVALID_MONEY", message: "Goal protected amount must be >= 0", path: ["protectedGoals", String(index), "protectedAmountInCents"] });
      }
      if (goal.protectedAmountInCents > goal.targetAmountInCents) {
        errors.push({ code: "INVALID_MONEY", message: "Protected amount cannot exceed target", path: ["protectedGoals", String(index), "protectedAmountInCents"] });
      }
    });
  }

  if (errors.length > 0) {
    return { success: false, errors, warnings };
  }

  return { success: true, data: doc as FinancialContextDocumentV1, warnings, normalizedFields };
}
