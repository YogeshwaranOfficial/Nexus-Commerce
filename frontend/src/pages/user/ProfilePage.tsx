import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, User, Lock, Bell, Save } from 'lucide-react';
import { userApi, api } from '../../services/api';
import { useAuthStore, useUIStore } from '../../stores';
import { getApiError } from '../../utils';
import { Spinner, Skeleton } from '../../components/ui/index';
import { useSEO } from '../../hooks/useSEO';

const profileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  preferences: z.object({
    notifications: z.boolean(),
    newsletter: z.boolean(),
  }).optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const pwdSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirmNew: z.string(),
}).refine((d) => d.newPassword === d.confirmNew, { message: 'Passwords do not match', path: ['confirmNew'] });
type PwdForm = z.infer<typeof pwdSchema>;

export default function ProfilePage() {
  useSEO({ title: 'My Profile', noIndex: true });
  const qc = useQueryClient();
  const { user, updateUser } = useAuthStore();
  const { showNotification } = useUIStore();
  const [tab, setTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.getProfile().then((r) => r.data.data.user),
  });

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: pErrors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: profile ? {
      name: profile.name,
      phone: profile.phone || '',
      preferences: profile.preferences,
    } : undefined,
  });

  const { register: regPwd, handleSubmit: handlePwd, formState: { errors: pwdErrors }, reset: resetPwd } = useForm<PwdForm>({
    resolver: zodResolver(pwdSchema),
  });

  const profileMutation = useMutation({
    mutationFn: (d: ProfileForm) => userApi.updateProfile(d),
    onSuccess: (res) => {
      updateUser(res.data.data.user);
      qc.invalidateQueries({ queryKey: ['profile'] });
      showNotification('success', 'Profile updated successfully');
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  const pwdMutation = useMutation({
    mutationFn: (d: PwdForm) => userApi.changePassword({ currentPassword: d.currentPassword, newPassword: d.newPassword }),
    onSuccess: () => {
      showNotification('success', 'Password changed successfully');
      resetPwd();
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await userApi.updateAvatar(res.data.data.url);
      updateUser({ avatar: res.data.data.url });
      qc.invalidateQueries({ queryKey: ['profile'] });
      showNotification('success', 'Avatar updated');
    } catch {
      showNotification('error', 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Bell },
  ] as const;

  return (
    <div>
      <h1 className="text-2xl font-black text-ink dark:text-ink-dark mb-6">My Profile</h1>

      {/* Avatar */}
      <div className="card p-5 mb-5 flex items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center">
            {profile?.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-2xl font-black">{user?.name?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={avatarUploading}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-colors shadow-sm"
          >
            {avatarUploading ? <Spinner size={12} /> : <Camera size={12} />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="font-bold text-ink dark:text-ink-dark">{profile?.name}</p>
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{profile?.email}</p>
          <span className={`badge text-2xs mt-1 ${user?.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'}`}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-surface-border dark:border-surface-border-dark">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === id ? 'border-brand-500 text-brand-500' : 'border-transparent text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'profile' && (
            <form onSubmit={handleProfile((d) => profileMutation.mutate(d))} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Full Name</label>
                <input {...regProfile('name')} className="input" />
                {pErrors.name && <p className="text-xs text-red-500 mt-1">Name is required</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Email</label>
                <input value={profile?.email || ''} disabled className="input opacity-60 cursor-not-allowed" />
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Phone Number</label>
                <input {...regProfile('phone')} placeholder="+91 98765 43210" className="input" />
              </div>
              <button type="submit" disabled={profileMutation.isPending} className="btn-primary">
                {profileMutation.isPending ? <Spinner size={16} /> : <><Save size={16} /> Save Changes</>}
              </button>
            </form>
          )}

          {tab === 'security' && (
            <form onSubmit={handlePwd((d) => pwdMutation.mutate(d))} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Current Password</label>
                <input {...regPwd('currentPassword')} type="password" placeholder="••••••••" className="input" />
                {pwdErrors.currentPassword && <p className="text-xs text-red-500 mt-1">Required</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">New Password</label>
                <input {...regPwd('newPassword')} type="password" placeholder="••••••••" className="input" />
                {pwdErrors.newPassword && <p className="text-xs text-red-500 mt-1">8+ chars, 1 uppercase, 1 number</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Confirm New Password</label>
                <input {...regPwd('confirmNew')} type="password" placeholder="••••••••" className="input" />
                {pwdErrors.confirmNew && <p className="text-xs text-red-500 mt-1">{pwdErrors.confirmNew.message}</p>}
              </div>
              <button type="submit" disabled={pwdMutation.isPending} className="btn-primary">
                {pwdMutation.isPending ? <Spinner size={16} /> : 'Update Password'}
              </button>
            </form>
          )}

          {tab === 'preferences' && (
            <form onSubmit={handleProfile((d) => profileMutation.mutate(d))} className="space-y-4 max-w-md">
              {[
                { key: 'notifications', label: 'Push Notifications', desc: 'Receive order and promo alerts' },
                { key: 'newsletter', label: 'Newsletter', desc: 'Get the latest deals and news' },
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors">
                  <input
                    type="checkbox"
                    {...regProfile(`preferences.${key as 'notifications' | 'newsletter'}`)}
                    className="mt-0.5 accent-brand-500 w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-medium text-ink dark:text-ink-dark">{label}</p>
                    <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{desc}</p>
                  </div>
                </label>
              ))}
              <button type="submit" disabled={profileMutation.isPending} className="btn-primary">
                {profileMutation.isPending ? <Spinner size={16} /> : <><Save size={16} /> Save Preferences</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
