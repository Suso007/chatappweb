// Utility for Web Crypto API operations
// Used for End-to-End Encryption

// Generate a random AES-GCM key
export async function generateKey(): Promise<CryptoKey> {
  return window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// Export key to base64 string (for URL hash)
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

// Import key from base64 string
export async function importKey(base64Key: string): Promise<CryptoKey> {
  try {
    const binary = atob(base64Key);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return window.crypto.subtle.importKey(
      "raw",
      bytes,
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  } catch (e) {
    throw new Error("Invalid encryption key format");
  }
}

// Encrypt text
export async function encryptMessage(
  text: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(text);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encodedText
  );

  const ciphertextArray = new Uint8Array(ciphertextBuffer);
  const ciphertext = btoa(String.fromCharCode(...ciphertextArray));
  const ivString = btoa(String.fromCharCode(...iv));

  return { ciphertext, iv: ivString };
}

// Decrypt text
export async function decryptMessage(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  try {
    const ciphertextBinary = atob(ciphertext);
    const ciphertextArray = new Uint8Array(ciphertextBinary.length);
    for (let i = 0; i < ciphertextBinary.length; i++) {
      ciphertextArray[i] = ciphertextBinary.charCodeAt(i);
    }

    const ivBinary = atob(iv);
    const ivArray = new Uint8Array(ivBinary.length);
    for (let i = 0; i < ivBinary.length; i++) {
      ivArray[i] = ivBinary.charCodeAt(i);
    }

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivArray,
      },
      key,
      ciphertextArray
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (e) {
    console.error("Decryption failed", e);
    return "[Decryption Error]";
  }
}
