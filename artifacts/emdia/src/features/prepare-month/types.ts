export type ReserveChoice = "undecided" | "want_to_protect" | "confirmed_none";

export interface ReferenceBalanceForm {
  amountReaisText: string;
  referenceDate: string; // YYYY-MM-DD
}

export interface ReserveForm {
  choice: ReserveChoice;
  amountReaisText: string;
}

export type IncomeConfidenceLabel = "certain" | "probable" | "uncertain";

export interface IncomeFormEntry {
  id: string;
  description: string;
  amountReaisText: string;
  expectedDate: string; // YYYY-MM-DD
  confidenceLabel: IncomeConfidenceLabel;
}

export type CommitmentRecurrenceLabel = "monthly" | "weekly" | "yearly";

export interface CommitmentFormEntry {
  id: string;
  name: string;
  amountReaisText: string;
  nextDueDate: string; // YYYY-MM-DD
  recurrence: CommitmentRecurrenceLabel;
  essential: boolean;
}

export interface GoalFormEntry {
  id: string;
  name: string;
  targetAmountReaisText: string;
  protectedAmountReaisText: string;
  targetDate: string; // YYYY-MM-DD, empty string means not set
  priority: number;
}

export interface PrepareMonthFormState {
  referenceBalance: ReferenceBalanceForm;
  reserve: ReserveForm;
  incomes: IncomeFormEntry[];
  commitments: CommitmentFormEntry[];
  goals: GoalFormEntry[];
}

export type PrepareMonthScreen =
  | "balance"
  | "reserve"
  | "income"
  | "commitments"
  | "goals"
  | "preview";

export const PREPARE_MONTH_SCREENS: PrepareMonthScreen[] = [
  "balance",
  "reserve",
  "income",
  "commitments",
  "goals",
  "preview",
];

export interface PrepareMonthStage {
  screens: PrepareMonthScreen[];
  label: string;
}

export const PREPARE_MONTH_STAGES: PrepareMonthStage[] = [
  { screens: ["balance"], label: "Seu saldo" },
  { screens: ["reserve"], label: "Sua reserva" },
  { screens: ["income"], label: "Receitas esperadas" },
  { screens: ["commitments"], label: "Compromissos" },
  { screens: ["goals"], label: "Metas protegidas" },
  { screens: ["preview"], label: "Seu mês preparado" },
];
