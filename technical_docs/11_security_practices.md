# 安全最佳實踐 (Security Best Practices)

**模組名稱**: Security Best Practices
**主要功能**: CoachRocks AI 安全開發規範與檢查清單
**最後更新**: 2025-11-18

---

## 📋 安全承諾

CoachRocks AI 致力於保護使用者資料與隱私，遵循業界安全最佳實踐，包括 OWASP Top 10 防護、資料加密、存取控制等。

### 安全等級

**🔴 High Security** - 處理敏感客戶資料、會議記錄、個人識別資訊 (PII)

---

## 🛡️ OWASP Top 10 防護

### 1. Broken Access Control (存取控制失效)

**風險**: 使用者存取未授權的資源

**防護措施**:
```typescript
// ✅ 正確：檢查資源擁有權
const client = await db.prepare(`
  SELECT * FROM clients
  WHERE client_id = ? AND user_id = ?
`).bind(clientId, userId).first()

if (!client) {
  return c.json({ error: 'Access denied' }, 403)
}

// ❌ 錯誤：只檢查資源存在
const client = await db.prepare(`
  SELECT * FROM clients WHERE client_id = ?
`).bind(clientId).first()
```

**檢查清單**:
- ✅ 所有 API 端點都需要認證 (除了公開端點)
- ✅ 查詢時必須包含 `user_id` 條件
- ✅ Session Token 驗證與過期檢查
- ✅ CORS 設定僅允許可信來源

---

### 2. Cryptographic Failures (加密失效)

**風險**: 敏感資料未加密或使用弱加密

**防護措施**:
```typescript
// ✅ 密碼雜湊 (Bcrypt)
import bcrypt from 'bcryptjs'
const hashedPassword = await bcrypt.hash(password, 10)

// ✅ Session Token 雜湊 (SHA-256)
const tokenHash = await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(token)
)

// ✅ HTTPS Only Cookies
setCookie(c, 'accessToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60  // 30 days
})
```

**檢查清單**:
- ✅ 所有 API 僅支援 HTTPS
- ✅ 密碼使用 Bcrypt 雜湊 (cost factor >= 10)
- ✅ Session Token 儲存 SHA-256 雜湊
- ✅ Cookies 設定 `httpOnly`, `secure`, `sameSite`
- ✅ 敏感資料加密儲存 (API Keys, Tokens)

---

### 3. Injection (注入攻擊)

**風險**: SQL Injection, Command Injection, XSS

**防護措施**:
```typescript
// ✅ SQL Injection 防護：使用 Prepared Statements
const stmt = db.prepare(`
  SELECT * FROM users WHERE email = ?
`)
const user = await stmt.bind(email).first()

// ❌ SQL Injection 風險：字串拼接
const query = `SELECT * FROM users WHERE email = '${email}'`

// ✅ XSS 防護：輸入驗證與輸出編碼
import { z } from 'zod'
const emailSchema = z.string().email().max(255)
const validatedEmail = emailSchema.parse(email)

// ✅ Command Injection 防護：避免執行外部命令
// Cloudflare Workers 本身不支援 child_process
```

**檢查清單**:
- ✅ 所有 SQL 查詢使用 Prepared Statements
- ✅ 使用 Zod 進行輸入驗證
- ✅ 前端使用 React (自動 XSS 防護)
- ✅ 禁止直接執行使用者輸入

---

### 4. Insecure Design (不安全設計)

**風險**: 架構設計缺陷導致安全漏洞

**防護措施**:
```typescript
// ✅ 最小權限原則
// 使用者只能存取自己的資料
const meetings = await db.prepare(`
  SELECT * FROM meetings WHERE user_id = ?
`).bind(userId).all()

// ✅ 預設拒絕策略
// 所有 API 預設需要認證
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}
```

**檢查清單**:
- ✅ 最小權限原則 (Least Privilege)
- ✅ 預設拒絕策略 (Deny by Default)
- ✅ 深度防禦 (Defense in Depth)
- ✅ 失敗安全 (Fail Securely)

---

### 5. Security Misconfiguration (安全配置錯誤)

**風險**: 預設配置、錯誤訊息洩漏、不必要功能啟用

