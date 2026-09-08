import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const TAG_LENGTH = 16; // 128-bit authentication tag

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is not defined.');
  }

  // If provided as 64-character hex string (32 bytes)
  if (keyHex.length === 64) {
    return Buffer.from(keyHex, 'hex');
  }

  // Fallback: derive 32-byte key via SHA-256
  return crypto.createHash('sha256').update(keyHex).digest();
}

/**
 * Mask an API key so that only prefixes and suffixes are visible.
 * e.g. "sk-ant-api03-abcdef123456" -> "sk-...3456"
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey) return '';
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) {
    return `${trimmed.slice(0, 2)}...${trimmed.slice(-2)}`;
  }
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}...${suffix}`;
}

export interface EncryptedPayload {
  encryptedApiKey: string;
  apiKeyIv: string;
  apiKeyTag: string;
  keyMask: string;
}

/**
 * Encrypt API key at-rest using AES-256-GCM.
 * Never logs the plain key.
 */
export function encryptApiKey(plainKey: string): EncryptedPayload {
  if (!plainKey || typeof plainKey !== 'string') {
    throw new Error('Invalid API key provided for encryption');
  }

  const trimmed = plainKey.trim();
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(trimmed, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    encryptedApiKey: encrypted.toString('base64'),
    apiKeyIv: iv.toString('hex'),
    apiKeyTag: tag.toString('hex'),
    keyMask: maskApiKey(trimmed),
  };
}

/**
 * Decrypt API key at-rest.
 * Plaintext must ONLY exist in temporary server memory during outbound API call.
 */
export function decryptApiKey(
  encryptedApiKey: string,
  apiKeyIv: string,
  apiKeyTag: string
): string {
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(apiKeyIv, 'hex');
    const tag = Buffer.from(apiKeyTag, 'hex');
    const encryptedText = Buffer.from(encryptedApiKey, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error('Failed to decrypt API key: authentication tag mismatch or corrupted ciphertext.');
  }
}
