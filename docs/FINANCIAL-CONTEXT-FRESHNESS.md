# Context Freshness

The context is subject to time decay because financial realities change over the month.

## Rules
- Context is "stale" if the `lastConfirmedAt` timestamp is >= 15 days older than the current date.
- Context is "expiring_soon" if the difference is >= 12 days.
- A stale context triggers UX warnings but does not block the decision engine (it just flags the data quality as stale).
- The freshness functions are pure and always take the `currentDate` as an argument (no implicit `Date.now()`).
