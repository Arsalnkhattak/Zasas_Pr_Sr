/**
 * SettingsPage — User Account & Profile Management
 *
 * Sections:
 *  1. Profile Info (display name, email, role badge) — read
 *  2. Edit Full Name — PUT /api/v1/users/me
 *  3. Change Password — PUT /api/v1/users/me (with currentPassword validation)
 *  4. Danger Zone — DELETE /api/v1/users/me with confirmation modal
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Modal } from '../../components/ui/Modal';
import { Badge, RoleBadge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import {
  User,
  Mail,
  Lock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  Save,
} from 'lucide-react';

// ── Tiny reusable field component ──────────────────────────────────────────────
const Field: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
}> = ({ label, error, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-slate-600">{label}</label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs text-red-600">
        <AlertTriangle className="h-3 w-3" />
        {error}
      </p>
    )}
  </div>
);

// ── Card wrapper ───────────────────────────────────────────────────────────────
const Card: React.FC<{
  title: string;
  description?: string;
  icon: React.FC<{ className?: string }>;
  iconColor?: string;
  children: React.ReactNode;
  danger?: boolean;
}> = ({ title, description, icon: Icon, iconColor = 'text-indigo-600', children, danger }) => (
  <div
    className={`rounded-2xl border bg-white p-6 shadow-sm ${
      danger ? 'border-red-200' : 'border-slate-200'
    }`}
  >
    <div className="mb-5 flex items-start gap-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          danger ? 'bg-red-50' : 'bg-slate-50'
        }`}
      >
        <Icon className={`h-4.5 w-4.5 ${danger ? 'text-red-500' : iconColor}`} />
      </div>
      <div>
        <h2 className={`text-sm font-bold ${danger ? 'text-red-700' : 'text-slate-800'}`}>
          {title}
        </h2>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
    </div>
    {children}
  </div>
);

// ── Input component ────────────────────────────────────────────────────────────
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }
>(({ error, className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/30 ${
      error
        ? 'border-red-300 bg-red-50 focus:border-red-400'
        : 'border-slate-200 bg-slate-50 focus:border-indigo-400 focus:bg-white'
    } ${className}`}
    {...props}
  />
));
Input.displayName = 'Input';

// ─────────────────────────────────────────────────────────────────────────────
export const SettingsPage: React.FC = () => {
  const { user, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // ── Name edit state
  const [name, setName] = useState(user?.fullName ?? '');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  // ── Password state
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  // ── Delete account state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sync name when user loads
  useEffect(() => {
    if (user?.fullName) setName(user.fullName);
  }, [user?.fullName]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleNameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }
    if (name.trim() === user?.fullName) {
      toast.info('No changes to save');
      return;
    }

    setNameLoading(true);
    setNameError('');
    try {
      await api.put('/api/v1/users/me', { fullName: name.trim() });
      await refreshProfile();
      toast.success('Your name has been updated!');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to update name';
      setNameError(msg);
      toast.error(msg);
    } finally {
      setNameLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!pwForm.currentPassword) errors.currentPassword = 'Current password is required';
    if (!pwForm.newPassword) errors.newPassword = 'New password is required';
    else if (pwForm.newPassword.length < 8) errors.newPassword = 'Must be at least 8 characters';
    else if (!/[A-Z]/.test(pwForm.newPassword)) errors.newPassword = 'Must include an uppercase letter';
    else if (!/[0-9]/.test(pwForm.newPassword)) errors.newPassword = 'Must include a number';
    if (pwForm.newPassword !== pwForm.confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      setPwErrors(errors);
      return;
    }

    setPwLoading(true);
    setPwErrors({});
    try {
      await api.put('/api/v1/users/me', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to change password';
      setPwErrors({ currentPassword: msg });
      toast.error(msg);
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.email) return;
    setDeleteLoading(true);
    try {
      await api.delete('/api/v1/users/me');
      await logout();
      navigate('/login', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete account');
      setDeleteLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Account Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your personal information and account security.
        </p>
      </div>

      {/* ── Profile Summary Card ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {/* Avatar */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-black text-white shadow-md shadow-indigo-500/30">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-bold text-slate-900">{user.fullName}</p>
            <RoleBadge role={user.role} />
            {user.isVerified ? (
              <Badge variant="success" dot>Verified</Badge>
            ) : (
              <Badge variant="warning" dot>Unverified</Badge>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-slate-500">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {user.email}
          </p>
        </div>
      </div>

      {/* ── Edit Name ────────────────────────────────────────────────────── */}
      <Card
        title="Personal Information"
        description="Update your display name visible across the platform."
        icon={User}
      >
        <form onSubmit={handleNameSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full Name" error={nameError}>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError('');
                }}
                placeholder="Your full name"
                error={!!nameError}
                autoComplete="name"
              />
            </Field>
            <Field label="Email Address">
              <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate text-sm text-slate-500">{user.email}</span>
                <span className="ml-auto text-[10px] font-semibold uppercase text-slate-400">
                  Read only
                </span>
              </div>
            </Field>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={nameLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30 transition-all hover:bg-indigo-500 disabled:opacity-60"
            >
              {nameLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </Card>

      {/* ── Change Password ───────────────────────────────────────────────── */}
      <Card
        title="Change Password"
        description="Use a strong password: at least 8 characters, one uppercase letter, one number."
        icon={Lock}
        iconColor="text-violet-600"
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {/* Current Password */}
          <Field label="Current Password" error={pwErrors.currentPassword}>
            <div className="relative">
              <Input
                type={showPw.current ? 'text' : 'password'}
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Enter current password"
                error={!!pwErrors.currentPassword}
                autoComplete="current-password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw((s) => ({ ...s, current: !s.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Toggle password visibility"
              >
                {showPw.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* New Password */}
            <Field label="New Password" error={pwErrors.newPassword}>
              <div className="relative">
                <Input
                  type={showPw.new ? 'text' : 'password'}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="New password"
                  error={!!pwErrors.newPassword}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((s) => ({ ...s, new: !s.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPw.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm New Password" error={pwErrors.confirmPassword}>
              <div className="relative">
                <Input
                  type={showPw.confirm ? 'text' : 'password'}
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Repeat new password"
                  error={!!pwErrors.confirmPassword}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPw.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
          </div>

          {/* Password strength hints */}
          {pwForm.newPassword && (
            <div className="flex flex-wrap gap-2">
              {[
                { label: '8+ chars', ok: pwForm.newPassword.length >= 8 },
                { label: 'Uppercase', ok: /[A-Z]/.test(pwForm.newPassword) },
                { label: 'Number', ok: /[0-9]/.test(pwForm.newPassword) },
              ].map((hint) => (
                <span
                  key={hint.label}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    hint.ok
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <CheckCircle2 className={`h-3 w-3 ${hint.ok ? 'text-emerald-500' : 'text-slate-300'}`} />
                  {hint.label}
                </span>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pwLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-600/30 transition-all hover:bg-violet-500 disabled:opacity-60"
            >
              {pwLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Update Password
            </button>
          </div>
        </form>
      </Card>

      {/* ── Danger Zone ──────────────────────────────────────────────────── */}
      <Card
        title="Danger Zone"
        description="Once your account is deleted, all data is permanently removed and cannot be recovered."
        icon={Trash2}
        danger
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-700">Delete my account</p>
            <p className="text-xs text-slate-500">
              This will permanently delete your account and all associated records.
            </p>
          </div>
          <button
            onClick={() => setDeleteOpen(true)}
            className="ml-4 shrink-0 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition-all hover:bg-red-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Account
          </button>
        </div>
      </Card>

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteConfirm('');
        }}
        title="Delete Account"
        size="sm"
        persistent={deleteLoading}
      >
        <div className="space-y-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-800">
              This action cannot be undone
            </p>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              All your data — including your student profile, uploaded documents, and academic
              records — will be permanently deleted.
            </p>
          </div>

          <Field label={`Type your email address to confirm: ${user.email}`}>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={user.email}
              autoComplete="off"
            />
          </Field>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setDeleteOpen(false);
                setDeleteConfirm('');
              }}
              disabled={deleteLoading}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== user.email || deleteLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleteLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
