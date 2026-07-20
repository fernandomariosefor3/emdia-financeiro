import { ExpectedIncome, FinancialCommitment } from "@/domain/finance/types";

export const mockReferenceDate = "2026-07-20";

export const mockInitialBalanceInCents = 124000; // R$ 1.240,00
export const mockMinimumReserveInCents = 25000;  // R$ 250,00

export const mockConfirmedIncome: ExpectedIncome[] = [
  {
    id: "inc-1",
    description: "Salário",
    amountInCents: 250000, // R$ 2.500,00
    expectedDate: "2026-07-28",
    confidence: "confirmed",
    status: "pending"
  }
];

export const mockCommitments: FinancialCommitment[] = [
  {
    id: "com-1",
    name: "Energia",
    amountInCents: 18700,
    dueDate: "2026-07-23",
    status: "pending",
    essential: true,
    priority: 1
  },
  {
    id: "com-2",
    name: "Internet",
    amountInCents: 16000,
    dueDate: "2026-07-24",
    status: "pending",
    essential: true,
    priority: 2
  },
  {
    id: "com-3",
    name: "Cartão",
    amountInCents: 62000,
    dueDate: "2026-07-26",
    status: "pending",
    essential: true,
    priority: 3
  },
  {
    id: "com-4",
    name: "Academia",
    amountInCents: 11000,
    dueDate: "2026-07-27",
    status: "pending",
    essential: false,
    priority: 4
  }
];
