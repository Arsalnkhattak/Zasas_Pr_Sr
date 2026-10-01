import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, IUser } from './user.model';
import { ApiError } from '../../utils/errors';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '../../utils/token';

export class AuthService {
  async register(data: { fullName: string; email: string; password: string; role?: 'user' | 'staff' | 'admin' }) {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(data.password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role || 'user',
      isVerified: false,
      verificationToken,
    });

    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      accessToken,
      refreshToken,
      verificationToken, // Returned for dev/testing ease
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await User.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshTokenStr: string) {
    try {
      const payload = verifyRefreshToken(refreshTokenStr);
      const user = await User.findById(payload.userId);

      if (!user) {
        throw ApiError.unauthorized('User not found');
      }

      const newPayload: TokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      const accessToken = generateAccessToken(newPayload);
      const refreshToken = generateRefreshToken(newPayload);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      };
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
  }

  async getCurrentUser(userId: string) {
    const user = await User.findById(userId).select('-passwordHash -verificationToken -resetPasswordToken');
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  async verifyEmail(token: string) {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      throw ApiError.badRequest('Invalid or expired verification token');
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    return { success: true, message: 'Email verified successfully' };
  }

  async forgotPassword(email: string) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't leak user existence
      return { success: true, message: 'If the email is registered, a reset link has been dispatched.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    return {
      success: true,
      message: 'If the email is registered, a reset link has been dispatched.',
      resetToken, // For dev/testing ease
    };
  }

  async resetPassword(token: string, newPass: string) {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired password reset token');
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPass, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { success: true, message: 'Password has been reset successfully' };
  }
}

export const authService = new AuthService();
