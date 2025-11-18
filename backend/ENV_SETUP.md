# 環境變數設定指南

## 📋 概述

本文件說明如何設定 CoachRocks AI 專案所需的所有環境變數。

⚠️ **安全警告**: 所有敏感資訊（API Key、密碼等）必須透過 Wrangler Secrets 管理，**絕對不要** commit 到 Git。

---

## 🔐 必要環境變數清單

### AI 服務

| 變數名稱 | 說明 | 來源 |
|---------|------|------|
| `OPENAI_API_KEY` | OpenAI API 金鑰 | OpenAI Dashboard |
| `PERPLEXITY_API_KEY` | Perplexity API 金鑰 | Perplexity Dashboard |
| `SERPER_API_KEY` | Serper.dev API 金鑰 | Serper.dev Dashboard |

### 認證

| 變數名稱 | 說明 | 產生方式 |
|---------|------|---------|
| `JWT_SECRET` | JWT 簽名密鑰 | 使用 `openssl rand -hex 32` 產生 |

### Email 服務（Gmail SMTP）

| 變數名稱 | 說明 | 範例值 |
|---------|------|--------|
| `GMAIL_SMTP_USER` | Gmail 帳號 | noreply@coachrocks.com |
| `GMAIL_SMTP_PASSWORD` | Google 應用程式密碼 | （16 字元應用程式密碼）|
| `FROM_EMAIL` | 發送郵件的地址 | noreply@coachrocks.com |
| `APP_NAME` | 應用程式名稱 | CoachRocks AI |

### OAuth - Google (OAuth 2.0 Authorization Code Flow)

| 變數名稱 | 說明 | 設定位置 |
|---------|------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | Google OAuth 重定向 URI（後端端點） | 例如：`https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback` |

**重要說明：**
- `GOOGLE_REDIRECT_URI` 必須指向**後端端點**，而非前端 URL
- ⚠️ **禁止使用 `localhost:8787`**（錯誤的舊專案位置，詳見 `PROJECT_RULES.md`）
- 開發環境：使用生產環境後端 `https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback`
- 生產環境：`https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback`
- 必須在 Google Cloud Console 的 OAuth 2.0 客戶端設定中註冊此 URI

**📖 詳細設定步驟**: 請參考 [Google OAuth 設定教學](../documents/google_oauth_setup_guide.md)

### OAuth - Zoom

| 變數名稱 | 說明 | 設定位置 |
|---------|------|---------|
| `ZOOM_CLIENT_ID` | Zoom OAuth Client ID | Zoom Marketplace |
| `ZOOM_CLIENT_SECRET` | Zoom OAuth Client Secret | Zoom Marketplace |
| `ZOOM_REDIRECT_URI` | Zoom OAuth 重定向 URI | 例如：`http://localhost:5173/auth/zoom/callback` |

**📖 詳細設定步驟**: 請參考 [Zoom 整合設定教學](../documents/zoom_integration_setup_guide.md)

### 應用程式設定

| 變數名稱 | 說明 | 範例值 |
|---------|------|--------|
| `BACKEND_URL` | 後端 API URL | `https://coach-backend.gamepig1976.workers.dev` (開發環境使用生產後端) |

**⚠️ 重要**: 禁止使用 `localhost:8787`（錯誤的舊專案位置，詳見 `PROJECT_RULES.md`）
| `FRONTEND_URL` | 前端應用 URL | `http://localhost:5173` (開發) |

---

## 🛠️ 設定方式

### 本地開發環境

#### 1. 建立 `.dev.vars` 檔案

在 `backend/` 目錄下建立 `.dev.vars` 檔案：

```bash
cd backend
touch .dev.vars
```

#### 2. 填入環境變數

編輯 `.dev.vars` 檔案，填入所有必要的環境變數：

```bash
# AI Services
OPENAI_API_KEY=sk-proj-...
PERPLEXITY_API_KEY=pplx-...
SERPER_API_KEY=3336eb8472e877c7c5948959ceadca12fe9243e2

# Authentication
JWT_SECRET=<generate-with-openssl-rand-hex-32>

# Email Service (Gmail SMTP)
GMAIL_SMTP_USER=noreply@coachrocks.com
GMAIL_SMTP_PASSWORD=gtcm pcqk bciq lssi
FROM_EMAIL=noreply@coachrocks.com
APP_NAME=CoachRocks AI

# OAuth - Google (OAuth 2.0 Authorization Code Flow)
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
GOOGLE_REDIRECT_URI=https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback

# OAuth - Zoom
ZOOM_CLIENT_ID=LLQUCayHRWu84ok6t0D0uQ
ZOOM_CLIENT_SECRET=42QPoO1pXPZay2IDNwmadXeXCtNxcneh
ZOOM_REDIRECT_URI=http://localhost:5173/auth/zoom/callback

# Application URLs
BACKEND_URL=https://coach-backend.gamepig1976.workers.dev
FRONTEND_URL=http://localhost:5173
```

