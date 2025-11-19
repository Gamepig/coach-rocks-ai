# 環境配置指南

## 概覽

本專案使用統一的環境配置模組來管理不同環境（開發、生產）的判斷邏輯，避免硬編碼的環境判斷。

## 環境判斷邏輯

### 配置模組位置
`frontend/src/config/environment.js`

### 使用方式

```javascript
import { isProduction, isDevelopment, getEnvironment } from '@/config/environment'

// 判斷環境
if (isProduction()) {
  // 生產環境邏輯
}

if (isDevelopment()) {
  // 開發環境邏輯
}

// 獲取環境名稱
const env = getEnvironment() // 'development' | 'production' | 'staging' | 'test'
```

## 環境變數配置

### 開發環境 (.env.development)

```bash
# 後端 URL
VITE_BACKEND_BASE_URL=http://localhost:8788

# 環境標識（可選）
VITE_ENVIRONMENT=development

# 生產域名列表（可選，用於環境判斷）
# VITE_PRODUCTION_DOMAINS=coach.rocks,app.coach.rocks
```

### 生產環境 (.env.production)

```bash
# 後端 URL
VITE_BACKEND_BASE_URL=https://coach-backend.gamepig1976.workers.dev

# 環境標識
VITE_ENVIRONMENT=production

# 生產域名列表（當 URL 不再是 pages.dev 時，更新此列表）
VITE_PRODUCTION_DOMAINS=pages.dev,coach.rocks,app.coach.rocks,coachrocksai.com
```

### Cloudflare Pages 環境變數

在 Cloudflare Dashboard 中設置：

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 前往：**Pages** → **coach-rocks-frontend** → **Settings** → **Environment Variables**
3. 設置以下變數（Production 和 Preview 環境）：

| 變數名 | 值 | 說明 |
|--------|---|------|
| `VITE_BACKEND_BASE_URL` | `https://coach-backend.gamepig1976.workers.dev` | 後端 API URL |
| `VITE_ENVIRONMENT` | `production` | 環境標識 |
| `VITE_PRODUCTION_DOMAINS` | `coach.rocks,app.coach.rocks,coachrocksai.com` | 生產域名列表（逗號分隔） |

## 環境判斷優先級

環境判斷按以下優先級進行：

1. **明確的環境變數** (`VITE_ENVIRONMENT`)
2. **測試環境判斷** (`process.env.NODE_ENV === 'test'`)
3. **Vite Mode** (`import.meta.env.MODE`)
4. **Hostname 判斷**:
   - `localhost` 或 `127.0.0.1` → `development`
   - 匹配 `VITE_PRODUCTION_DOMAINS` → `production`
5. **預設** → `development`

## 生產域名配置

### 預設域名列表

如果未設置 `VITE_PRODUCTION_DOMAINS`，將使用以下預設列表：

- `pages.dev` （Cloudflare Pages 預設域名）
- `coach.rocks` （主域名）
- `app.coach.rocks` （子域名）
- `coachrocksai.com` （備用域名）

### 更新域名列表

當 URL 變更時，更新以下位置：

1. **環境變數文件**:
   - `.env.production` 中的 `VITE_PRODUCTION_DOMAINS`

2. **Cloudflare Pages**:
   - Dashboard → Environment Variables → `VITE_PRODUCTION_DOMAINS`

3. **配置模組** (可選):
   - 更新 `frontend/src/config/environment.js` 中的 `defaultDomains`

## Google OAuth 配置

### 前端配置

前端會自動使用環境配置模組判斷環境，無需額外配置。

### 後端配置

後端需要設置以下環境變數（Cloudflare Workers Secrets）：

| Secret 名稱 | 說明 | 範例值 |
|-------------|------|--------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-xxxxx` |
| `GOOGLE_REDIRECT_URI` | OAuth Callback URL | `https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback` |
| `FRONTEND_URL` | 前端 URL（生產環境） | `https://coach-rocks.pages.dev` |

### 設置後端 Secrets

```bash
# 進入後端目錄
cd backend

# 設置 Secrets
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_REDIRECT_URI
npx wrangler secret put FRONTEND_URL
```

### Google Console 配置

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 選擇專案 → **APIs & Services** → **Credentials**
3. 編輯 OAuth 2.0 Client ID
4. 在 **Authorized redirect URIs** 中添加：

   **生產環境**:
   ```
   https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback
   ```

   **開發環境** (可選):
   ```
   http://localhost:8788/api/auth/google/callback
   ```

5. 在 **Authorized JavaScript origins** 中添加前端域名：
   ```
   https://coach-rocks.pages.dev
   https://coach.rocks
   http://localhost:5173
   ```

## 常見問題排查

### 1. Google OAuth 錯誤: "redirect_uri_mismatch"

**原因**: Google Console 中配置的 redirect_uri 與後端環境變數不匹配

**解決方案**:
1. 檢查後端 `GOOGLE_REDIRECT_URI` 值
2. 確保 Google Console 中有對應的 redirect URI
3. 確保兩者完全一致（包括協議、域名、路徑）

### 2. 環境判斷錯誤

**原因**: 環境變數未正確設置或域名未添加到列表

**解決方案**:
1. 確認 `VITE_PRODUCTION_DOMAINS` 包含當前域名
2. 或設置明確的 `VITE_ENVIRONMENT` 環境變數
3. 檢查瀏覽器 Console 查看環境診斷信息

### 3. 後端 URL 驗證失敗

**原因**: `VITE_BACKEND_BASE_URL` 未設置或格式錯誤

**解決方案**:
1. 檢查 `.env` 文件或 Cloudflare Pages 環境變數
2. 確保 URL 格式正確（包含協議，不包含尾隨斜線）
3. 範例: `https://coach-backend.gamepig1976.workers.dev`

## 測試配置

### 開發環境測試

```bash
cd frontend
npm run dev
```

在瀏覽器 Console 中會自動顯示環境診斷信息。

### 生產環境測試

1. 構建應用: `npm run build`
2. 預覽: `npm run preview`
3. 檢查環境判斷是否正確

## 遷移指南

### 從硬編碼遷移到配置模組

**舊代碼**:
```javascript
const isProduction = window.location.hostname.includes('pages.dev')
```

**新代碼**:
```javascript
import { isProduction } from '@/config/environment'

const isProd = isProduction()
```

### 已遷移的文件

以下文件已完成遷移：

- ✅ `frontend/src/services/api.js`
- ✅ `frontend/src/contexts/AuthContext.jsx`
- ✅ `frontend/src/App.jsx`
- ✅ `frontend/src/components/LoginPage/LoginPage.jsx`
- ✅ `frontend/src/components/LoginPrompt/LoginPrompt.jsx`
- ✅ `frontend/src/utils/envDiagnostics.js`

## 更新記錄

- **2025-11-19**: 創建統一環境配置模組，移除所有硬編碼的 `pages.dev` 判斷
- **說明**: 未來 URL 變更時，只需更新環境變數，無需修改代碼
