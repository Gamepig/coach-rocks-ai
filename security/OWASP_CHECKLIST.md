# OWASP Top 10 Security Checklist

**Project**: CoachRocks AI
**Last Updated**: 2025-10-30
**OWASP Version**: 2021

## Overview

This checklist ensures CoachRocks AI is protected against the OWASP Top 10 most critical web application security risks.

## Status Legend
- ✅ **Implemented**: Security control is in place
- 🚧 **In Progress**: Currently being implemented
- ⏸️ **Planned**: Scheduled for future implementation
- ❌ **Not Applicable**: Not relevant to this application

---

## A01:2021 – Broken Access Control

**Risk**: Users can access resources they shouldn't be able to.

### Checklist

- [ ] 🚧 **Implement RBAC** (Role-Based Access Control)
  - [ ] Define user roles (Admin, Coach, Client)
  - [ ] Implement role middleware
  - [ ] Test role enforcement

- [ ] 🚧 **Enforce Least Privilege**
  - [ ] Default deny policy
  - [ ] Explicit permission grants
  - [ ] Regular permission audits

- [ ] 🚧 **Resource Ownership Validation**
  - [ ] Check user owns resource before access
  - [ ] Implement row-level security
  - [ ] Test unauthorized access attempts

- [ ] ⏸️ **API Authorization**
  - [ ] JWT token validation on all protected endpoints
  - [ ] Scope-based authorization
  - [ ] Rate limiting per user/role

- [ ] ⏸️ **Disable Directory Listing**
  - [ ] Configure Cloudflare Pages
  - [ ] Review static file serving

- [ ] ⏸️ **Log Access Control Failures**
  - [ ] Log all authorization failures
  - [ ] Alert on suspicious patterns
  - [ ] Implement audit trail

### Implementation Notes
```typescript
// Example: Resource ownership check
export async function verifyResourceOwnership(
  userId: string,
  resourceId: string,
  resourceType: 'meeting' | 'client'
): Promise<boolean> {
  const resource = await db.query[resourceType]s.findFirst({
    where: and(
      eq(resourceType === 'meeting' ? meetings.id : clients.id, resourceId),
      eq(resourceType === 'meeting' ? meetings.userId : clients.userId, userId)
    )
  })
  return !!resource
}
```

---

## A02:2021 – Cryptographic Failures

**Risk**: Sensitive data exposure due to inadequate cryptography.

### Checklist

- [ ] ✅ **Encrypt Data in Transit**
  - [x] Force HTTPS (Cloudflare automatic)
  - [x] TLS 1.3 minimum
  - [x] HSTS headers
  - [ ] ⏸️ Certificate pinning

- [ ] 🚧 **Encrypt Data at Rest**
  - [x] Cloudflare D1 native encryption
  - [ ] 🚧 Encrypt sensitive columns (AES-256-GCM)
  - [ ] 🚧 Secure key management (Cloudflare Secrets)

- [ ] 🚧 **Password Storage**
  - [ ] Use bcrypt (work factor ≥ 12)
  - [ ] ⏸️ Plan migration to argon2
  - [ ] Salt all passwords
  - [ ] Never log passwords

- [ ] ⏸️ **Classify Data Sensitivity**
  - [ ] Identify PII fields
  - [ ] Document retention policies
  - [ ] Implement data minimization

- [ ] ⏸️ **Disable Caching for Sensitive Data**
  - [ ] Set `Cache-Control: no-store` headers
  - [ ] Review all API responses
  - [ ] Test cache behavior

### Implementation Notes
```typescript
// Example: Field-level encryption
export async function encryptSensitiveField(
  plaintext: string,
  key: string
): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)
  const keyData = encoder.encode(key)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  )

  return btoa(String.fromCharCode(...iv, ...new Uint8Array(encrypted)))
}
```

---

## A03:2021 – Injection

**Risk**: Malicious data can trick the interpreter into executing unintended commands.

### Checklist

- [ ] 🚧 **SQL Injection Prevention**
  - [x] Use Drizzle ORM (parameterized queries)
  - [ ] 🚧 Never concatenate SQL strings
  - [ ] 🚧 Input validation on all user inputs
  - [ ] 🚧 Test with SQLMap

