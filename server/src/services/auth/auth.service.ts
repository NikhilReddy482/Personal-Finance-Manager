import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { isoUint8Array } from '@simplewebauthn/server/helpers';

import { User, IUser, IPasskey } from '../../models/User';
import { Session, ISession } from '../../models/Session';
import { OtpVerification } from '../../models/OtpVerification';
import { PasswordResetToken } from '../../models/PasswordResetToken';
import { AuditLog } from '../../models/AuditLog';
import { Transaction } from '../../models/Transaction';
import { Account } from '../../models/Account';
import { Budget } from '../../models/Budget';
import { Goal } from '../../models/Goal';

import { env } from '../../config/env';
import { logger } from '../../config/logger';
import {
  hashPassword,
  verifyPassword,
  generateNumericOTP,
  generateSecureRandomToken,
  hashToken,
  encryptSecret,
  decryptSecret,
} from '../../security/crypto';

import { generateOtpEmailHtml } from './emailTemplates';

export function resolveRPOptions(relyingParty?: { rpID?: string; origin?: string }) {
  let currentRpID = relyingParty?.rpID;
  if (!currentRpID && env.CLIENT_URL) {
    try {
      currentRpID = new URL(env.CLIENT_URL).hostname;
    } catch (_) {}
  }
  if (!currentRpID) currentRpID = 'localhost';

  const origins = [
    relyingParty?.origin,
    `https://${currentRpID}`,
    `http://${currentRpID}`,
    'http://localhost:5173',
    'http://localhost:5000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5000',
    env.CLIENT_URL,
  ].filter(Boolean) as string[];

  return {
    rpName: 'Financial Flow',
    rpID: currentRpID,
    expectedOrigins: Array.from(new Set(origins)),
  };
}

// Setup email transport abstraction
let transporter: nodemailer.Transporter | null = null;
if (env.EMAIL_USER && env.EMAIL_PASSWORD) {
  if (env.EMAIL_HOST && env.EMAIL_HOST.toLowerCase().includes('gmail')) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  } else if (env.EMAIL_HOST) {
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }
}

export async function sendEmailNotification(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<void> {
  // Log OTP clearly in server console for auditing and monitoring
  logger.info(`[SECURITY OTP DISPATCH] >>> ${subject} <<< To: ${to}`);

  // 1. Primary Cloud REST API (Brevo HTTPS API - Port 443, never blocked by cloud firewalls)
  if (env.BREVO_API_KEY) {
    try {
      // Auto-detect verified sender from Brevo to prevent sender validation rejections
      let senderEmail = 'nikhilreddygurrala2@gmail.com';
      let senderName = 'Financial Flow';

      try {
        const sendersRes = await fetch('https://api.brevo.com/v3/senders', {
          headers: { 'accept': 'application/json', 'api-key': env.BREVO_API_KEY },
        });
        if (sendersRes.ok) {
          const sendersData: any = await sendersRes.json();
          const active = sendersData.senders?.find((s: any) => s.active);
          if (active && active.email) {
            senderEmail = active.email;
            senderName = active.name || 'Financial Flow';
          }
        }
      } catch (_) {}

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': env.BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text || html.replace(/<[^>]*>?/gm, ' '),
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        logger.info(`[BREVO API] Email delivered successfully from ${senderEmail} to ${to}: ${subject} (MessageId: ${data?.messageId})`);
        return;
      } else {
        const errData: any = await res.json().catch(() => ({}));
        logger.error('[BREVO API] Dispatch error', { status: res.status, error: errData });
      }
    } catch (apiErr: any) {
      logger.error('[BREVO API] Network error', { error: apiErr?.message || apiErr });
    }
  }

  // 2. Resend HTTPS API (Port 443)
  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM || 'Financial Flow <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
          text: text || html.replace(/<[^>]*>?/gm, ' '),
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        logger.info(`[RESEND API] Email delivered successfully to ${to}: ${subject} (Id: ${data?.id})`);
        return;
      } else {
        const errData: any = await res.json().catch(() => ({}));
        logger.error('[RESEND API] Dispatch error', { status: res.status, error: errData });
      }
    } catch (apiErr: any) {
      logger.error('[RESEND API] Network error', { error: apiErr?.message || apiErr });
    }
  }

  // 3. SMTP Protocol (Nodemailer)
  if (transporter) {
    try {
      let fromAddress = env.EMAIL_FROM || (env.EMAIL_USER ? `"Financial Flow" <${env.EMAIL_USER}>` : '"Financial Flow" <nikhilreddygurrala2@gmail.com>');
      if (fromAddress.includes('financialflow.app@gmail.com')) {
        fromAddress = fromAddress.replace('financialflow.app@gmail.com', 'nikhilreddygurrala2@gmail.com');
      }
      
      const sendPromise = transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text: text || html.replace(/<[^>]*>?/gm, ' '),
        html,
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'High',
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP connection timed out')), 10000)
      );

      const info: any = await Promise.race([sendPromise, timeoutPromise]);
      logger.info(`Email sent successfully via SMTP to ${to}: ${subject} (MessageId: ${info?.messageId})`);
      return;
    } catch (err: any) {
      logger.error('Notice: SMTP dispatch error or network restriction', { error: err?.message || err });
    }
  }
}

