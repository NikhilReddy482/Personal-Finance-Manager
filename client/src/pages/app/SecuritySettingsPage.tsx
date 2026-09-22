import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { startRegistration } from '@simplewebauthn/browser';
import {
  ShieldCheck,
  Lock,
  Smartphone,
  KeyRound,
  ShieldOff,
  Copy,
  Check,
  Eye,
  AlertTriangle,
  X,
  Fingerprint,
  Trash2,
  Plus,
  AlertOctagon,
  Laptop,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const SecuritySettingsPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<any[]>([]);
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState(false);

  // 2FA TOTP state
  const [mfaSetup, setMfaSetup] = useState<any>(null);
  const [mfaToken, setMfaToken] = useState('');
  const [sessionRecoveryCodes, setSessionRecoveryCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Modals
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disabling, setDisabling] = useState(false);

  const [showViewCodesModal, setShowViewCodesModal] = useState(false);
  const [viewAuthCode, setViewAuthCode] = useState('');
  const [verifyingViewCode, setVerifyingViewCode] = useState(false);

  // Passkey Modal
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [passkeyNickname, setPasskeyNickname] = useState('');
  const [registeringPasskey, setRegisteringPasskey] = useState(false);

  // Delete Account Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteOtpSent, setDeleteOtpSent] = useState(false);
  const [sendingDeleteOtp, setSendingDeleteOtp] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Clean ephemeral codes on navigation
  useEffect(() => {
    return () => {
      setSessionRecoveryCodes([]);
    };
  }, []);

  const loadSessions = async () => {
    try {
      const res: any = await api.get('/security/sessions');
      if (res.success) setSessions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPasskeys = async () => {
    setLoadingPasskeys(true);
    try {
      const res: any = await api.get('/security/passkeys');
      if (res.success) setPasskeys(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPasskeys(false);
    }
  };

  useEffect(() => {
    loadSessions();
    loadPasskeys();
  }, []);

  // --- MFA Handlers ---
  const handleStartMFASetup = async () => {
    setError('');
    setSuccess('');
    try {
      const res: any = await api.post('/security/mfa/setup');
      if (res.success) setMfaSetup(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize 2FA setup');
    }
  };

  const handleEnableMFA = async () => {
    setError('');
    try {
      const res: any = await api.post('/security/mfa/enable', {
        secret: mfaSetup.secret,
        token: mfaToken,
      });
      if (res.success) {
        setSessionRecoveryCodes(res.data.recoveryCodes || []);
        setMfaSetup(null);
        setMfaToken('');
        setSuccess('Two-factor authentication successfully enabled! You will now be prompted for 2FA on login.');
        await refreshUser();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    }
  };

  const handleDisableMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableCode) {
      setError('Please enter your 6-digit Authenticator code or password.');
      return;
    }
    setDisabling(true);
    setError('');
    try {
      const isOtp = /^\d{6}$/.test(disableCode.trim());
      const payload = isOtp ? { code: disableCode.trim() } : { password: disableCode };
      const res: any = await api.post('/security/mfa/disable', payload);
      if (res.success) {
        setShowDisableModal(false);
        setDisableCode('');
        setSessionRecoveryCodes([]);
        setSuccess('Two-factor authentication disabled. You can now log in directly with your password.');
        await refreshUser();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA. Verify code or password.');
    } finally {
      setDisabling(false);
    }
  };

  const handleViewRecoveryCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewAuthCode) {
      setError('Please enter your 6-digit Authenticator code.');
      return;
    }
    setVerifyingViewCode(true);
    setError('');
    try {
      const res: any = await api.post('/security/mfa/recovery-codes', {
        code: viewAuthCode.trim(),
      });
      if (res.success) {
        setSessionRecoveryCodes(res.data.recoveryCodes || []);
        setShowViewCodesModal(false);
        setViewAuthCode('');
        setSuccess('Fresh backup recovery codes generated and revealed for this session.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid 6-digit Authenticator code.');
    } finally {
      setVerifyingViewCode(false);
    }
  };

  const handleCopyCodes = () => {
    if (sessionRecoveryCodes.length > 0) {
      navigator.clipboard.writeText(sessionRecoveryCodes.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // --- Passkeys Handlers ---
  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRegisteringPasskey(true);

    try {
      // 1. Get registration options from server
      const optionsRes: any = await api.post('/security/passkeys/register-options');
      if (!optionsRes.success || !optionsRes.data) {
        throw new Error('Failed to get passkey registration challenge');
      }

      // 2. Prompt browser WebAuthn (Fingerprint / Windows Hello / Touch ID)
      const regResp = await startRegistration({ optionsJSON: optionsRes.data });

      // 3. Verify with server
      const verifyRes: any = await api.post('/security/passkeys/register-verify', {
        response: regResp,
        deviceName: passkeyNickname.trim() || 'Biometric Authenticator',
      });

      if (verifyRes.success) {
        setPasskeys(verifyRes.data.passkeys || []);
        setShowPasskeyModal(false);
        setPasskeyNickname('');
        setSuccess('Biometric Passkey registered successfully! You can now use your fingerprint to sign in.');
        await refreshUser();
      }
    } catch (err: any) {
      setError(err.message || 'Passkey registration cancelled or failed.');
    } finally {
      setRegisteringPasskey(false);
    }
  };

  const handleDeletePasskey = async (credentialId: string) => {
    if (!window.confirm('Are you sure you want to remove this passkey?')) return;
    try {
      const res: any = await api.delete(`/security/passkeys/${encodeURIComponent(credentialId)}`);
      if (res.success) {
        setPasskeys(res.data.passkeys || []);
        setSuccess('Passkey removed.');
        await refreshUser();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove passkey');
    }
  };

  // --- Account Deletion Handlers ---
  const handleRequestDeleteOTP = async () => {
    setError('');
    setSendingDeleteOtp(true);
    try {
      const res: any = await api.post('/security/account/delete-otp');
      if (res.success) {
        setDeleteOtpSent(true);
        setSuccess('Account deletion confirmation code has been dispatched to your email.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request deletion code');
    } finally {
      setSendingDeleteOtp(false);
    }
  };

  const handleConfirmAccountDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteOtp.trim()) {
      setError('Please enter the 6-digit confirmation code sent to your email.');
      return;
    }
    setDeletingAccount(true);
    setError('');

    try {
      const res: any = await api.post('/security/account/delete-confirm', {
        otp: deleteOtp.trim(),
        password: deletePassword || undefined,
      });

      if (res.success) {
        await logout();
        navigate('/auth/register', {
          state: { message: 'Your account and all financial records have been permanently erased.' },
        });
      }
    } catch (err: any) {
      setError(err.message || 'Account deletion failed. Please check the confirmation code.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.delete(`/security/sessions/${sessionId}`);
      loadSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      await api.delete('/security/sessions');
      loadSessions();
      setSuccess('All other sessions have been logged out.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Security & Privacy Center</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
          Configure two-factor authentication, biometric passkeys, active sessions, and data privacy controls
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* 1. Two-Factor Authentication (MFA) Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`p-3 rounded-2xl border ${user?.mfaEnabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-white text-base sm:text-lg">Two-Factor Authentication (MFA)</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    user?.mfaEnabled
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {user?.mfaEnabled ? 'Enabled' : 'Disabled (Direct Login)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {user?.mfaEnabled
                  ? 'Active: You will be prompted for an Authenticator code or Email OTP every time you sign in.'
                  : 'Inactive: You will sign in directly with your password without being prompted for OTP verification.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {user?.mfaEnabled ? (
              <>
                <button
                  onClick={() => {
                    setError('');
                    setViewAuthCode('');
                    setShowViewCodesModal(true);
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-400" /> Recovery Codes
                </button>
                <button
                  onClick={() => {
                    setError('');
                    setDisableCode('');
                    setShowDisableModal(true);
                  }}
                  className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/20 flex items-center gap-1.5 transition"
                >
                  <ShieldOff className="w-3.5 h-3.5" /> Turn Off MFA
                </button>
              </>
            ) : (
              !mfaSetup && (
                <button
                  onClick={handleStartMFASetup}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition"
                >
                  Enable Two-Factor Authentication
                </button>
              )
            )}
          </div>
        </div>

        {/* Setup Wizard */}
        {mfaSetup && (
          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 text-center">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white">Scan QR Code with Google or Microsoft Authenticator</h4>
              <button onClick={() => setMfaSetup(null)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={mfaSetup.qrCodeDataUrl} alt="QR Code" className="w-44 h-44 mx-auto rounded-xl bg-white p-2" />
            <div className="text-xs text-slate-400">
              Or manually enter key: <span className="font-mono text-blue-400 font-bold select-all">{mfaSetup.secret}</span>
            </div>
            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto pt-2">
              <input
                type="text"
                maxLength={6}
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value)}
                placeholder="000000"
                className="text-center py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm font-mono tracking-widest focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleEnableMFA}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition"
              >
                Verify & Enable
              </button>
            </div>
          </div>
        )}

        {/* Ephemeral Recovery Codes Display */}
        {sessionRecoveryCodes.length > 0 && (
          <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-amber-300 text-sm">Emergency Single-Use Recovery Codes</h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCodes}
                  className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy All'}
                </button>
                <button
                  onClick={() => setSessionRecoveryCodes([])}
                  className="p-1 text-amber-400/60 hover:text-amber-300 rounded-lg"
                  title="Close from Screen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-amber-400/80">
              Each code can be used once to log in if you lose access to your authenticator device.
              <strong className="text-amber-200"> These codes will vanish when you leave this page.</strong>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {sessionRecoveryCodes.map((c) => (
                <div key={c} className="p-2 bg-slate-950 text-white font-mono text-center rounded-xl text-xs font-bold border border-slate-800 select-all">
                  {c}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Biometric Passkeys (Fingerprint / Touch ID / Windows Hello) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg">Passkeys & Biometric Authentication</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Sign in seamlessly using your device's fingerprint sensor, Touch ID, Windows Hello, or hardware security key without typing OTPs.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setError('');
              setShowPasskeyModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition"
          >
            <Plus className="w-4 h-4" /> Register New Passkey
          </button>
        </div>

        {/* Registered Passkeys List */}
        <div className="space-y-3">
          {loadingPasskeys ? (
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" /> Loading passkeys...
            </div>
          ) : passkeys.length > 0 ? (
            passkeys.map((p: any) => (
              <div
                key={p.credentialId}
                className="flex items-center justify-between p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white">{p.deviceName || 'Biometric Passkey'}</div>
                    <div className="text-slate-500 text-[11px]">
                      Added on {new Date(p.createdAt).toLocaleDateString()} • ID: {p.credentialId.slice(0, 16)}...
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeletePasskey(p.credentialId)}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                  title="Remove Passkey"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
              No biometric passkeys registered yet. Click <strong>Register New Passkey</strong> to add your fingerprint or device authenticator.
            </div>
          )}
        </div>
      </div>

      {/* 3. Active Sessions Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base sm:text-lg">Active Logged-In Sessions</h3>
            <p className="text-xs text-slate-400 mt-0.5">Manage devices currently authenticated into your workspace</p>
          </div>
          {sessions.length > 1 && (
            <button
              onClick={handleRevokeOtherSessions}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/20 transition"
            >
              Log Out Other Devices
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-800/80 bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden">
          {sessions.map((s) => (
            <div key={s.id} className="p-4 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-white flex items-center gap-2">
                  {s.userAgent} {s.isCurrent && <span className="text-[10px] px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded-full font-bold">Current Device</span>}
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">IP: {s.ipAddress} • Last Active: {new Date(s.lastActiveAt).toLocaleString()}</div>
              </div>
              {!s.isCurrent && (
                <button
                  onClick={() => handleRevokeSession(s.id)}
                  className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold rounded-lg transition"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Danger Zone: Delete Account & Wipe Financial Data */}
      <div className="bg-gradient-to-br from-rose-950/20 via-slate-900 to-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg">Delete Account & Erase All Financial Data</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Permanently delete your user credentials, connected bank accounts, uploaded statements, transactions, and audit records. This action cannot be undone.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setError('');
              setDeleteOtp('');
              setDeletePassword('');
              setDeleteOtpSent(false);
              setShowDeleteModal(true);
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/25 transition whitespace-nowrap"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Passkey Registration Modal */}
      {showPasskeyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400">
                <Fingerprint className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Register Biometric Passkey</h3>
              </div>
              <button onClick={() => setShowPasskeyModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Give this device a nickname, then use your fingerprint, Touch ID, Windows Hello, or hardware key to complete verification:
            </p>

            <form onSubmit={handleRegisterPasskey} className="space-y-4">
              <input
                type="text"
                value={passkeyNickname}
                onChange={(e) => setPasskeyNickname(e.target.value)}
                placeholder="e.g. Work Laptop Windows Hello / My iPhone Touch ID"
                className="w-full py-2.5 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasskeyModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registeringPasskey}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition flex items-center gap-1.5"
                >
                  {registeringPasskey ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Fingerprint className="w-3.5 h-3.5" />}
                  {registeringPasskey ? 'Prompting Biometrics...' : 'Verify Fingerprint / Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal (With 2-Step OTP Verification) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertOctagon className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Permanent Account Erasure</h3>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              To permanently erase all transactions, bank accounts, and user credentials, verify your identity with a 6-digit confirmation code.
            </p>

            {!deleteOtpSent ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRequestDeleteOTP}
                  disabled={sendingDeleteOtp}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  {sendingDeleteOtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                  {sendingDeleteOtp ? 'Sending Code...' : 'Send Deletion Code to My Email'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmAccountDelete} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    6-Digit Deletion Confirmation Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full py-2.5 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-center text-lg font-mono tracking-widest focus:outline-none focus:border-rose-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Current Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full py-2.5 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deletingAccount || deleteOtp.trim().length < 6}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition disabled:opacity-50"
                  >
                    {deletingAccount ? 'Erasing Account...' : 'Permanently Delete Everything'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Disable 2FA Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Disable Two-Factor Authentication</h3>
              </div>
              <button onClick={() => setShowDisableModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              When 2FA is disabled, you will log in directly using only your email and password without being prompted for OTP verification. Enter your current Authenticator code or password:
            </p>

            <form onSubmit={handleDisableMFA} className="space-y-4">
              <input
                type="password"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="6-digit Authenticator code or current password"
                className="w-full py-2.5 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisableModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disabling}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg transition"
                >
                  {disabling ? 'Disabling...' : 'Confirm Disable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Recovery Codes Modal */}
      {showViewCodesModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400">
                <KeyRound className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Security Verification</h3>
              </div>
              <button onClick={() => setShowViewCodesModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter the 6-digit rolling code from your Authenticator app to reveal your backup recovery codes:
            </p>

            <form onSubmit={handleViewRecoveryCodes} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                value={viewAuthCode}
                onChange={(e) => setViewAuthCode(e.target.value)}
                placeholder="000000"
                className="w-full py-2.5 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-center text-base font-mono tracking-widest focus:outline-none focus:border-indigo-500"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowViewCodesModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingViewCode}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition"
                >
                  {verifyingViewCode ? 'Verifying...' : 'Verify & Reveal Codes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
