import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hashed a plain text password.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plain text password with a hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