- [ ] 🚧 **XSS Prevention**
  - [ ] Input sanitization (DOMPurify)
  - [ ] Output encoding
  - [ ] Content Security Policy (CSP)
  - [ ] React automatic escaping (verify)

- [ ] ⏸️ **Command Injection Prevention**
  - [ ] Avoid shell commands where possible
  - [ ] If needed: validate and sanitize inputs
  - [ ] Use safe APIs instead

- [ ] 🚧 **NoSQL Injection Prevention**
  - [x] N/A - Not using NoSQL
  - [ ] If added: validate query parameters

- [ ] 🚧 **LDAP/XML Injection Prevention**
  - [x] N/A - Not using LDAP/XML
  - [ ] If added: validate inputs

### Implementation Notes
```typescript
// Example: Zod validation for SQL injection prevention
const createClientSchema = z.object({
  name: z.string()
    .min(1)
    .max(200)
    .regex(/^[a-zA-Z0-9\s\-']+$/, 'Invalid characters'),
  email: z.string().email(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format')
})

// Usage in route
app.post('/api/clients',
  validateInput(createClientSchema),
  async (c) => {
    const data = c.get('validatedData')
    // Safe to use data - already validated
  }
)
```

---

## A04:2021 – Insecure Design

**Risk**: Missing or ineffective security controls in design phase.

### Checklist

- [ ] 🚧 **Threat Modeling**
  - [x] Document threat model (see THREAT_MODEL.md)
  - [ ] 🚧 Identify assets and threats
  - [ ] 🚧 Define security requirements
  - [ ] ⏸️ Regular threat model reviews

- [ ] 🚧 **Secure Development Lifecycle**
  - [x] Security-first architecture
  - [ ] 🚧 Security requirements in user stories
  - [ ] ⏸️ Security testing in CI/CD
  - [ ] ⏸️ Regular security training

- [ ] ⏸️ **Secure Design Patterns**
  - [x] Defense in depth
  - [x] Fail secure
  - [x] Least privilege
  - [ ] 🚧 Zero trust implementation

- [ ] ⏸️ **Limit Resource Consumption**
  - [ ] Rate limiting (API)
  - [ ] File upload size limits
  - [ ] Query result pagination
  - [ ] Connection pooling limits

### Implementation Notes
- See [Threat Model](./THREAT_MODEL.md) for detailed analysis
- See [System Patterns](../memory-bank/systemPatterns.md) for secure design patterns

---

## A05:2021 – Security Misconfiguration

**Risk**: Insecure default configurations, incomplete setup, or overly permissive settings.

### Checklist

- [ ] 🚧 **Harden Configuration**
  - [ ] Remove default accounts
  - [ ] Disable unnecessary features
  - [ ] Review Cloudflare settings
  - [ ] Minimal error messages to users

- [ ] 🚧 **Security Headers**
  - [ ] Content-Security-Policy
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] Referrer-Policy: no-referrer
  - [ ] Permissions-Policy

- [ ] 🚧 **CORS Configuration**
  - [ ] Whitelist allowed origins
  - [ ] Restrict methods
  - [ ] Validate preflight requests
  - [ ] No wildcard in production

- [ ] 🚧 **Dependency Management**
  - [ ] Regular npm audit
  - [ ] Automated dependency updates
  - [ ] Review dependency licenses
  - [ ] Pin dependency versions

- [ ] ⏸️ **Environment Separation**
  - [ ] Separate dev/staging/prod
  - [ ] Different credentials per environment
  - [ ] No production data in dev/staging

### Implementation Notes
```typescript
// Example: Security headers middleware
export function securityHeaders(): MiddlewareHandler {
  return async (c, next) => {
    c.header('Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self'; " +
      "connect-src 'self' https://api.openai.com"
    )
    c.header('X-Frame-Options', 'DENY')
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('Referrer-Policy', 'no-referrer')
    c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

    await next()
  }
}
```

---

## A06:2021 – Vulnerable and Outdated Components

**Risk**: Using components with known vulnerabilities.

### Checklist

- [ ] 🚧 **Inventory Components**
  - [x] List all dependencies (package.json)
  - [ ] 🚧 Document versions
  - [ ] ⏸️ Track end-of-life dates

