import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, RefreshCw, Mail, Smartphone, KeyRound } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const purpose = location.state?.purpose || 'REGISTRATION';
  const isLogin = purpose === 'LOGIN';
  const mfaEnabled = Boolean(location.state?.mfaEnabled);

  const [email, setEmail] = useState(location.state?.email || '');
  const [method, setMethod] = useState<'EMAIL' | 'TOTP' | 'RECOVERY'>('EMAIL');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email address.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await api.post('/auth/verify-login-otp', {
          email,
          otp: otp.trim(),
          method,
        });
      } else {
        await api.post('/auth/verify-email', { email, otp: otp.trim() });
      }
      await refreshUser();
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email address to resend the code.');
      return;
    }
    setError('');
    setMessage('');
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email, purpose });
      setMessage('A fresh verification code has been dispatched to your email.');
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-4">
          {method === 'TOTP' ? (
            <Smartphone className="w-6 h-6" />
          ) : method === 'RECOVERY' ? (
            <KeyRound className="w-6 h-6" />
          ) : (
            <CheckCircle2 className="w-6 h-6" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight">
          {isLogin
            ? method === 'TOTP'
              ? 'Authenticator 2FA'
              : method === 'RECOVERY'
              ? 'Backup Recovery Code'
              : 'Login Verification'
            : 'Verify Your Email'}
        </h2>

        <p className="text-slate-400 text-sm mt-1 mb-6">
          {isLogin ? (
            method === 'TOTP' ? (
              'Enter the 6-digit rolling code from your Google / Microsoft Authenticator app'
            ) : method === 'RECOVERY' ? (
              'Enter one of your 8-character single-use recovery codes'
            ) : (
              <span>
                Enter the 6-digit code sent to <strong className="text-slate-200">{email}</strong>
              </span>
            )
          ) : (
            <span>
              Enter the 6-digit code sent to <strong className="text-slate-200">{email}</strong>
            </span>
          )}
        </p>

        {/* Verification Method Switcher (Only when 2FA is configured) */}
        {isLogin && mfaEnabled && (
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMethod('EMAIL');
                setOtp('');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                method === 'EMAIL'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" /> Email OTP
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('TOTP');
                setOtp('');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                method === 'TOTP'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Authenticator App
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('RECOVERY');
                setOtp('');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                method === 'RECOVERY'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" /> Recovery
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-left">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-left">
            {message}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          {!location.state?.email && (
            <div className="text-left mb-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              {method === 'RECOVERY' ? '8-Character Recovery Code' : '6-Digit Code'}
            </label>
            <input
              type="text"
              required
              maxLength={method === 'RECOVERY' ? 9 : 6}
              value={otp}
              onChange={(e) => {
                if (method === 'RECOVERY') {
                  setOtp(e.target.value.toUpperCase());
                } else {
                  setOtp(e.target.value.replace(/\D/g, ''));
                }
              }}
              placeholder={method === 'RECOVERY' ? 'A1B2-C3D4' : '000000'}
              className="w-full text-center tracking-[8px] text-2xl font-bold py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.trim().length < 6}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Verifying Code...' : 'Verify & Continue'}
          </button>
        </form>

        {method === 'EMAIL' && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={resending || cooldown > 0}
              onClick={handleResend}
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 disabled:text-slate-500 transition font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              {cooldown > 0 ? `Resend email code in ${cooldown}s` : 'Resend verification code to email'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
