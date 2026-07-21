# Financial Context Contracts

## Overview
The Financial Context encapsulates the confirmed state of a user's finances for the month. It acts as a snapshot that is explicitly validated and confirmed by the user.

## Constants & Limits
- `MAX_EXPECTED_INCOMES` = 50
- `MAX_RECURRING_COMMITMENTS` = 100
- `MAX_PROTECTED_GOALS` = 20
- `MAX_DESCRIPTION_LENGTH` = 100
- `MAX_NAME_LENGTH` = 50
- `MAX_PLANNING_HORIZON_DAYS` = 365
- `MAX_MONEY_IN_CENTS` = 99999999999
- `MAX_RECURRENCE_INTERVAL_DAYS` = 365
- `STALE_CONTEXT_THRESHOLD_DAYS` = 15

## Core Interfaces
- **FinancialContextDocumentV1**: The top-level document.
- **ReferenceBalance**: The explicit initial balance confirmed at a specific civil date.
- **MinimumReserveSetting**: Allows explicit missing state or explicit 0 via `explicitZero`.
- **ExpectedIncome**, **RecurringCommitment**, **ProtectedGoal**: Core domain arrays with limit boundaries.

## Behaviors
- **Idempotency Key**: Validated strictly as a non-empty string up to 100 characters. Absence is permitted but not silently invented. Ensures identical requests don't cause anomalies upon retry.
- **Custom Interval**: The `custom_interval` recurrence is currently marked as `UNSUPPORTED_CUSTOM_INTERVAL` in V1 and rejected. No contract is allowed to accept data that the engine cannot correctly project yet.