#### 3. 確認 `.gitignore`

確保 `backend/.gitignore` 包含：

```
.dev.vars
.env
.env.local
.env.*.local
```

### 生產環境（Cloudflare Workers）

使用 Wrangler CLI 設定 secrets：

```bash
# 進入 backend 目錄
cd backend

# AI Services
wrangler secret put OPENAI_API_KEY
wrangler secret put PERPLEXITY_API_KEY
wrangler secret put SERPER_API_KEY

# Authentication
wrangler secret put JWT_SECRET

# Email Service
wrangler secret put GMAIL_SMTP_USER
wrangler secret put GMAIL_SMTP_PASSWORD
wrangler secret put FROM_EMAIL
wrangler secret put APP_NAME

# OAuth - Google (OAuth 2.0 Authorization Code Flow)
# 注意：GOOGLE_REDIRECT_URI 必須指向後端端點
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GOOGLE_REDIRECT_URI

# OAuth - Zoom
wrangler secret put ZOOM_CLIENT_ID
wrangler secret put ZOOM_CLIENT_SECRET
wrangler secret put ZOOM_REDIRECT_URI

# Application URLs
wrangler secret put BACKEND_URL
wrangler secret put FRONTEND_URL
```

每次執行 `wrangler secret put` 時，會提示你輸入對應的值。

---

## 🔍 驗證設定

### 檢查環境變數是否正確載入

在本地開發時，啟動 Wrangler：

```bash
cd backend
npm run dev
```

檢查 console 輸出，確認沒有 "Environment variable not set" 錯誤。

### 測試 API 端點

測試需要環境變數的端點：

```bash
# 測試 OpenAI API
curl https://coach-backend.gamepig1976.workers.dev/api/test-openai

# 測試 Serper API
curl https://coach-backend.gamepig1976.workers.dev/api/test-search
```

---

## 📝 實際憑證資訊

實際的 API Key 和憑證資訊請參考：
- `documents/開發確認事項 10 23 2959654905e780e9bf9ee5f5275f234a拷貝2.md`

**注意**: 該文件包含實際的 API Key，請妥善保管，不要分享給未授權人員。

---

## ⚠️ 安全最佳實踐

1. **永遠不要 commit 敏感資訊**
   - 確保 `.dev.vars` 在 `.gitignore` 中
   - 使用 `git check-ignore .dev.vars` 確認

2. **使用強隨機密鑰**
   - JWT_SECRET: `openssl rand -hex 32`
   - 定期輪換密鑰

3. **最小權限原則**
   - API Key 只授予必要的權限
   - 定期審查和撤銷未使用的憑證

4. **環境隔離**
   - 開發、測試、生產環境使用不同的 API Key
   - 不要跨環境共享憑證

5. **監控異常使用**
   - 定期檢查 API 使用量
   - 設定異常使用警報

---

## 🔄 更新環境變數

### 更新單一 Secret

```bash
wrangler secret put <VARIABLE_NAME>
```

### 列出所有 Secrets

```bash
wrangler secret list
```

### 刪除 Secret

```bash
wrangler secret delete <VARIABLE_NAME>
```

---

## 📚 相關文件

### 整合設定教學

詳細的整合設定步驟請參考以下教學文件：

- **[Google OAuth 設定教學](../documents/google_oauth_setup_guide.md)** - Google OAuth 2.0 完整設定指南
- **[Zoom 整合設定教學](../documents/zoom_integration_setup_guide.md)** - Zoom OAuth 與 Webhook 設定指南
- **[Google Meet 整合設定教學](../documents/google_meet_integration_setup_guide.md)** - Google Meet/Calendar API 整合設定指南

### 其他文件

- [Cloudflare Workers Secrets 文件](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Wrangler CLI 文件](https://developers.cloudflare.com/workers/wrangler/)
- [專案安全規範](./CLAUDE.MD)

---

**最後更新**: 2025-11-10

