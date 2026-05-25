import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Github, Chrome, CheckCircle } from 'lucide-react';
import { authApi } from '../../services/api';
import { useUIStore } from '../../stores';
import { getApiError } from '../../utils';
import { Spinner, Divider } from '../../components/ui/index';
import { useSEO } from '../../hooks/useSEO';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

type Form = z.infer<typeof schema>;

const requirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  useSEO({ title: 'Create Account', noIndex: true });
  const navigate = useNavigate();
  const { showNotification } = useUIStore();
  const [showPwd, setShowPwd] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const pwd = watch('password', '');

  const mutation = useMutation({
    mutationFn: (d: Form) => authApi.register({ name: d.name, email: d.email, password: d.password }),
    onSuccess: (_, vars) => {
      setRegisteredEmail(vars.email);
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  if (registeredEmail) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-black text-ink dark:text-ink-dark mb-2">Check your inbox!</h2>
        <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark mb-6">
          We sent a 6-digit OTP to <span className="font-semibold text-ink dark:text-ink-dark">{registeredEmail}</span>. Enter it to verify your account.
        </p>
        <button
          onClick={() => navigate(`/verify-email?email=${encodeURIComponent(registeredEmail)}`)}
          className="btn-primary w-full py-3"
        >
          Enter OTP
        </button>
        <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-4">
          Didn't receive it? Check your spam folder or{' '}
          <button onClick={() => mutation.mutate(undefined as any)} className="text-brand-500 hover:underline">resend</button>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-black text-ink dark:text-ink-dark mb-1">Create your account</h2>
      <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark mb-7">
        Already have one?{' '}
        <Link to="/login" className="text-brand-500 font-semibold hover:underline">Sign in</Link>
      </p>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <a href="/api/auth/google" className="btn-secondary justify-center py-2.5 text-sm">
          <Chrome size={16} /> Google
        </a>
        <a href="/api/auth/github" className="btn-secondary justify-center py-2.5 text-sm">
          <Github size={16} /> GitHub
        </a>
      </div>

      <Divider label="or sign up with email" />

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Full Name</label>
          <input {...register('name')} placeholder="John Doe" className="input" autoComplete="name" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Email</label>
          <input {...register('email')} type="email" placeholder="you@example.com" className="input" autoComplete="email" />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Password</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••••"
              className="input pr-10"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {pwd && (
            <div className="mt-2 space-y-1">
              {requirements.map(({ label, test }) => (
                <div key={label} className={`flex items-center gap-1.5 text-xs ${test(pwd) ? 'text-green-600 dark:text-green-400' : 'text-ink-muted dark:text-ink-muted-dark'}`}>
                  <CheckCircle size={11} className={test(pwd) ? 'fill-green-500 text-white' : 'text-current'} />
                  {label}
                </div>
              ))}
            </div>
          )}
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Confirm Password</label>
          <input {...register('confirm')} type="password" placeholder="••••••••" className="input" autoComplete="new-password" />
          {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm.message}</p>}
        </div>

        <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
          By signing up, you agree to our{' '}
          <Link to="#" className="text-brand-500 hover:underline">Terms</Link> and{' '}
          <Link to="#" className="text-brand-500 hover:underline">Privacy Policy</Link>.
        </p>

        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3">
          {mutation.isPending ? <Spinner size={18} /> : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
