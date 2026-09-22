# 🌊 Financial Flow — AI-Powered Personal Finance Intelligence Platform

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Scikit--Learn](https://img.shields.io/badge/Scikit--Learn-1.4+-F7931E?logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_/_3.6_Flash-4285F4?logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**Financial Flow** is an institutional-grade personal finance management and intelligence platform. It ingests heterogeneous multi-bank statements (CSV, Excel `.xlsx`/`.xls`, and PDF), normalizes disparate transaction formats into a canonical schema, categorizes transactions via a hybrid deterministic + Scikit-Learn ML pipeline, detects recurring commitments & subscriptions, identifies statistical anomalies (via Isolation Forest), computes zero-hallucination deterministic financial analytics, and provides an autonomous conversational financial advisor strictly grounded in authenticated user statement data.

---

## 🛠️ Complete Technology Stack

### 1. 🖥️ Frontend Client Application
| Technology / Library | Purpose & Implementation |
| :--- | :--- |
| **React 18** | High-performance component-based UI architecture with hooks and custom contexts. |
| **TypeScript (v5.x)** | Complete end-to-end type safety across components, props, state, and API contracts. |
| **Vite** | Next-generation frontend build tool and lightning-fast HMR development server. |
| **Tailwind CSS (v3.4)** | Utility-first CSS framework coupled with modern design token architecture. |
| **Custom CSS Theme Engine** | Dynamic CSS custom properties (`:root` & `.dark`) enabling full institutional Light/Dark mode transitions with zero style leakage. |
| **Recharts** | Interactive financial data visualizer (Donut Category breakdowns, Area cash flow trajectories, Merchant bar charts). |
| **Lucide React** | Comprehensive, lightweight, modern iconography system. |
| **React Router DOM (v6)** | Client-side declarative routing, protected route wrappers, and navigation guards. |
| **SimpleWebAuthn Browser** | Browser-level WebAuthn client facilitating biometric passkey registration and fingerprint login (Touch ID / Windows Hello). |
| **React-Markdown & Remark-GFM** | Rich Markdown parser for rendering AI responses, financial data dossiers, evidence tables, and formulas. |
| **Axios** | Promise-based HTTP client with global request/response interceptors for sessions and error handling. |

---

### 2. ⚙️ Backend Core API Server
| Technology / Library | Purpose & Implementation |
| :--- | :--- |
| **Node.js (v18+)** | Asynchronous event-driven JavaScript/TypeScript server runtime. |
| **Express.js** | RESTful API server framework with modular routing, middleware pipelines, and controller architecture. |
| **MongoDB Atlas & Mongoose** | Cloud distributed NoSQL database with strict schema validation, compound indexing, and aggregation pipelines. |
| **Argon2 & Bcrypt** | State-of-the-art password hashing algorithms resilient against GPU/ASIC brute-force attacks. |
| **Two-Factor Auth (TOTP)** | `speakeasy` + `qrcode` generating RFC 6238 compliant TOTP secrets, backed by encrypted backup recovery codes. |
| **WebAuthn / Passkeys Server** | `@simplewebauthn/server` verifying cryptographic biometric challenges for hardware-backed logins. |
| **AES-256-GCM Encryption** | Cryptographic encryption at rest for sensitive 2FA TOTP secrets and stored access credentials. |
| **Cookie Sessions** | Secure, HTTP-only, SameSite cookie-based session authentication with server-side revocation. |
| **Universal File Parsers** | Multi-format statement ingestion engine: <br>• `csv-parse` for delimiter/synonym mapping <br>• `xlsx` for Excel spreadsheets <br>• `pdf-parse` for PDF bank statement text extraction |
| **SHA-256 Fingerprinting** | Cryptographic transaction hashing for instant duplicate detection and reconciliation. |
| **Nodemailer** | Transactional email delivery service for OTP codes, password resets, and security notifications. |
| **Zod & Express Validators** | Strict runtime schema validation for incoming payloads and API contracts. |
| **Helmet & Rate Limiting** | HTTP security header protection and `express-rate-limit` against brute-force and DDoS attempts. |

---

### 3. 🤖 AI & LLM Grounded Intelligence Layer
| Technology / Provider | Purpose & Implementation |
| :--- | :--- |
| **Google Gemini AI** | Google Gemini 2.5 / 3.6 Flash providing rapid synthesis of natural language financial advice and executive reports. |
| **OpenRouter Cascade** | Multi-model cloud fallback rotation (`InclusionAI Ling-3.0-Flash-Fin` ➔ `Google Gemini 2.0 Flash` ➔ `Meta Llama 3.3 70B`). |
| **Deterministic Tool Registry** | Strict tool-calling boundary (`getFinancialSummary`, `getCategorySpending`, `getBudgetStatus`, `getAnomalies`, `getMonthlyComparison`). Guarantees **zero hallucinations**—the LLM explains verified mathematical facts rather than calculating numbers itself. |
| **Local Rule Synthesizer** | Offline algorithmic fallback engine ensuring uninterrupted financial briefings even without cloud connectivity. |

---

### 4. 🧠 Python Machine Learning Microservice
| Technology / Library | Purpose & Implementation |
| :--- | :--- |
| **FastAPI** | Modern, high-performance Python ASGI web framework for machine learning inference endpoints. |
| **Uvicorn** | Lightning-fast ASGI web server implementation for Python. |
| **Scikit-Learn (`sklearn`)** | Core machine learning toolkit: <br>• **TF-IDF Vectorizer + Multinomial Naive Bayes / Logistic Regression** for text-based transaction categorization <br>• **Isolation Forest (`IsolationForest`)** for unsupervised spending anomaly & outlier detection |
| **Pandas & NumPy** | Vectorized tabular processing, matrix operations, statistical standard deviations, and dataset hygiene. |
| **Joblib** | Serialized model artifact persistence and zero-latency in-memory pipeline caching. |
| **Pydantic** | Data validation and settings management using Python type annotations. |

---

## 🏗️ Architectural Data Flow

```
   ┌────────────────────────────────────────────────────────┐
   │         User Ingestion (CSV / XLSX / XLS / PDF)         │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ Universal Multi-Bank Parser & SHA-256 Deduplication    │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │               Staging & User Verification              │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │               Hybrid Classification Tier               │
   │  1. User Defined Rules ➔ 2. Merchant Knowledgebase ➔   │
   │  3. Scikit-Learn TF-IDF Pipeline ➔ 4. Fallback         │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │             Deterministic Analytics Engine             │
   │   • Integer Minor Units (Paise) Calculations           │
   │   • 50/30/20 Wealth Compliance Model                   │
   │   • Spending Velocity & Month-End Pace Estimation      │
   │   • Recurring Subscriptions & Cash Flow Trajectory     │
   └─────────────┬────────────────────────────┬─────────────┘
                 │                            │
                 ▼                            ▼
   ┌───────────────────────────┐┌───────────────────────────┐
   │   Isolation Forest (ML)   ││ Grounded AI Advisor &     │
   │ Spending Anomaly Detector ││ Tool-Calling Registry     │
   └───────────────────────────┘└───────────────────────────┘
```

---

## ⚡ Key Engineering Principles

1. **Deterministic Precision (`paise` Minor Units)**: All financial monetary values are stored and calculated as 64-bit integer minor units (paise / cents) to completely eliminate IEEE 754 floating-point rounding inaccuracies.
2. **Zero Financial Hallucination Guarantee**: AI models are restricted from computing arithmetic aggregates. The backend deterministic engine computes authoritative numbers, and the AI is provided structured fact dossiers.
3. **Multi-Tenant Data Segregation (IDOR Protection)**: All database queries resolve ownership strictly from validated server-side session contexts (`req.userId`).
4. **Biometric WebAuthn & 2FA**: Complete defense-in-depth with optional TOTP Authenticator app sync and device-native biometric Passkeys (fingerprint / Windows Hello).
5. **Universal Banking Interoperability**: Ingestion engine recognizes standard synonym mappings across Indian and global banking institutions (HDFC, ICICI, SBI, Axis, Chase, Citi, Barclays, etc.).

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js** (v18.0 or higher)
- **Python** (v3.10 or higher)
- **MongoDB** (Local instance or MongoDB Atlas connection string)

### 1. Clone Repository
```bash
git clone https://github.com/NikhilReddy482/Personal-Finance-Manager-.git
cd Personal-Finance-Manager-
```

### 2. Configure Backend Server
```bash
cd server
cp .env.example .env
# Fill in your MONGODB_URI, SESSION_SECRET, and AI API Keys in server/.env
npm install
npm run dev
```

### 3. Launch Frontend Client
```bash
cd ../client
npm install
npm run dev
```
*Frontend runs at: `http://localhost:5173`*

### 4. Start Python ML Microservice (Optional / Recommended)
```bash
cd ../ml-service
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000
```
*ML Service runs at: `http://127.0.0.1:8000`*

---

## 🧪 Testing Suite
- **Backend Unit & Security Tests**: `cd server && npm test`
- **Machine Learning Pipeline Tests**: `cd ml-service && pytest`

---

## 📄 License
This project is licensed under the MIT License.
