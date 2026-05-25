// ─── pages/auth/LoginPage.tsx ─────────────────────────────
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Github, Chrome } from 'lucide-react';
import { useState } from 'react';
import { authApi } from '../../services/api';
import { useAuthStore, useUIStore } from '../../stores';
import { getApiError } from '../../utils';
import { Spinner, Divider } from '../../components/ui/index';
import { useSEO } from '../../hooks/useSEO';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  useSEO({ title: 'Sign In', noIndex: true });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const { showNotification } = useUIStore();
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: LoginForm) => authApi.login(data),
    onSuccess: (res) => {
      const { user, accessToken } = res.data.data;
      setAuth(user, accessToken);
      showNotification('success', `Welcome back, ${user.name}!`);
      navigate(searchParams.get('redirect') || '/');
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  return (
    <div>
      <h2 className="text-2xl font-black text-ink dark:text-ink-dark mb-1">Welcome back</h2>
      <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark mb-7">
        Don't have an account?{' '}
        <Link to="/register" className="text-brand-500 font-semibold hover:underline">Sign up free</Link>
      </p>

      {searchParams.get('session') === 'expired' && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400">
          Your session expired. Please sign in again.
        </div>
      )}

      {/* OAuth */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <a
          href={`${import.meta.env.VITE_API_URL || ''}/api/auth/google`}
          className="btn-secondary justify-center py-2.5 text-sm"
        >
          <Chrome size={16} /> Google
        </a>
        <a
          href={`${import.meta.env.VITE_API_URL || ''}/api/auth/github`}
          className="btn-secondary justify-center py-2.5 text-sm"
        >
          <Github size={16} /> GitHub
        </a>
      </div>

      <Divider label="or continue with email" />

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Email</label>
          <input {...register('email')} type="email" placeholder="you@example.com" className="input" autoComplete="email" />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-sm font-medium text-ink dark:text-ink-dark">Password</label>
            <Link to="/forgot-password" className="text-xs text-brand-500 hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <input {...register('password')} type={showPwd ? 'text' : 'password'} placeholder="••••••••" className="input pr-10" autoComplete="current-password" />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3">
          {mutation.isPending ? <Spinner size={18} /> : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
