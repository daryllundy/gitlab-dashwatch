// Secure storage utilities for sensitive data like GitLab tokens
// Uses Web Crypto API for encryption/decryption

import { logger } from './logger';

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM

// Storage keys
const STORAGE_KEYS = {
  GITLAB_TOKENS: 'gitlab_tokens_encrypted',
  ENCRYPTION_KEY: 'gitlab_encryption_key',
  KEY_SALT: 'gitlab_key_salt',
} as const;

// In-memory cache for encryption keys
let encryptionKey: CryptoKey | null = null;
let keySalt: Uint8Array | null = null;

/**
 * Generate a new encryption key from password
 */
async function deriveEncryptionKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random salt for key derivation
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Generate a random IV for encryption
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt data using AES-GCM
 */
async function encryptData(data: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = generateIV();

  const encrypted = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv: iv,
    },
    key,
    encoder.encode(data)
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return arrayBufferToBase64(combined.buffer);
}

/**
 * Decrypt data using AES-GCM
 */
async function decryptData(encryptedData: string, key: CryptoKey): Promise<string> {
  try {
    const combined = new Uint8Array(base64ToArrayBuffer(encryptedData));
    const iv = combined.slice(0, IV_LENGTH);
    const encrypted = combined.slice(IV_LENGTH);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv,
      },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    logger.error('Failed to decrypt data', 'secureStorage', error);
    throw new Error('Failed to decrypt data. The encryption key may be incorrect.');
  }
}

/**
 * Initialize encryption key from password
 */
export async function initializeEncryption(password: string): Promise<void> {
  try {
    // Check if we already have a salt stored
    const storedSalt = localStorage.getItem(STORAGE_KEYS.KEY_SALT);
    if (storedSalt) {
      keySalt = new Uint8Array(base64ToArrayBuffer(storedSalt));
    } else {
      // Generate new salt
      keySalt = generateSalt();
      localStorage.setItem(STORAGE_KEYS.KEY_SALT, arrayBufferToBase64(keySalt));
    }

    // Derive encryption key
    encryptionKey = await deriveEncryptionKey(password, keySalt);
    logger.info('Encryption initialized successfully', 'secureStorage');
  } catch (error) {
    logger.error('Failed to initialize encryption', 'secureStorage', error);
    throw new Error('Failed to initialize secure storage');
  }
}

/**
 * Check if encryption is initialized
 */
export function isEncryptionInitialized(): boolean {
  return encryptionKey !== null && keySalt !== null;
}

/**
 * Store encrypted GitLab token
 */
export async function storeGitlabToken(instanceId: string, token: string): Promise<void> {
  if (!isEncryptionInitialized()) {
    throw new Error('Encryption not initialized. Call initializeEncryption() first.');
  }

  try {
    // Get existing tokens
    const existingTokens = await getStoredGitlabTokens();

    // Encrypt new token
    const encryptedToken = await encryptData(token, encryptionKey!);

    // Update tokens
    existingTokens[instanceId] = encryptedToken;

    // Store encrypted tokens
    const tokensJson = JSON.stringify(existingTokens);
    localStorage.setItem(STORAGE_KEYS.GITLAB_TOKENS, tokensJson);

    logger.info(`GitLab token stored securely for instance: ${instanceId}`, 'secureStorage');
  } catch (error) {
    logger.error(`Failed to store GitLab token for instance: ${instanceId}`, 'secureStorage', error);
    throw new Error('Failed to securely store GitLab token');
  }
}

/**
 * Retrieve decrypted GitLab token
 */
export async function getGitlabToken(instanceId: string): Promise<string | null> {
  if (!isEncryptionInitialized()) {
    throw new Error('Encryption not initialized. Call initializeEncryption() first.');
  }

  try {
    const tokens = await getStoredGitlabTokens();
    const encryptedToken = tokens[instanceId];

    if (!encryptedToken) {
      return null;
    }

    // Decrypt token
    const decryptedToken = await decryptData(encryptedToken, encryptionKey!);
    return decryptedToken;
  } catch (error) {
    logger.error(`Failed to retrieve GitLab token for instance: ${instanceId}`, 'secureStorage', error);
    throw new Error('Failed to retrieve GitLab token');
  }
}

/**
 * Remove GitLab token
 */
export async function removeGitlabToken(instanceId: string): Promise<void> {
  try {
    const tokens = await getStoredGitlabTokens();
    delete tokens[instanceId];

    const tokensJson = JSON.stringify(tokens);
    localStorage.setItem(STORAGE_KEYS.GITLAB_TOKENS, tokensJson);

    logger.info(`GitLab token removed for instance: ${instanceId}`, 'secureStorage');
  } catch (error) {
    logger.error(`Failed to remove GitLab token for instance: ${instanceId}`, 'secureStorage', error);
    throw new Error('Failed to remove GitLab token');
  }
}

/**
 * Get all stored GitLab tokens (encrypted)
 */
async function getStoredGitlabTokens(): Promise<Record<string, string>> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.GITLAB_TOKENS);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    logger.error('Failed to parse stored GitLab tokens', 'secureStorage', error);
    return {};
  }
}

/**
 * Clear all stored GitLab tokens and encryption data
 */
export function clearAllGitlabTokens(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.GITLAB_TOKENS);
    localStorage.removeItem(STORAGE_KEYS.ENCRYPTION_KEY);
    localStorage.removeItem(STORAGE_KEYS.KEY_SALT);

    encryptionKey = null;
    keySalt = null;

    logger.info('All GitLab tokens and encryption data cleared', 'secureStorage');
  } catch (error) {
    logger.error('Failed to clear GitLab tokens', 'secureStorage', error);
    throw new Error('Failed to clear stored data');
  }
}

/**
 * Check if Web Crypto API is available
 */
export function isCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' &&
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.getRandomValues === 'function';
}

/**
 * Generate a secure random password for encryption
 */
export function generateSecurePassword(length: number = 32): string {
  if (!isCryptoAvailable()) {
    throw new Error('Web Crypto API not available');
  }

  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const charsetLength = charset.length;
  const randomValues = crypto.getRandomValues(new Uint8Array(length));

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charsetLength];
  }

  return password;
}

/**
 * Validate encryption setup
 */
export async function validateEncryptionSetup(password: string): Promise<boolean> {
  if (!isCryptoAvailable()) {
    return false;
  }

  try {
    // Try to initialize with the provided password
    await initializeEncryption(password);

    // Try to decrypt existing tokens to validate the password
    const tokens = await getStoredGitlabTokens();
    const tokenKeys = Object.keys(tokens);
    if (tokenKeys.length > 0) {
      // Try to decrypt first token to validate password
      const firstTokenId = tokenKeys[0]!;
      const encryptedToken = tokens[firstTokenId];
      if (encryptedToken) {
        await decryptData(encryptedToken, encryptionKey!);
      }
    }

    return true;
  } catch {
    // Reset encryption state on failure
    encryptionKey = null;
    return false;
  }
}

/**
 * Get encryption status information
 */
export function getEncryptionStatus(): {
  initialized: boolean;
  cryptoAvailable: boolean;
  hasStoredTokens: boolean;
  hasStoredSalt: boolean;
} {
  const storedTokens = localStorage.getItem(STORAGE_KEYS.GITLAB_TOKENS);
  const storedSalt = localStorage.getItem(STORAGE_KEYS.KEY_SALT);

  return {
    initialized: isEncryptionInitialized(),
    cryptoAvailable: isCryptoAvailable(),
    hasStoredTokens: storedTokens !== null && storedTokens !== '{}',
    hasStoredSalt: storedSalt !== null,
  };
}
