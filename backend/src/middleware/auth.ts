import jwt from "@tsndr/cloudflare-worker-jwt"
import { DatabaseService } from "../services/database"
import type { Env } from "../types"

export interface AuthenticatedRequest extends Request {
  user?: {
    user_id: string;
    email: string;
    plan: string;
    verified: boolean;
    onboarding_completed?: boolean;
  };
}

/**
 * Authentication middleware that validates session tokens
 */
export async function authMiddleware(
  request: Request,
  env: Env
): Promise<{ isValid: boolean; user?: any; error?: string }> {
  try {
    // Be tolerant to header casing and formats
    const rawAuth = request.headers.get('authorization') || request.headers.get('Authorization') || ''
    console.log("🔐 Auth middleware - Authorization header:", rawAuth ? "Present" : "Missing");

    const match = rawAuth.match(/^Bearer\s+(.+)$/i)
    if (!match) {
      console.log("🔐 Auth middleware - No valid authorization header");
      return { isValid: false, error: 'No valid authorization header' };
    }

    const token = match[1]; // Extract token after Bearer
    console.log("🔐 Auth middleware - Token type check:", token.includes('.') ? "JWT format" : "Session token format");
    
    // Check if JWT_SECRET exists for JWT validation
    if (env.JWT_SECRET) {
      try {
        const isJwtValid = await jwt.verify(token, env.JWT_SECRET);
        console.log("🔐 Auth middleware - JWT validation:", isJwtValid ? "Valid" : "Invalid");
        
        if (isJwtValid) {
          // Handle JWT tokens (email verification)
          const payload = jwt.decode(token);
          const userEmail = payload.payload?.email;
          console.log("🔐 Auth middleware - JWT email:", userEmail);
          
          if (!userEmail) {
            return { isValid: false, error: 'Invalid JWT payload' };
          }
          
          const db = new DatabaseService(env);
          const user = await db.getUserByEmail(userEmail);
          
          if (!user) {
            return { isValid: false, error: 'User not found' };
          }
          
          console.log("🔐 Auth middleware - JWT auth successful for:", user.email);
          return { isValid: true, user };
        }
      } catch (jwtError) {
        console.log("🔐 Auth middleware - JWT validation failed:", jwtError.message);
      }
    }
    
    // If not a JWT, try to validate as session token
    console.log("🔐 Auth middleware - Trying session token validation...");
    const db = new DatabaseService(env);
    
    // Hash the token for lookup (assuming we store hashed tokens)
    const tokenHash = await hashToken(token);
    console.log("🔐 Auth middleware - Session token hash:", tokenHash.substring(0, 16) + "...");
    const user = await db.getUserBySessionToken(tokenHash);
    console.log("🔐 Auth middleware - Session user found:", user ? "YES" : "NO");
    
    if (!user) {
      return { isValid: false, error: 'Invalid or expired session token' };
    }
    
    console.log("🔐 Auth middleware - Session auth successful for:", user.email);
    return { isValid: true, user };
    
  } catch (error) {
    console.error('🔐 Auth middleware error:', error);
    return { isValid: false, error: 'Authentication failed' };
  }
}

/**
 * Generate a secure session token
 */
export async function generateSessionToken(): Promise<string> {
  // Generate a random token (256 bits = 32 bytes)
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  
  // Convert to base64url (URL-safe base64)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Hash a token for secure storage
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  
  // Convert to hex string
  return Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create a session token and store it in the database
 */
export async function createUserSession(
  userId: string, 
  env: Env, 
  request: Request,
  durationDays: number = 30
): Promise<string> {
  const db = new DatabaseService(env);
  
  // Generate session token
  const sessionToken = await generateSessionToken();
  const tokenHash = await hashToken(sessionToken);
  
  // Set expiration (30 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);
  
  // Extract user agent and IP from request
  const userAgent = request.headers.get('User-Agent') || undefined;
  const ipAddress = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('X-Forwarded-For') || 
                   undefined;
  
  // Store in database
  await db.createSessionToken(userId, tokenHash, expiresAt, userAgent, ipAddress);
  
  return sessionToken;
}

/**
 * Middleware wrapper for endpoints that require authentication
 */
export function requireAuth() {
  return async (request: Request, env: Env, context: any, next: () => Promise<Response>) => {
    const auth = await authMiddleware(request, env);
    
    if (!auth.isValid) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized', 
        message: auth.error || 'Authentication required' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Add user to request context
    (request as AuthenticatedRequest).user = auth.user;
    
    return next();
  };
}

/**
 * Extract user from authenticated request
 */
export function getAuthenticatedUser(request: Request): any | null {
  return (request as AuthenticatedRequest).user || null;
}