**防護措施**:
```typescript
// ✅ 環境變數管理
// 使用 Wrangler Secrets
wrangler secret put OPENAI_API_KEY
wrangler secret put JWT_SECRET

// ✅ 錯誤訊息處理
try {
  await sensitiveOperation()
} catch (error) {
  // ❌ 不洩漏內部錯誤
  // throw new Error(error.stack)

  // ✅ 回傳通用錯誤訊息
  console.error('Internal error:', error)
  return c.json({ error: 'Operation failed' }, 500)
}

// ✅ CORS 設定
app.use('*', cors({
  origin: ['https://coach-rocks.pages.dev', 'http://localhost:5173'],
  credentials: true
}))
```

**檢查清單**:
- ✅ 生產環境禁用 Debug 模式
- ✅ 錯誤訊息不洩漏內部資訊
- ✅ CORS 僅允許可信來源
- ✅ 不使用預設密碼或金鑰
- ✅ 定期更新依賴套件

---

### 6. Vulnerable and Outdated Components (易受攻擊和過時組件)

**防護措施**:
```bash
# 定期檢查依賴漏洞
npm audit

# 自動修復已知漏洞
npm audit fix

# 更新套件
npm update

# 檢查過時套件
npm outdated
```

**檢查清單**:
- ✅ 每月執行 `npm audit`
- ✅ 重大漏洞立即修復
- ✅ 定期更新依賴套件
- ✅ 移除未使用的依賴

---

### 7. Identification and Authentication Failures (識別和認證失效)

**防護措施**:
```typescript
// ✅ Session Token 機制
// 使用 SHA-256 雜湊儲存
const tokenHash = await hashToken(token)
await db.prepare(`
  INSERT INTO session_tokens (user_id, token_hash, expires_at)
  VALUES (?, ?, ?)
`).bind(userId, tokenHash, expiresAt).run()

// ✅ Token 過期檢查
const session = await db.prepare(`
  SELECT * FROM session_tokens
  WHERE token_hash = ?
    AND is_active = TRUE
    AND expires_at > datetime('now')
`).bind(tokenHash).first()

// ✅ 密碼強度要求
const passwordSchema = z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/)
```

**檢查清單**:
- ✅ 密碼最少 8 字元，包含大寫與數字
- ✅ Session Token 有效期限 (30 天)
- ✅ Token 撤銷機制 (登出)
- ✅ 多重登入支援 (多個 Session)
- ✅ 禁用 Session Token 後無法使用

---

### 8. Software and Data Integrity Failures (軟體和資料完整性失效)

**防護措施**:
```typescript
// ✅ 輸入驗證
const MeetingSchema = z.object({
  fileContent: z.string().min(1).max(1000000),
  fileName: z.string().min(1).max(255),
  uploadType: z.enum(['document', 'recording']),
  meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
})

// ✅ CI/CD 安全
// .gitlab-ci.yml 使用 protected variables
variables:
  OPENAI_API_KEY: $OPENAI_API_KEY  # From GitLab CI/CD Variables

// ✅ Dependency Integrity
// package-lock.json 確保依賴版本一致
```

**檢查清單**:
- ✅ 使用 Zod 進行輸入驗證
- ✅ GitLab CI/CD 使用 Protected Variables
- ✅ package-lock.json 提交至版控
- ✅ 不允許執行未驗證的程式碼

---

### 9. Security Logging and Monitoring Failures (安全日誌和監控失效)

**防護措施**:
```typescript
// ✅ 安全事件記錄
console.log('🔐 LOGIN_SUCCESS:', { userId, email, ip })
console.log('🔐 LOGIN_FAILED:', { email, reason, ip })
console.log('🔐 SESSION_CREATED:', { userId, tokenId, expiresAt })
console.log('🔐 ACCESS_DENIED:', { userId, resource, action })

// ✅ 敏感操作記錄
console.log('🔒 CLIENT_CREATED:', { userId, clientId })
console.log('🔒 MEETING_ANALYZED:', { userId, meetingId })
console.log('🔒 DATA_EXPORTED:', { userId, dataType })

// ❌ 不記錄敏感資料
// console.log('Password:', password) ❌
// console.log('Token:', accessToken) ❌
```

