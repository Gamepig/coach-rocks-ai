# CoachRocks AI - 專案所有權轉移指南

**目標**: 從 `gamepig1976@gmail.com` (Gamepig) 轉移至 `katherine84522@gmail.com` (Katherine)
**文件版本**: 1.0
**最後更新**: 2025-11-19

---

## 📋 快速導覽

- [轉移映射表](#%EF%B8%8F-轉移值映射表) - 所有需要更新的值
- [自動化腳本](#-自動化腳本清單) - AI 執行指令
- [手動步驟](#-手動操作清單) - 必須手工完成的項目
- [驗證檢查](#-驗證檢查清單) - 部署前確認
- [域名轉移計劃](#-第-6-階段域名轉移) - coachrocks.com 正式上線
- [回滾計劃](#-回滾計劃) - 應急措施

---

## 🗂️ 轉移值映射表

### Cloudflare Workers (後端)

| 項目 | 舊值 | 新值 | 類型 | 位置 |
|------|------|------|------|------|
| 後端 Worker 帳戶 | `gamepig1976` | `katherine84522` | Cloudflare 帳戶 | Dashboard |
| Account ID | `9288c023577aa2f6ce20582b6c4bdda0` | `[待獲取]` | UUID | `backend/wrangler.jsonc:11` |
| D1 Database ID | `d15ec66a-762c-40a2-bc8e-d64a1c8eb440` | `[待遷移]` | UUID | `backend/wrangler.jsonc:19` |
| 後端 URL | `https://coach-backend.gamepig1976.workers.dev` | `https://coach-backend.katherine84522.workers.dev` | 域名 | 23+ 檔案 |
| Worker 名稱 | `coach-backend` | `coach-backend` | 字串 | `backend/wrangler.jsonc:7` |

### Cloudflare Pages (前端)

| 項目 | 舊值 | 新值 | 類型 | 位置 |
|------|------|------|------|------|
| 前端帳戶 | `gamepig1976` | `katherine84522` | Cloudflare 帳戶 | Dashboard |
| Pages 專案名稱 | `coach-rocks-frontend` | `coach-rocks-frontend` | 字串 | `frontend/wrangler.toml:6` |
| Pages URL | `https://coach-rocks-frontend.pages.dev` | `https://coach-rocks-frontend.pages.dev` | 域名 | 保持不變 |

### Google OAuth (第三方服務)

| 項目 | 舊值 | 新值 | 類型 | 位置 |
|------|------|------|------|------|
| Redirect URI | `https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback` | `https://coach-backend.katherine84522.workers.dev/api/auth/google/callback` | URL | Google Console |
| OAuth Client ID | `680063720169-mqh939kph7tjn18bvjsojucruts04omj.apps.googleusercontent.com` | `[待建立]` | 字串 | Google Console |
| OAuth Client Secret | `[敏感信息已屏蔽]` | `[待建立]` | 字串 | Google Console |

### Git 設置

| 項目 | 舊值 | 新值 | 類型 | 位置 |
|------|------|------|------|------|
| Git 用戶郵箱 | `gamepig1976@gmail.com` | `katherine84522@gmail.com` | 郵箱 | `.git/config` |
| 腳本預設郵箱 | `gamepig1976@gmail.com` | `katherine84522@gmail.com` | 郵箱 | 多個腳本 |

### 域名轉移（Phase 6 - 正式上線）

| 項目 | 過渡階段 | 生產階段 | 類型 | 位置 | 說明 |
|------|---------|---------|------|------|------|
| **後端域名** | `coach-backend.katherine84522.workers.dev` | `api.coachrocks.com` | 域名 | 多個 | Workers 自訂域名 |
| **前端域名** | `coach-rocks-frontend.pages.dev` | `coachrocks.com` | 域名 | 多個 | Pages 自訂域名 |
| **Google OAuth Redirect** | `https://coach-backend.katherine84522.workers.dev/api/auth/google/callback` | `https://api.coachrocks.com/api/auth/google/callback` | URL | Google Console | OAuth 重定向 URI |
| **CORS 允許來源** | `https://coach-rocks-frontend.pages.dev` | `https://coachrocks.com` | URL | 後端代碼 | 跨域資源共享 |
| **郵件回覆域名** | `noreply@coachrocks.com` | `noreply@coachrocks.com` | 域名 | 郵件設置 | 不變 |
| **DNS A 記錄** | 無 | `coachrocks.com` 指向 CF | 記錄 | Cloudflare | 域名 DNS 配置 |
| **DNS CNAME 記錄** | 無 | `api.coachrocks.com` → Workers | 記錄 | Cloudflare | API 子域配置 |

---

## 🤖 自動化腳本清單

所有自動化操作都可由 AI 執行。使用下列 JSON 格式傳遞指令。

### JSON 指令格式

```json
{
  "operation": "operation_name",
  "description": "操作描述",
  "parameters": {
    "old_value": "舊值",
    "new_value": "新值",
    "file_pattern": "檔案模式"
  },
  "automation_type": "script|manual|hybrid",
  "priority": "P0|P1|P2"
}
```

### 自動化操作列表

#### 1️⃣ 批量更新後端 URL

**操作 ID**: `AUTO_001`

```json
{
  "operation": "batch_replace_backend_url",
  "description": "將所有檔案中的 gamepig1976 後端 URL 替換為 katherine84522",
  "automation_type": "script",
  "priority": "P0",
  "parameters": {
    "old_value": "https://coach-backend.gamepig1976.workers.dev",
    "new_value": "https://coach-backend.katherine84522.workers.dev",
    "exclude_files": [
      "technical_docs/**",
      "*.md",
      "backend/insert_test_data_for_current_user.sql",
      ".git/**"
    ],
    "include_files": [
      "backend/wrangler.jsonc",
      "backend/.dev.vars",
      "frontend/.env.production",
      "frontend/src/**/*.{js,jsx,ts,tsx}",
      "scripts/**/*.sh",
      "backend/src/**/*.ts"
    ]
  },
  "bash_command": "find . -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.jsx' -o -name '*.js' -o -name '*.jsonc' -o -name '.dev.vars' -o -name '.env.*' -o -name '*.sh' \\) ! -path '*./.git/*' ! -path '*/node_modules/*' ! -path '*/.wrangler/*' -exec sed -i '' 's|https://coach-backend\\.gamepig1976\\.workers\\.dev|https://coach-backend.katherine84522.workers.dev|g' {} +",
  "verification_command": "grep -r 'coach-backend.gamepig1976' --include='*.ts' --include='*.js' --include='*.jsonc' --include='.dev.vars' --include='.env.*' . 2>/dev/null | wc -l"
}
```

**執行指令**:
```bash
# macOS/Linux
find . -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.jsx' -o -name '*.js' -o -name '*.jsonc' -o -name '.dev.vars' -o -name '.env.*' -o -name '*.sh' \) ! -path '*./.git/*' ! -path '*/node_modules/*' ! -path '*/.wrangler/*' -exec sed -i '' 's|https://coach-backend\.gamepig1976\.workers\.dev|https://coach-backend.katherine84522.workers.dev|g' {} +

# 驗證
grep -r 'coach-backend.gamepig1976' --include='*.ts' --include='*.js' --include='*.jsonc' --include='.dev.vars' --include='.env.*' . 2>/dev/null || echo "✅ 全部已更新"
```

---

#### 2️⃣ 更新 Git 設置

**操作 ID**: `AUTO_002`

```json
{
  "operation": "update_git_user_email",
  "description": "更新 Git 本地配置的用戶郵箱",
  "automation_type": "script",
  "priority": "P0",
  "parameters": {
    "old_email": "gamepig1976@gmail.com",
    "new_email": "katherine84522@gmail.com",
    "scope": "local"
  },
  "bash_command": "git config user.email 'katherine84522@gmail.com'",
  "verification_command": "git config user.email"
}
```

**執行指令**:
```bash
# 設置 Git 用戶郵箱
git config user.email 'katherine84522@gmail.com'

# 驗證
git config user.email
# 預期輸出: katherine84522@gmail.com
```

---

#### 3️⃣ 更新 Wrangler 配置

**操作 ID**: `AUTO_003`

```json
{
  "operation": "update_wrangler_config",
  "description": "更新 backend/wrangler.jsonc 中的 account_id（需手動獲取新 ID）",
  "automation_type": "hybrid",
  "priority": "P0",
  "parameters": {
    "file": "backend/wrangler.jsonc",
    "old_account_id": "9288c023577aa2f6ce20582b6c4bdda0",
    "new_account_id": "[MANUAL_INPUT]",
    "note": "新 account_id 需從 Katherine 的 Cloudflare Dashboard 複製"
  }
}
```

**手動步驟**:
1. Katherine 登入 Cloudflare Dashboard
2. 複製右上角的 Account ID
3. 告訴 AI 新的 Account ID
4. AI 執行以下更新:

```bash
# 假設新 Account ID 為 abc123...
sed -i '' 's/"account_id": "9288c023577aa2f6ce20582b6c4bdda0"/"account_id": "abc123..."/g' backend/wrangler.jsonc

# 驗證
grep "account_id" backend/wrangler.jsonc
```

---

#### 4️⃣ 更新腳本中的郵箱

**操作 ID**: `AUTO_004`

```json
{
  "operation": "update_script_emails",
  "description": "更新 shell 腳本中的預設郵箱",
  "automation_type": "script",
  "priority": "P1",
  "parameters": {
    "old_email": "gamepig1976@gmail.com",
    "new_email": "katherine84522@gmail.com",
    "file_pattern": "scripts/**/*.sh"
  },
  "bash_command": "find scripts -name '*.sh' -exec sed -i '' 's/gamepig1976@gmail\\.com/katherine84522@gmail.com/g' {} +",
  "verification_command": "grep -r 'gamepig1976@gmail.com' scripts/ 2>/dev/null || echo '✅ 已全部更新'"
}
```

**執行指令**:
```bash
# 更新所有 shell 腳本
find scripts -name '*.sh' -exec sed -i '' 's/gamepig1976@gmail\.com/katherine84522@gmail.com/g' {} +

# 驗證
grep -r 'gamepig1976@gmail.com' scripts/ 2>/dev/null || echo "✅ 已全部更新"
```

---

#### 5️⃣ 檢查是否有遺漏

**操作 ID**: `AUTO_005`

```json
{
  "operation": "verify_all_replacements",
  "description": "檢查是否有遺漏的舊值",
  "automation_type": "script",
  "priority": "P0",
  "parameters": {
    "search_patterns": [
      "gamepig1976",
      "coach-backend.gamepig1976.workers.dev",
      "9288c023577aa2f6ce20582b6c4bdda0",
      "d15ec66a-762c-40a2-bc8e-d64a1c8eb440"
    ]
  },
  "bash_command": "echo '=== 檢查 gamepig1976 ==='; grep -r 'gamepig1976' --include='*.ts' --include='*.js' --include='*.jsonc' --include='.dev.vars' . 2>/dev/null | grep -v '.git' | head -20 || echo '✅ 未找到'; echo ''; echo '=== 檢查舊 Account ID ==='; grep -r '9288c023577aa2f6ce20582b6c4bdda0' . 2>/dev/null | grep -v '.git' | head -20 || echo '✅ 未找到'",
  "expected_result": "只在 technical_docs 和備註中出現"
}
```

**執行指令**:
```bash
# 檢查是否有遺漏（排除文檔和 Git）
echo "=== 檢查遺漏的 gamepig1976 ==="
grep -r 'gamepig1976' \
  --include='*.ts' \
  --include='*.js' \
  --include='*.jsonc' \
  --include='.dev.vars' \
  --include='.env.*' \
  --include='*.sh' \
  --exclude-dir='.git' \
  --exclude-dir='node_modules' \
  --exclude-dir='.wrangler' \
  . 2>/dev/null || echo "✅ 未找到遺漏項目"

echo ""
echo "=== 檢查遺漏的舊 Account ID ==="
grep -r '9288c023577aa2f6ce20582b6c4bdda0' \
  --include='*.ts' \
  --include='*.js' \
  --include='*.jsonc' \
  --exclude-dir='.git' \
  . 2>/dev/null || echo "✅ 未找到遺漏項目"
```

---

## 🔧 手動操作清單

### Phase 1: Cloudflare 設置（必須由 Katherine 完成）

#### Step 1️⃣: 獲取新的 Cloudflare Account ID

**時機**: 轉移開始前

```json
{
  "operation": "get_cloudflare_account_id",
  "description": "Katherine 從 Cloudflare Dashboard 獲取新的 Account ID",
  "automation_type": "manual",
  "priority": "P0",
  "steps": [
    "1. Katherine 登入 https://dash.cloudflare.com",
    "2. 在右上角帳戶菜單中找到 'Account Settings'",
    "3. 在 'Account' 標籤中複製 'Account ID'（例如: abc123def456...）",
    "4. 提供給 AI，用於更新 wrangler.jsonc"
  ],
  "expected_output": "32 位十六進制 ID"
}
```

---

#### Step 2️⃣: 建立 Cloudflare Workers（後端）

**時機**: Phase 1 完成後

```json
{
  "operation": "setup_cloudflare_workers",
  "description": "在 Katherine 的 Cloudflare 帳戶建立新的 Workers",
  "automation_type": "manual",
  "priority": "P0",
  "steps": [
    "1. Katherine 登入 https://dash.cloudflare.com",
    "2. 選擇 'Workers & Pages' > 'Overview'",
    "3. 建立新 Worker，命名為 'coach-backend'",
    "4. 使用 wrangler 部署：",
    "   cd backend",
    "   npm install",
    "   wrangler deploy",
    "5. 驗證部署：curl https://coach-backend.katherine84522.workers.dev/api/health"
  ],
  "expected_result": "Worker 部署成功，健康檢查返回 200"
}
```

**對應 AI 命令**:
```bash
# 步驟 4: 部署 Worker
cd backend
wrangler deploy
# 預期輸出: Successfully deployed...
# 預期 URL: https://coach-backend.katherine84522.workers.dev

# 驗證部署
curl https://coach-backend.katherine84522.workers.dev/api/health
```

---

#### Step 3️⃣: 建立 Cloudflare Pages（前端）

**時機**: Phase 1 完成後

```json
{
  "operation": "setup_cloudflare_pages",
  "description": "在 Katherine 的 Cloudflare 帳戶建立新的 Pages",
  "automation_type": "manual",
  "priority": "P0",
  "steps": [
    "1. Katherine 登入 https://dash.cloudflare.com",
    "2. 選擇 'Workers & Pages' > 'Pages'",
    "3. 建立新 Pages 專案，命名為 'coach-rocks-frontend'",
    "4. 使用 wrangler 部署：",
    "   cd frontend",
    "   npm install",
    "   npm run build",
    "   wrangler pages deploy dist --project-name=coach-rocks-frontend",
    "5. 驗證部署：訪問 https://coach-rocks-frontend.pages.dev"
  ],
  "expected_result": "Pages 部署成功，可訪問應用"
}
```

**對應 AI 命令**:
```bash
# 步驟 4: 構建並部署前端
cd frontend
npm install
npm run build
wrangler pages deploy dist --project-name=coach-rocks-frontend
# 預期 URL: https://coach-rocks-frontend.pages.dev
```

---

#### Step 4️⃣: 遷移 D1 資料庫

**時機**: Phase 2 開始

```json
{
  "operation": "migrate_d1_database",
  "description": "將 D1 資料庫遷移至 Katherine 的帳戶",
  "automation_type": "hybrid",
  "priority": "P0",
  "steps": [
    "選項 A（推薦）: 使用 Cloudflare Backup & Restore",
    "  1. 登入 Gamepig 的 Cloudflare Dashboard",
    "  2. 導出 D1 資料庫備份",
    "  3. Katherine 登入她的 Cloudflare Dashboard",
    "  4. 建立新 D1 資料庫：coachdb",
    "  5. 導入備份",
    "",
    "選項 B: 使用 SQL 匯出/匯入",
    "  1. AI 執行：wrangler d1 export DB backup.sql",
    "  2. Katherine 執行：wrangler d1 import coachdb backup.sql",
    "",
    "預期結果: 新資料庫獲得新的 database_id（UUID）"
  ],
  "manual_steps": 3,
  "ai_can_help": "執行 export/import 命令（如果有權限）"
}
```

---

### Phase 2: Google OAuth 更新

#### Step 5️⃣: 建立新的 Google OAuth Credentials

**時機**: 後端 Worker 部署後

```json
{
  "operation": "create_google_oauth_credentials",
  "description": "為新的後端 URL 建立 Google OAuth 認證",
  "automation_type": "manual",
  "priority": "P0",
  "steps": [
    "1. 前往 https://console.cloud.google.com/",
    "2. 選擇或建立專案（或使用現有 coach-rocks 專案）",
    "3. 在 'Credentials' 建立新的 OAuth 2.0 Client ID",
    "4. 應用類型選擇 'Web application'",
    "5. 在 'Authorized redirect URIs' 新增：",
    "   https://coach-backend.katherine84522.workers.dev/api/auth/google/callback",
    "6. 獲取：",
    "   - Client ID",
    "   - Client Secret",
    "7. 提供給 AI，用於更新環境變數"
  ],
  "expected_output": "New Client ID and Secret"
}
```

---

#### Step 6️⃣: 更新 Google OAuth 環境變數

**操作 ID**: `AUTO_006`

```json
{
  "operation": "update_google_oauth_env",
  "description": "更新 Wrangler Secrets 中的 Google OAuth 憑證",
  "automation_type": "hybrid",
  "priority": "P0",
  "parameters": {
    "secrets_to_update": [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_REDIRECT_URI"
    ],
    "google_redirect_uri": "https://coach-backend.katherine84522.workers.dev/api/auth/google/callback"
  },
  "bash_command": "cd backend && wrangler secret put GOOGLE_CLIENT_ID && wrangler secret put GOOGLE_CLIENT_SECRET && wrangler secret put GOOGLE_REDIRECT_URI",
  "note": "AI 將逐一提示輸入各個值"
}
```

**執行指令**:
```bash
# 設置 Google OAuth 秘密（AI 會逐一提示輸入）
cd backend

# 設置新的 Client ID
wrangler secret put GOOGLE_CLIENT_ID
# 輸入: [Katherine 的新 Client ID]

# 設置新的 Client Secret
wrangler secret put GOOGLE_CLIENT_SECRET
# 輸入: [Katherine 的新 Client Secret]

# 設置新的 Redirect URI
wrangler secret put GOOGLE_REDIRECT_URI
# 輸入: https://coach-backend.katherine84522.workers.dev/api/auth/google/callback

# 驗證
wrangler secret list
```

---

### Phase 3: 其他 Secrets 和環境變數

#### Step 7️⃣: 更新其他必要的 Secrets

**操作 ID**: `AUTO_007`

```json
{
  "operation": "update_other_secrets",
  "description": "更新其他必要的 Wrangler Secrets",
  "automation_type": "hybrid",
  "priority": "P1",
  "secrets_to_copy": [
    {
      "name": "OPENAI_API_KEY",
      "source": "gamepig1976 的 .dev.vars",
      "action": "複製相同值"
    },
    {
      "name": "PERPLEXITY_API_KEY",
      "source": "gamepig1976 的 .dev.vars",
      "action": "複製相同值"
    },
    {
      "name": "SERPER_API_KEY",
      "source": "gamepig1976 的 .dev.vars",
      "action": "複製相同值"
    },
    {
      "name": "JWT_SECRET",
      "source": "gamepig1976 的 .dev.vars",
      "action": "複製相同值"
    },
    {
      "name": "RESEND_API_KEY",
      "source": "gamepig1976 的 .dev.vars",
      "action": "複製相同值"
    },
    {
      "name": "FROM_EMAIL",
      "value": "noreply@coachrocks.com",
      "action": "保持不變"
    },
    {
      "name": "APP_NAME",
      "value": "CoachRocks AI",
      "action": "保持不變"
    },
    {
      "name": "BACKEND_URL",
      "value": "https://coach-backend.katherine84522.workers.dev",
      "action": "更新為新 URL"
    },
    {
      "name": "FRONTEND_URL",
      "value": "https://coach-rocks-frontend.pages.dev",
      "action": "保持不變"
    }
  ],
  "bash_command": "cd backend && wrangler secret list && echo '請逐一檢查上述 Secrets，確保都已設置'"
}
```

**執行指令**:
```bash
# 檢查已設置的 Secrets
cd backend
wrangler secret list

# AI 將根據結果添加缺失的 Secrets
# 每個 secret 執行：wrangler secret put <NAME>
```

#### Step 8️⃣: RESEND 郵件服務設定

**操作 ID**: `AUTO_008`

**背景**: RESEND 是本專案的郵件發送服務，用於發送用戶通知、認證郵件等。需要在轉移時確保郵件服務正常運作。

**RESEND 配置概述**:
- **API Key**: 從舊帳戶複製到新帳戶
- **發送者設定**: `noreply@coachrocks.com` (需要域名驗證)
- **環境模式**:
  - 開發環境：使用 RESEND 測試域名 `onboarding@resend.dev`
  - 生產環境：使用驗證的 `noreply@coachrocks.com`

**詳細設定步驟**:

##### 1️⃣ Cloudflare Workers Secret 設置

```bash
# 方法 A: 交互式設置（推薦）
cd backend
wrangler secret put RESEND_API_KEY
# 粘貼舊帳戶的 API Key（見 backend/.dev.vars 中的 RESEND_API_KEY）
# 按 Enter 完成

# 驗證設置
wrangler secret list | grep RESEND
```

##### 2️⃣ RESEND API Key 取得方法

如果需要新的 API Key：

```
1. 登入 https://resend.com
2. 前往 "API Keys" 頁面
3. 點擊 "Create API Key"
4. 選擇帳戶和權限範圍
5. 複製生成的密鑰
6. 保存到安全位置
```

##### 3️⃣ 不同環境的 RESEND 設定

**開發環境** (`FRONTEND_URL=http://localhost:5173`):
```
- 自動使用 RESEND 測試域名：onboarding@resend.dev
- 不需要域名驗證
- 適合本地開發和測試
- 郵件直接發送到指定收件人
```

**生產環境** (`FRONTEND_URL=https://coach-rocks-frontend.pages.dev`):
```
- 使用驗證的域名：noreply@coachrocks.com
- 需要完成 RESEND 域名驗證（見下方）
- 推薦配置 SPF/DKIM 記錄以提升郵件可靠性
```

##### 4️⃣ RESEND 域名驗證（生產環境需要）

```
時機：在 Phase 6 執行（域名上線後）

步驟:
1. 登入 https://resend.com Dashboard
2. 前往 "Domains" 或 "From Addresses"
3. 點擊 "Add Domain"
4. 輸入 "coachrocks.com"
5. RESEND 將提供 DNS 記錄：
   - CNAME 記錄（MX 驗證）
   - TXT 記錄（DKIM/SPF）
6. 複製這些記錄到 Cloudflare DNS：
   - 進入 Cloudflare Dashboard → coachrocks.com → DNS
   - 添加記錄，等待驗證（通常 5-30 分鐘）
7. 驗證完成後，即可使用 noreply@coachrocks.com 發送郵件
```

##### 5️⃣ RESEND 郵件測試

```bash
# 方法 1: 使用項目內的測試腳本
cd backend
node test-resend-email.js your-email@example.com

# 方法 2: 測試開發環境
curl -X POST https://coach-backend.katherine84522.workers.dev/api/email-test \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com","subject":"Test","html":"<p>Test</p>"}'

# 預期結果：
# ✅ 郵件應在 5 秒內送達
# ✅ 來自地址應為 onboarding@resend.dev（開發）或 noreply@coachrocks.com（生產）
```

**執行指令**:
```bash
# 1️⃣ 設置 RESEND_API_KEY
cd backend
wrangler secret put RESEND_API_KEY

# 2️⃣ 驗證設置
wrangler secret list

# 3️⃣ 測試郵件發送
node test-resend-email.js test@example.com

# 4️⃣ 檢查環境變數配置
grep -E "FROM_EMAIL|APP_NAME" backend/.dev.vars
```

---

## 🌐 第 6 階段：域名轉移至 coachrocks.com

**時機**: Phase 5 驗證完全通過，應用穩定運行後執行
**預期結果**: 用戶通過 coachrocks.com 訪問應用，舊的 workers.dev 域名重定向到新域名

### 域名轉移架構

```
用戶訪問
  ├─ coachrocks.com              → coach-rocks-frontend (Pages)
  ├─ api.coachrocks.com          → coach-backend (Workers)
  ├─ *.coachrocks.com (重定向)   → coachrocks.com
  └─ coach-backend.katherine84522.workers.dev (重定向) → api.coachrocks.com
```

### 手動步驟 1: 購買並驗證域名

**操作 ID**: `MANUAL_DOMAIN_001`

**詳細教學步驟**:

1. **購買域名**
   ```
   選項 A: 通過 Cloudflare Registrar（推薦）
   - 登入 https://dash.cloudflare.com
   - 選擇 "Domain Registration"
   - 搜尋 "coachrocks.com"
   - 檢查可用性並購買（通常 $10-15/年）
   - 自動配置 Cloudflare Nameservers

   選項 B: 通過其他註冊商（GoDaddy、Namecheap 等）
   - 購買 coachrocks.com 域名
   - 進入域名設置，更新 Nameservers 為 Cloudflare：
     • ns1.cloudflare.com
     • ns2.cloudflare.com
   - 在 Cloudflare 中添加域名
   ```

2. **在 Cloudflare 添加域名**
   ```
   步驟:
   1. 登入 https://dash.cloudflare.com
   2. 點擊 "Add a Site"
   3. 輸入 "coachrocks.com"
   4. 選擇免費方案（Free）
   5. 核實名稱伺服器指向 Cloudflare
   6. 等待域名驗證（通常 5-30 分鐘）
   7. 驗證狀態：Dashboard 應顯示 "Active Nameserver"
   ```

3. **驗證域名所有權**
   ```
   在 Cloudflare Dashboard：
   - 域名狀態應為 "Active"
   - Nameservers 應為 Cloudflare 的 NS 記錄
   - DNS 記錄標籤頁應可編輯
   ```

---

### 自動化操作 1: 批量更新域名

**操作 ID**: `AUTO_009`

```json
{
  "operation": "batch_replace_domain_names",
  "description": "將所有 katherine84522.workers.dev 和 pages.dev 替換為 coachrocks.com",
  "priority": "P0",
  "parameters": {
    "replacements": [
      {
        "old": "coach-backend.katherine84522.workers.dev",
        "new": "api.coachrocks.com",
        "files": "代碼、配置、腳本"
      },
      {
        "old": "coach-rocks-frontend.pages.dev",
        "new": "coachrocks.com",
        "files": "代碼、配置、環境變數"
      }
    ]
  }
}
```

**執行指令**:
```bash
# 1️⃣ 替換後端域名
find . -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.jsx' -o -name '*.js' -o -name '*.jsonc' -o -name '.dev.vars' -o -name '.env.*' -o -name '*.sh' \) ! -path '*./.git/*' ! -path '*/node_modules/*' ! -path '*/.wrangler/*' -exec sed -i '' 's|coach-backend\.katherine84522\.workers\.dev|api.coachrocks.com|g' {} +

# 2️⃣ 替換前端域名
find . -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.jsx' -o -name '*.js' -o -name '*.jsonc' -o -name '.env.*' -o -name '*.sh' \) ! -path '*./.git/*' ! -path '*/node_modules/*' ! -path '*/.wrangler/*' -exec sed -i '' 's|coach-rocks-frontend\.pages\.dev|coachrocks.com|g' {} +

# 3️⃣ 更新 CORS 允許來源
find . -type f -name '*.ts' ! -path '*/node_modules/*' -exec sed -i '' "s|'https://coach-rocks-frontend.pages.dev'|'https://coachrocks.com'|g" {} +

# 4️⃣ 驗證替換成功
echo "=== 檢查後端域名 ===" && grep -r 'coach-backend.katherine84522.workers.dev' --include='*.ts' --include='*.js' . --exclude-dir='.git' --exclude-dir='node_modules' 2>/dev/null || echo "✅ 已全部更新"
echo "" && echo "=== 檢查前端域名 ===" && grep -r 'coach-rocks-frontend.pages.dev' --include='*.ts' --include='*.js' . --exclude-dir='.git' --exclude-dir='node_modules' 2>/dev/null || echo "✅ 已全部更新"
```

---

### 自動化操作 2: 更新 Google OAuth Redirect URI

**操作 ID**: `AUTO_010`

**執行指令**:
```bash
# 更新環境變數中的 Google OAuth Redirect URI
cd backend

# 設置新的 Redirect URI
echo 'https://api.coachrocks.com/api/auth/google/callback' | wrangler secret put GOOGLE_REDIRECT_URI

# 驗證
wrangler secret list | grep GOOGLE_REDIRECT
```

**手動步驟（Google Console 更新）**:
```
1. 登入 https://console.cloud.google.com/
2. 選擇 coach-rocks 專案
3. 前往 "Credentials" → OAuth 2.0 Client IDs
4. 編輯現有的 Client ID（Web application）
5. 在 "Authorized redirect URIs" 中：
   - 刪除舊的：https://coach-backend.katherine84522.workers.dev/api/auth/google/callback
   - 新增：https://api.coachrocks.com/api/auth/google/callback
6. 點擊 "Save"
7. 測試新的 Redirect URI：
   訪問 https://api.coachrocks.com/api/auth/google/init
   應看到 Google 登入頁面
```

---

### 手動步驟 2: 在 Cloudflare 配置 Workers 自訂域名

**操作 ID**: `MANUAL_DOMAIN_002`

**詳細教學**:

1. **綁定 Workers 自訂域名**
   ```
   步驟:
   1. 登入 https://dash.cloudflare.com
   2. 選擇 coachrocks.com 域名
   3. 前往 "Workers & Pages" → "coach-backend" Worker
   4. 選擇 "Settings" → "Domains & Routes"
   5. 點擊 "Add Route"
   6. 設置:
      - Route Pattern: api.coachrocks.com/*
      - Worker: coach-backend
   7. 點擊 "Save"
   8. 驗證：訪問 https://api.coachrocks.com/api/health
   ```

2. **建立 DNS 記錄（如需要）**
   ```
   Cloudflare Workers 通常自動配置，但驗證以下：

   前往 "DNS" 標籤：
   - 應有 CNAME 記錄: api.coachrocks.com → coach-backend.workers.dev
     （Cloudflare 自動管理）
   - 如無，手動添加：
     Type: CNAME
     Name: api
     Target: coach-backend.workers.dev
     Proxy status: Proxied (橙色雲)
   ```

3. **SSL/TLS 配置**
   ```
   Cloudflare 自動管理 SSL 證書，驗證：
   1. 前往 "SSL/TLS" → "Edge Certificates"
   2. 應顯示 "Full" 加密模式
   3. 待機 24 小時以確保證書頒發
   4. 測試: curl -I https://api.coachrocks.com/api/health
      應返回 HTTP 200（非 403/ERR_SSL_VERSION_OR_CIPHER_MISMATCH）
   ```

---

### 手動步驟 3: 在 Cloudflare 配置 Pages 自訂域名

**操作 ID**: `MANUAL_DOMAIN_003`

**詳細教學**:

1. **綁定 Pages 自訂域名**
   ```
   步驟:
   1. 登入 https://dash.cloudflare.com
   2. 選擇 coachrocks.com 域名
   3. 前往 "Workers & Pages" → "Pages" → "coach-rocks-frontend"
   4. 選擇 "Custom domains"
   5. 點擊 "Set up a custom domain"
   6. 輸入 "coachrocks.com"（主域名）
   7. Cloudflare 自動驗證並配置
   8. 驗證：訪問 https://coachrocks.com
      應顯示應用首頁
   ```

2. **配置根域名和 www 子域名**
   ```
   可選：添加 www 子域名
   1. 重複上述步驟
   2. 輸入 "www.coachrocks.com"
   3. 設置重定向（可選）：
      www.coachrocks.com → coachrocks.com
   ```

3. **驗證 DNS 記錄**
   ```
   前往 "DNS" 標籤，應有：

   Type: CNAME
   Name: coachrocks.com (或 @)
   Target: coach-rocks-frontend.pages.dev
   Proxy status: Proxied (橙色雲)

   如果是 A 記錄（某些情況下）：
   Type: A
   Name: @
   IPv4 address: 192.0.2.1 (Cloudflare Pages IP)
   Proxy status: Proxied
   ```

---

### 手動步驟 4: 配置域名重定向

**操作 ID**: `MANUAL_DOMAIN_004`

**詳細教學**:

1. **設置舊域名重定向到新域名**
   ```
   目的: 舊的 workers.dev 域名自動重定向到新域名

   步驟:
   1. 登入 https://dash.cloudflare.com
   2. 選擇 coachrocks.com 域名
   3. 前往 "Rules" → "Page Rules" （或 "Redirect Rules"）
   4. 建立規則:

      規則 A: Workers 重定向
      - 條件: URL matches (.*coach-backend\.katherine84522\.workers\.dev.*)
      - 操作: Permanent Redirect (301)
      - Target: https://api.coachrocks.com/$1

      規則 B: Pages 重定向（可選）
      - 條件: URL matches (.*coach-rocks-frontend\.pages\.dev.*)
      - 操作: Permanent Redirect (301)
      - Target: https://coachrocks.com/$1

   5. 測試重定向:
      curl -L https://coach-backend.katherine84522.workers.dev/api/health
      應最終返回 https://api.coachrocks.com/api/health 的響應
   ```

2. **Alternative: 在 Workers 代碼中實現重定向**
   ```
   如果上述 Page Rules 不可用，在 Workers 代碼中添加：

   backend/src/index.ts 開始：

   export default {
     async fetch(request: Request, env: Env) {
       const url = new URL(request.url);

       // 重定向舊域名
       if (url.hostname === 'coach-backend.katherine84522.workers.dev') {
         url.hostname = 'api.coachrocks.com';
         return Response.redirect(url.toString(), 301);
       }

       // 繼續正常處理...
   ```

---

### 自動化操作 3: 驗證域名轉移完整性

**操作 ID**: `AUTO_011`

**執行指令**:
```bash
# 1️⃣ 檢查是否有遺漏的舊域名
echo "=== 檢查遺漏的舊域名 ===" && \
grep -r 'katherine84522.workers.dev\|pages.dev' \
  --include='*.ts' --include='*.js' --include='*.tsx' --include='*.jsx' \
  --include='*.jsonc' --include='.env.*' --include='*.sh' \
  . --exclude-dir='.git' --exclude-dir='node_modules' 2>/dev/null | \
  grep -v 'technical_docs' || echo "✅ 無遺漏"

# 2️⃣ 檢查是否正確使用新域名
echo "" && echo "=== 檢查新域名配置 ===" && \
grep -r 'api.coachrocks.com\|coachrocks.com' \
  --include='*.ts' --include='*.js' \
  . --exclude-dir='.git' --exclude-dir='node_modules' 2>/dev/null | head -10

# 3️⃣ 驗證環境變數
echo "" && echo "=== 驗證環境變數 ===" && \
cd backend && \
echo "GOOGLE_REDIRECT_URI:" && wrangler secret list | grep GOOGLE_REDIRECT && \
echo "BACKEND_URL:" && wrangler secret list | grep BACKEND_URL && \
echo "FRONTEND_URL:" && wrangler secret list | grep FRONTEND_URL

# 4️⃣ 連接性測試
echo "" && echo "=== 連接性測試 ===" && \
echo "Testing API..." && \
curl -s -o /dev/null -w "API Status: %{http_code}\n" https://api.coachrocks.com/api/health && \
echo "Testing Frontend..." && \
curl -s -o /dev/null -w "Frontend Status: %{http_code}\n" https://coachrocks.com
```

---

## ✅ 驗證檢查清單

在部署到生產前，執行以下檢查。

### 檢查 1: 代碼中的硬編碼值

**操作 ID**: `VERIFY_001`

```json
{
  "operation": "verify_no_hardcoded_values",
  "description": "確保代碼中沒有遺漏的舊值",
  "automation_type": "script",
  "bash_commands": [
    "echo '=== 檢查舊域名 ==='; grep -r 'gamepig1976' --include='*.ts' --include='*.js' . --exclude-dir='.git' --exclude-dir='node_modules' --exclude-dir='technical_docs' 2>/dev/null | wc -l",
    "echo '=== 檢查舊 Account ID ==='; grep -r '9288c023577aa2f6ce20582b6c4bdda0' --include='*.ts' --include='*.jsonc' . --exclude-dir='.git' 2>/dev/null | wc -l",
    "echo '=== 檢查舊 Database ID ==='; grep -r 'd15ec66a-762c-40a2-bc8e-d64a1c8eb440' --include='*.jsonc' . --exclude-dir='.git' 2>/dev/null | wc -l"
  ],
  "expected_result": "所有計數都應為 0 或只在註解中出現"
}
```

**執行指令**:
```bash
# 檢查舊域名（應為 0）
grep -r 'gamepig1976' \
  --include='*.ts' \
  --include='*.js' \
  --include='*.jsx' \
  --include='*.tsx' \
  --include='*.jsonc' \
  --include='.dev.vars' \
  --include='.env.*' \
  --exclude-dir='.git' \
  --exclude-dir='node_modules' \
  --exclude-dir='technical_docs' \
  . 2>/dev/null && echo "❌ 發現遺漏！" || echo "✅ 無遺漏"

# 檢查舊 Account ID（應為 0）
grep -r '9288c023577aa2f6ce20582b6c4bdda0' \
  --include='*.jsonc' \
  --exclude-dir='.git' \
  . 2>/dev/null && echo "❌ 發現遺漏！" || echo "✅ 無遺漏"
```

---

### 檢查 2: 配置檔案驗證

**操作 ID**: `VERIFY_002`

```json
{
  "operation": "verify_config_files",
  "description": "驗證關鍵配置檔案的更新",
  "automation_type": "script",
  "files_to_verify": [
    {
      "file": "backend/wrangler.jsonc",
      "checks": [
        "account_id 已更新為新值",
        "database_id 是否已遷移",
        "名稱仍為 'coach-backend'"
      ]
    },
    {
      "file": "frontend/.env.production",
      "checks": [
        "VITE_BACKEND_BASE_URL = https://coach-backend.katherine84522.workers.dev"
      ]
    },
    {
      "file": "backend/.dev.vars",
      "checks": [
        "GOOGLE_REDIRECT_URI 已更新",
        "BACKEND_URL 已更新",
        "其他 secrets 已複製"
      ]
    }
  ],
  "bash_commands": [
    "echo '=== wrangler.jsonc ==='; grep -E 'account_id|database_id|\"name\"' backend/wrangler.jsonc",
    "echo ''; echo '=== .env.production ==='; cat frontend/.env.production | grep VITE_BACKEND",
    "echo ''; echo '=== .dev.vars (GOOGLE_REDIRECT_URI) ==='; grep GOOGLE_REDIRECT_URI backend/.dev.vars"
  ]
}
```

**執行指令**:
```bash
# 驗證 wrangler.jsonc
echo "=== 驗證 backend/wrangler.jsonc ==="
grep -E 'account_id|database_id' backend/wrangler.jsonc
# 預期：account_id 為新值，database_id 為新值或已遷移

# 驗證 .env.production
echo ""
echo "=== 驗證 frontend/.env.production ==="
grep VITE_BACKEND_BASE_URL frontend/.env.production
# 預期：VITE_BACKEND_BASE_URL=https://coach-backend.katherine84522.workers.dev

# 驗證 Google OAuth
echo ""
echo "=== 驗證 Google OAuth Redirect URI ==="
grep GOOGLE_REDIRECT_URI backend/.dev.vars
# 預期：GOOGLE_REDIRECT_URI=https://coach-backend.katherine84522.workers.dev/api/auth/google/callback
```

---

### 檢查 3: 連接性測試

**操作 ID**: `VERIFY_003`

```json
{
  "operation": "verify_connectivity",
  "description": "測試後端連接性和認證",
  "automation_type": "script",
  "priority": "P0",
  "tests": [
    {
      "name": "Health Check",
      "command": "curl -v https://coach-backend.katherine84522.workers.dev/api/health",
      "expected": "HTTP 200"
    },
    {
      "name": "Google OAuth Init",
      "command": "curl -X GET 'https://coach-backend.katherine84522.workers.dev/api/auth/google/init' -H 'Content-Type: application/json'",
      "expected": "HTTP 200 with redirect URL"
    },
    {
      "name": "Database Connection",
      "command": "curl -X POST https://coach-backend.katherine84522.workers.dev/api/test-db -H 'Content-Type: application/json'",
      "expected": "HTTP 200 with DB response"
    }
  ]
}
```

**執行指令**:
```bash
# 測試 Health Check
echo "=== Health Check ==="
curl -v https://coach-backend.katherine84522.workers.dev/api/health
# 預期：HTTP 200, 返回 { "status": "ok" }

# 測試 Google OAuth
echo ""
echo "=== Google OAuth Init ==="
curl -X GET 'https://coach-backend.katherine84522.workers.dev/api/auth/google/init' \
  -H 'Content-Type: application/json'
# 預期：HTTP 200, 返回 Google 登入 URL

# 測試資料庫連接
echo ""
echo "=== Database Connection ==="
curl -X POST https://coach-backend.katherine84522.workers.dev/api/test-db \
  -H 'Content-Type: application/json'
# 預期：HTTP 200, 資料庫可訪問
```

---

### 檢查 4: Git 配置驗證

**操作 ID**: `VERIFY_004`

```json
{
  "operation": "verify_git_config",
  "description": "驗證 Git 本地配置",
  "automation_type": "script",
  "bash_commands": [
    "git config user.email",
    "git config user.name",
    "git log --oneline -1"
  ],
  "expected": {
    "user_email": "katherine84522@gmail.com",
    "user_name": "Katherine（或適當名稱）",
    "last_commit": "應顯示最後一次提交"
  }
}
```

**執行指令**:
```bash
# 驗證 Git 配置
echo "=== Git 用戶配置 ==="
git config user.email
git config user.name

# 驗證最後提交
git log --oneline -1
```

---

## 🔄 回滾計劃

如果轉移過程中出現問題，使用此計劃恢復。

### 回滾 Scenario 1: 後端部署失敗

```json
{
  "scenario": "後端部署失敗，需要恢復",
  "steps": [
    "1. Gamepig 檢查 coach-backend.gamepig1976.workers.dev 是否仍可用",
    "2. 如果可用，使用舊後端 URL（檢查 git 歷史）",
    "3. 執行：git checkout backend/wrangler.jsonc （恢復配置）",
    "4. 重新部署：cd backend && wrangler deploy",
    "5. 驗證：curl https://coach-backend.gamepig1976.workers.dev/api/health"
  ],
  "automated_command": "git checkout backend/wrangler.jsonc && cd backend && wrangler deploy"
}
```

---

### 回滾 Scenario 2: 代碼中有遺漏的舊值

```json
{
  "scenario": "發現代碼中仍有舊值導致路由錯誤",
  "steps": [
    "1. 執行搜索找出遺漏位置：grep -r 'gamepig1976' .",
    "2. 記錄所有遺漏的檔案和行號",
    "3. 手動修改或重新執行自動化腳本",
    "4. 驗證並重新部署"
  ],
  "quick_fix_command": "find . -type f \\( -name '*.ts' -o -name '*.js' \\) ! -path '*./.git/*' -exec sed -i '' 's/gamepig1976/katherine84522/g' {} +"
}
```

---

### 回滾 Scenario 3: 資料庫遷移失敗

```json
{
  "scenario": "D1 資料庫遷移失敗，需要恢復",
  "steps": [
    "1. 檢查 Gamepig 的 Cloudflare Dashboard - D1 coachdb 是否仍存在",
    "2. 在 Katherine 的帳戶中建立新 D1 資料庫：coachdb_backup",
    "3. 從 Gamepig 帳戶重新匯出資料庫",
    "4. 導入到 Katherine 帳戶",
    "5. 更新 wrangler.jsonc 中的 database_id",
    "6. 重新部署"
  ],
  "commands": [
    "wrangler d1 export coachdb backup.sql",
    "wrangler d1 import coachdb_backup backup.sql",
    "# 更新 wrangler.jsonc，然後",
    "wrangler deploy"
  ]
}
```

---

## 📝 執行順序

按以下順序執行操作，確保依賴關係正確：

```
Phase 1: 準備（Katherine）
  ├─ 獲取新 Account ID
  ├─ 建立 Cloudflare Workers (coach-backend)
  └─ 建立 Cloudflare Pages (coach-rocks-frontend)

Phase 2: 自動化更新
  ├─ AUTO_001: 批量更新後端 URL
  ├─ AUTO_002: 更新 Git 配置
  ├─ AUTO_003: 更新 Wrangler Account ID
  ├─ AUTO_004: 更新腳本郵箱
  └─ AUTO_005: 驗證無遺漏

Phase 3: 認證配置
  ├─ 建立 Google OAuth Credentials
  ├─ AUTO_006: 更新 Google OAuth Secrets
  └─ AUTO_007: 更新其他 Secrets

Phase 4: 資料庫遷移
  └─ 遷移 D1 資料庫並更新 database_id

Phase 5: 驗證
  ├─ VERIFY_001: 檢查無硬編碼舊值
  ├─ VERIFY_002: 驗證配置檔案
  ├─ VERIFY_003: 連接性測試
  └─ VERIFY_004: Git 配置驗證

Phase 6: 部署
  ├─ 部署後端：wrangler deploy
  ├─ 構建前端：npm run build
  └─ 部署前端：wrangler pages deploy dist
```

---

## 🎯 關鍵決策點

| 決策點 | 選項 | 影響 |
|--------|------|------|
| **D1 資料庫遷移** | A: 遷移（複製所有數據） | 保留現有數據，Katherine 帳戶有完整備份 |
| | B: 新建空資料庫 | 需要重新初始化，現有數據遺失 |
| **代碼庫所有權** | A: 轉移給 Katherine（推薦） | 一個明確的所有者 |
| | B: 共同擁有 | 可能導致權限問題 |
| **DNS/自訂域名** | A: 保持指向舊帳戶 | 需要額外配置 |
| | B: 轉移到新帳戶 | 更乾淨的結構 |

---

## 📞 故障排除

### 常見問題 1: "account_id 錯誤"
```
錯誤: Your account ID is not recognized
原因: wrangler.jsonc 中的 account_id 不正確
解決: 從 Cloudflare Dashboard 複製正確的 Account ID
```

### 常見問題 2: "Google OAuth 重定向 URI 不匹配"
```
錯誤: redirect_uri_mismatch
原因: Google Console 中的 Redirect URI 與實際 URI 不匹配
解決:
  1. 確認新的後端 URL: https://coach-backend.katherine84522.workers.dev/api/auth/google/callback
  2. 在 Google Console 更新 Redirect URI
  3. 重新生成 Client ID/Secret
```

### 常見問題 3: "資料庫無法連接"
```
錯誤: D1_ERROR: Database not found
原因: database_id 未更新或資料庫未遷移
解決:
  1. 驗證 database_id 是否正確
  2. 檢查資料庫是否存在於 Katherine 的帳戶
  3. 重新執行遷移
```

---

## 📊 進度追蹤表

複製此表格到 AIPROJECT.MD 或任務面板中，追蹤進度：

```markdown
## 專案轉移進度

| ID | 任務 | 狀態 | 執行者 | 備註 |
|----|------|------|--------|------|
| AUTO_001 | 批量更新後端 URL | ⏳ | AI | 等待 Phase 1 完成 |
| AUTO_002 | 更新 Git 配置 | ⏳ | AI | 簡單操作 |
| AUTO_003 | 更新 Wrangler Account ID | ⏳ | AI | 需要新 Account ID |
| AUTO_004 | 更新腳本郵箱 | ⏳ | AI | 可並行執行 |
| AUTO_005 | 驗證無遺漏 | ⏳ | AI | 最後檢查 |
| VERIFY_001 | 代碼驗證 | ⏳ | AI | 部署前必執 |
| VERIFY_002 | 配置驗證 | ⏳ | AI | 部署前必執 |
| VERIFY_003 | 連接性測試 | ⏳ | AI | 部署前必執 |
| VERIFY_004 | Git 配置驗證 | ⏳ | AI | 部署前必執 |
```

---

## 🔐 安全檢查清單

在執行任何自動化操作前，確保：

- [ ] 已備份所有關鍵配置檔案
- [ ] 已記錄所有舊值（便於回滾）
- [ ] 已驗證 Katherine 帳戶有完整的 Cloudflare 權限
- [ ] 已複製所有 API 密鑰和秘密
- [ ] 已記錄所有 Secrets（用於對比）
- [ ] Git 分支已正確（應在 main/master）
- [ ] 已通知所有相關利益相關者（如有）

---

## 📞 聯絡方式

- **Gamepig**: gamepig1976@gmail.com（舊帳戶）
- **Katherine**: katherine84522@gmail.com（新帳戶）
- **Cloudflare Support**: https://support.cloudflare.com

---

**版本歷史**:
- v1.0 - 2025-11-19 - 初始版本，包含完整的自動化和手動步驟

**最後檢查**: 2025-11-19