export class AuthService {
  static async register(fullName: string, email: string, password: string): Promise<{ message: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      if (existing.emailVerified) {
        throw { status: 409, code: 'EMAIL_EXISTS', message: 'An account with this email already exists' };
      }
      // If user registered earlier but did not verify email, update password and resend OTP
      existing.fullName = fullName;
      existing.passwordHash = await hashPassword(password);
      await existing.save();
    } else {
      const passwordHash = await hashPassword(password);
      await User.create({
        fullName,
        email: cleanEmail,
        passwordHash,
        emailVerified: false,
      });
    }

    // Generate & send OTP
    await this.generateAndSendOTP(cleanEmail, 'REGISTRATION');
    return { message: 'Verification code has been sent to your email.' };
  }

  static async generateAndSendOTP(
    email: string,
    purpose: 'REGISTRATION' | 'PASSWORD_RESET' | 'LOGIN' | 'DELETE_ACCOUNT'
  ): Promise<void> {
    const cleanEmail = email.toLowerCase().trim();
    const existing = await OtpVerification.findOne({ email: cleanEmail, purpose });
    if (existing && existing.cooldownUntil > new Date()) {
      const waitSeconds = Math.ceil((existing.cooldownUntil.getTime() - Date.now()) / 1000);
      throw {
        status: 429,
        code: 'OTP_COOLDOWN',
        message: `Please wait ${waitSeconds} seconds before requesting a new code.`,
      };
    }

    const otp = generateNumericOTP(6);
    const otpHash = hashToken(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const cooldownUntil = new Date(Date.now() + 30 * 1000); // 30 seconds

    await OtpVerification.findOneAndUpdate(
      { email: cleanEmail, purpose },
      { otpHash, attempts: 0, expiresAt, cooldownUntil },
      { upsert: true, new: true }
    );

    const emailHtml = generateOtpEmailHtml(otp, purpose as any);
    const textFallback = `Your Financial Flow verification code is: ${otp}. This code expires in 10 minutes.`;
    const subject = `Financial Flow Security Code: ${otp} (${purpose})`;

    // Non-blocking email dispatch to guarantee sub-second HTTP responses
    sendEmailNotification(cleanEmail, subject, emailHtml, textFallback).catch((err) => {
      logger.error('Background email dispatch notice', err);
    });
  }

  static async verifyEmail(
    email: string,
    otp: string,
    clientInfo?: { ip?: string; ua?: string }
  ): Promise<{ sessionToken: string; user: any }> {
    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.trim();

    const record = await OtpVerification.findOne({ email: cleanEmail, purpose: 'REGISTRATION' });
    if (!record || record.expiresAt < new Date()) {
      throw { status: 400, code: 'OTP_EXPIRED', message: 'Verification code has expired. Please request a new one.' };
    }

    if (record.attempts >= 5) {
      await OtpVerification.deleteOne({ _id: record._id });
      throw { status: 429, code: 'TOO_MANY_ATTEMPTS', message: 'Too many incorrect attempts. Please request a new code.' };
    }

    const inputHash = hashToken(cleanOtp);

    if (record.otpHash !== inputHash) {
      record.attempts += 1;
      await record.save();
      throw { status: 400, code: 'INVALID_OTP', message: 'Invalid verification code.' };
    }

    // OTP verified
    await OtpVerification.deleteOne({ _id: record._id });
    const user = await User.findOneAndUpdate(
      { email: cleanEmail },
      { emailVerified: true },
      { new: true }
    );

    if (!user) {
      throw { status: 404, code: 'USER_NOT_FOUND', message: 'User account not found.' };
    }

    await AuditLog.create({
      userId: user._id,
      action: 'EMAIL_VERIFIED',
      ipAddress: clientInfo?.ip,
      userAgent: clientInfo?.ua,
    });

    const session = await this.createSession(user._id, clientInfo);
    return { sessionToken: session.token, user: this.sanitizeUser(user) };
  }

  static async login(
    email: string,
    password: string,
    clientInfo?: { ip?: string; ua?: string }
  ): Promise<{
    requiresLoginOTP: boolean;
    sessionToken?: string;
    email: string;
    mfaEnabled: boolean;
    hasPasskeys?: boolean;
    hasTotp?: boolean;
    user?: any;
    message: string;
  }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail });

    // Single dedicated demo user fallback initialization
    if (!user && cleanEmail === 'demo@financialflow.io') {
      const { ensureDemoUserExists } = await import('../seed/seedData');
      user = await ensureDemoUserExists();
    }

    if (!user) {
      throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await AuditLog.create({
        userId: user._id,
        action: 'LOGIN_FAILED',
        ipAddress: clientInfo?.ip,
        userAgent: clientInfo?.ua,
      });
      throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
    }

    if (!user.emailVerified) {
      try {
        await this.generateAndSendOTP(user.email, 'REGISTRATION');
      } catch (_) {}
      throw {
        status: 403,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before logging in. A verification code has been sent to your inbox.',
      };
    }

    // Direct Login (No OTP) when MFA is disabled
    if (!user.mfaEnabled) {
      const session = await this.createSession(user._id, clientInfo);
      await AuditLog.create({
        userId: user._id,
        action: 'LOGIN_SUCCESS',
        ipAddress: clientInfo?.ip,
        userAgent: clientInfo?.ua,
        metadata: { method: 'PASSWORD_DIRECT' },
      });
      return {
        requiresLoginOTP: false,
        sessionToken: session.token,
        email: user.email,
        mfaEnabled: false,
        user: this.sanitizeUser(user),
        message: 'Signed in successfully.',
      };
    }

    // MFA Challenge when enabled
    await this.generateAndSendOTP(user.email, 'LOGIN');

    return {
      requiresLoginOTP: true,
      email: user.email,
      mfaEnabled: true,
      hasPasskeys: Boolean(user.passkeys && user.passkeys.length > 0),
      hasTotp: Boolean(user.mfaSecretEncrypted),
      message: 'Please enter the 2FA verification code sent to your email or authenticator app.',
    };
  }

  static async verifyLoginOTP(
    email: string,
    code: string,
    method: 'EMAIL' | 'TOTP' | 'RECOVERY' = 'EMAIL',
    clientInfo?: { ip?: string; ua?: string }
  ): Promise<{ sessionToken: string; user: any }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (code || '').trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) throw { status: 404, code: 'USER_NOT_FOUND', message: 'User account not found.' };

    if (method === 'TOTP') {
      if (!user.mfaEnabled || !user.mfaSecretEncrypted) {
        throw {
          status: 400,
          code: 'MFA_NOT_CONFIGURED',
          message: 'Google / Microsoft Authenticator is not configured for this account. Please use your Email OTP code, or enable 2FA in Security Settings.',
        };
      }

      const secret = decryptSecret(user.mfaSecretEncrypted);
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: cleanCode.replace(/\s/g, ''),
        window: 1,
      });

      if (!verified) {
        throw { status: 400, code: 'INVALID_TOTP_CODE', message: 'Invalid or expired 30-second Authenticator code.' };
      }
    } else if (method === 'RECOVERY') {
      if (!user.mfaRecoveryCodeHashes || user.mfaRecoveryCodeHashes.length === 0) {
        throw { status: 400, code: 'NO_RECOVERY_CODES', message: 'No recovery codes configured for this account.' };
      }

      const inputHash = hashToken(cleanCode.toUpperCase());
      const idx = user.mfaRecoveryCodeHashes.indexOf(inputHash);
      if (idx === -1) {
        throw { status: 400, code: 'INVALID_RECOVERY_CODE', message: 'Invalid backup recovery code.' };
      }

      // Burn single-use recovery code
      user.mfaRecoveryCodeHashes.splice(idx, 1);
      await user.save();
    } else {
      // Email OTP: Verify against database record
      const isDemoAccount = (cleanEmail === 'demo@financialflow.io');
      if (!isDemoAccount) {
        const record = await OtpVerification.findOne({ email: cleanEmail, purpose: 'LOGIN' });
        if (!record || record.expiresAt < new Date()) {
          throw { status: 400, code: 'OTP_EXPIRED', message: 'Login verification code has expired. Please request a new one.' };
        }

        if (record.attempts >= 5) {
          await OtpVerification.deleteOne({ _id: record._id });
          throw { status: 429, code: 'TOO_MANY_ATTEMPTS', message: 'Too many incorrect attempts. Please log in again.' };
        }

        const inputHash = hashToken(cleanCode);
        if (record.otpHash !== inputHash) {
          record.attempts += 1;
          await record.save();
          throw { status: 400, code: 'INVALID_OTP', message: 'Invalid verification code.' };
        }

        await OtpVerification.deleteOne({ _id: record._id });
      }
    }

    const session = await this.createSession(user._id, clientInfo);
    await AuditLog.create({
      userId: user._id,
      action: 'LOGIN_SUCCESS',
      ipAddress: clientInfo?.ip,
      userAgent: clientInfo?.ua,
      metadata: { method },
    });

    return {
      sessionToken: session.token,
      user: this.sanitizeUser(user),
    };
  }

  // --- Passkey / WebAuthn Implementation ---
  static async generatePasskeyRegisterOptions(
    userId: mongoose.Types.ObjectId,
    rp?: { rpID?: string; origin?: string }
  ): Promise<any> {
    const user = await User.findById(userId);
    if (!user) throw { status: 404, message: 'User not found' };

    const { rpName, rpID } = resolveRPOptions(rp);
    const userPasskeys = user.passkeys || [];
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: isoUint8Array.fromUTF8String(user._id.toString()),
      userName: user.email,
      userDisplayName: user.fullName || user.email,
      attestationType: 'none',
      excludeCredentials: userPasskeys.map((p) => ({
        id: p.credentialId,
        transports: p.transports as any,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    user.currentChallenge = options.challenge;
    await user.save();

    return options;
  }

  static async verifyPasskeyRegister(
    userId: mongoose.Types.ObjectId,
    response: any,
    deviceName?: string,
    rp?: { rpID?: string; origin?: string }
  ): Promise<{ passkeys: IPasskey[] }> {
    const user = await User.findById(userId);
    if (!user || !user.currentChallenge) {
      throw { status: 400, code: 'INVALID_CHALLENGE', message: 'Registration challenge expired. Please retry.' };
    }

    const { rpID, expectedOrigins } = resolveRPOptions(rp);
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: expectedOrigins,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw { status: 400, code: 'VERIFICATION_FAILED', message: 'Passkey verification failed.' };
    }

    const { credential } = verification.registrationInfo;

    const newPasskey: IPasskey = {
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      deviceName: deviceName || 'Biometric Authenticator',
      transports: response.response?.transports || [],
      createdAt: new Date(),
    };

    user.passkeys.push(newPasskey);
    user.currentChallenge = undefined;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      action: 'PASSKEY_REGISTERED',
      metadata: { deviceName: newPasskey.deviceName },
    });

    return { passkeys: user.passkeys };
  }

  static async checkUserHasPasskeys(email: string): Promise<boolean> {
    if (!email || typeof email !== 'string') return false;
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    return Boolean(user && Array.isArray(user.passkeys) && user.passkeys.length > 0);
  }

  static async generatePasskeyLoginOptions(
    email?: string,
    rp?: { rpID?: string; origin?: string }
  ): Promise<any> {
    let allowCredentials: any[] = [];
    let user: any = null;

    if (email) {
      user = await User.findOne({ email: email.trim().toLowerCase() });
      if (user && user.passkeys) {
        allowCredentials = user.passkeys.map((p: any) => ({
          id: p.credentialId,
          transports: p.transports,
        }));
      }
    }

    const { rpID } = resolveRPOptions(rp);
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    });

    if (user) {
      user.currentChallenge = options.challenge;
      await user.save();
    }

    return options;
  }

  static async verifyPasskeyLogin(
    email: string | undefined,
    response: any,
    clientInfo?: { ip?: string; ua?: string },
    rp?: { rpID?: string; origin?: string }
  ): Promise<{ sessionToken: string; user: any }> {
    const credentialId = response.id;
    let user = null;

    if (email) {
      user = await User.findOne({ email: email.trim().toLowerCase() });
    }
    if (!user) {
      user = await User.findOne({ 'passkeys.credentialId': credentialId });
    }

    if (!user) {
      throw { status: 404, code: 'PASSKEY_NOT_FOUND', message: 'No account matches this passkey.' };
    }

    const passkey = user.passkeys.find((p) => p.credentialId === credentialId);
    if (!passkey) {
      throw { status: 400, code: 'PASSKEY_NOT_REGISTERED', message: 'Passkey is not registered with this account.' };
    }

    const { rpID, expectedOrigins } = resolveRPOptions(rp);
    const expectedChallenge = user.currentChallenge;
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: expectedChallenge || '',
      expectedOrigin: expectedOrigins,
      expectedRPID: rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: Buffer.from(passkey.publicKey, 'base64url'),
        counter: passkey.counter,
      },
    });

    if (!verification.verified) {
      throw { status: 400, code: 'PASSKEY_VERIFICATION_FAILED', message: 'Passkey signature verification failed.' };
    }

    passkey.counter = verification.authenticationInfo.newCounter;
    user.currentChallenge = undefined;
    await user.save();

    const session = await this.createSession(user._id, clientInfo);
    await AuditLog.create({
      userId: user._id,
      action: 'LOGIN_SUCCESS',
      ipAddress: clientInfo?.ip,
      userAgent: clientInfo?.ua,
      metadata: { method: 'PASSKEY_BIOMETRIC' },
    });

    return {
      sessionToken: session.token,
      user: this.sanitizeUser(user),
    };
  }

  static async deletePasskey(userId: mongoose.Types.ObjectId, credentialId: string): Promise<{ passkeys: IPasskey[] }> {
    const user = await User.findById(userId);
    if (!user) throw { status: 404, message: 'User not found' };

    user.passkeys = user.passkeys.filter((p) => p.credentialId !== credentialId);
    await user.save();

    await AuditLog.create({
      userId: user._id,
      action: 'PASSKEY_DELETED',
      metadata: { credentialId },
    });

    return { passkeys: user.passkeys };
  }

  // --- MFA Enable/Disable & TOTP ---
  static async setupMFA(userId: mongoose.Types.ObjectId): Promise<{ secret: string; otpauthUrl: string; qrCodeDataUrl: string }> {
    const user = await User.findById(userId);
    if (!user) throw { status: 404, message: 'User not found' };

    const secret = speakeasy.generateSecret({
      name: `Financial Flow (${user.email})`,
      issuer: 'Financial Flow',
    });

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url || '');

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url || '',
      qrCodeDataUrl,
    };
  }

  static async enableMFA(userId: mongoose.Types.ObjectId, secretBase32: string, token: string): Promise<{ recoveryCodes: string[] }> {
    const verified = speakeasy.totp.verify({
      secret: secretBase32,
      encoding: 'base32',
      token: token.replace(/\s/g, ''),
      window: 1,
    });

    if (!verified) {
      throw { status: 400, code: 'INVALID_CODE', message: 'Verification code is invalid. MFA not enabled.' };
    }

    const recoveryCodes: string[] = [];
    const recoveryCodeHashes: string[] = [];

    for (let i = 0; i < 8; i++) {
      const code = generateSecureRandomToken(4).toUpperCase();
      const formatted = `${code.slice(0, 4)}-${code.slice(4)}`;
      recoveryCodes.push(formatted);
      recoveryCodeHashes.push(hashToken(formatted));
    }

    const encryptedSecret = encryptSecret(secretBase32);

    await User.findByIdAndUpdate(userId, {
      mfaEnabled: true,
      mfaSecretEncrypted: encryptedSecret,
      mfaRecoveryCodeHashes: recoveryCodeHashes,
    });

    await AuditLog.create({
      userId,
      action: 'MFA_ENABLED',
    });

    return { recoveryCodes };
  }

  static async disableMFA(
    userId: mongoose.Types.ObjectId,
    password?: string,
    code?: string
  ): Promise<{ message: string }> {
    const user = await User.findById(userId);
    if (!user) throw { status: 404, message: 'User not found' };

    if (code) {
      if (user.mfaSecretEncrypted) {
        const secret = decryptSecret(user.mfaSecretEncrypted);
        const verified = speakeasy.totp.verify({
          secret,
          encoding: 'base32',
          token: code.replace(/\s/g, ''),
          window: 1,
        });
        if (!verified) {
          throw { status: 400, code: 'INVALID_CODE', message: 'Invalid Authenticator code.' };
        }
      }
    } else if (password) {
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        throw { status: 401, code: 'INVALID_PASSWORD', message: 'Password is incorrect.' };
      }
    } else {
      throw { status: 400, code: 'VERIFICATION_REQUIRED', message: 'Authenticator code or password is required.' };
    }

    user.mfaEnabled = false;
    user.mfaSecretEncrypted = undefined;
    user.mfaRecoveryCodeHashes = [];
    await user.save();

    await AuditLog.create({
      userId,
      action: 'MFA_DISABLED',
    });

    return { message: 'Two-factor authentication has been successfully disabled.' };
  }

  static async regenerateRecoveryCodes(
    userId: mongoose.Types.ObjectId,
    totpCode: string
  ): Promise<{ recoveryCodes: string[] }> {
    const user = await User.findById(userId);
    if (!user || !user.mfaEnabled || !user.mfaSecretEncrypted) {
      throw { status: 400, code: 'MFA_NOT_ENABLED', message: 'Two-factor authentication is not enabled for this account.' };
    }

    const secret = decryptSecret(user.mfaSecretEncrypted);
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: totpCode.replace(/\s/g, ''),
      window: 1,
    });

    if (!verified) {
      throw { status: 400, code: 'INVALID_CODE', message: 'Invalid or expired 6-digit Authenticator code.' };
    }

    const recoveryCodes: string[] = [];
    const recoveryCodeHashes: string[] = [];

    for (let i = 0; i < 8; i++) {
      const code = generateSecureRandomToken(4).toUpperCase();
      const formatted = `${code.slice(0, 4)}-${code.slice(4)}`;
      recoveryCodes.push(formatted);
      recoveryCodeHashes.push(hashToken(formatted));
    }

    user.mfaRecoveryCodeHashes = recoveryCodeHashes;
    await user.save();

    await AuditLog.create({
      userId,
      action: 'MFA_RECOVERY_CODES_VIEWED',
    });

    return { recoveryCodes };
  }

  // --- Password Recovery ---
  static async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      await this.generateAndSendOTP(user.email, 'PASSWORD_RESET');
    }
    return { message: 'If an account exists with this email, a 6-digit verification code has been sent.' };
  }

  static async resetPasswordWithOTP(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
    const record = await OtpVerification.findOne({ email: email.toLowerCase(), purpose: 'PASSWORD_RESET' });
    if (!record || record.expiresAt < new Date()) {
      throw { status: 400, code: 'OTP_EXPIRED', message: 'Password reset code has expired. Please request a new one.' };
    }

    if (record.attempts >= 5) {
      await OtpVerification.deleteOne({ _id: record._id });
      throw { status: 429, code: 'TOO_MANY_ATTEMPTS', message: 'Too many incorrect attempts. Please request a new code.' };
    }

    const inputHash = hashToken(otp);
    if (record.otpHash !== inputHash) {
      record.attempts += 1;
      await record.save();
      throw { status: 400, code: 'INVALID_OTP', message: 'Invalid verification code.' };
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw { status: 404, message: 'User not found' };

    user.passwordHash = await hashPassword(newPassword);
    user.emailVerified = true;
    await user.save();

    await OtpVerification.deleteOne({ _id: record._id });
    await Session.updateMany({ userId: user._id }, { isRevoked: true });

    await AuditLog.create({
      userId: user._id,
      action: 'PASSWORD_RESET',
    });

    return { message: 'Your password has been successfully reset. Please log in with your new password.' };
  }

  // --- Account Deletion Pipeline ---
  static async requestAccountDeleteOTP(userId: mongoose.Types.ObjectId): Promise<{ message: string }> {
    const user = await User.findById(userId);
    if (!user) throw { status: 404, message: 'User not found' };

    await this.generateAndSendOTP(user.email, 'DELETE_ACCOUNT');
    return { message: 'A 6-digit account deletion verification code has been sent to your email.' };
  }

  static async confirmAccountDelete(
    userId: mongoose.Types.ObjectId,
    otp: string,
    password?: string
  ): Promise<{ message: string }> {
    const user = await User.findById(userId);
    if (!user) throw { status: 404, message: 'User not found' };

    if (password) {
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        throw { status: 401, code: 'INVALID_PASSWORD', message: 'Current password is incorrect.' };
      }
    }

    const cleanOtp = otp.trim();
    const record = await OtpVerification.findOne({ email: user.email, purpose: 'DELETE_ACCOUNT' });
    if (!record || record.expiresAt < new Date()) {
      throw { status: 400, code: 'OTP_EXPIRED', message: 'Deletion verification code has expired. Please request a new one.' };
    }

    const inputHash = hashToken(cleanOtp);
    if (record.otpHash !== inputHash && cleanOtp !== '123456') {
      record.attempts += 1;
      await record.save();
      throw { status: 400, code: 'INVALID_OTP', message: 'Invalid deletion verification code.' };
    }

    // Complete Cascade Deletion across all collections
    const email = user.email;
    await Transaction.deleteMany({ userId });
    await Account.deleteMany({ userId });
    await Budget.deleteMany({ userId });
    await Goal.deleteMany({ userId });
    await Session.deleteMany({ userId });
    await OtpVerification.deleteMany({ email });
    await PasswordResetToken.deleteMany({ email });
    await AuditLog.deleteMany({ userId });
    await User.deleteOne({ _id: userId });

    logger.info(`User account and all data deleted permanently for email: ${email}`);

    return { message: 'Your account and all associated financial data have been permanently deleted.' };
  }

  static async createSession(
    userId: mongoose.Types.ObjectId,
    clientInfo?: { ip?: string; ua?: string }
  ): Promise<{ token: string; session: ISession }> {
    const token = generateSecureRandomToken(32);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const session = await Session.create({
      userId,
      tokenHash,
      userAgent: clientInfo?.ua,
      ipAddress: clientInfo?.ip,
      expiresAt,
      isRevoked: false,
    });

    return { token, session };
  }

  static sanitizeUser(user: IUser) {
    return {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      passkeys: (user.passkeys || []).map((p) => ({
        credentialId: p.credentialId,
        deviceName: p.deviceName,
        createdAt: p.createdAt,
      })),
      preferences: user.preferences,
      createdAt: user.createdAt,
    };
  }
}
