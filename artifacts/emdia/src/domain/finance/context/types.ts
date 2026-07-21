import { MoneyInCents } from "../types";

export type CivilDate = string; // YYYY-MM-DD

export type DataQuality = "complete" | "partial" | "insufficient" | "stale";

export interface CompletenessFlags {
  referenceBalance: boolean;
  minimumReserve: boolean;
  expectedIncome: boolean;
  recurringCommitments: boolean;
  protectedGoals: boolean;
}

export interface FinancialContextMetadata {
  schemaVersion: 1;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  lastConfirmedAt: string; // ISO
  source: string;
  dataQuality: DataQuality;
  completeness: CompletenessFlags;
  revision: number;
  idempotencyKey?: string;
}

export interface FinancialProfile {
  preferredName?: string;
  incomePattern?: string;
  planningHorizonDays?: number;
  currency?: string;
  timezone?: string;
  onboardingCompletedAt?: string; // ISO
}

export interface CalculationPreferences {
  includeProbableIncome: boolean;
  includeUncertainIncome: boolean;
  minimumDataQuality: DataQuality;
  planningHorizonDays: number;
  protectMinimumReserve: boolean;
  includePausedGoals: boolean;
}

export type MinimumReserveSetting =
  | {
      status: "missing";
    }
  | {
      status: "configured";
      amountInCents: MoneyInCents;
      explicitZero: boolean;
      lastConfirmedAt: string; // ISO
    };

export interface ReferenceBalance {
  amountInCents: MoneyInCents;
  referenceDate: CivilDate;
  source: "user_input" | "imported" | "bank_connection" | "migrated" | "estimated";
  confidence: "confirmed" | "estimated";
  lastConfirmedAt: string; // ISO
}

export interface ExpectedIncome {
  id: string;
  description: string;
  amountInCents: MoneyInCents;
  expectedDate: CivilDate;
  status: "active" | "received" | "cancelled" | "archived";
  confidence: "confirmed" | "probable" | "uncertain";
  source: string;
  recurrence?: string;
  lastConfirmedAt: string; // ISO
  archivedAt?: string; // ISO
}

export interface RecurringCommitment {
  id: string;
  name: string;
  amountInCents: MoneyInCents;
  recurrence: "monthly" | "weekly" | "yearly" | "custom_interval";
  nextDueDate: CivilDate;
  essential: boolean;
  priority: number;
  status: "active" | "paused" | "cancelled" | "archived";
  source: string;
  lastConfirmedAt: string; // ISO
  archivedAt?: string; // ISO
}

export interface ProtectedGoal {
  id: string;
  name: string;
  targetAmountInCents: MoneyInCents;
  protectedAmountInCents: MoneyInCents;
  targetDate?: CivilDate;
  status: "active" | "completed" | "paused" | "cancelled" | "archived";
  priority: number;
  source: string;
  lastConfirmedAt: string; // ISO
  archivedAt?: string; // ISO
}

export interface FinancialContextDocumentV1 {
  schemaVersion: 1;
  metadata: FinancialContextMetadata;
  profile: FinancialProfile;
  calculationPreferences: CalculationPreferences;
  referenceBalance?: ReferenceBalance;
  minimumReserve: MinimumReserveSetting;
  expectedIncomes: ExpectedIncome[];
  recurringCommitments: RecurringCommitment[];
  protectedGoals: ProtectedGoal[];
}

export interface ValidationError {
  code: string;
  message: string;
  path: string[];
}

export interface ValidationWarning {
  code: string;
  message: string;
  path: string[];
}

export type ValidationResult<T> = 
  | { success: true; data: T; warnings: ValidationWarning[]; normalizedFields: string[] }
  | { success: false; errors: ValidationError[]; warnings: ValidationWarning[] };
