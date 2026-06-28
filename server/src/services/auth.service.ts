import { User, IUser } from '@/models/user.model';
import { hashPassword, comparePassword } from '@/utils/crypto';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/utils/token';
import { ApiError } from '@/utils/ApiError';

export interface AuthSession {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * Register a new user.
 */
export async function register(name: string, email: string, password: string): Promise<IUser> {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const hashedPassword = await hashPassword(password);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  // Convert to object and strip password
  const userObj = user.toObject() as Partial<IUser>;
  delete userObj.password;
  return userObj as IUser;
}

/**
 * Log in an existing user.
 */
export async function login(email: string, password: string, rememberMe = false): Promise<AuthSession> {
  // Select password field explicitly since it's hidden by default
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.password) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isPasswordMatch = await comparePassword(password, user.password);
  if (!isPasswordMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString(), rememberMe);

  // Store refresh token for rotation tracking
  user.refreshTokens.push(refreshToken);
  await user.save();

  const userObj = user.toObject() as Partial<IUser>;
  delete userObj.password;
  delete userObj.refreshTokens;

  return {
    user: userObj as IUser,
    accessToken,
    refreshToken,
  };
}

/**
 * Clean up a session by removing the refresh token.
 */
export async function logout(userId: string, refreshToken: string): Promise<void> {
  const user = await User.findById(userId);
  if (user) {
    user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
    await user.save();
  }
}

/**
 * Refresh the access token using refresh token rotation.
 */
export async function refresh(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    const payload = verifyRefreshToken(oldRefreshToken);
    const user = await User.findById(payload.userId);
    
    if (!user || !user.refreshTokens.includes(oldRefreshToken)) {
      // Token reuse or invalid token; revoke all tokens for safety
      if (user) {
        user.refreshTokens = [];
        await user.save();
      }
      throw ApiError.unauthorized('Session has expired. Please login again');
    }

    // Rotate refresh token
    const newAccessToken = generateAccessToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    // Replace old refresh token with the new one
    user.refreshTokens = user.refreshTokens.filter((token) => token !== oldRefreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.unauthorized('Invalid or expired session');
  }
}
