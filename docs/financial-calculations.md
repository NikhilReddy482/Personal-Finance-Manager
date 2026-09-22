# Deterministic Financial Calculations

1. **Integer Minor Units**: All monetary calculations are performed in `paise` (integer) to ensure exactness.
2. **Savings Formula**: `Savings = Total Income - Total Consumption Expenses`.
3. **Savings Rate**: `(Savings / Total Income) * 100` (safe against zero income).
4. **Budget Spending Pace**: `Daily Spend Velocity = Spent / Days Elapsed`. `Projected Month-End Spend = Daily Velocity * Total Days In Month`.
