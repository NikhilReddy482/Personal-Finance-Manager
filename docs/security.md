# Security Architecture & Threat Model

- **Password Hashing**: Argon2id with 64MB memory cost, 3 iterations, 4 parallelism lanes.
- **MFA Security**: TOTP RFC 6238 secrets encrypted at rest via AES-256-GCM. 8 single-use recovery codes stored as SHA-256 hashes.
- **Session Security**: Cryptographically random 256-bit tokens, SHA-256 hashed in database, transmitted via HttpOnly, SameSite, Secure cookies.
- **IDOR Defense**: All database queries strictly scope by `userId: req.userId` resolved from verified session.
- **Prompt Injection Defense**: Untrusted transaction descriptions are isolated with delimiter boundaries and explicit AI system constraints.
