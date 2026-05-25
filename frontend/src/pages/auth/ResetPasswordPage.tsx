import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { authApi } from '../../services/api';
import { useUIStore } from '../../stores';
import { getApiError } from '../../utils';
import { Spinner } from '../../components/ui/index';
import { useSEO } from '../../hooks/useSEO';

const schema = z.object({
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });
type Form = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  useSEO({ title: 'Reset Password', noIndex: true });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showNotification } = useUIStore();
  const [showPwd, setShowPwd] = useState(false);
  const token = searchParams.get('token') || '';

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (d: Form) => authApi.resetPassword({ token, password: d.password }),
    onSuccess: () => {
      showNotification('success', 'Password reset successfully. Please sign in.');
      navigate('/login');
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm text-red-500 mb-4">Invalid or missing reset token.</p>
        <Link to="/forgot-password" className="btn-primary">Request New Link</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center mb-4">
        <Lock size={22} className="text-brand-500" />
      </div>
      <h2 className="text-2xl font-black text-ink dark:text-ink-dark mb-1">Set new password</h2>
      <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark mb-7">Choose a strong password you haven't used before.</p>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">New Password</label>
          <div className="relative">
            <input {...register('password')} type={showPwd ? 'text' : 'password'} placeholder="••••••••" className="input pr-10" />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">Must be 8+ chars with uppercase and number</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Confirm Password</label>
          <input {...register('confirm')} type="password" placeholder="••••••••" className="input" />
          {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm.message}</p>}
        </div>
        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3">
          {mutation.isPending ? <Spinner size={18} /> : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
