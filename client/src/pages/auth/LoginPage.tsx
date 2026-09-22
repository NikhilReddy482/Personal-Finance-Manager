import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { startAuthentication } from '@simplewebauthn/browser';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck, Fingerprint } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [hasPasskeys, setHasPasskeys] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length < 5) {
      setHasPasskeys(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res: any = await api.post('/auth/passkeys/check', { email: cleanEmail });
        if (res.success && res.data?.hasPasskeys) {
          setHasPasskeys(true);
        } else {
          setHasPasskeys(false);
        }
      } catch {
        setHasPasskeys(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim();

    try {
      const res: any = await api.post('/auth/login', { email: cleanEmail, password });
      if (res.data?.requiresLoginOTP) {
        navigate('/auth/verify-email', {
          state: {
            email: res.data.email || cleanEmail,
            purpose: 'LOGIN',
            mfaEnabled: Boolean(res.data?.mfaEnabled),
            hasPasskeys: Boolean(res.data?.hasPasskeys),
          },
        });
      } else if (res.data?.sessionToken || !res.data?.requiresLoginOTP) {
        // Direct Login without OTP when MFA is disabled
        await refreshUser();
        navigate('/app/dashboard');
      } else {
        navigate('/auth/verify-email', {
          state: {
            email: cleanEmail,
            purpose: 'LOGIN',
            mfaEnabled: Boolean(res.data?.mfaEnabled),
          },
        });
      }
    } catch (err: any) {
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        navigate('/auth/verify-email', {
          state: {
            email: cleanEmail,
            purpose: 'REGISTRATION',
          },
        });
        return;
      }
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setError('');
    setPasskeyLoading(true);

    try {
      const cleanEmail = email.trim() || undefined;
      // 1. Get Authentication Options from server
      const optionsRes: any = await api.post('/auth/passkeys/login-options', { email: cleanEmail });
      if (!optionsRes.success || !optionsRes.data) {
        throw new Error('Failed to obtain passkey challenge from server');
      }

      // 2. Prompt browser / Windows Hello / Touch ID
      const authResp = await startAuthentication({ optionsJSON: optionsRes.data });

      // 3. Verify assertion with server
      const verifyRes: any = await api.post('/auth/passkeys/login-verify', {
        email: cleanEmail,
        response: authResp,
      });

      if (verifyRes.success) {
        await refreshUser();
        navigate('/app/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Passkey authentication was cancelled or failed.');
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-sm opacity-60"></div>
            <img
              src="/logo.png"
              alt="Financial Flow Logo"
              className="relative w-16 h-16 rounded-2xl object-contain border border-blue-500/30 bg-slate-900 shadow-xl"
            />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
          <p className="text-slate-400 text-sm mt-1">Sign in to your Financial Flow workspace</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
              <Link to="/auth/forgot-password" className="text-xs text-blue-400 hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || passkeyLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing In...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>

          {/* Passkey / Biometric Login Option (Only visible if biometrics are registered for this account) */}
          {hasPasskeys && (
            <button
              type="button"
              disabled={loading || passkeyLoading}
              onClick={handlePasskeyLogin}
              className="w-full py-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 text-xs sm:text-sm mt-2"
            >
              <Fingerprint className="w-4 h-4 text-blue-400" />
              {passkeyLoading ? 'Verifying Passkey...' : 'Sign In with Passkey / Biometrics'}
            </button>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500 font-semibold tracking-wider">Or</span>
            </div>
          </div>

          <button
            type="button"
            disabled={loading || passkeyLoading}
            onClick={async () => {
              setError('');
              setLoading(true);
              try {
                await api.post('/auth/demo');
                await refreshUser();
                navigate('/app/dashboard');
              } catch (err: any) {
                setError(err.message || 'Demo sign-in failed');
              } finally {
                setLoading(false);
              }
            }}
            className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 font-semibold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 text-sm"
          >
            <ShieldCheck className="w-4 h-4" /> 1-Click Explore Demo Workspace
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account?{' '}
          <Link to="/auth/register" className="text-blue-400 hover:underline font-semibold">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};
