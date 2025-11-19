# Google OAuth 故障排查指南

## 錯誤: "Google OAuth 無法使用：後端 URL 驗證失敗"

### 問題描述

用戶點擊 "Sign In with Google" 按鈕時，出現以下錯誤訊息：

```
❌ Google OAuth 無法使用：後端 URL 驗證失敗
```

### 可能原因

1. **前端環境變數未設置**: `VITE_BACKEND_BASE_URL` 未配置
2. **環境變數格式錯誤**: URL 包含額外字符或格式不正確
3. **後端 OAuth 配置問題**: Google OAuth Secrets 未設置
4. **Google Console 配置不匹配**: redirect_uri 配置錯誤

## 診斷步驟

### 步驟 1: 檢查前端環境變數

#### 開發環境

檢查 `frontend/.env.development`:

```bash
cat frontend/.env.development
```

應包含:
```bash
VITE_BACKEND_BASE_URL=http://localhost:8788
```

#### 生產環境 (Cloudflare Pages)

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 前往: **Pages** → **coach-rocks-frontend** → **Settings** → **Environment Variables**
3. 檢查變數:
   - 名稱: `VITE_BACKEND_BASE_URL`
   - 值: `https://coach-backend.gamepig1976.workers.dev`
   - 環境: Production 和 Preview

### 步驟 2: 檢查瀏覽器 Console

打開瀏覽器開發者工具 (F12)，查看 Console 輸出：

```javascript
// 應該看到類似的輸出:
✅ Cleaned backend URL: https://coach-backend.gamepig1976.workers.dev
✅ VITE_BACKEND_BASE_URL: https://coach-backend.gamepig1976.workers.dev

// 或環境診斷信息:
🌍 Environment Info: {
  environment: "production",
  hostname: "coach-rocks.pages.dev",
  productionDomains: ["pages.dev", "coach.rocks", ...]
}
```

### 步驟 3: 檢查後端 Secrets

進入後端目錄並檢查 Secrets:

```bash
cd backend
npx wrangler secret list
```

應該看到:
- ✅ `GOOGLE_CLIENT_ID`
- ✅ `GOOGLE_CLIENT_SECRET`
- ✅ `GOOGLE_REDIRECT_URI`
- ✅ `FRONTEND_URL`

如果缺少任何 Secret，使用以下命令設置:

```bash
# 設置 Google Client ID
npx wrangler secret put GOOGLE_CLIENT_ID
# 輸入值: [從 Google Console 獲取]

# 設置 Google Client Secret
npx wrangler secret put GOOGLE_CLIENT_SECRET
# 輸入值: [從 Google Console 獲取]

# 設置 Redirect URI
npx wrangler secret put GOOGLE_REDIRECT_URI
# 輸入值: https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback

# 設置前端 URL
npx wrangler secret put FRONTEND_URL
# 輸入值: https://coach-rocks.pages.dev
```

### 步驟 4: 檢查 Google Console 配置

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 選擇專案
3. **APIs & Services** → **Credentials**
4. 找到 OAuth 2.0 Client ID
5. 檢查 **Authorized redirect URIs**:

   應該包含:
   ```
   https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback
   ```

6. 檢查 **Authorized JavaScript origins**:

   應該包含:
   ```
   https://coach-rocks.pages.dev
   https://coach.rocks
   http://localhost:5173
   ```

## 常見錯誤與解決方案

### 錯誤 1: "redirect_uri_mismatch"

**完整錯誤訊息**:
```
Error: redirect_uri_mismatch
The redirect URI in the request, https://..., does not match the ones authorized for the OAuth client.
```

**原因**: Google Console 中的 redirect URI 與後端配置不匹配

**解決方案**:

1. **檢查後端配置的 redirect URI**:
   ```bash
   # 查看後端日誌（當點擊 Google 登入時）
   # 應該看到:
   🔍 Google OAuth Configuration Check:
     - GOOGLE_REDIRECT_URI: https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback
   ```

2. **確保 Google Console 中有對應的 URI**:
   - 前往 Google Console → Credentials
   - 編輯 OAuth 2.0 Client ID
   - 在 "Authorized redirect URIs" 中添加後端配置的 URI
   - **注意**: URI 必須完全匹配（協議、域名、路徑）

3. **檢查環境**: 開發環境和生產環境可能需要不同的 redirect URI
   - 開發: `http://localhost:8788/api/auth/google/callback`
   - 生產: `https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback`

### 錯誤 2: "VITE_BACKEND_BASE_URL not configured"

**原因**: 前端環境變數未設置

**解決方案**:

