/**
 * Authentication Utilities
 * 
 * Provides password hashing and verification using Web Crypto API
 * (Compatible with Cloudflare Workers environment)
 */

/**
 * Hash a password using PBKDF2 (Web Crypto API)
 * This is compatible with Cloudflare Workers and provides strong security
 */
export async function hashPassword(password: string, salt?: Uint8Array): Promise<{ hash: string; salt: string }> {
  // Generate salt if not provided
  if (!salt) {
    salt = crypto.getRandomValues(new Uint8Array(16))
  }

  // Import password as key material
  const encoder = new TextEncoder()
  const passwordData = encoder.encode(password)

  // Import key for PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  // Derive key using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // High iteration count for security
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 256 bits = 32 bytes
  )

  // Convert to base64 for storage
  const hashArray = new Uint8Array(hashBuffer)
  const hashBase64 = btoa(String.fromCharCode(...hashArray))
  const saltBase64 = btoa(String.fromCharCode(...salt))

  return {
    hash: hashBase64,
    salt: saltBase64
  }
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  try {
    // Decode salt from base64
    const saltArray = Uint8Array.from(atob(storedSalt), c => c.charCodeAt(0))

    // Hash the provided password with the stored salt
    const { hash } = await hashPassword(password, saltArray)

    // Compare hashes (constant-time comparison)
    return hash === storedHash
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  // Generate 32 random bytes (256 bits)
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)

  // Convert to base64url (URL-safe base64)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Hash a token for secure storage
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = new Uint8Array(hashBuffer)

  // Convert to hex string
  return Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

