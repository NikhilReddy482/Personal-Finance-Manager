# MongoDB Database Schema & Index Specifications

### 1. `users`
- `_id`, `fullName`, `email` (unique index), `passwordHash` (Argon2id), `emailVerified`, `mfaEnabled`, `mfaSecretEncrypted` (AES-256-GCM), `mfaRecoveryCodeHashes`.

### 2. `accounts`
- `_id`, `userId` (index), `name`, `institutionName`, `accountType` (SAVINGS, CREDIT_CARD, etc.), `openingBalanceMinor`, `currentBalanceMinor`.

### 3. `transactions`
- `_id`, `userId` (index), `accountId` (index), `date` (ISODate, index), `description`, `normalizedDescription`, `amountMinor` (integer), `transactionType`, `category`, `subcategory`, `merchant`, `fingerprint` (index), `isRecurring`, `isAnomaly`, `reviewStatus`.
- Compound Indexes: `{ userId: 1, date: -1 }`, `{ userId: 1, category: 1, date: -1 }`, `{ userId: 1, fingerprint: 1 }`.

### 4. `budgets`
- `_id`, `userId` (index), `period` (YYYY-MM), `category`, `amountLimitMinor`, `alertThresholdPercent`.

### 5. `goals`
- `_id`, `userId` (index), `name`, `targetAmountMinor`, `currentAmountMinor`, `targetDate`, `priority`.
