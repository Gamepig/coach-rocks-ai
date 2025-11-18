# 🔒 CoachRocks AI - Enterprise-Grade Coaching Platform

> **Security-First** AI-powered meeting analysis platform designed for coaches and consultants who handle sensitive client information.

[![Security](https://img.shields.io/badge/security-first-green.svg)](./SECURITY.md)
[![OWASP](https://img.shields.io/badge/OWASP-compliant-blue.svg)](./security/OWASP_CHECKLIST.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)

---

## 🌟 Why CoachRocks AI?

### 🔐 Security as Our Core Differentiator

CoachRocks AI is built from the ground up with **enterprise-grade security** as our primary value proposition. We understand that coaching sessions contain highly sensitive client information, and we've designed every aspect of our platform to protect your data.

**Our Security Commitments**:
- ✅ **Zero-knowledge architecture** - Your data is encrypted end-to-end
- ✅ **GDPR compliant** - Full data privacy and portability
- ✅ **SOC 2 ready** - Enterprise security standards (certification in progress)
- ✅ **Bank-level encryption** - AES-256-GCM for sensitive data
- ✅ **Multi-layer defense** - DDoS protection, WAF, rate limiting, and more

### ⚡ What We Do

Transform your coaching workflow with AI-powered automation:
- 🎙️ **Automatic Transcription** - Crystal-clear meeting records
- 📊 **Intelligent Analysis** - AI-generated summaries and action items
- 📱 **Social Content** - Auto-generated Reels scripts for marketing
- 🧠 **Mind Maps** - Visual representation of coaching sessions
- 🔗 **Platform Integration** - Seamless Zoom and Google Meet sync
- 📧 **Smart Notifications** - Secure email delivery with verification

---

## 🏗️ Architecture

### Tech Stack

#### 🔒 Security-First Technologies

**Backend**:
- **Cloudflare Workers** - Edge computing with built-in DDoS protection
- **Hono Framework** - Lightweight, secure HTTP framework
- **TypeScript** - Type-safe development (strict mode)
- **Drizzle ORM** - SQL injection protection

**Frontend**:
- **React 18** - Modern, secure UI framework
- **Vite** - Fast builds with environment isolation
- **TypeScript** - Type-safe frontend code

**Database & Storage**:
- **Cloudflare D1** - Encrypted SQLite at the edge
- **Cloudflare R2** - Secure object storage
- **At-rest encryption** - All sensitive data encrypted

**Security Stack**:
- **JWT Authentication** - RS256 signed tokens
- **OAuth 2.0** - Google, Zoom integration
- **bcrypt/argon2** - Password hashing
- **TLS 1.3** - Transport encryption
- **RBAC** - Role-based access control
- **Rate Limiting** - Multi-layer protection
- **Audit Logging** - Complete activity tracking

### Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Security Layers                  │
├─────────────────────────────────────────┤
│  1. Cloudflare DDoS + WAF              │
│  2. TLS 1.3 Encryption                  │
│  3. JWT Authentication                  │
│  4. RBAC Authorization                  │
│  5. Input Validation (Zod)              │
│  6. Rate Limiting                       │
│  7. Audit Logging                       │
└─────────────────────────────────────────┘
              ⬇️
┌─────────────────────────────────────────┐
│    Cloudflare Edge Workers              │
│    - Backend API (Hono)                 │
│    - Frontend (React)                   │
└─────────────────────────────────────────┘
              ⬇️
┌─────────────────────────────────────────┐
│    Encrypted Storage                     │
│    - Cloudflare D1 (Database)           │
│    - Cloudflare R2 (Files)              │
└─────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (LTS)
- pnpm 8+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/coach-rocks-ai.git
cd coach-rocks-ai

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your actual values

# Generate security secrets
openssl rand -hex 32  # Use for JWT_SECRET
openssl rand -hex 32  # Use for ENCRYPTION_KEY

# Initialize database
pnpm run db:migrate

# Start development server
pnpm run dev
```

### Configuration

1. **Set up Cloudflare Secrets** (Production):
   ```bash
   wrangler secret put JWT_SECRET
   wrangler secret put ENCRYPTION_KEY
   wrangler secret put OPENAI_API_KEY
   # ... (see .env.example for all secrets)
   ```

2. **Configure OAuth**:
   - [Google OAuth Setup Guide](./documents/google_oauth_setup_guide.md) - Complete step-by-step guide
   - [Zoom Integration Setup Guide](./documents/zoom_integration_setup_guide.md) - Complete step-by-step guide
   - [Google Meet Integration Setup Guide](./documents/google_meet_integration_setup_guide.md) - Complete step-by-step guide

3. **Review Security Settings**:
   - Check `SECURITY.md` for security policies
   - Review `security/OWASP_CHECKLIST.md` for compliance
   - Configure CORS in `backend/src/middleware/cors.ts`

4. **(Optional) Generate Test Data**:
   ```bash
   cd backend
   node generate-mock-data.js > generate-mock-data.sql
   wrangler d1 execute coachdb --local --file=./generate-mock-data.sql
   ```

## 🧪 Test Accounts

After inserting mock data, you can use these test accounts:

| Email | Password | Plan | Onboarding | Clients | Meetings |
|-------|----------|------|------------|---------|----------|
| `coach1@example.com` | `password123` | Pro | ✅ Completed | 4 | 3 |
| `coach2@example.com` | `password123` | Basic | ✅ Completed | 2 | 1 |
| `coach3@example.com` | `password123` | Free | ❌ Not completed | 1 | 1 |

**Note**: All passwords are hashed with bcrypt in the database. The plain text password `password123` is provided for testing purposes only.

For detailed test data information, see [backend/README_MOCK_DATA.md](./backend/README_MOCK_DATA.md).

---

## 📚 Documentation

### For Users
- [Security Policy](./SECURITY.md) - Our security commitments
- [Privacy Policy](./PRIVACY.md) - Coming soon
- [User Guide](./docs/USER_GUIDE.md) - Coming soon

### For Developers
- [Memory Bank](./memory-bank/) - Project context and knowledge
  - [Project Brief](./memory-bank/projectbrief.md)
  - [Technical Context](./memory-bank/techContext.md)
  - [System Patterns](./memory-bank/systemPatterns.md)
- [Integration Setup Guides](./documents/) - Step-by-step integration guides
  - [Google OAuth Setup](./documents/google_oauth_setup_guide.md) - Google OAuth 2.0 configuration
  - [Zoom Integration](./documents/zoom_integration_setup_guide.md) - Zoom OAuth & Webhook setup
  - [Google Meet Integration](./documents/google_meet_integration_setup_guide.md) - Google Meet/Calendar API setup
- [Security Documentation](./security/)
  - [OWASP Top 10 Checklist](./security/OWASP_CHECKLIST.md)
  - [Threat Model](./security/THREAT_MODEL.md)
- [AI Project Board](./AIPROJECT.MD) - Development tasks and status

### Architecture & Design
- [Product Context](./memory-bank/productContext.md) - Why we exist
- [Active Context](./memory-bank/activeContext.md) - Current work focus
- [Progress Tracking](./memory-bank/progress.md) - Development status

---

## 🔒 Security Features

### 🛡️ Defense in Depth

**Layer 1: Infrastructure**
- Cloudflare DDoS protection (automatic)
- Web Application Firewall (WAF)
- Global edge network (reduced attack surface)

**Layer 2: Network**
- TLS 1.3 encryption (all traffic)
- HSTS headers (force HTTPS)
- Certificate management (automatic)

**Layer 3: Application**
- JWT authentication (RS256 signed)
- OAuth 2.0 integration (Google Authorization Code Flow, Zoom)
- Rate limiting (IP + user level)
- Input validation (Zod schemas)
- XSS prevention (auto-escaping)
- SQL injection prevention (ORM)

**Layer 4: Data**
- At-rest encryption (AES-256-GCM)
- Field-level encryption (sensitive data)
- Secure key management (Cloudflare Secrets)

**Layer 5: Monitoring**
- Audit logging (all security events)
- Anomaly detection
- Real-time alerts

### 🔐 Authentication & Authorization

- **Multi-method Auth**: Google OAuth 2.0 (Authorization Code Flow) + Email/Password
- **Short-lived tokens**: 15-minute access tokens
- **Secure sessions**: HttpOnly, Secure, SameSite cookies
- **Password security**: bcrypt hashing (work factor 12+)
- **MFA support**: Coming soon

### 📊 Compliance

- ✅ **GDPR Compliant**: Data privacy, portability, right to be forgotten
- ✅ **OWASP Top 10**: Full compliance checklist
- 🚧 **SOC 2 Type II**: Certification in progress
- 🚧 **ISO 27001**: Planned for 2026

---

## 🏃 Development Workflow

### Sprint Planning

We follow a **security-first development** approach:

1. **Security Review** - All features reviewed for security implications
2. **Threat Modeling** - Identify potential threats
3. **Secure Implementation** - Follow security patterns
4. **Security Testing** - OWASP ZAP, Burp Suite scans
5. **Code Review** - Security-focused reviews
6. **Audit Logging** - All changes logged

### Current Sprint (2 Weeks)

See [AIPROJECT.MD](./AIPROJECT.MD) for detailed task breakdown.

**Week 1**: Core fixes + Security infrastructure
- ✅ Authentication system (JWT + OAuth)
- ✅ Security middleware stack
- ✅ Input validation framework
- Dashboard data fixes
- Meeting upload enhancements

**Week 2**: Integrations + Testing
- Zoom/Google Meet integration (secure)
- Professional onboarding
- E2E testing
- Security testing (OWASP scan)

---

## 🧪 Testing

### Security Testing

```bash
# Run security audit
pnpm run security:audit

# Run OWASP dependency check
pnpm run security:deps

# Run linting (with security rules)
pnpm run lint

# Type checking (strict mode)
pnpm run type-check
```

### Unit & Integration Tests

```bash
# Run all tests
pnpm run test

# Run tests with coverage
pnpm run test:coverage

# Run E2E tests
pnpm run test:e2e
```

---

## 📝 Contributing

We welcome contributions! Please follow our security guidelines:

1. **Never commit secrets** - Use `.env.local` (gitignored)
2. **Security-first mindset** - Think about security implications
3. **Follow OWASP guidelines** - Check `security/OWASP_CHECKLIST.md`
4. **Write tests** - Include security test cases
5. **Code review** - All PRs require security review

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## 🚨 Security

### Reporting Vulnerabilities

**Email**: security@coachrocks.ai

Please see our [Security Policy](./SECURITY.md) for:
- How to report vulnerabilities
- Our response timeline
- Responsible disclosure guidelines
- Bug bounty program (coming soon)

### Security Resources

- [Security Policy](./SECURITY.md)
- [OWASP Checklist](./security/OWASP_CHECKLIST.md)
- [Threat Model](./security/THREAT_MODEL.md)
- [Security Architecture](./memory-bank/systemPatterns.md)

---

## 📄 License

[MIT License](./LICENSE) - See LICENSE file for details

---

## 🙏 Acknowledgments

Built with security-first principles inspired by:
- OWASP Top 10
- NIST Cybersecurity Framework
- CIS Controls
- Cloud Security Alliance

Powered by:
- Cloudflare Workers (Edge computing + security)
- OpenAI GPT-4 (Enterprise API - data privacy)
- Deepgram (Secure transcription)

---

## 📞 Contact

- **Website**: https://coachrocks.ai
- **Email**: support@coachrocks.ai
- **Security**: security@coachrocks.ai
- **Documentation**: https://docs.coachrocks.ai

---

<div align="center">

**🔒 Built with Security First 🔒**

*Protecting your coaching practice, one session at a time.*

</div>