**開發環境**:
1. 創建或編輯 `frontend/.env.development`
2. 添加:
   ```bash
   VITE_BACKEND_BASE_URL=http://localhost:8788
   ```
3. 重新啟動開發伺服器: `npm run dev`

**生產環境**:
1. 登入 Cloudflare Dashboard
2. Pages → coach-rocks-frontend → Settings → Environment Variables
3. 添加變數:
   - Name: `VITE_BACKEND_BASE_URL`
   - Value: `https://coach-backend.gamepig1976.workers.dev`
   - Environment: Production + Preview
4. 重新部署: Deployments → Retry deployment

### 錯誤 3: "oauth_not_configured"

**URL 參數**:
```
?error=oauth_not_configured&message=Google%20OAuth%20not%20configured
```

**原因**: 後端 Google OAuth Secrets 未設置

**解決方案**:

檢查並設置所有必需的 Secrets:

```bash
cd backend

# 列出現有 Secrets
npx wrangler secret list

# 設置缺少的 Secrets
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_REDIRECT_URI
npx wrangler secret put FRONTEND_URL
```

### 錯誤 4: "invalid_client"

**原因**: Google Client ID 或 Client Secret 不正確

**解決方案**:

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. 找到 OAuth 2.0 Client ID
4. 複製正確的 Client ID 和 Client Secret
5. 更新後端 Secrets:
   ```bash
   npx wrangler secret put GOOGLE_CLIENT_ID
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   ```

### 錯誤 5: "access_denied"

**原因**: 用戶取消了 Google 授權或權限不足

**解決方案**:

這是正常行為，用戶可以重新嘗試登入。如果持續發生:
1. 檢查 Google OAuth Consent Screen 配置
2. 確保應用狀態為 "Production" 或 "Testing" (包含測試用戶)
3. 檢查 OAuth Scopes 是否正確:
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`

## 測試 OAuth 流程

### 開發環境測試

1. 啟動後端:
   ```bash
   cd backend
   npm run dev
   ```

2. 啟動前端:
   ```bash
   cd frontend
   npm run dev
   ```

3. 訪問 `http://localhost:5173`
4. 點擊 "Sign In with Google"
5. 檢查 Console 輸出和 Network 請求

### 生產環境測試

1. 訪問 `https://coach-rocks.pages.dev`
2. 點擊 "Sign In with Google"
3. 如果出現錯誤，檢查 URL 參數中的錯誤信息
4. 檢查 Cloudflare Workers 日誌:
   ```bash
   cd backend
   npx wrangler tail
   ```

## 日誌分析

### 前端日誌

打開瀏覽器 Console (F12)，查看:

```javascript
// 環境配置日誌
🌍 Environment Info: {...}

// OAuth 初始化日誌
✅ Cleaned backend URL: ...
🔍 analyzeAuthenticatedMeeting: ...

// 錯誤日誌
❌ Google OAuth handleGoogleLogin error: ...
```

### 後端日誌

查看 Cloudflare Workers 日誌:

```bash
cd backend
npx wrangler tail
```

應該看到:
```
Google OAuth initialization called
🔍 Google OAuth Configuration Check:
  - GOOGLE_CLIENT_ID: xxxxx...
  - GOOGLE_REDIRECT_URI: https://...
✅ Using frontend URL from request header: ...
```

## 完整檢查清單

- [ ] 前端環境變數 `VITE_BACKEND_BASE_URL` 已設置
- [ ] 後端 Secrets 全部設置 (4個)
- [ ] Google Console redirect URI 已配置
- [ ] Google Console JavaScript origins 已配置
- [ ] 環境判斷邏輯正確（使用 `config/environment.js`）
- [ ] 前後端服務都已重新啟動/部署
- [ ] 測試用戶已添加到 OAuth Consent Screen（開發模式）

## 獲取幫助

如果以上步驟都無法解決問題：

1. 收集完整的錯誤信息:
   - 瀏覽器 Console 輸出
   - Network 請求詳情
   - 後端日誌 (`wrangler tail`)

2. 檢查相關配置:
   - 前端 `.env` 文件
   - Cloudflare Pages 環境變數
   - Cloudflare Workers Secrets
   - Google Console OAuth 配置

3. 參考文檔:
   - [環境配置指南](./ENVIRONMENT_CONFIG_GUIDE.md)
   - [Google OAuth 2.0 文檔](https://developers.google.com/identity/protocols/oauth2)
   - [Cloudflare Pages 環境變數](https://developers.cloudflare.com/pages/platform/build-configuration/)

## 更新記錄

- **2025-11-19**: 初始版本，涵蓋常見 OAuth 錯誤排查
