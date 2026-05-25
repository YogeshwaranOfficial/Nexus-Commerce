// ─── VerifyEmailPage ──────────────────────────────────────
import { useRef, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { authApi } from '../../services/api';
import { useAuthStore, useUIStore } from '../../stores';
import { getApiError } from '../../utils';
import { Spinner } from '../../components/ui/index';
import { useSEO } from '../../hooks/useSEO';

export function VerifyEmailPage() {
  useSEO({ title: 'Verify Email', noIndex: true });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { showNotification } = useUIStore();
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const mutation = useMutation({
    mutationFn: (code: string) => authApi.verifyEmail({ email, otp: code }),
    onSuccess: (res) => {
      setAuth(res.data.data.user, res.data.data.accessToken);
      showNotification('success', 'Email verified! Welcome to Nexus.');
      navigate('/');
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (next.every(Boolean)) mutation.mutate(next.join(''));
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      mutation.mutate(text);
    }
  };

  return (
    <div className="text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center mx-auto mb-4">
        <ShieldCheck size={28} className="text-brand-500" />
      </div>
      <h2 className="text-2xl font-black text-ink dark:text-ink-dark mb-1">Verify your email</h2>
      <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark mb-8">
        We sent a 6-digit code to <span className="font-semibold text-ink dark:text-ink-dark">{email}</span>
      </p>

      <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            maxLength={1}
            className="w-12 h-14 rounded-xl border-2 border-surface-border dark:border-surface-border-dark bg-white dark:bg-surface-card-dark text-center text-xl font-bold text-ink dark:text-ink-dark focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          />
        ))}
      </div>

      {mutation.isPending && (
        <div className="flex justify-center mb-4"><Spinner /></div>
      )}

      <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
        Didn't get it?{' '}
        <button className="text-brand-500 hover:underline font-medium">Resend OTP</button>
      </p>
    </div>
  );
}
export default VerifyEmailPage;