- [ ] 🚧 **Regular Updates**
  - [ ] Weekly npm audit
  - [ ] Monthly dependency updates
  - [ ] Security patches within 48 hours
  - [ ] Subscribe to security advisories

- [ ] ⏸️ **Automated Scanning**
  - [ ] Dependabot alerts
  - [ ] Snyk integration
  - [ ] OWASP Dependency-Check
  - [ ] CI/CD security gates

- [ ] ⏸️ **Remove Unused Dependencies**
  - [ ] Regular dependency cleanup
  - [ ] Analyze bundle size
  - [ ] Remove dev dependencies from production

### Implementation Notes
```bash
# Weekly security check routine
npm audit
npm outdated
npm run security-check  # Custom script

# Update dependencies safely
npm update
npm run test
npm run build
```

---

## A07:2021 – Identification and Authentication Failures

**Risk**: Broken authentication allows attackers to compromise accounts.

### Checklist

- [ ] 🚧 **Implement MFA**
  - [ ] ⏸️ TOTP support
  - [ ] ⏸️ SMS fallback
  - [ ] ⏸️ Recovery codes

- [ ] 🚧 **Password Requirements**
  - [ ] Minimum 12 characters
  - [ ] Complexity requirements
  - [ ] Password strength meter
  - [ ] Prevent common passwords

- [ ] 🚧 **Session Management**
  - [ ] Short-lived access tokens (15 min)
  - [ ] Secure refresh tokens (7 days)
  - [ ] HttpOnly, Secure cookies
  - [ ] SameSite=Strict
  - [ ] Token revocation support

- [ ] 🚧 **Brute Force Protection**
  - [ ] Rate limiting (5 attempts/15 min)
  - [ ] Account lockout
  - [ ] CAPTCHA on repeated failures
  - [ ] Alert on suspicious attempts

- [ ] 🚧 **Credential Recovery**
  - [ ] Secure password reset flow
  - [ ] Time-limited reset tokens
  - [ ] Email verification
  - [ ] No password hints

- [ ] ⏸️ **OAuth Security**
  - [ ] State parameter validation
  - [ ] PKCE for mobile
  - [ ] Minimal scope requests
  - [ ] Token rotation

### Implementation Notes
```typescript
// Example: Secure session configuration
const sessionConfig = {
  accessToken: {
    algorithm: 'RS256',
    expiresIn: '15m',
    issuer: 'coachrocks.ai'
  },
  refreshToken: {
    expiresIn: '7d',
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  }
}

// Rate limiting for auth endpoints
const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true
}
```

---

## A08:2021 – Software and Data Integrity Failures

**Risk**: Code and infrastructure that don't protect against integrity violations.

### Checklist

- [ ] 🚧 **Verify Dependencies**
  - [ ] Use npm lock files
  - [ ] Subresource Integrity (SRI) for CDN
  - [ ] Verify package signatures
  - [ ] Private npm registry (optional)

- [ ] ⏸️ **CI/CD Security**
  - [ ] Signed commits
  - [ ] Branch protection rules
  - [ ] Code review requirements
  - [ ] Automated security tests

- [ ] ⏸️ **Digital Signatures**
  - [ ] Sign deployment artifacts
  - [ ] Verify webhook signatures
  - [ ] JWT signature verification

- [ ] 🚧 **Secure Update Mechanism**
  - [ ] Automated dependency updates
  - [ ] Changelog review
  - [ ] Rollback capability
  - [ ] Staging environment testing

