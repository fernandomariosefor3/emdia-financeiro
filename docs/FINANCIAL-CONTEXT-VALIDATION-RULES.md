# Validation Rules

## Core Principles
1. Purity: The validation function never mutates the original object.
2. No Fallbacks: Missing or invalid fields trigger strict errors (no silent normalization to defaults).

## Validations
- Schema Version: Must be exactly 1.
- Dates: Must be valid civil dates (YYYY-MM-DD).
- Reference Balance Date: Cannot be in the future.
- Amounts: Must be integers in cents, non-negative where applicable (e.g., minimum reserve, protected goals), > 0 for incomes and commitments.
- Explicit Zero: Configured minimum reserve of 0 must have `explicitZero: true`. If > 0, it must have `explicitZero: false`.
- Bounds: Arrays must not exceed defined limits. Strings must not exceed max lengths.
- Duplicate IDs: Checked within each domain array.

## Security Audit Note
In our CI pipeline, the `pnpm audit --audit-level=high` step is currently configured with `continue-on-error: true`. This means that vulnerabilities found by the audit **will not block the pipeline**. A future P0 task has been added to the backlog to evaluate and enforce blocking merges on high severity vulnerabilities. The pipeline is passing, but this does not imply "Security Audit aprovado sem vulnerabilidades" unless explicitly checked in the CI logs.
