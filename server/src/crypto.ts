/**
 * NEXORA AI — Sovereign Cryptography & Vault Security Engine
 * Implements AES-256-GCM authenticated encryption for sensitive records,
 * and SHA-256 cryptographic digests for verification and telemetry masking.
 *
 * IMPORTANT: SHA-256 is an irreversible cryptographic one-way hash function.
 * It is used solely for verification, integrity checks, and search digests.
 * Real recovery of sensitive credentials requires authenticated AES-256-GCM encryption.
 */

import crypto from 'crypto';

// Master key derivation: derives a 32-byte (256-bit) cipher key strictly from VAULT_ENCRYPTION_KEY
function getMasterKey(): Buffer {
  const isProduction = process.env.NODE_ENV === 'production';
  const rawKey = process.env.VAULT_ENCRYPTION_KEY?.trim();

  if (isProduction) {
    if (!rawKey || rawKey.length < 32) {
      throw new Error(
        'FATAL SECURITY CONFIGURATION ERROR: VAULT_ENCRYPTION_KEY must be configured in environment variables and contain at least 32 characters (256-bit entropy). Refusing to operate with missing or insecure key.'
      );
    }
    return crypto.createHash('sha256').update(rawKey).digest();
  }

  // Development and testing environments
  if (rawKey) {
    if (rawKey.length < 16) {
      throw new Error(
        'SECURITY ERROR: VAULT_ENCRYPTION_KEY must contain at least 16 characters in non-production environments.'
      );
    }
    return crypto.createHash('sha256').update(rawKey).digest();
  }

  // If in development mode and key is missing: fail closed
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      'SECURITY ERROR: VAULT_ENCRYPTION_KEY is missing. Configure VAULT_ENCRYPTION_KEY in server/.env before starting the server.'
    );
  }

  // Fail closed if explicitly testing missing key behavior in test environment
  if (process.env.TEST_MISSING_VAULT_KEY === 'true') {
    throw new Error('SECURITY ERROR: VAULT_ENCRYPTION_KEY is missing. Failing closed.');
  }

  // Isolated deterministic key strictly for offline test suites
  return crypto.createHash('sha256').update('nexora-test-environment-deterministic-vault-key-32b').digest();
}

/**
 * Validates whether the current environment has a cryptographically compliant vault key
 */
export function validateVaultKeyConfiguration(): { valid: boolean; error?: string } {
  const isProduction = process.env.NODE_ENV === 'production';
  const rawKey = process.env.VAULT_ENCRYPTION_KEY?.trim();

  if (isProduction) {
    if (!rawKey || rawKey.length < 32) {
      return {
        valid: false,
        error: 'VAULT_ENCRYPTION_KEY is required and must be >= 32 characters in production.',
      };
    }
  } else if (!rawKey && process.env.NODE_ENV !== 'test') {
    return {
      valid: false,
      error: 'VAULT_ENCRYPTION_KEY is required in development.',
    };
  }

  return { valid: true };
}

export interface EncryptedPayload {
  iv: string; // 12-byte hex IV
  authTag: string; // 16-byte hex authentication tag
  ciphertext: string; // hex encrypted data
  digest: string; // 8-char SHA-256 digest of original plaintext
  displayMask: string; // Safe representation for logs/prompts
}

export const VaultCrypto = {
  /**
   * One-way cryptographic digest for indexing and verification.
   * NOTE: This is NOT encryption and cannot be reversed.
   */
  hashSha256(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  },

  /**
   * Create safe display mask without exposing sensitive credentials in logs
   */
  createDisplayMask(content: string, digestPrefix?: string): string {
    const trimmed = content.trim();
    const digest = digestPrefix || this.hashSha256(trimmed).slice(0, 8);
    const prefix = trimmed.slice(0, 3);
    const suffix = trimmed.length > 5 ? trimmed.slice(-2) : '••';
    return `[CRITICAL PROTECTED] ${prefix}••••••${suffix} (Digest: ${digest})`;
  },

  /**
   * Encrypt sensitive content using AES-256-GCM (Authenticated Encryption)
   */
  encrypt(plaintext: string): EncryptedPayload {
    const key = getMasterKey();
    const iv = crypto.randomBytes(12); // Recommended 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    const digest = this.hashSha256(plaintext).slice(0, 8);
    const displayMask = this.createDisplayMask(plaintext, digest);

    return {
      iv: iv.toString('hex'),
      authTag,
      ciphertext,
      digest,
      displayMask,
    };
  },

  /**
   * Decrypt AES-256-GCM encrypted payload back to original plaintext
   */
  decrypt(payload: { iv: string; authTag: string; ciphertext: string }): string {
    const key = getMasterKey();
    const iv = Buffer.from(payload.iv, 'hex');
    const authTag = Buffer.from(payload.authTag, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(payload.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },

  /**
   * Serializes an EncryptedPayload into a compact portable string: "iv:authTag:ciphertext"
   */
  serialize(payload: { iv: string; authTag: string; ciphertext: string }): string {
    return `${payload.iv}:${payload.authTag}:${payload.ciphertext}`;
  },

  /**
   * Deserializes a compact string back to components
   */
  deserialize(serialized: string): { iv: string; authTag: string; ciphertext: string } | null {
    const parts = serialized.split(':');
    if (parts.length !== 3) return null;
    return {
      iv: parts[0],
      authTag: parts[1],
      ciphertext: parts[2],
    };
  },
};
