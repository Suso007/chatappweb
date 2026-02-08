/**
 * E2E Encryption using ECDH for key agreement + AES-GCM for message encryption
 * 
 * Flow:
 * 1. Each user generates an ECDH key pair locally
 * 2. Public key is uploaded to server, private key stays in localStorage
 * 3. To encrypt: derive shared secret from your private key + recipient's public key
 * 4. Use derived key for AES-GCM encryption
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const CURVE = "P-256";

// ============================================
// Key Management
// ============================================

/**
 * Generate a new ECDH key pair
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: CURVE,
    },
    true, // extractable (needed for export)
    ["deriveKey", "deriveBits"]
  );
}

/**
 * Export public key to base64 (for uploading to server)
 */
export async function exportPublicKey(keyPair: CryptoKeyPair): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  return arrayBufferToBase64(exported);
}

/**
 * Export private key to base64 (for localStorage backup)
 */
export async function exportPrivateKey(keyPair: CryptoKeyPair): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  return arrayBufferToBase64(exported);
}

/**
 * Import public key from base64 (recipient's key from server)
 */
export async function importPublicKey(base64Key: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(base64Key);
  return window.crypto.subtle.importKey(
    "spki",
    keyData,
    {
      name: "ECDH",
      namedCurve: CURVE,
    },
    false,
    []
  );
}

/**
 * Import private key from base64 (from localStorage)
 */
export async function importPrivateKey(base64Key: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(base64Key);
  return window.crypto.subtle.importKey(
    "pkcs8",
    keyData,
    {
      name: "ECDH",
      namedCurve: CURVE,
    },
    false,
    ["deriveKey", "deriveBits"]
  );
}

// ============================================
// Key Derivation (ECDH)
// ============================================

/**
 * Derive a shared AES key from your private key and recipient's public key
 */
export async function deriveSharedKey(
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey
): Promise<CryptoKey> {
  return window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: theirPublicKey,
    },
    myPrivateKey,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

// ============================================
// Encryption / Decryption
// ============================================

/**
 * Encrypt a message using AES-GCM with the derived shared key
 */
export async function encryptMessage(
  text: string,
  sharedKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(text);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    sharedKey,
    encodedText
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
  };
}

/**
 * Decrypt a message using AES-GCM with the derived shared key
 */
export async function decryptMessage(
  ciphertext: string,
  iv: string,
  sharedKey: CryptoKey
): Promise<string> {
  try {
    const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
    const ivBuffer = base64ToArrayBuffer(iv);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: ivBuffer,
      },
      sharedKey,
      ciphertextBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (e) {
    console.error("Decryption failed:", e);
    throw new Error("Failed to decrypt message");
  }
}

// ============================================
// Local Storage Helpers
// ============================================

const PRIVATE_KEY_STORAGE_KEY = "securechat_private_key";
const PUBLIC_KEY_STORAGE_KEY = "securechat_public_key";

/**
 * Store key pair in localStorage
 */
export async function storeKeyPair(keyPair: CryptoKeyPair): Promise<void> {
  const privateKeyBase64 = await exportPrivateKey(keyPair);
  const publicKeyBase64 = await exportPublicKey(keyPair);

  localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, privateKeyBase64);
  localStorage.setItem(PUBLIC_KEY_STORAGE_KEY, publicKeyBase64);
}

/**
 * Load key pair from localStorage
 */
export async function loadKeyPair(): Promise<{
  privateKey: CryptoKey;
  publicKey: string;
} | null> {
  const privateKeyBase64 = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
  const publicKeyBase64 = localStorage.getItem(PUBLIC_KEY_STORAGE_KEY);

  if (!privateKeyBase64 || !publicKeyBase64) {
    return null;
  }

  try {
    const privateKey = await importPrivateKey(privateKeyBase64);
    return { privateKey, publicKey: publicKeyBase64 };
  } catch (e) {
    console.error("Failed to load key pair:", e);
    return null;
  }
}

/**
 * Check if key pair exists in localStorage
 */
export function hasStoredKeyPair(): boolean {
  return !!(
    localStorage.getItem(PRIVATE_KEY_STORAGE_KEY) &&
    localStorage.getItem(PUBLIC_KEY_STORAGE_KEY)
  );
}

/**
 * Initialize or load existing key pair
 * Returns the public key base64 string
 */
export async function initializeKeys(): Promise<{
  privateKey: CryptoKey;
  publicKey: string;
}> {
  // Try to load existing keys
  const existing = await loadKeyPair();
  if (existing) {
    return existing;
  }

  // Generate new key pair
  const keyPair = await generateKeyPair();
  await storeKeyPair(keyPair);

  const publicKey = await exportPublicKey(keyPair);
  return {
    privateKey: keyPair.privateKey,
    publicKey,
  };
}

// ============================================
// Utility Functions
// ============================================

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}
