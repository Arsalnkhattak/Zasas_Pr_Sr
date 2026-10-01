import React from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-violet-50 text-violet-700 border-violet-200',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className, dot }) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
      variants[variant],
      className
    )}
  >
    {dot && (
      <span
        className={clsx('h-1.5 w-1.5 rounded-full', {
          'bg-slate-500': variant === 'default',
          'bg-emerald-500': variant === 'success',
          'bg-amber-500': variant === 'warning',
          'bg-red-500': variant === 'danger',
          'bg-blue-500': variant === 'info',
          'bg-violet-500': variant === 'purple',
        })}
      />
    )}
    {children}
  </span>
);

/** Convenience: role badge maps role string to a variant */
export const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const map: Record<string, BadgeVariant> = {
    admin: 'danger',
    staff: 'purple',
    user: 'info',
  };
  return <Badge variant={map[role] ?? 'default'}>{role}</Badge>;
};
