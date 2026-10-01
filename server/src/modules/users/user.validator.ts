import { z } from 'zod';

/**
 * Schema for a user updating their own profile information.
 * Full name is optional (only update what's changed).
 * Password change requires the current password for security.
 */
export const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(80, 'Full name too long')
      .optional(),
    currentPassword: z.string().min(1, 'Current password is required to set a new password').optional(),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'New password must contain at least one number')
      .optional(),
  })
  .refine(
    (data) => {
      // If newPassword is provided, currentPassword must also be provided
      if (data.newPassword && !data.currentPassword) return false;
      return true;
    },
    {
      message: 'Current password is required when setting a new password',
      path: ['currentPassword'],
    }
  )
  .refine((data) => data.fullName || data.newPassword, {
    message: 'Provide at least a fullName or a new password to update',
  });

/**
 * Schema for paginated admin user listing.
 */
export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  role: z.enum(['user', 'staff', 'admin', 'all']).default('all'),
  sortBy: z.enum(['createdAt', 'fullName', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema for admin updating another user's role or verification status.
 */
export const adminUpdateUserSchema = z.object({
  role: z.enum(['user', 'staff', 'admin']).optional(),
  isVerified: z.boolean().optional(),
}).refine((data) => data.role !== undefined || data.isVerified !== undefined, {
  message: 'Provide at least one field to update (role or isVerified)',
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
