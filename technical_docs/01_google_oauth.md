# Google OAuth 2.0 認證系統技術文件

**功能名稱**: Google OAuth 2.0 Authentication System
**最後更新**: 2025-11-18
**負責人**: Backend Team
**安全等級**: 🔴 高 (處理使用者認證)

---

## 📋 目錄

1. [功能描述](#功能描述)
2. [檔案位置](#檔案位置)
3. [主要函數](#主要函數)
4. [相關函數](#相關函數)
5. [函數與變數列表](#函數與變數列表)
6. [設計概念](#設計概念)
7. [函數變數使用位置](#函數變數使用位置)
8. [API 端點](#api-端點)
9. [資料庫結構](#資料庫結構)
10. [環境變數](#環境變數)
11. [QA 常見問題](#qa-常見問題)
12. [Debug 說明](#debug-說明)
13. [測試範例](#測試範例)

---

## 功能描述

### 概述

Google OAuth 2.0 認證系統實作了 **Authorization Code Flow (後端控制流程)**,提供安全的使用者登入功能。使用者可透過 Google 帳號登入系統,無需記憶額外的密碼。

### 核心功能

1. **OAuth 初始化** (`/api/auth/google/init`)
   - 產生安全的 state 參數防止 CSRF 攻擊
   - 將 state 儲存在加密 cookie 中
   - 重定向使用者到 Google 授權頁面

2. **OAuth 回調處理** (`/api/auth/google/callback`)
   - 驗證 state 參數確保請求安全性
   - 交換授權碼取得 access token
   - 使用 access token 獲取使用者資料
   - 建立或更新使用者帳號
   - 產生 session token 並重定向回前端

3. **登出功能** (`/api/logout`)
   - 清除 session token
   - 清除所有認證相關 cookies

### 使用場景

- 新使用者首次註冊
- 既有使用者登入
- 既有使用者連結 Google 帳號
- 多裝置登入管理

### 技術特點

- ✅ **CSRF 保護**: 使用加密的 state 參數
- ✅ **安全儲存**: session token 使用 JWT 簽章
- ✅ **自動帳號連結**: 支援 email 連結既有帳號
- ✅ **多前端支援**: 自動偵測前端 URL (localhost/production)
- ✅ **詳細日誌**: 完整的 debug 日誌追蹤
- ✅ **錯誤處理**: 友善的錯誤訊息與重定向

---

## 檔案位置

### 後端檔案

| 檔案路徑 | 功能 | 行數 |
|---------|------|------|
| `backend/src/endpoints/authGoogleInit.ts` | OAuth 初始化端點 | 197 行 |
| `backend/src/endpoints/authGoogle.ts` | OAuth 回調處理端點 | ~300 行 |
| `backend/src/endpoints/logout.ts` | 登出端點 | ~100 行 |
| `backend/src/middleware/session.ts` | Session 管理中介層 | ~200 行 |
| `backend/src/middleware/auth.ts` | 認證中介層 | ~150 行 |
| `backend/src/services/database.ts` | 資料庫服務 (使用者相關) | ~1400 行 |

### 前端檔案

| 檔案路徑 | 功能 |
|---------|------|
| `frontend/src/components/Login/Login.jsx` | 登入頁面組件 |
| `frontend/src/components/Login/LoginButtons.jsx` | 登入按鈕組件 |
| `frontend/src/services/api.js` | API 服務層 |

### 配置檔案

| 檔案路徑 | 功能 |
|---------|------|
| `backend/wrangler.jsonc` | Cloudflare Workers 配置 |
| `.gitlab-ci.yml` | CI/CD 配置 |

---

## 主要函數

### 1. AuthGoogleInit.handle()

**位置**: `backend/src/endpoints/authGoogleInit.ts:126-194`

```typescript
async handle(c: AppContext) {
  // 1. 檢查 OAuth 配置
  // 2. 獲取前端 URL
  // 3. 產生 state 參數
  // 4. 建立 Google OAuth URL
  // 5. 設定 cookies (state + frontend URL)
  // 6. 重定向到 Google
}
```

**功能**: OAuth 流程初始化，產生 state 並重定向到 Google

**輸入**: `AppContext` (包含 request, environment)

**輸出**: Redirect Response (302) 到 Google OAuth 頁面

**關鍵邏輯**:
- 檢查 `GOOGLE_CLIENT_ID` 和 `GOOGLE_REDIRECT_URI` 環境變數
- 呼叫 `getFrontendUrl()` 獲取前端 URL
- 呼叫 `generateOAuthState()` 產生隨機 state
- 呼叫 `setOAuthStateCookie()` 設定加密 cookie
- 呼叫 `setOAuthFrontendUrlCookie()` 儲存前端 URL

**錯誤處理**:
- OAuth 未配置: 重定向回前端並顯示錯誤訊息
- 其他錯誤: 回傳 500 JSON 錯誤

---

### 2. AuthGoogleInit.getFrontendUrl()

**位置**: `backend/src/endpoints/authGoogleInit.ts:36-124`

```typescript
private getFrontendUrl(c: AppContext): string {
  // 1. 檢查請求是否來自 localhost
  // 2. 檢查 Referer/Origin headers
  // 3. 檢查 FRONTEND_URL 環境變數
  // 4. 返回合適的前端 URL
}
```

**功能**: 智慧偵測前端 URL,支援本地開發和生產環境

**優先順序**:
1. Request hostname 是 localhost → 返回 `http://localhost:5173`
2. Referer/Origin headers 是 localhost → 使用 header 值
3. `FRONTEND_URL` 環境變數是 localhost → 使用環境變數
4. Request 來自 localhost 但 `FRONTEND_URL` 是生產環境 → 使用 localhost
5. `FRONTEND_URL` 環境變數 (生產環境)
6. 拋出錯誤 (必須設定 `FRONTEND_URL`)

**錯誤處理**: 拋出 Error 如果無法取得前端 URL

---

### 3. AuthGoogle.handle()

**位置**: `backend/src/endpoints/authGoogle.ts` (~line 225-320)

```typescript
async handle(c: AppContext) {
  // 1. 驗證 state 參數
  // 2. 交換授權碼取得 access token
  // 3. 取得使用者資料
  // 4. 建立/更新使用者
  // 5. 產生 session token
  // 6. 重定向回前端
}
```

**功能**: 處理 Google OAuth 回調,完成使用者登入

**關鍵步驟**:
1. 從 query parameters 取得 `code` 和 `state`
2. 呼叫 `getOAuthStateFromCookie()` 驗證 state
3. 呼叫 `exchangeGoogleAuthCode()` 交換 token
4. 呼叫 `getGoogleUserProfile()` 取得使用者資料
5. 呼叫 `getOrCreateGoogleUser()` 建立/更新使用者
6. 呼叫 `createUserSession()` 產生 session token
7. 呼叫 `getOAuthFrontendUrlFromCookie()` 取得前端 URL
8. 重定向回前端並帶上 token

**錯誤處理**:
- 缺少 code/state: 重定向回前端並顯示錯誤
- State 不匹配: 重定向回前端並顯示 CSRF 錯誤
- Token 交換失敗: 重定向回前端並顯示錯誤
- 資料庫錯誤: 重定向回前端並顯示錯誤

---

### 4. AuthGoogle.exchangeGoogleAuthCode()

**位置**: `backend/src/endpoints/authGoogle.ts:71-119`

```typescript
private async exchangeGoogleAuthCode(
  code: string,
  env: any
): Promise<GoogleTokenResponse | null>
```

**功能**: 使用授權碼交換 Google access token

**流程**:
1. 準備 POST 請求參數:
   - `grant_type`: 'authorization_code'
   - `code`: 授權碼
   - `redirect_uri`: 回調 URI (必須與初始化時一致)
   - `client_id`: Google Client ID
   - `client_secret`: Google Client Secret
2. 發送 POST 請求到 `https://oauth2.googleapis.com/token`
3. 解析回應並返回 token 資料

**回傳**:
- 成功: `GoogleTokenResponse` 物件 (包含 `access_token`, `refresh_token` 等)
- 失敗: `null`

**重要提醒**:
- `redirect_uri` 必須與 OAuth 初始化時使用的完全一致
- Google 會嚴格驗證 `redirect_uri`,任何差異都會導致錯誤

---

### 5. AuthGoogle.getGoogleUserProfile()

**位置**: `backend/src/endpoints/authGoogle.ts:124-144`

```typescript
private async getGoogleUserProfile(
  accessToken: string
): Promise<GoogleUserProfile | null>
```

**功能**: 使用 access token 取得 Google 使用者資料

**流程**:
1. 發送 GET 請求到 `https://www.googleapis.com/oauth2/v2/userinfo`
2. 在 `Authorization` header 帶上 `Bearer {accessToken}`
3. 解析回應並返回使用者資料

**回傳**:
```typescript
{
  id: string            // Google user ID
  email: string         // Email address
  verified_email: boolean
  name: string          // Display name
  given_name?: string   // First name
  family_name?: string  // Last name
  picture?: string      // Avatar URL
}
```

---

### 6. AuthGoogle.getOrCreateGoogleUser()

**位置**: `backend/src/endpoints/authGoogle.ts:149-230` (估計)

```typescript
private async getOrCreateGoogleUser(
  db: DatabaseService,
  googleId: string,
  email: string,
  name: string,
  avatarUrl: string,
  env: any
): Promise<{ userId: string; isNewUser: boolean }>
```

**功能**: 根據 Google ID 建立或更新使用者帳號

**流程**:
1. 嘗試用 `google_id` 查詢使用者
2. 如果找到:
   - 更新 `last_login`
   - 更新 `avatar_url`
   - 設定 `verified = TRUE`
   - 返回 `{ userId, isNewUser: false }`
3. 如果沒找到,用 `email` 查詢:
   - 如果有既有使用者:
     - 連結 Google 帳號 (更新 `google_id`)
     - 返回 `{ userId, isNewUser: false }`
4. 如果都沒找到:
   - 建立新使用者
   - 設定 `google_id`, `email`, `name`, `avatar_url`
   - 設定 `auth_provider = 'google'`
   - 設定 `verified = TRUE`
   - 返回 `{ userId, isNewUser: true }`

**重要邏輯**: 自動帳號連結 (如果 email 已存在但未連結 Google)

---

## 相關函數

### Session 管理函數

**檔案**: `backend/src/middleware/session.ts`

| 函數名稱 | 功能 | 位置 |
|---------|------|------|
| `generateOAuthState()` | 產生隨機 state (32 bytes hex) | session.ts |
| `setOAuthStateCookie()` | 設定加密的 state cookie | session.ts |
| `getOAuthStateFromCookie()` | 從 cookie 取得並驗證 state | session.ts |
| `clearOAuthStateCookie()` | 清除 state cookie | session.ts |
| `setOAuthFrontendUrlCookie()` | 設定前端 URL cookie | session.ts |
| `getOAuthFrontendUrlFromCookie()` | 從 cookie 取得前端 URL | session.ts |

### 認證中介層函數

**檔案**: `backend/src/middleware/auth.ts`

| 函數名稱 | 功能 | 位置 |
|---------|------|------|
| `createUserSession()` | 產生 JWT session token | auth.ts |
| `verifyUserSession()` | 驗證 JWT session token | auth.ts |
| `getUserFromSession()` | 從 token 取得使用者資料 | auth.ts |

### 資料庫函數

**檔案**: `backend/src/services/database.ts`

| 函數名稱 | 功能 | 位置 |
|---------|------|------|
| `getUserByEmail()` | 用 email 查詢使用者 | database.ts:~500 |
| `getUserById()` | 用 user_id 查詢使用者 | database.ts:~520 |
| `createUser()` | 建立新使用者 | database.ts:~540 |
| `updateUser()` | 更新使用者資料 | database.ts:~580 |

---

## 函數與變數列表

### 類別定義

#### AuthGoogleInit

**檔案**: `backend/src/endpoints/authGoogleInit.ts`

```typescript
export class AuthGoogleInit extends OpenAPIRoute {
  // 公開方法
  async handle(c: AppContext): Promise<Response>

  // 私有方法
  private getFrontendUrl(c: AppContext): string
}
```

**屬性**:
- `schema`: OpenAPI schema 定義

**方法**:
- `handle()`: 主要處理函數
- `getFrontendUrl()`: 取得前端 URL 輔助函數

---

#### AuthGoogle

**檔案**: `backend/src/endpoints/authGoogle.ts`

```typescript
export class AuthGoogle extends OpenAPIRoute {
  // 公開方法
  async handle(c: AppContext): Promise<Response>

  // 私有方法
  private async exchangeGoogleAuthCode(code: string, env: any): Promise<GoogleTokenResponse | null>
  private async getGoogleUserProfile(accessToken: string): Promise<GoogleUserProfile | null>
  private async getOrCreateGoogleUser(
    db: DatabaseService,
    googleId: string,
    email: string,
    name: string,
    avatarUrl: string,
    env: any
  ): Promise<{ userId: string; isNewUser: boolean }>
}
```

**屬性**:
- `schema`: OpenAPI schema 定義

**方法**:
- `handle()`: 主要處理函數
- `exchangeGoogleAuthCode()`: 交換授權碼
- `getGoogleUserProfile()`: 取得使用者資料
- `getOrCreateGoogleUser()`: 建立或更新使用者

---

### 類型定義

#### GoogleUserProfile

```typescript
type GoogleUserProfile = {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name?: string
  family_name?: string
  picture?: string
}
```

#### GoogleTokenResponse

```typescript
type GoogleTokenResponse = {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope: string
  token_type: string
  error?: string
  error_description?: string
}
```

#### AppContext

```typescript
// 定義在 backend/src/types.ts
interface AppContext extends ExecutionContext {
  req: Request
  env: Env
  json: (data: any, status?: number) => Response
  redirect: (url: string, status?: number) => Response
}
```

---

### 全域變數

無全域變數。所有狀態都儲存在 cookies 或資料庫中。

---

### 環境變數 (使用於此模組)

| 變數名稱 | 用途 | 範例值 | 必須 |
|---------|------|--------|------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `123456...apps.googleusercontent.com` | ✅ 是 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-...` | ✅ 是 |
| `GOOGLE_REDIRECT_URI` | OAuth 回調 URI | `https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback` | ✅ 是 |
| `FRONTEND_URL` | 前端應用 URL | `https://coach-rocks-frontend.pages.dev` | ✅ 是 |
| `JWT_SECRET` | JWT 簽章密鑰 | (隨機 hex 字串) | ✅ 是 |

---

## 設計概念

### 架構設計

#### OAuth 2.0 Authorization Code Flow

```
┌─────────┐                                   ┌─────────────┐
│         │  1. Click "Login with Google"     │             │
│  User   │──────────────────────────────────>│  Frontend   │
│         │                                   │             │
└─────────┘                                   └─────────────┘
     ^                                              │
     │                                              │ 2. Redirect to
     │                                              │    /api/auth/google/init
     │                                              v
     │                                        ┌─────────────┐
     │                                        │             │
     │  6. Redirect to Frontend with Token   │   Backend   │
     │<───────────────────────────────────────│   (Init)    │
     │                                        │             │
     │                                        └─────────────┘
     │                                              │
     │                                              │ 3. Generate state
     │                                              │    Set cookies
     │                                              │    Redirect to Google
     │                                              v
     │                                        ┌─────────────┐
     │  4. Login & Authorize                  │             │
     │<───────────────────────────────────────│   Google    │
     │                                        │   OAuth     │
     └───────────────────────────────────────>│             │
                                              └─────────────┘
                  │                                  │
                  │ 5. Redirect to Backend Callback │
                  │    with code & state             │
                  v                                  v
            ┌─────────────┐                    ┌─────────────┐
            │             │                    │             │
            │   Backend   │<───────────────────│   Google    │
            │ (Callback)  │  Exchange code     │             │
            │             │  for access token  │             │
            └─────────────┘                    └─────────────┘
                  │
                  │ 6. Create/Update User
                  │    Generate Session Token
                  │    Redirect to Frontend
                  v
            ┌─────────────┐
            │             │
            │  Database   │
            │             │
            └─────────────┘
```

### 設計模式

#### 1. Command Pattern (命令模式)

每個端點類別 (`AuthGoogleInit`, `AuthGoogle`) 都實作 `OpenAPIRoute` 介面的 `handle()` 方法,封裝了完整的請求處理邏輯。

#### 2. Template Method Pattern (範本方法模式)

`handle()` 方法定義了處理流程的骨架,內部呼叫多個私有方法完成細部工作。

#### 3. Strategy Pattern (策略模式)

`getFrontendUrl()` 使用多種策略決定前端 URL:
- Request hostname 檢查策略
- Header 檢查策略
- 環境變數策略

#### 4. Factory Pattern (工廠模式)

`getOrCreateGoogleUser()` 根據不同情況建立或返回使用者物件。

### 安全設計

#### CSRF 防護

1. **State 參數**: 產生隨機 state 參數防止 CSRF 攻擊
2. **加密 Cookie**: State 儲存在加密的 HttpOnly cookie 中
3. **State 驗證**: 回調時驗證 state 參數與 cookie 是否一致
4. **一次性使用**: State 驗證後立即清除

#### Session 安全

1. **JWT 簽章**: Session token 使用 JWT 簽章防止竄改
2. **HttpOnly Cookie**: Token 儲存在 HttpOnly cookie 防止 XSS
3. **Secure Flag**: 生產環境使用 Secure flag (HTTPS only)
4. **SameSite**: 設定 SameSite=Lax 防止 CSRF

#### 敏感資料保護

1. **環境變數**: Client Secret 等敏感資料儲存在環境變數中
2. **不記錄密鑰**: 日誌中不記錄完整的 Client ID/Secret
3. **HTTPS Only**: 生產環境強制使用 HTTPS

---

## 函數變數使用位置

### authGoogleInit.ts 中的變數使用

#### getFrontendUrl()

**使用變數**:
- `c.req.url` - 取得請求 URL
- `c.req.header('Referer')` - 取得 Referer header
- `c.req.header('Origin')` - 取得 Origin header
- `c.env.FRONTEND_URL` - 取得環境變數

**呼叫位置**:
- `authGoogleInit.ts:151` - 在 `handle()` 方法中呼叫

---

#### handle()

**使用變數**:
- `c.env.GOOGLE_CLIENT_ID` - Google Client ID
- `c.env.GOOGLE_REDIRECT_URI` - OAuth 回調 URI
- `frontendUrl` - 前端 URL (從 `getFrontendUrl()` 取得)
- `state` - OAuth state 參數 (從 `generateOAuthState()` 取得)
- `googleAuthUrl` - Google OAuth URL

**呼叫函數**:
- `generateOAuthState()` - session.ts:~20
- `setOAuthStateCookie()` - session.ts:~30
- `setOAuthFrontendUrlCookie()` - session.ts:~60
- `getFrontendUrl()` - authGoogleInit.ts:36

**回傳位置**:
- 成功: 返回 Redirect Response
- 失敗: 返回 JSON 錯誤或重定向到前端

---

### authGoogle.ts 中的變數使用

#### exchangeGoogleAuthCode()

**使用變數**:
- `code` - 授權碼
- `env.GOOGLE_CLIENT_ID` - Google Client ID
- `env.GOOGLE_CLIENT_SECRET` - Google Client Secret
- `env.GOOGLE_REDIRECT_URI` - OAuth 回調 URI
- `tokenEndpoint` - Google token endpoint URL
- `params` - POST 請求參數

**呼叫位置**:
- `authGoogle.ts:~240` - 在 `handle()` 方法中呼叫

---

#### getGoogleUserProfile()

**使用變數**:
- `accessToken` - Google access token

**呼叫位置**:
- `authGoogle.ts:~260` - 在 `handle()` 方法中呼叫

---

#### getOrCreateGoogleUser()

**使用變數**:
- `googleId` - Google user ID
- `email` - User email
- `name` - User name
- `avatarUrl` - User avatar URL
- `db` - DatabaseService 實例
- `env.DB` - D1 database 實例

**呼叫位置**:
- `authGoogle.ts:~280` - 在 `handle()` 方法中呼叫

---

#### handle()

**使用變數**:
- `code` - 從 query parameter 取得
- `state` - 從 query parameter 取得
- `error` - 從 query parameter 取得 (如果有錯誤)
- `expectedState` - 從 cookie 取得
- `tokenData` - Token 交換回應
- `userProfile` - Google 使用者資料
- `result` - 使用者建立/更新結果
- `sessionToken` - JWT session token
- `frontendUrl` - 前端 URL (從 cookie 取得)

**呼叫函數**:
- `getOAuthStateFromCookie()` - session.ts:~40
- `exchangeGoogleAuthCode()` - authGoogle.ts:71
- `getGoogleUserProfile()` - authGoogle.ts:124
- `getOrCreateGoogleUser()` - authGoogle.ts:149
- `createUserSession()` - auth.ts:~30
- `getOAuthFrontendUrlFromCookie()` - session.ts:~70
- `clearOAuthStateCookie()` - session.ts:~50

**回傳位置**:
- 成功: 重定向到前端 (帶 token)
- 失敗: 重定向到前端 (帶錯誤訊息)

---

## API 端點

### 1. Google OAuth 初始化

**端點**: `GET /api/auth/google/init`

**功能**: 初始化 Google OAuth 流程

**請求範例**:
```http
GET /api/auth/google/init HTTP/1.1
Host: coach-backend.gamepig1976.workers.dev
Referer: http://localhost:5173/
```

**回應**:
- **狀態碼**: `302 Found`
- **Headers**:
  - `Location: https://accounts.google.com/o/oauth2/v2/auth?...`
  - `Set-Cookie: oauth_state=...; HttpOnly; Secure; SameSite=Lax`
  - `Set-Cookie: oauth_frontend_url=...; HttpOnly; Secure; SameSite=Lax`

**錯誤回應**:
```http
HTTP/1.1 302 Found
Location: http://localhost:5173/?error=oauth_not_configured&message=Google%20OAuth%20not%20configured
```

**Cookies 設定**:
- `oauth_state`: 加密的 state 參數 (Max-Age: 600秒)
- `oauth_frontend_url`: 前端 URL (Max-Age: 600秒)

---

### 2. Google OAuth 回調

**端點**: `GET /api/auth/google/callback`

**功能**: 處理 Google OAuth 回調並完成登入

**請求範例**:
```http
GET /api/auth/google/callback?code=4/0AY...&state=abc123... HTTP/1.1
Host: coach-backend.gamepig1976.workers.dev
Cookie: oauth_state=...; oauth_frontend_url=...
```

**Query Parameters**:
- `code`: 授權碼 (Google 提供)
- `state`: State 參數 (Google 返回)
- `error`: 錯誤碼 (如果授權失敗)
- `error_description`: 錯誤描述

**成功回應**:
```http
HTTP/1.1 302 Found
Location: http://localhost:5173/?token=eyJhbGci...&oauth=success&provider=google
Set-Cookie: session_token=eyJhbGci...; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
Set-Cookie: oauth_state=; Max-Age=0
```

**錯誤回應 (State 不匹配)**:
```http
HTTP/1.1 302 Found
Location: http://localhost:5173/?error=csrf_detected&message=Invalid%20state
```

**錯誤回應 (Token 交換失敗)**:
```http
HTTP/1.1 302 Found
Location: http://localhost:5173/?error=oauth_failed&message=Failed%20to%20exchange%20authorization%20code
```

---

### 3. 登出

**端點**: `POST /api/logout`

**功能**: 登出並清除 session

**請求範例**:
```http
POST /api/logout HTTP/1.1
Host: coach-backend.gamepig1976.workers.dev
Cookie: session_token=eyJhbGci...
```

**成功回應**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Headers**:
```http
Set-Cookie: session_token=; Max-Age=0
Set-Cookie: oauth_state=; Max-Age=0
Set-Cookie: oauth_frontend_url=; Max-Age=0
```

---

## 資料庫結構

### users 表

```sql
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  google_id TEXT UNIQUE,
  auth_provider TEXT DEFAULT 'email',  -- 'email' 或 'google'
  verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**欄位說明**:
- `user_id`: 使用者 ID (UUID)
- `email`: Email 地址 (唯一)
- `name`: 使用者姓名
- `avatar_url`: 頭像 URL (來自 Google)
- `google_id`: Google User ID (唯一,用於 Google OAuth)
- `auth_provider`: 認證提供者 ('email' 或 'google')
- `verified`: Email 是否已驗證 (Google 登入自動驗證)
- `last_login`: 最後登入時間
- `created_at`: 帳號建立時間

**索引**:
- `PRIMARY KEY (user_id)`
- `UNIQUE (email)`
- `UNIQUE (google_id)`

**相關查詢**:
```sql
-- 用 google_id 查詢使用者
SELECT * FROM users WHERE google_id = ?

-- 用 email 查詢使用者
SELECT * FROM users WHERE email = ?

-- 連結 Google 帳號到既有使用者
UPDATE users
SET google_id = ?,
    auth_provider = 'google',
    avatar_url = ?,
    verified = TRUE,
    last_login = CURRENT_TIMESTAMP
WHERE user_id = ?

-- 建立新使用者
INSERT INTO users (
  user_id, email, name, avatar_url, google_id,
  auth_provider, verified, created_at
) VALUES (?, ?, ?, ?, ?, 'google', TRUE, CURRENT_TIMESTAMP)
```

---

## 環境變數

### 必要環境變數

#### GOOGLE_CLIENT_ID

- **用途**: Google OAuth Client ID
- **取得方式**: Google Cloud Console > APIs & Services > Credentials
- **範例**: `123456789012-abc123def456.apps.googleusercontent.com`
- **設定方式**:
  ```bash
  wrangler secret put GOOGLE_CLIENT_ID
  ```

#### GOOGLE_CLIENT_SECRET

- **用途**: Google OAuth Client Secret
- **取得方式**: Google Cloud Console > APIs & Services > Credentials
- **範例**: `GOCSPX-abc123def456ghi789`
- **安全性**: 🔴 **絕對不可洩漏或提交到版本控制**
- **設定方式**:
  ```bash
  wrangler secret put GOOGLE_CLIENT_SECRET
  ```

#### GOOGLE_REDIRECT_URI

- **用途**: OAuth 回調 URI
- **值**: `https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback`
- **重要**: 必須在 Google Cloud Console 中設定為授權重定向 URI
- **設定方式**:
  ```bash
  wrangler secret put GOOGLE_REDIRECT_URI
  ```

#### FRONTEND_URL

- **用途**: 前端應用 URL (用於 OAuth 完成後重定向)
- **開發環境**: `http://localhost:5173`
- **生產環境**: `https://coach-rocks-frontend.pages.dev`
- **設定方式**:
  ```bash
  wrangler secret put FRONTEND_URL
  ```

#### JWT_SECRET

- **用途**: JWT token 簽章密鑰
- **產生方式**:
  ```bash
  openssl rand -hex 32
  ```
- **範例**: `a1b2c3d4e5f6...` (64 字元)
- **安全性**: 🔴 **絕對不可洩漏或提交到版本控制**
- **設定方式**:
  ```bash
  wrangler secret put JWT_SECRET
  ```

---

### 選用環境變數

無選用環境變數。所有上述變數都是必要的。

---

### 環境變數檢查清單

在部署前確認以下環境變數已設定:

```bash
# 檢查 secrets
wrangler secret list

# 應該看到以下 secrets:
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - GOOGLE_REDIRECT_URI
# - FRONTEND_URL
# - JWT_SECRET
```

---

## QA 常見問題

### Q1: redirect_uri_mismatch 錯誤

**問題**: Google 回應 `redirect_uri_mismatch` 錯誤

**原因**:
- `GOOGLE_REDIRECT_URI` 環境變數值與 Google Cloud Console 設定不一致
- `GOOGLE_REDIRECT_URI` 包含多餘的空格或換行字元
- Google Cloud Console 未新增授權重定向 URI

**解決方案**:
1. 檢查 `GOOGLE_REDIRECT_URI` 環境變數:
   ```bash
   wrangler secret list
   ```
2. 檢查 Google Cloud Console:
   - 前往 [Google Cloud Console](https://console.cloud.google.com)
   - 選擇專案
   - APIs & Services > Credentials
   - 點選 OAuth 2.0 Client ID
   - 確認「授權重定向 URI」包含: `https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback`
3. 重新設定環境變數 (確保無多餘字元):
   ```bash
   wrangler secret put GOOGLE_REDIRECT_URI
   # 輸入: https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback
   ```

---

### Q2: CSRF detected (State 不匹配)

**問題**: 回調時顯示 "Invalid state" 錯誤

**原因**:
- Cookie 被阻擋 (瀏覽器隱私設定)
- State cookie 過期 (超過 10 分鐘)
- 跨域 cookie 問題

**解決方案**:
1. 檢查瀏覽器 Cookie 設定:
   - 開啟 DevTools > Application > Cookies
   - 確認 `oauth_state` cookie 存在
2. 檢查 Cookie 屬性:
   - 本地開發: `SameSite=Lax`, **不設定** `Secure`
   - 生產環境: `SameSite=Lax`, `Secure`
3. 檢查 OAuth 流程時間:
   - 確保從點選「使用 Google 登入」到授權完成不超過 10 分鐘
4. 清除瀏覽器 Cookie 後重試

---

### Q3: 本地開發時重定向到生產環境

**問題**: 本地開發時 OAuth 完成後重定向到生產環境 URL

**原因**:
- `FRONTEND_URL` 環境變數設定為生產環境 URL
- `getFrontendUrl()` 邏輯未正確偵測本地環境

**解決方案**:
1. 檢查請求來源:
   - 確認前端運行在 `http://localhost:5173`
   - 確認後端運行在 `http://localhost:8788`
2. 檢查 `getFrontendUrl()` 日誌:
   - 開啟後端控制台
   - 查看 "✅ Request is from localhost" 訊息
3. 臨時解決方案:
   - 在本地開發時設定 `FRONTEND_URL=http://localhost:5173`
   - 或修改程式碼強制使用 localhost

**相關程式碼**: `authGoogleInit.ts:36-124`

---

### Q4: 使用者無法連結 Google 帳號

**問題**: 既有使用者想連結 Google 帳號但失敗

**原因**:
- Email 不一致 (既有帳號 email 與 Google email 不同)
- 資料庫約束衝突

**解決方案**:
1. 檢查使用者 email:
   ```sql
   SELECT email FROM users WHERE user_id = ?
   ```
2. 確認 Google email 與既有帳號 email 一致
3. 如果不一致,需要手動更新或使用新帳號
4. 確認 `google_id` 欄位未被其他使用者使用

**相關程式碼**: `authGoogle.ts:149-230` (`getOrCreateGoogleUser`)

---

### Q5: Session token 無效或過期

**問題**: 登入後 session token 立即失效

**原因**:
- `JWT_SECRET` 未設定或設定錯誤
- JWT 簽章驗證失敗
- Token 已過期

**解決方案**:
1. 檢查 `JWT_SECRET` 環境變數:
   ```bash
   wrangler secret list
   ```
2. 確認 `JWT_SECRET` 在開發和生產環境一致 (如果需要跨環境登入)
3. 檢查 token 有效期:
   - 預設: 7 天 (604800 秒)
   - 可在 `createUserSession()` 中調整
4. 清除瀏覽器 Cookie 後重新登入

**相關程式碼**: `auth.ts:~30` (`createUserSession`)

---

## Debug 說明

### 開啟 Debug 日誌

所有 OAuth 相關操作都有詳細的日誌輸出。

**本地開發**:
```bash
cd backend
npm run dev
# 或
wrangler dev
```

**檢視日誌**:
- 開啟終端機查看 `console.log` 輸出
- 使用 `wrangler tail` 查看即時日誌:
  ```bash
  wrangler tail
  ```

---

### 關鍵日誌檢查點

#### 1. OAuth 初始化

查看以下日誌:
```
Google OAuth initialization called
🔍 Google OAuth Configuration Check:
  - GOOGLE_CLIENT_ID: 123456...
  - GOOGLE_REDIRECT_URI: https://...
  - Redirect URI length: 64
Generated OAuth state: abc123...
🔍 Google OAuth URL Details:
  - Full OAuth URL: https://accounts.google.com/...
  - Redirect URI sent to Google: https://...
Frontend URL to redirect back to: http://localhost:5173
```

**檢查項目**:
- ✅ `GOOGLE_CLIENT_ID` 和 `GOOGLE_REDIRECT_URI` 都有值
- ✅ `Redirect URI` 長度正確 (不含空格或換行)
- ✅ `Frontend URL` 正確

---

#### 2. OAuth 回調

查看以下日誌:
```
Google OAuth callback called
🔍 Google Token Exchange Configuration:
  - Redirect URI used in token exchange: https://...
  - Expected redirect URI: https://...
  - Redirect URI matches expected: true
```

**檢查項目**:
- ✅ `code` 和 `state` 參數都存在
- ✅ State 驗證通過
- ✅ Token 交換成功
- ✅ 使用者資料取得成功
- ✅ 使用者建立/更新成功

---

### 常見錯誤日誌

#### 錯誤 1: OAuth not configured

```
❌ GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI not configured
```

**處理**: 設定環境變數

---

#### 錯誤 2: Google token exchange failed

```
❌ Google token exchange failed: 400 {
  "error": "invalid_grant",
  "error_description": "Malformed auth code."
}
```

**處理**:
- 檢查 `code` 是否有效
- 確認 `code` 未被重複使用

---

#### 錯誤 3: State mismatch

```
❌ State mismatch: expected abc123... but got xyz789...
```

**處理**:
- 檢查 Cookie 設定
- 確認未跨域問題

---

### Debug 工具

#### 1. 瀏覽器 DevTools

**Network 標籤**:
- 查看 `/api/auth/google/init` 請求
- 查看重定向到 Google 的請求
- 查看 `/api/auth/google/callback` 請求
- 檢查 Response Headers 中的 `Set-Cookie`

**Application 標籤**:
- 檢查 Cookies:
  - `oauth_state`
  - `oauth_frontend_url`
  - `session_token`
- 確認 Cookie 屬性 (HttpOnly, Secure, SameSite)

**Console 標籤**:
- 查看前端錯誤訊息
- 檢查 token 是否正確儲存

---

#### 2. Wrangler CLI

```bash
# 檢查環境變數
wrangler secret list

# 查看即時日誌
wrangler tail

# 測試 OAuth 端點
curl -I http://localhost:8788/api/auth/google/init
```

---

#### 3. Postman/Insomnia

測試 OAuth 流程:

**Step 1: 初始化**
```http
GET http://localhost:8788/api/auth/google/init
```

**檢查**:
- 回應狀態: `302 Found`
- `Location` header 包含 Google OAuth URL
- `Set-Cookie` headers 包含 `oauth_state` 和 `oauth_frontend_url`

**Step 2: 模擬回調** (需要手動取得 code)
```http
GET http://localhost:8788/api/auth/google/callback?code=4/0AY...&state=abc123...
Cookie: oauth_state=...; oauth_frontend_url=...
```

**檢查**:
- 回應狀態: `302 Found`
- `Location` header 重定向到前端並帶 token
- `Set-Cookie` headers 包含 `session_token`

---

## 測試範例

### 單元測試 (建議)

**檔案**: `backend/tests/auth/google.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { getFrontendUrl } from '../../src/endpoints/authGoogleInit'

describe('getFrontendUrl', () => {
  it('should return localhost URL when request is from localhost', () => {
    const mockContext = {
      req: {
        url: 'http://localhost:8788/api/auth/google/init',
        header: (name: string) => {
          if (name === 'Referer') return 'http://localhost:5173'
          return null
        }
      },
      env: {
        FRONTEND_URL: 'https://coach-rocks-frontend.pages.dev'
      }
    }

    const result = getFrontendUrl(mockContext as any)
    expect(result).toBe('http://localhost:5173')
  })

  it('should return production URL when request is from production', () => {
    const mockContext = {
      req: {
        url: 'https://coach-backend.gamepig1976.workers.dev/api/auth/google/init',
        header: (name: string) => null
      },
      env: {
        FRONTEND_URL: 'https://coach-rocks-frontend.pages.dev'
      }
    }

    const result = getFrontendUrl(mockContext as any)
    expect(result).toBe('https://coach-rocks-frontend.pages.dev')
  })
})
```

---

### 整合測試

**檔案**: `backend/tests/integration/oauth.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { unstable_dev } from 'wrangler'

describe('Google OAuth Integration', () => {
  let worker: any

  beforeEach(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true }
    })
  })

  it('should redirect to Google OAuth page on /init', async () => {
    const response = await worker.fetch('/api/auth/google/init', {
      method: 'GET',
      redirect: 'manual'
    })

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('accounts.google.com')
    expect(response.headers.get('set-cookie')).toContain('oauth_state')
  })

  // 更多測試...
})
```

---

### 手動測試流程

#### 本地開發環境測試

**前置條件**:
- 後端運行: `cd backend && npm run dev`
- 前端運行: `cd frontend && npm run dev`
- 環境變數已設定

**測試步驟**:

1. **開啟前端**:
   ```
   http://localhost:5173
   ```

2. **點選「使用 Google 登入」**:
   - 應重定向到 `http://localhost:8788/api/auth/google/init`
   - 再重定向到 Google OAuth 頁面

3. **選擇 Google 帳號並授權**:
   - Google 會詢問授權權限
   - 授權後重定向到 `/api/auth/google/callback`

4. **驗證登入成功**:
   - 應重定向回 `http://localhost:5173/?token=...&oauth=success&provider=google`
   - 前端應顯示已登入狀態
   - 檢查瀏覽器 DevTools > Application > Cookies:
     - 應有 `session_token` cookie

5. **測試登出**:
   - 點選「登出」按鈕
   - 應清除 `session_token` cookie
   - 應回到未登入狀態

---

#### 生產環境測試

**前置條件**:
- 後端已部署到 Cloudflare Workers
- 前端已部署到 Cloudflare Pages
- 生產環境環境變數已設定
- Google Cloud Console 已設定生產環境 OAuth Client

**測試步驟**:

1. **開啟生產環境前端**:
   ```
   https://coach-rocks-frontend.pages.dev
   ```

2. **執行與本地開發相同的測試步驟**

3. **額外檢查**:
   - 確認 HTTPS 連線
   - 確認 Cookies 有 `Secure` flag
   - 確認跨域請求正常 (CORS)

---

## 相關文件

- [Gmail 郵件服務](./02_gmail_service.md)
- [會議分析服務](./03_meeting_analysis.md)
- [Cloudflare 部署](./10_cloudflare_deployment.md)
- [OWASP 檢查清單](../security/OWASP_CHECKLIST.md)
- [Google OAuth 綜合教學](../documents/google_oauth_comprehensive_guide.md)

---

**文件版本**: 1.0
**建立日期**: 2025-11-18
**最後更新**: 2025-11-18
