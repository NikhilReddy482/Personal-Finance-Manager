import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateNumericOTP,
  hashToken,
  encryptSecret,
  decryptSecret,
  generateFingerprint,
} from '../src/security/crypto';

describe('Security & Cryptography Utilities', () => {
  it('hashes and verifies passwords with Argon2id', async () => {
    const pwd = 'StrongSecurePassword123!#';
    const hash = await hashPassword(pwd);
    expect(hash).toContain('$argon2id$');

    const isValid = await verifyPassword(pwd, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('WrongPassword123!', hash);
    expect(isInvalid).toBe(false);
  });

  it('generates 6-digit numeric OTPs', () => {
    const otp = generateNumericOTP(6);
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it('encrypts and decrypts secrets at rest using AES-256-GCM', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const encrypted = encryptSecret(secret);
    expect(encrypted).toContain(':');
    
    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(secret);
  });

  it('creates deterministic SHA-256 transaction fingerprints', () => {
    const fp1 = generateFingerprint('user1:acc1:2024-10-15:42050:SWIGGY');
    const fp2 = generateFingerprint('user1:acc1:2024-10-15:42050:SWIGGY');
    const fp3 = generateFingerprint('user1:acc1:2024-10-15:42050:UBER');

    expect(fp1).toBe(fp2);
    expect(fp1).not.toBe(fp3);
  });
});
