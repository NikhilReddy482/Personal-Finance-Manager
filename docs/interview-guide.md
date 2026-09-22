# Financial Flow — Technical Defense & Interview Guide

### 1. Why is Financial Flow not just a standard expense tracker or banking app?
Banking apps focus on banking operations (fund transfers, account balances, card management) and are locked to single institutions. Financial Flow is an independent multi-source financial intelligence layer that normalizes statements from heterogeneous institutions, detects recurring commitments & statistical anomalies, estimates budget pace, and grounds conversational AI strictly in user financial evidence.

### 2. Why use Integer Minor Units instead of floating point numbers?
JavaScript IEEE 754 floating-point arithmetic introduces rounding drift (e.g. `0.1 + 0.2 === 0.30000000000000004`). In financial systems, every transaction and budget is represented in integer minor units (paise / cents), completely avoiding floating-point imprecision.

### 3. How do you prevent AI Hallucinations for personal financial data?
The LLM is completely forbidden from calculating authoritative numbers or directly querying MongoDB. Instead, approved backend tools execute deterministic aggregation pipelines, and the LLM receives verified JSON summaries to generate the user-facing explanation. Users can inspect the exact tool calculation via "View Evidence".

### 4. How are duplicate transactions prevented across overlapping statement uploads?
A deterministic SHA-256 fingerprint is computed for each row: `hash(userId + accountId + dateISO + amountMinor + normalizedDescription)`. If an identical fingerprint exists, the transaction is flagged during staging preview rather than silently inserted.