**檢查清單**:
- ✅ 記錄所有認證事件
- ✅ 記錄存取控制失敗
- ✅ 記錄敏感操作 (建立/刪除/修改)
- ❌ 不記錄密碼、Token、PII
- ✅ 使用 `wrangler tail` 監控即時日誌

---

### 10. Server-Side Request Forgery (SSRF)

**防護措施**:
```typescript
// ✅ URL 驗證
function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url)

    // 只允許 HTTPS
    if (parsed.protocol !== 'https:') {
      return false
    }

    // 禁止內部 IP
    const hostname = parsed.hostname
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      return false
    }

    return true
  } catch {
    return false
  }
}

// ✅ 使用白名單
const ALLOWED_DOMAINS = [
  'api.openai.com',
  'www.googleapis.com',
  'oauth2.googleapis.com'
]

function isAllowedDomain(url: string): boolean {
  const parsed = new URL(url)
  return ALLOWED_DOMAINS.some(domain => parsed.hostname.endsWith(domain))
}
```

**檢查清單**:
- ✅ 驗證外部 API URL
- ✅ 禁止存取內部網路
- ✅ 使用白名單限制可存取的網域
- ✅ 禁止使用者提供的 URL 直接請求

---

## 🔐 額外安全措施

### Rate Limiting (速率限制)

```typescript
// 會議分析速率限制：30 秒間隔
const lastAnalysis = await db.prepare(`
  SELECT last_analysis_timestamp
  FROM users
  WHERE user_id = ?
`).bind(userId).first()

const now = new Date()
const lastTime = new Date(lastAnalysis.last_analysis_timestamp)
const diffSeconds = (now.getTime() - lastTime.getTime()) / 1000

if (diffSeconds < 30) {
  return c.json({
    error: 'Rate limit exceeded. Please wait 30 seconds between analyses.'
  }, 429)
}
```

### Data Sanitization (資料清理)

```typescript
// 移除 HTML 標籤
function sanitizeHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

// 限制字串長度
function truncateString(str: string, maxLength: number): string {
  return str.length > maxLength ? str.slice(0, maxLength) : str
}
```

### Content Security Policy (CSP)

```typescript
// 前端 CSP 設定
app.use('*', async (c, next) => {
  await next()
  c.header('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://coach-backend.gamepig1976.workers.dev"
  ].join('; '))
})
```

---

## 📋 安全檢查清單

### 開發階段

- [ ] 使用 Zod 驗證所有輸入
- [ ] 所有 SQL 使用 Prepared Statements
- [ ] 敏感資料加密儲存
- [ ] 錯誤訊息不洩漏內部資訊
- [ ] 檢查資源擁有權 (user_id 條件)

### 部署前

- [ ] 執行 `npm audit` 檢查漏洞
- [ ] 環境變數使用 Wrangler Secrets
- [ ] CORS 設定正確
- [ ] Session Token 過期時間設定
- [ ] 速率限制機制啟用

### 生產環境

- [ ] HTTPS Only
- [ ] 監控安全日誌
- [ ] 定期備份資料庫
- [ ] 定期更新依賴套件
- [ ] 定期審查存取控制

---

## 🚨 安全事件回應

### 1. 發現漏洞

1. **立即評估影響範圍**
2. **隔離受影響系統**
3. **修復漏洞**
4. **部署更新**
5. **通知受影響使用者** (如需要)

### 2. 資料洩漏

1. **立即撤銷所有 Session Tokens**
2. **強制使用者重設密碼**
3. **審查存取日誌**
4. **通知主管機關** (根據 GDPR/CCPA)
5. **公開透明溝通**

### 3. 帳號被盜

1. **撤銷該使用者所有 Session**
2. **鎖定帳號**
3. **發送安全警告郵件**
4. **提供帳號恢復流程**
5. **審查異常活動**

---

## 📚 相關文件

- [SECURITY.md](../SECURITY.md) - 公開安全政策
- [security/OWASP_CHECKLIST.md](../security/OWASP_CHECKLIST.md) - OWASP 檢查清單
- [security/THREAT_MODEL.md](../security/THREAT_MODEL.md) - 威脅模型
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - 官方文件

---

**文件版本**: 1.0
**維護者**: Development Team
**更新記錄**:
- 2025-11-18: 初始版本建立
- 遵循: OWASP Top 10 2021, GDPR, CCPA
