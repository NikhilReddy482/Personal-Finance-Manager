# Financial Flow — AI-Powered Personal Finance Intelligence Platform

Financial Flow is a personal finance intelligence platform that ingests heterogeneous financial statements (CSV, XLSX, PDF), converts disparate statement formats into a unified transaction schema, categorizes transactions using a hybrid rule-based + ML pipeline, detects recurring commitments & anomalies (via Isolation Forest), computes deterministic financial analytics, and powers an AI conversational assistant strictly grounded in the authenticated user's financial data.

---

## 🏗️ Architectural Overview

```
Financial Statements (CSV / XLSX / PDF)
       │
       ▼
Universal Normalizer & Duplicate Fingerprinting (SHA-256)
       │
       ▼
Import Staging Preview & User Confirmation
       │
       ▼
Hybrid Classifier (User Rules ➔ Merchant Engine ➔ Scikit-Learn TF-IDF ➔ Fallback)
       │
       ▼
Deterministic Analytics Engine (Cash Flow, Pace, Savings Rate)
       │
   ┌───┴────────────────────────┬────────────────────────┐
   ▼                            ▼                        ▼
Budget Intelligence       Recurring & Subs          Isolation Forest
(Pace & Month-End)      (Burn & Timeline)        (Unusual Tx Detection)
   │                            │                        │
   └───────────────────┬────────┴────────────────────────┘
                       ▼
            Structured Insight Engine
                       │
                       ▼
       Flagship "Explain My Finances" &
     Grounded AI Financial Assistant (OpenRouter)
```

---

## ⚡ Key Highlights & Principles

1. **Zero Financial Hallucinations**: The conversational AI assistant is strictly bound to approved backend deterministic tools (`getFinancialSummary`, `getCategorySpending`, `getBudgetStatus`, `getAnomalies`, `getMonthlyComparison`). The LLM never computes authoritative financial metrics.
2. **Integer Minor Units (`paise`)**: All monetary figures are stored and calculated as integers to eliminate floating-point arithmetic errors (`0.1 + 0.2 !== 0.3`).
3. **Multi-tier Universal Statement Parser**: Handles heterogeneous column synonyms (`Narration`, `Withdrawal Amt`, `Cr`, `Value Date`) across Indian and global banks.
4. **Multi-Tenant IDOR Protection**: Server-side user identity resolution (`req.userId = session.userId`) on every query.
5. **Two-Factor Authentication (TOTP)**: Compatible with Google Authenticator, Microsoft Authenticator, and Authy with AES-256-GCM encrypted secrets at rest and hashed single-use recovery codes.
6. **Isolation Forest & Statistical Anomalies**: Highlights unusual spending deviations with explainable context without alarmist fraud accusations.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- Python (3.10+)

### Setup
```bash
# 1. Install Server dependencies
cd server
npm install

# 2. Install Client dependencies
cd ../client
npm install

# 3. Start Backend API
cd ../server
npm run dev

# 4. Start Frontend Client
cd ../client
npm run dev

# 5. Start ML Microservice (Optional)
cd ../ml-service
uvicorn app.main:app --port 8000
```
