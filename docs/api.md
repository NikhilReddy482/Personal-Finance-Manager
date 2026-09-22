# REST API Reference Documentation

All endpoints are versioned under `/api/v1` and return consistent JSON structures.

### Authentication & Security
- `POST /auth/register`: Body: `{ fullName, email, password, confirmPassword }`
- `POST /auth/verify-email`: Body: `{ email, otp }`
- `POST /auth/login`: Body: `{ email, password }`
- `POST /auth/mfa/verify`: Body: `{ tempToken, code, isRecoveryCode }`
- `POST /auth/logout`: Revokes active session and clears cookie.
- `GET /security/sessions`: Returns active authenticated sessions with IP and browser.
- `POST /security/mfa/setup`: Generates base32 secret and QR code.
- `POST /security/mfa/enable`: Verifies code and returns 8 single-use recovery codes.

### Ingestion & Transactions
- `POST /imports/upload`: Multipart upload with `statement` file and `accountId`.
- `POST /imports/:batchId/confirm`: Confirms staged preview items.
- `GET /transactions`: Paginated transaction list with filters (`page`, `limit`, `search`, `category`, `type`).
- `PUT /transactions/:id`: Updates transaction category / status and captures human-in-the-loop feedback.

### Analytics & Intelligence
- `GET /analytics/overview`: High-level metrics (`totalIncome`, `totalExpense`, `savings`, `savingsRate`).
- `GET /analytics/breakdown`: Hierarchical category spend.
- `GET /analytics/trends`: Monthly cash flow trends over past N months.
- `GET /budgets`: Spending pace, remaining limits, and projected month-end spend.
- `GET /recurring`: Detected recurring subscriptions and annualized commitment totals.
- `GET /anomalies`: Flagged unusual transactions with plain-English signals.
- `GET /insights/explain-my-finances`: Flagship deterministic narrative explanation.
- `POST /assistant/chat`: Grounded AI conversational inquiry.
