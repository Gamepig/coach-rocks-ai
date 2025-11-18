# Cloudflare 部署技術文件

**功能名稱**: Cloudflare Workers & Pages Deployment
**最後更新**: 2025-11-18
**負責人**: DevOps Team

---

## 📋 目錄

1. [功能描述](#功能描述)
2. [檔案位置](#檔案位置)
3. [主要配置](#主要配置)
4. [部署流程](#部署流程)
5. [環境變數](#環境變數)
6. [D1 Database 設定](#d1-database-設定)
7. [Domain 配置](#domain-配置)
8. [QA 常見問題](#qa-常見問題)
9. [Debug 說明](#debug-說明)

---

## 功能描述

### 概述

CoachRocks AI 使用 Cloudflare 平台進行全棧部署：
- **後端**: Cloudflare Workers（Serverless JavaScript/TypeScript Runtime）
- **前端**: Cloudflare Pages（靜態網站託管）
- **資料庫**: Cloudflare D1（SQL Database）
- **AI 服務**: Cloudflare Workers AI（可選）

### 核心功能

1. **Cloudflare Workers 部署**
   - Serverless TypeScript 後端
   - 全球邊緣節點部署
   - 毫秒級冷啟動
   - 自動擴展

2. **Cloudflare Pages 部署**
   - 靜態網站託管
   - Git 整合自動部署
   - 全球 CDN 加速
   - 自動 HTTPS

3. **D1 Database**
   - SQLite-based SQL 資料庫
   - 全球複製
   - 低延遲查詢
   - 免費方案支援

4. **環境變數管理**
   - Wrangler Secrets（敏感資料）
   - Environment Variables（非敏感配置）
   - 開發/生產環境隔離

### 技術特點

- ✅ **零伺服器管理**: 完全 Serverless 架構
- ✅ **全球部署**: 自動部署到全球邊緣節點
- ✅ **高可用性**: 99.9%+ 可用性保證
- ✅ **自動擴展**: 根據流量自動調整資源
- ✅ **低延遲**: 邊緣計算實現毫秒級響應
- ✅ **成本效益**: 免費方案支援開發和小型應用

---

## 檔案位置

### 配置檔案

| 檔案路徑 | 功能 | 行數 |
|---------|------|------|
| `backend/wrangler.jsonc` | Cloudflare Workers 主配置 | 88 行 |
| `backend/package.json` | Backend 依賴與部署腳本 | 30 行 |
| `backend/ENV_SETUP.md` | 環境變數設定指南 | 275 行 |
| `backend/.dev.vars` | 本地開發環境變數（不提交） | - |
| `frontend/package.json` | Frontend 建置與部署腳本 | 40 行 |
| `frontend/vite.config.js` | Vite 建置配置 | 11 行 |
| `.gitlab-ci.yml` | CI/CD 自動部署配置 | 80 行 |

### 相關腳本

| 檔案路徑 | 功能 |
|---------|------|
| `backend/src/index.ts` | Workers 入口點 |
| `backend/src/database.ts` | D1 Database 服務層 |

---

## 主要配置

### Wrangler 配置（backend/wrangler.jsonc）

**檔案**: `backend/wrangler.jsonc:1-88`

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "coach-backend",
  "main": "src/index.ts",
  "compatibility_date": "2025-06-20",
  "account_id": "9288c023577aa2f6ce20582b6c4bdda0",

  // 監控配置
  "observability": {
    "enabled": true
  },

  // D1 資料庫綁定
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "coachdb",
      "database_id": "d15ec66a-762c-40a2-bc8e-d64a1c8eb440"
    }
  ],

  // AI 服務綁定
  "ai": {
    "binding": "AI"
  },

  // 非敏感環境變數
  "vars": {}
}
```

**關鍵配置說明**:

1. **name**: Worker 名稱，部署後的 URL 為 `https://coach-backend.gamepig1976.workers.dev`
2. **main**: TypeScript 入口檔案
3. **compatibility_date**: Workers 平台相容性日期
4. **account_id**: Cloudflare 帳戶 ID
5. **observability**: 啟用監控和日誌
6. **d1_databases**: D1 資料庫綁定配置
   - `binding`: 在程式碼中的變數名稱（`c.env.DB`）
   - `database_name`: 資料庫名稱
   - `database_id`: D1 資料庫 UUID
7. **ai**: Cloudflare Workers AI 綁定（`c.env.AI`）

---

### Package.json 部署腳本

**Backend** (`backend/package.json:5-9`):
```json
{
  "scripts": {
    "deploy": "wrangler deploy",
    "dev": "wrangler dev --port 8788",
    "start": "wrangler dev --port 8788"
  }
}
```

**Frontend** (`frontend/package.json:6-10`):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## 部署流程

### 完整部署流程

```
┌─────────────────────────────────────────┐
│  開發階段                                │
├─────────────────────────────────────────┤
│  1. 本地開發（wrangler dev）             │
│  2. 測試驗證                             │
│  3. Git Commit & Push                   │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  GitLab CI/CD 自動觸發                  │
│  (Push to main/master)                  │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Stage 1: Backend 部署                  │
├─────────────────────────────────────────┤
│  1. TypeScript 編譯檢查                  │
│  2. 清除快取                             │
│  3. wrangler deploy                     │
│  4. Health Check 驗證                   │
└────────┬────────────────────────────────┘
         │ (success)
         ▼
┌─────────────────────────────────────────┐
│  Stage 2: Frontend 部署                 │
├─────────────────────────────────────────┤
│  1. vite build                          │
│  2. wrangler pages deploy dist          │
└────────┬────────────────────────────────┘
         │ (success)
         ▼
┌─────────────────────────────────────────┐
│  部署完成                                │
│  ✅ Backend: workers.dev                │
│  ✅ Frontend: pages.dev                 │
│  ✅ D1 Database: 自動綁定                │
└─────────────────────────────────────────┘
```

### 手動部署

#### Backend 手動部署

```bash
# 1. 進入 backend 目錄
cd backend

# 2. 安裝依賴
pnpm install

# 3. TypeScript 編譯檢查
npx tsc --noEmit

# 4. 部署到 Cloudflare Workers
wrangler deploy

# 5. 驗證部署
curl https://coach-backend.gamepig1976.workers.dev/api/health
```

**輸出範例**:
```
⛅️ wrangler 4.21.0
-------------------
Uploading Worker "coach-backend" to Cloudflare...
 ✨ Success! Your worker has been deployed to:
    https://coach-backend.gamepig1976.workers.dev
```

#### Frontend 手動部署

```bash
# 1. 進入 frontend 目錄
cd frontend

# 2. 安裝依賴
pnpm install

# 3. 設定環境變數
export VITE_BACKEND_BASE_URL=https://coach-backend.gamepig1976.workers.dev

# 4. 建置前端
pnpm build

# 5. 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name=coach-rocks-frontend

# 6. 驗證部署
open https://coach-rocks-frontend.pages.dev
```

**輸出範例**:
```
🌎 Uploading... (123/456 files)
✨ Success! Deployed to:
   https://coach-rocks-frontend.pages.dev
```

---

## 環境變數

### 環境變數分類

Cloudflare Workers 支援兩種環境變數：

1. **Secrets**（敏感資料）
   - API Keys、密碼、Token
   - 使用 `wrangler secret put` 設定
   - 不會顯示在 Dashboard 或程式碼中
   - 例如: `OPENAI_API_KEY`, `JWT_SECRET`

2. **Variables**（非敏感資料）
   - 配置參數、URL
   - 在 `wrangler.jsonc` 的 `vars` 區塊設定
   - 可在 Dashboard 查看
   - 例如: `BACKEND_URL`, `APP_NAME`

### 必要的 Secrets

**AI 服務**:
```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put PERPLEXITY_API_KEY
wrangler secret put SERPER_API_KEY
```

**認證**:
```bash
# 產生 JWT Secret: openssl rand -hex 32
wrangler secret put JWT_SECRET
```

**Email 服務（RESEND/MailChannels）**:
```bash
wrangler secret put RESEND_API_KEY
wrangler secret put FROM_EMAIL
wrangler secret put APP_NAME
```

**OAuth - Google**:
```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GOOGLE_REDIRECT_URI
```

**OAuth - Zoom**:
```bash
wrangler secret put ZOOM_CLIENT_ID
wrangler secret put ZOOM_CLIENT_SECRET
wrangler secret put ZOOM_REDIRECT_URI
```

**應用程式 URL**:
```bash
wrangler secret put BACKEND_URL
wrangler secret put FRONTEND_URL
```

### 本地開發環境變數

**檔案**: `backend/.dev.vars`（不提交到 Git）

```bash
# AI Services
OPENAI_API_KEY=sk-proj-...
PERPLEXITY_API_KEY=pplx-...
SERPER_API_KEY=...

# Authentication
JWT_SECRET=<generate-with-openssl-rand-hex-32>

# Email Service (RESEND/MailChannels)
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@coachrocks.com
APP_NAME=CoachRocks AI

# OAuth - Google
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback

# OAuth - Zoom
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...
ZOOM_REDIRECT_URI=http://localhost:5173/auth/zoom/callback

# Application URLs
BACKEND_URL=https://coach-backend.gamepig1976.workers.dev
FRONTEND_URL=http://localhost:5173
```

### Secrets 管理指令

```bash
# 列出所有 Secrets
wrangler secret list

# 設定 Secret（會提示輸入值）
wrangler secret put <SECRET_NAME>

# 刪除 Secret
wrangler secret delete <SECRET_NAME>
```

---

## D1 Database 設定

### D1 Database 配置

**檔案**: `backend/wrangler.jsonc:14-20`

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "coachdb",
    "database_id": "d15ec66a-762c-40a2-bc8e-d64a1c8eb440"
  }
]
```

### 建立 D1 Database

```bash
# 建立新的 D1 Database
wrangler d1 create coachdb

# 輸出會包含 database_id，複製到 wrangler.jsonc
```

### D1 Database 操作

```bash
# 執行 SQL 指令
wrangler d1 execute coachdb --command "SELECT * FROM users LIMIT 10"

# 執行 SQL 檔案
wrangler d1 execute coachdb --file=./schema.sql

# 本地開發（使用本地 SQLite）
wrangler d1 execute coachdb --local --command "SELECT * FROM users"
```

### 資料庫遷移

```bash
# 1. 建立遷移檔案
wrangler d1 migrations create coachdb add_new_table

# 2. 編輯遷移檔案（在 migrations/ 目錄）

# 3. 套用遷移（本地）
wrangler d1 migrations apply coachdb --local

# 4. 套用遷移（生產）
wrangler d1 migrations apply coachdb
```

### 在程式碼中使用 D1

**檔案**: `backend/src/database.ts`

```typescript
// D1 Database 綁定在 c.env.DB
export async function getUser(c: AppContext, userId: string) {
  const result = await c.env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(userId).first()

  return result
}
```

---

## Domain 配置

### Cloudflare 域名設定流程

#### 1. 添加域名到 Cloudflare

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 點擊「Add a Site」
3. 輸入域名（例如: `coachrocks.com`）
4. 選擇「Quick scan for DNS records」
5. 點擊「Continue」

#### 2. 複製 Cloudflare Name Servers

Cloudflare 會提供兩個 Name Servers，例如:
```
alice.ns.cloudflare.com
bob.ns.cloudflare.com
```

複製這些記錄到記事本。

#### 3. 在 GoDaddy 更新 Name Servers

1. 登入 [GoDaddy](https://www.godaddy.com)
2. 進入「My Products」→ 找到域名
3. 點擊「DNS」→「Name Servers」
4. 點擊「Change」
5. 選擇「Custom」
6. 輸入 Cloudflare 的 Name Servers
7. 點擊「Save」

#### 4. 等待 DNS 傳播

DNS 傳播通常需要 **5-30 分鐘**，最多可能需要 24 小時。

**驗證 DNS 傳播**:
```bash
# macOS/Linux
dig coachrocks.com NS +short

# 應該看到 Cloudflare 的 NS 記錄
# alice.ns.cloudflare.com
# bob.ns.cloudflare.com
```

### Workers 自訂域名

#### 設定 Workers 自訂域名

1. 在 Cloudflare Dashboard 選擇域名
2. 進入「Workers & Pages」→「coach-backend」
3. 點擊「Settings」→「Domains & Routes」
4. 點擊「Add Custom Domain」
5. 輸入子域名（例如: `api.coachrocks.com`）
6. 點擊「Add Custom Domain」

Cloudflare 會自動建立 DNS 記錄並啟用 HTTPS。

### Pages 自訂域名

#### 設定 Pages 自訂域名

1. 在 Cloudflare Dashboard 選擇域名
2. 進入「Workers & Pages」→「coach-rocks-frontend」
3. 點擊「Custom domains」
4. 點擊「Set up a custom domain」
5. 輸入域名（例如: `app.coachrocks.com`）
6. 點擊「Continue」

Cloudflare 會自動建立 DNS 記錄並啟用 HTTPS。

---

## QA 常見問題

### Q1: wrangler deploy 失敗 - Unauthorized

**問題**: `wrangler deploy` 回應 401 Unauthorized

**原因**:
- 未登入 Cloudflare 帳戶
- API Token 無效或過期

**解決方案**:
```bash
# 登入 Cloudflare
wrangler login

# 或使用 API Token
export CLOUDFLARE_API_TOKEN=your-api-token
wrangler deploy
```

---

### Q2: D1 Database 找不到

**問題**: 部署後出現 "Database binding 'DB' not found"

**原因**:
- `wrangler.jsonc` 中的 `database_id` 錯誤
- D1 Database 不存在

**解決方案**:
```bash
# 1. 列出所有 D1 Databases
wrangler d1 list

# 2. 確認 database_id 正確
# 3. 更新 wrangler.jsonc 中的 database_id
# 4. 重新部署
wrangler deploy
```

---

### Q3: Environment Variable 未載入

**問題**: 程式碼中無法讀取環境變數

**原因**:
- 本地開發: `.dev.vars` 檔案不存在或格式錯誤
- 生產環境: Secret 未設定

**解決方案**:

**本地開發**:
```bash
# 1. 建立 .dev.vars 檔案
cd backend
touch .dev.vars

# 2. 填入環境變數（參考 .env.example）
# 3. 重新啟動 wrangler dev
npm run dev
```

**生產環境**:
```bash
# 設定 Secret
wrangler secret put VARIABLE_NAME

# 驗證 Secret 已設定
wrangler secret list
```

---

### Q4: TypeScript 編譯錯誤

**問題**: `wrangler deploy` 時出現 TypeScript 錯誤

**原因**: TypeScript 程式碼有錯誤

**解決方案**:
```bash
# 1. 本地執行 TypeScript 檢查
cd backend
npx tsc --noEmit

# 2. 修正所有錯誤
# 3. 重新部署
wrangler deploy
```

---

### Q5: Pages 部署失敗 - Build Error

**問題**: `wrangler pages deploy` 失敗

**原因**:
- 前端建置失敗
- `dist` 目錄不存在
- 環境變數未設定

**解決方案**:
```bash
# 1. 本地建置測試
cd frontend
export VITE_BACKEND_BASE_URL=https://coach-backend.gamepig1976.workers.dev
pnpm build

# 2. 確認 dist 目錄存在
ls -la dist/

# 3. 重新部署
wrangler pages deploy dist --project-name=coach-rocks-frontend
```

---

### Q6: CORS 錯誤

**問題**: 前端請求後端時出現 CORS 錯誤

**原因**: Workers 未設定正確的 CORS headers

**解決方案**:

確認後端程式碼中有正確的 CORS 設定:
```typescript
// backend/src/index.ts
app.use('*', async (c, next) => {
  await next()

  c.header('Access-Control-Allow-Origin', c.env.FRONTEND_URL)
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  c.header('Access-Control-Allow-Credentials', 'true')
})
```

---

## Debug 說明

### 查看 Workers 日誌

#### 使用 Wrangler Tail（即時日誌）

```bash
# 即時查看 Workers 日誌
wrangler tail

# 過濾特定狀態碼
wrangler tail --status 500

# 過濾特定 IP
wrangler tail --ip 1.2.3.4
```

**日誌範例**:
```
[2025-11-18 10:30:00] GET https://coach-backend.gamepig1976.workers.dev/api/health
  Status: 200 OK
  Duration: 12ms
```

#### Cloudflare Dashboard 日誌

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 進入「Workers & Pages」→「coach-backend」
3. 點擊「Logs」→「Real-time Logs」
4. 查看即時日誌和錯誤

### 本地測試

#### Backend 本地測試

```bash
cd backend
npm run dev

# 測試 API 端點
curl http://localhost:8788/api/health
curl http://localhost:8788/api/test-db
```

#### Frontend 本地測試

```bash
cd frontend
npm run dev

# 開啟瀏覽器
open http://localhost:5173
```

### 效能監控

#### Cloudflare Analytics

1. 進入「Workers & Pages」→「coach-backend」
2. 點擊「Analytics」
3. 查看:
   - Requests per second
   - Errors per second
   - CPU time
   - Duration percentiles

#### 關鍵指標

| 指標 | 正常範圍 | 警告閾值 |
|------|---------|---------|
| Request Duration (p50) | < 50ms | > 200ms |
| Request Duration (p99) | < 200ms | > 1000ms |
| Error Rate | < 1% | > 5% |
| CPU Time | < 10ms | > 50ms |

### 常見錯誤訊息

#### 錯誤 1: "Failed to fetch"

```
TypeError: Failed to fetch
```

**處理**:
1. 檢查 CORS 設定
2. 確認 Backend URL 正確
3. 檢查網路連線

---

#### 錯誤 2: "Database not found"

```
Error: Database binding 'DB' not found
```

**處理**: 檢查 `wrangler.jsonc` 中的 D1 綁定配置

---

#### 錯誤 3: "Secret not found"

```
Error: Environment variable OPENAI_API_KEY not found
```

**處理**: 使用 `wrangler secret put` 設定缺少的 Secret

---

### 診斷工具

#### 1. 檢查 Workers 狀態

```bash
# 列出所有 Workers
wrangler deployments list

# 查看最新部署
wrangler deployments view
```

#### 2. 檢查 D1 連線

```bash
# 測試 D1 查詢
wrangler d1 execute coachdb --command "SELECT 1"
```

#### 3. 檢查 Secrets

```bash
# 列出所有 Secrets
wrangler secret list
```

#### 4. 網路診斷

```bash
# 測試 Workers 端點
curl -v https://coach-backend.gamepig1976.workers.dev/api/health

# 檢查 DNS 解析
dig coach-backend.gamepig1976.workers.dev

# 檢查 SSL 證書
openssl s_client -connect coach-backend.gamepig1976.workers.dev:443
```

---

## 相關文件

- [GitLab CI/CD 自動部署](./09_gitlab_cicd.md)
- [Google OAuth 認證](./01_google_oauth.md)
- [環境變數設定指南](./backend/ENV_SETUP.md)
- [Cloudflare Workers 文件](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages 文件](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 文件](https://developers.cloudflare.com/d1/)
- [Wrangler CLI 文件](https://developers.cloudflare.com/workers/wrangler/)

---

**文件版本**: 1.0
**建立日期**: 2025-11-18
**最後更新**: 2025-11-18
