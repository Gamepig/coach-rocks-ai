# 🔒 CoachRocks AI - 企業級教練平台

> **安全優先**的 AI 驅動會議分析平台，專為處理敏感客戶資訊的教練和顧問設計。

[![安全性](https://img.shields.io/badge/security-first-green.svg)](./SECURITY.md)
[![OWASP](https://img.shields.io/badge/OWASP-compliant-blue.svg)](./security/OWASP_CHECKLIST.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)

---

## 🌟 核心優勢

### 🔐 企業級安全架構

CoachRocks AI 從根本上構建了**企業級安全**作為核心價值。深刻理解教練會議包含高度敏感的客戶資訊，因此在平台的每個方面都設計了全面的資料保護機制。

**安全承諾**：
- ✅ **零知識架構** - 端到端加密您的資料
- ✅ **GDPR 合規** - 完整的資料隱私和可移植性
- ✅ **SOC 2 就緒** - 企業安全標準（認證進行中）
- ✅ **銀行級加密** - AES-256-GCM 敏感資料加密
- ✅ **多層防禦** - DDoS 防護、WAF、速率限制等

### ⚡ 核心功能

用 AI 自動化轉變您的教練工作流程：
- 🎙️ **自動轉錄** - 清晰的會議記錄
- 📊 **智能分析** - AI 生成的摘要和行動項目
- 📱 **社交內容** - 自動生成 Reels 腳本用於行銷
- 🧠 **思維導圖** - 教練會議的視覺表示
- 🔗 **平台整合** - 無縫 Zoom 和 Google Meet 同步
- 📧 **智能通知** - 安全郵件傳遞和驗證

---

## 🏗️ 技術架構

### 技術棧

#### 🔒 安全優先的技術選擇

**後端**：
- **Cloudflare Workers** - 邊緣計算具有內置 DDoS 防護
- **Hono Framework** - 輕量級、安全的 HTTP 框架
- **TypeScript** - 類型安全開發（嚴格模式）
- **Drizzle ORM** - SQL 注入防護

**前端**：
- **React 18** - 現代化、安全的 UI 框架
- **Vite** - 快速構建和環境隔離
- **TypeScript** - 類型安全的前端代碼

**資料庫和儲存**：
- **Cloudflare D1** - 邊緣加密 SQLite
- **Cloudflare R2** - 安全的物件儲存
- **靜態加密** - 所有敏感資料都已加密

**安全堆棧**：
- **JWT 認證** - RS256 簽名令牌
- **OAuth 2.0** - Google、Zoom 整合
- **bcrypt/argon2** - 密碼雜湊
- **TLS 1.3** - 傳輸加密
- **RBAC** - 基於角色的存取控制
- **速率限制** - 多層防護
- **稽核日誌** - 完整的活動追蹤

### 架構圖

```
┌─────────────────────────────────────────┐
│         安全層                          │
├─────────────────────────────────────────┤
│  1. Cloudflare DDoS + WAF              │
│  2. TLS 1.3 加密                        │
│  3. JWT 認證                            │
│  4. RBAC 授權                           │
│  5. 輸入驗證 (Zod)                      │
│  6. 速率限制                            │
│  7. 稽核日誌                            │
└─────────────────────────────────────────┘
              ⬇️
┌─────────────────────────────────────────┐
│    Cloudflare 邊緣 Workers              │
│    - 後端 API (Hono)                   │
│    - 前端 (React)                       │
└─────────────────────────────────────────┘
              ⬇️
┌─────────────────────────────────────────┐
│    加密儲存                              │
│    - Cloudflare D1 (資料庫)             │
│    - Cloudflare R2 (檔案)               │
└─────────────────────────────────────────┘
```

---

## 🚀 快速開始

### 先決條件

- Node.js 18+ (LTS)
- pnpm 8+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare 帳戶

### 安裝

```bash
# 複製儲存庫
git clone https://github.com/Gamepig/coach-rocks-ai.git
cd coach-rocks-ai

# 安裝依賴
pnpm install

# 設置環境變數
cp .env.example .env.local
# 使用您的實際值編輯 .env.local

# 生成安全密鑰
openssl rand -hex 32  # 用於 JWT_SECRET
openssl rand -hex 32  # 用於 ENCRYPTION_KEY

# 初始化資料庫
pnpm run db:migrate

# 啟動開發伺服器
pnpm run dev
```

### 配置

1. **設置 Cloudflare 密鑰**（生產環境）：
   ```bash
   wrangler secret put JWT_SECRET
   wrangler secret put ENCRYPTION_KEY
   wrangler secret put OPENAI_API_KEY
   # ... (查看 .env.example 了解所有密鑰)
   ```

2. **配置 OAuth**：
   - [Google OAuth 設置指南](./documents/google_oauth_setup_guide.md) - 完整逐步指南
   - [Zoom 整合設置指南](./documents/zoom_integration_setup_guide.md) - 完整逐步指南
   - [Google Meet 整合設置指南](./documents/google_meet_integration_setup_guide.md) - 完整逐步指南

3. **審查安全設置**：
   - 查看 `SECURITY.md` 了解安全政策
   - 查看 `security/OWASP_CHECKLIST.md` 以獲得合規性
   - 在 `backend/src/middleware/cors.ts` 中配置 CORS

4. **（可選）生成測試資料**：
   ```bash
   cd backend
   node generate-mock-data.js > generate-mock-data.sql
   wrangler d1 execute coachdb --local --file=./generate-mock-data.sql
   ```

## 🧪 測試帳戶

插入模擬資料後，您可以使用這些測試帳戶：

| 郵箱 | 密碼 | 方案 | 入職 | 客戶端 | 會議 |
|-------|----------|------|------------|---------|----------|
| `coach1@example.com` | `password123` | Pro | ✅ 已完成 | 4 | 3 |
| `coach2@example.com` | `password123` | Basic | ✅ 已完成 | 2 | 1 |
| `coach3@example.com` | `password123` | Free | ❌ 未完成 | 1 | 1 |

**注意**：所有密碼在資料庫中使用 bcrypt 雜湊。純文字密碼 `password123` 僅供測試目的。

詳細的測試資料資訊，請參見 [backend/README_MOCK_DATA.md](./backend/README_MOCK_DATA.md)。

---

## 📚 文件

### 開發者文件
- [安全政策](./SECURITY.md) - 我們的安全承諾
- [隱私政策](./PRIVACY.md) - 即將推出
- [使用指南](./docs/USER_GUIDE.md) - 即將推出

### 技術文件
- [記憶庫](./memory-bank/) - 專案背景和知識
  - [專案摘要](./memory-bank/projectbrief.md)
  - [技術背景](./memory-bank/techContext.md)
  - [系統模式](./memory-bank/systemPatterns.md)
- [整合設置指南](./documents/) - 逐步整合指南
  - [Google OAuth 設置](./documents/google_oauth_setup_guide.md) - Google OAuth 2.0 配置
  - [Zoom 整合](./documents/zoom_integration_setup_guide.md) - Zoom OAuth 和 Webhook 設置
  - [Google Meet 整合](./documents/google_meet_integration_setup_guide.md) - Google Meet/Calendar API 設置
- [安全文件](./security/)
  - [OWASP Top 10 檢查清單](./security/OWASP_CHECKLIST.md)
  - [威脅模型](./security/THREAT_MODEL.md)

### 架構和設計
- [產品背景](./memory-bank/productContext.md) - 為什麼我們存在
- [活躍背景](./memory-bank/activeContext.md) - 當前工作重點
- [進度追蹤](./memory-bank/progress.md) - 開發狀態

---

## 🔒 安全功能

### 🛡️ 深度防禦

**第 1 層：基礎架構**
- Cloudflare DDoS 防護（自動）
- Web 應用防火牆 (WAF)
- 全球邊緣網路（減少攻擊面）

**第 2 層：網路**
- TLS 1.3 加密（所有流量）
- HSTS 標題（強制 HTTPS）
- 憑證管理（自動）

**第 3 層：應用程式**
- JWT 認證（RS256 簽名）
- OAuth 2.0 整合（Google 授權代碼流程、Zoom）
- 速率限制（IP + 使用者級別）
- 輸入驗證（Zod 架構）
- XSS 防護（自動轉義）
- SQL 注入防護（ORM）

**第 4 層：資料**
- 靜態加密（AES-256-GCM）
- 欄位級加密（敏感資料）
- 安全密鑰管理（Cloudflare 密鑰）

**第 5 層：監控**
- 稽核日誌（所有安全事件）
- 異常檢測
- 即時警報

### 🔐 認證和授權

- **多方法認證**：Google OAuth 2.0（授權代碼流程）+ 電子郵件/密碼
- **短期令牌**：15 分鐘存取令牌
- **安全會話**：HttpOnly、Secure、SameSite Cookie
- **密碼安全**：bcrypt 雜湊（工作因子 12+）
- **MFA 支援**：即將推出

### 📊 合規性

- ✅ **GDPR 合規**：資料隱私、可移植性、被遺忘權
- ✅ **OWASP Top 10**：完整合規檢查清單
- 🚧 **SOC 2 Type II**：認證進行中
- 🚧 **ISO 27001**：計劃於 2026 年

---

## 🧪 測試

### 安全測試

```bash
# 執行安全稽核
pnpm run security:audit

# 執行 OWASP 依賴檢查
pnpm run security:deps

# 執行 linting（使用安全規則）
pnpm run lint

# 類型檢查（嚴格模式）
pnpm run type-check
```

### 單元和整合測試

```bash
# 執行所有測試
pnpm run test

# 執行包含覆蓋率的測試
pnpm run test:coverage

# 執行 E2E 測試
pnpm run test:e2e
```

---

## 📝 貢獻

我們歡迎貢獻！請遵循我們的安全指南：

1. **從不提交密鑰** - 使用 `.env.local`（gitignore）
2. **安全優先心態** - 考慮安全影響
3. **遵循 OWASP 指南** - 查看 `security/OWASP_CHECKLIST.md`
4. **編寫測試** - 包括安全測試案例
5. **程式碼審查** - 所有 PR 需要安全審查

詳細指南請參見 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## 🔒 安全漏洞報告

有關安全問題報告、我們的回應時間表、負責任披露指南和其他安全資訊，請查看我們的 [安全政策](./SECURITY.md)。

### 安全資源

- [安全政策](./SECURITY.md)
- [OWASP 檢查清單](./security/OWASP_CHECKLIST.md)
- [威脅模型](./security/THREAT_MODEL.md)
- [安全架構](./memory-bank/systemPatterns.md)

---

## 📄 授權

[MIT 授權](./LICENSE) - 詳見 LICENSE 檔案

---

## 🙏 致謝

受以下安全優先原則啟發而構建：
- OWASP Top 10
- NIST 網路安全框架
- CIS 控制項
- 雲安全聯盟

由以下支持：
- Cloudflare Workers（邊緣計算 + 安全）
- OpenAI GPT-4（企業 API - 資料隱私）
- Deepgram（安全轉錄）

---

<div align="center">

**🔒 安全優先構建 🔒**

*保護您的教練實踐，逐次會議。*

</div>
