# System Architecture & Technical Specifications

## Monorepo Layout
- `client/`: React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, Recharts, Lucide Icons.
- `server/`: Express, TypeScript, Mongoose, Argon2id, Speakeasy, Zod, Winston, Multer, CSV/XLSX/PDF parsers.
- `ml-service/`: FastAPI, Scikit-Learn, Pandas, NumPy, Joblib, Isolation Forest.
- `docs/`: In-depth engineering, security, and interview documentation.

## Hybrid Classification Hierarchy
1. **User Custom Rules**: User-defined merchant patterns take absolute precedence.
2. **Deterministic Merchant Rules**: Exact and regex merchant signatures (e.g. `Swiggy`, `Netflix`, `Uber`).
3. **Scikit-Learn Classifier**: TF-IDF (1-2 ngrams) + Logistic Regression / Naive Bayes model.
4. **Heuristic Fallback**: Safe fallback to unclassified expense with review flag.
