import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

/**
 * Utilities to encrypt/decrypt small JSON payloads using AES-256-GCM.
 * Used for securely storing pending sign-up data until email verification.
 */

function getEncryptionKey(): Buffer {
  const secret =
    process.env.PENDING_SIGNUP_SECRET || 'development-default-secret';
  // Derive a 32-byte key via SHA-256
  return createHash('sha256').update(secret).digest();
}

export function encryptJson(payload: unknown): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12); // 96-bit nonce for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store as base64 parts joined by dots: iv.authTag.ciphertext
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join('.');
}

export function decryptJson<T = unknown>(encrypted: string): T {
  const key = getEncryptionKey();
  const [ivB64, tagB64, dataB64] = encrypted.split('.');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid encrypted payload format');
  }
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}
