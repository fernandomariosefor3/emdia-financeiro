# Decision Engine Adapter

The `buildDecisionContext` function transforms the confirmed context document and the raw historical transactions into the projection arrays expected by the Decision Engine.

## Rules
1. Transactions occurring strictly **before or on** the `referenceBalance.referenceDate` are ignored (prevent double counting).
2. Transactions occurring **after** the `referenceDate` but **on or before** the `currentDate` modify the `currentBalanceInCents`.
3. Transactions occurring **after** the `currentDate` but within the `horizonEndDate` are converted into future `commitments` or `expectedIncomes` (projections).
4. Recurring commitments are unrolled into specific occurrences for every due date within the horizon.
5. Minimum reserve and protected goals are summed to `protectedAmountInCents` based on preferences.
