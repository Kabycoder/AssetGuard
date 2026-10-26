import crypto from 'crypto';

/**
 * Generates a valid 24-character hexadecimal MongoDB ObjectId string.
 * Used for in-memory fallback ID generation when primary MongoDB instance is offline.
 */
export function generateObjectId(): string {
  return crypto.randomBytes(12).toString('hex');
}
