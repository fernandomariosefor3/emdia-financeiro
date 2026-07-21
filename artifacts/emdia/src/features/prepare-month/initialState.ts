import { PrepareMonthFormState } from "./types";

export const MAX_PROTOTYPE_INCOMES = 3;
export const MAX_PROTOTYPE_COMMITMENTS = 5;
export const MAX_PROTOTYPE_GOALS = 3;

export function createInitialPrepareMonthState(): PrepareMonthFormState {
  return {
    referenceBalance: { amountReaisText: "", referenceDate: "" },
    reserve: { choice: "undecided", amountReaisText: "" },
    incomes: [],
    commitments: [],
    goals: [],
  };
}

let localEntryCounter = 0;

export function createLocalEntryId(prefix: string): string {
  localEntryCounter += 1;
  return `${prefix}-${localEntryCounter}`;
}
