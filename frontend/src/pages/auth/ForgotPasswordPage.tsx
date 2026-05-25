import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authApi } from '../../services/api';
import { useUIStore } from '../../stores';
import { useSEO } from '../../hooks/useSEO';
import { getApiError } from '../../utils';
import { Spinner } from '../../components/ui/index';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  useSEO({ title: 'Forgot Password', noIndex: true });
  const { showNotification } = useUIStore();
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (d: Form) => authApi.forgotPassword(d.email),
    onError: (err) => showNotification('error', getApiError(err)),
  });

  if (mutation.isSuccess) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-black text-ink dark:text-ink-dark mb-2">Check your email</h2>
        <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark mb-6">
          If that email exists in our system, you'll receive a password reset link within a few minutes.
        </p>
        <Link to="/login" className="btn-secondary inline-flex"><ArrowLeft size={16} /> Back to Sign In</Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/login" className="flex items-center gap-1.5 text-sm text-ink-muted dark:text-ink-muted-dark hover:text-brand-500 transition-colors mb-6">
        <ArrowLeft size={15} /> Back to Sign In
      </Link>
      <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center mb-4">
        <Mail size={22} className="text-brand-500" />
      </div>
      <h2 className="text-2xl font-black text-ink dark:text-ink-dark mb-1">Forgot password?</h2>
      <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark mb-7">
        Enter your email and we'll send you a reset link.
      </p>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Email Address</label>
          <input {...register('email')} type="email" placeholder="you@example.com" className="input" autoFocus />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3">
          {mutation.isPending ? <Spinner size={18} /> : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
}