### Implementation Notes
```typescript
// Example: Webhook signature verification (Zoom)
export async function verifyZoomWebhook(
  payload: string,
  signature: string,
  timestamp: string
): Promise<boolean> {
  const message = `v0:${timestamp}:${payload}`
  const hmac = crypto.createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET)
  const expectedSignature = `v0=${hmac.update(message).digest('hex')}`

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

---

## A09:2021 – Security Logging and Monitoring Failures

**Risk**: Insufficient logging leads to inability to detect, escalate, or respond to breaches.

### Checklist

- [ ] 🚧 **Log Security Events**
  - [ ] All authentication attempts
  - [ ] Authorization failures
  - [ ] Input validation failures
  - [ ] Application errors
  - [ ] Critical business operations

- [ ] 🚧 **Log Format & Content**
  - [ ] Timestamp (UTC)
  - [ ] Event type
  - [ ] User ID (if applicable)
  - [ ] Source IP
  - [ ] Success/failure
  - [ ] ❌ Never log passwords or tokens

- [ ] ⏸️ **Centralized Logging**
  - [ ] Cloudflare Logs
  - [ ] 90-day retention
  - [ ] Tamper-evident logs
  - [ ] Regular log reviews

- [ ] ⏸️ **Alerting**
  - [ ] Real-time alerts for critical events
  - [ ] Anomaly detection
  - [ ] Failed login threshold alerts
  - [ ] Suspicious activity patterns

- [ ] ⏸️ **Monitoring**
  - [ ] Application performance monitoring
  - [ ] Error rate tracking
  - [ ] Security metrics dashboard
  - [ ] Regular security reviews

### Implementation Notes
```typescript
// Example: Security audit log
export interface SecurityEvent {
  timestamp: string  // ISO 8601 UTC
  eventType: SecurityEventType
  userId?: string
  sourceIp: string
  resource?: string
  action: string
  result: 'success' | 'failure'
  metadata?: Record<string, any>
}

// Example log entries
logger.security({
  eventType: 'AUTH_FAILURE',
  userId: 'user-123',
  sourceIp: '192.168.1.1',
  action: 'login',
  result: 'failure',
  metadata: { reason: 'invalid_password', attempts: 3 }
})
```

---

## A10:2021 – Server-Side Request Forgery (SSRF)

**Risk**: Web application fetches remote resources without validating user-supplied URLs.

### Checklist

- [ ] 🚧 **Validate URLs**
  - [ ] Whitelist allowed domains
  - [ ] Reject private IP ranges
  - [ ] Reject localhost
  - [ ] Use URL parsing library

- [ ] 🚧 **Network Segmentation**
  - [x] Cloudflare Workers (isolated)
  - [ ] ⏸️ Separate internal/external networks
  - [ ] ⏸️ Firewall rules

- [ ] ⏸️ **Sanitize Response Data**
  - [ ] Validate content type
  - [ ] Size limits
  - [ ] Timeout limits
  - [ ] No raw response to users

- [ ] ⏸️ **Monitor Outbound Requests**
  - [ ] Log all external API calls
  - [ ] Alert on unusual patterns
  - [ ] Rate limit external requests

### Implementation Notes
```typescript
// Example: Safe URL fetching
const ALLOWED_DOMAINS = [
  'api.openai.com',
  'api.deepgram.com',
  'zoom.us',
  'googleapis.com'
]

export async function safeFetch(url: string): Promise<Response> {
  const parsedUrl = new URL(url)

  // 1. Check domain whitelist
  if (!ALLOWED_DOMAINS.some(domain =>
    parsedUrl.hostname.endsWith(domain)
  )) {
    throw new Error('Domain not allowed')
  }

  // 2. Reject private IPs
  const ip = await dns.resolve(parsedUrl.hostname)
  if (isPrivateIP(ip)) {
    throw new Error('Private IP not allowed')
  }

  // 3. Fetch with timeout
  return fetch(url, {
    signal: AbortSignal.timeout(30000) // 30s timeout
  })
}
```

---

## Testing & Validation

### Automated Tests
- [ ] ⏸️ OWASP ZAP automated scan
- [ ] ⏸️ Burp Suite Professional scan
- [ ] ⏸️ Nuclei templates
- [ ] ⏸️ Custom security tests

### Manual Testing
- [ ] ⏸️ Penetration testing
- [ ] ⏸️ Code review (security focus)
- [ ] ⏸️ Architecture review
- [ ] ⏸️ Third-party security audit

### Continuous Monitoring
- [ ] ⏸️ Weekly automated scans
- [ ] ⏸️ Monthly manual reviews
- [ ] ⏸️ Quarterly penetration tests
- [ ] ⏸️ Annual security audit

---

## Review & Updates

**Review Frequency**: Monthly or after significant changes

**Next Review Date**: 2025-11-30

**Responsible**: Security Team / Tech Lead

**Sign-off**: Required before production deployment

---

**Last Updated**: 2025-10-30
**Version**: 1.0.0
