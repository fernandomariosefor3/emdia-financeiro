import { describe, it, expect } from "vitest";
import { mapTransactionsToContext, RawTransaction } from "../financeDataMappers";

describe("financeDataMappers", () => {
  const referenceDate = "2026-07-20";

  it("should calculate balance correctly without double counting and ignore missing/invalid amounts", () => {
    const raw: RawTransaction[] = [
      { id: "1", type: "income", amount: 1500.50, date: "2026-07-10" }, // past income -> balance
      { id: "2", type: "expense", amount: "500", date: "2026-07-15" }, // past expense -> balance
      { id: "3", type: "expense", amount: 200, date: "2026-07-25" }, // future expense -> commitment
      { id: "4", type: "income", amount: 3000, date: "2026-07-30", confirmed: true }, // future income -> expected
      { id: "5", type: "income", amount: "invalid", date: "2026-07-10" }, // should be ignored
    ];

    const result = mapTransactionsToContext(raw, referenceDate);

    // Balance = (1500.50 - 500) * 100 = 100050
    expect(result.context.currentBalanceInCents).toBe(100050);

    // Commitments
    expect(result.context.commitments).toHaveLength(1);
    expect(result.context.commitments[0].amountInCents).toBe(20000);

    // Expected Incomes
    expect(result.context.expectedIncomes).toHaveLength(1);
    expect(result.context.expectedIncomes[0].amountInCents).toBe(300000);
    expect(result.context.expectedIncomes[0].confidence).toBe("confirmed");

    // Diagnostics
    expect(result.diagnostics.validDocumentCount).toBe(4);
    expect(result.diagnostics.invalidDocumentCount).toBe(1);
    expect(result.diagnostics.warnings).toHaveLength(1); // invalid amount warning
  });

  it("should assign 'probable' confidence if future income does not have confirmed flag", () => {
    const raw: RawTransaction[] = [
      { id: "1", type: "income", amount: 1000, date: "2026-08-01" }
    ];
    
    const result = mapTransactionsToContext(raw, referenceDate);
    expect(result.context.expectedIncomes[0].confidence).toBe("probable");
  });

  it("should not assign past transactions to future projections (no double counting)", () => {
    const raw: RawTransaction[] = [
      { id: "1", type: "expense", amount: 100, date: "2026-07-20" } // exact reference date goes to balance
    ];
    
    const result = mapTransactionsToContext(raw, referenceDate);
    expect(result.context.currentBalanceInCents).toBe(-10000);
    expect(result.context.commitments).toHaveLength(0);
  });
});
