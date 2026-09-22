import React from 'react';
import { Check, X } from 'lucide-react';

interface Props {
  password: string;
  confirmPassword?: string;
}

export const PasswordStrengthIndicator: React.FC<Props> = ({ password, confirmPassword }) => {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const matchesConfirm = confirmPassword !== undefined ? password.length > 0 && password === confirmPassword : true;

  const rules = [
    { label: 'At least 8 characters', met: hasMinLength },
    { label: 'One uppercase letter (A-Z)', met: hasUpper },
    { label: 'One lowercase letter (a-z)', met: hasLower },
    { label: 'One number (0-9)', met: hasNumber },
    { label: 'One special symbol (!@#$%^&*)', met: hasSpecial },
  ];

  if (confirmPassword !== undefined) {
    rules.push({ label: 'Passwords match', met: matchesConfirm });
  }

  const metCount = rules.filter((r) => r.met).length;
  const strengthPercent = (metCount / rules.length) * 100;

  const getStrengthColor = () => {
    if (metCount <= 2) return 'bg-rose-500';
    if (metCount <= 4) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStrengthLabel = () => {
    if (metCount <= 2) return { text: 'Weak', color: 'text-rose-400' };
    if (metCount <= 4) return { text: 'Moderate', color: 'text-amber-400' };
    return { text: 'Strong', color: 'text-emerald-400' };
  };

  if (!password && !confirmPassword) return null;

  return (
    <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2.5 mt-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">Password Security</span>
        <span className={`font-semibold ${getStrengthLabel().color}`}>{getStrengthLabel().text}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: `${strengthPercent}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {rules.map((rule, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-[11px]">
            {rule.met ? (
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center flex-shrink-0">
                <X className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            )}
            <span className={rule.met ? 'text-slate-200 font-medium' : 'text-slate-500'}>
              {rule.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
