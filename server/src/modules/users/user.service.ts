import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../auth/user.model';
import { StudentProfile } from '../profile/profile.model';
import { ApiError } from '../../utils/errors';
import { getCache, setCache, invalidateCacheByPrefix, deleteCache } from '../../utils/cache';
import type { UpdateProfileInput, UserQueryInput, AdminUpdateUserInput } from './user.validator';

// Cache key namespaces
const USERS_LIST_PREFIX = 'users:list:';
const USER_STATS_KEY = 'users:stats';

// ─── User Self-Service ─────────────────────────────────────────────────────────

/**
 * Get the authenticated user's account info merged with their student profile.
 */
export async function getUserMe(userId: string) {
  const cacheKey = `user:me:${userId}`;
  const cached = await getCache<object>(cacheKey);
  if (cached) return cached;

  const user = await User.findById(userId).select('-passwordHash -verificationToken -resetPasswordToken').lean();
  if (!user) throw ApiError.notFound('User not found');

  const profile = await StudentProfile.findOne({ userId }).lean();

  const result = { user, profile };
  await setCache(cacheKey, result, 120); // cache for 2 minutes
  return result;
}

/**
 * Update the authenticated user's full name and/or password.
 *
 * PASSWORD SECURITY CONCEPT:
 *   We never store plain-text passwords. When the user wants to change their
 *   password we: (1) verify the currentPassword against the stored bcrypt hash,
 *   (2) only then hash the newPassword and save it. This prevents unauthorized
 *   password changes if someone gets access to a logged-in session.
 */
export async function updateUserMe(userId: string, input: UpdateProfileInput) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  if (input.fullName) {
    user.fullName = input.fullName;
  }

  if (input.newPassword) {
    if (!input.currentPassword) {
      throw ApiError.badRequest('Current password required to set a new password');
    }
    const isMatch = await user.comparePassword(input.currentPassword);
    if (!isMatch) {
      throw ApiError.unauthorized('Current password is incorrect');
    }
    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(input.newPassword, salt);
  }

  await user.save();

  // Invalidate this user's cache so next GET /me fetches fresh data
  await deleteCache(`user:me:${userId}`);

  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };
}

/**
 * Permanently delete the authenticated user's account.
 *
 * CASCADING DELETION CONCEPT:
 *   When a user is deleted, we also clean up all associated data to avoid
 *   orphaned records in the database. We use mongoose session + transactions
 *   to ensure either ALL deletions succeed or NONE do (atomicity).
 *
 *   Orphaned data causes bugs, wasted storage, and privacy compliance issues.
 */
export async function deleteUserMe(userId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findByIdAndDelete(userId).session(session);
    if (!user) throw ApiError.notFound('User not found');

    // Cascade: remove the student profile
    await StudentProfile.deleteOne({ userId }).session(session);

    // Note: Document files stored on disk/S3 are NOT deleted here to preserve
    // audit trail. In production you would queue a background job via BullMQ.

    await session.commitTransaction();

    // Invalidate caches
    await deleteCache(`user:me:${userId}`);
    await invalidateCacheByPrefix(USERS_LIST_PREFIX);
    await deleteCache(USER_STATS_KEY);
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

// ─── Admin Services ────────────────────────────────────────────────────────────

/**
 * Get a paginated, filterable, searchable list of all users.
 *
 * SERVER-SIDE PAGINATION CONCEPT:
 *   Formula: skip = (page - 1) * limit
 *   Example: page=3, limit=10 → skip 20 records, fetch next 10.
 *   We run the data query and count query CONCURRENTLY with Promise.all()
 *   to keep latency low instead of running them sequentially.
 *
 *   Result includes full pagination metadata so the frontend can render
 *   "Page 3 of 17" and enable/disable Prev/Next buttons correctly.
 */
export async function getUsersList(input: UserQueryInput) {
  const { page, limit, search, role, sortBy, sortOrder } = input;

  const cacheKey = `${USERS_LIST_PREFIX}${JSON.stringify(input)}`;
  const cached = await getCache<object>(cacheKey);
  if (cached) return cached;

  // Build the MongoDB filter
  const filter: Record<string, unknown> = {};
  if (role !== 'all') filter.role = role;
  if (search) {
    const regex = new RegExp(search, 'i'); // case-insensitive search
    filter.$or = [{ fullName: regex }, { email: regex }];
  }

  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  // Run data fetch + total count concurrently
  const [users, totalRecords] = await Promise.all([
    User.find(filter)
      .select('-passwordHash -verificationToken -resetPasswordToken')
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalRecords / limit);

  const result = {
    users,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };

  await setCache(cacheKey, result, 30); // shorter TTL for admin lists
  return result;
}

/**
 * Get full detail of a single user (for admin inspection).
 */
export async function getUserById(id: string) {
  const user = await User.findById(id)
    .select('-passwordHash -verificationToken -resetPasswordToken')
    .lean();
  if (!user) throw ApiError.notFound('User not found');

  const profile = await StudentProfile.findOne({ userId: id }).lean();
  return { user, profile };
}

/**
 * Admin: Update a user's role or verification status.
 */
export async function adminUpdateUser(id: string, input: AdminUpdateUserInput) {
  const user = await User.findByIdAndUpdate(
    id,
    { $set: input },
    { new: true, runValidators: true }
  ).select('-passwordHash -verificationToken -resetPasswordToken');

  if (!user) throw ApiError.notFound('User not found');

  // Invalidate caches on data change
  await deleteCache(`user:me:${id}`);
  await invalidateCacheByPrefix(USERS_LIST_PREFIX);
  await deleteCache(USER_STATS_KEY);

  return user;
}

/**
 * Admin: Delete any user by ID with cascading cleanup.
 */
export async function adminDeleteUser(id: string) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findByIdAndDelete(id).session(session);
    if (!user) throw ApiError.notFound('User not found');

    await StudentProfile.deleteOne({ userId: id }).session(session);

    await session.commitTransaction();

    await deleteCache(`user:me:${id}`);
    await invalidateCacheByPrefix(USERS_LIST_PREFIX);
    await deleteCache(USER_STATS_KEY);
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Get high-level user statistics for the admin dashboard.
 */
export async function getUserStats() {
  const cached = await getCache<object>(USER_STATS_KEY);
  if (cached) return cached;

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [total, verified, admins, newThisWeek] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
  ]);

  const stats = { total, verified, admins, newThisWeek };
  await setCache(USER_STATS_KEY, stats, 120);
  return stats;
}
