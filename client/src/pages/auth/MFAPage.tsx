import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck } from 'lucide-react';

export const MFAPage: React.FC = () => {
  const location = useLocation();
  const tempToken = location.state?.tempToken || '';
  const [code, setCode] = useState('');
  const [isRecoveryCode, setIsRecoveryCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/mfa/verify', {
        tempToken,
        code,
        isRecoveryCode,
      });
      await refreshUser();
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'MFA verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-4">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Two-Factor Authentication</h2>
        <p className="text-slate-400 text-sm mt-1 mb-6">
          {isRecoveryCode ? 'Enter one of your emergency recovery codes' : 'Enter the 6-digit code from your authenticator app'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={isRecoveryCode ? 'A1B2-C3D4' : '123456'}
            className="w-full text-center text-xl font-bold py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Confirm Authentication'}
          </button>
        </form>

        <button
          onClick={() => {
            setIsRecoveryCode(!isRecoveryCode);
            setCode('');
            setError('');
          }}
          className="mt-6 text-xs text-indigo-400 hover:underline"
        >
          {isRecoveryCode ? 'Use Authenticator App OTP' : 'Use a backup recovery code'}
        </button>
      </div>
    </div>
  );
};
