# 專案轉移 - AI 快速參考卡

**快速查詢表** - 複製並立即執行

---

## 📋 轉移值對照表

```
舊帳戶: gamepig1976@gmail.com
新帳戶: katherine84522@gmail.com

舊後端 URL:  https://coach-backend.gamepig1976.workers.dev
新後端 URL:  https://coach-backend.katherine84522.workers.dev

舊 Account ID:  9288c023577aa2f6ce20582b6c4bdda0
新 Account ID:  [待從 Katherine 帳戶獲取]

舊 Database ID: d15ec66a-762c-40a2-bc8e-d64a1c8eb440
新 Database ID: [待遷移或新建]
```

---

## 🚀 AI 可立即執行的命令

### Step 1: 批量更新後端 URL

```bash
# 替換所有檔案中的舊 URL
find . -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.jsx' -o -name '*.js' -o -name '*.jsonc' -o -name '.dev.vars' -o -name '.env.*' -o -name '*.sh' \) ! -path '*./.git/*' ! -path '*/node_modules/*' ! -path '*/.wrangler/*' -exec sed -i '' 's|https://coach-backend\.gamepig1976\.workers\.dev|https://coach-backend.katherine84522.workers.dev|g' {} +

# 驗證替換成功
grep -r 'coach-backend.gamepig1976' --include='*.ts' --include='*.js' --include='*.jsonc' --include='.dev.vars' --include='.env.*' . --exclude-dir='.git' --exclude-dir='node_modules' --exclude-dir='technical_docs' 2>/dev/null || echo "✅ 全部已更新"
```

### Step 2: 更新 Git 配置

```bash
# 設置新的 Git 用戶郵箱
git config user.email 'katherine84522@gmail.com'

# 驗證
git config user.email
# 預期: katherine84522@gmail.com
```

### Step 3: 更新腳本中的郵箱

```bash
# 更新 scripts 目錄中的所有郵箱
find scripts -name '*.sh' -exec sed -i '' 's/gamepig1976@gmail\.com/katherine84522@gmail.com/g' {} +

# 驗證
grep -r 'gamepig1976@gmail.com' scripts/ 2>/dev/null || echo "✅ 已全部更新"
```

### Step 4: 驗證沒有遺漏

```bash
# 檢查舊域名
grep -r 'gamepig1976' --include='*.ts' --include='*.js' --include='*.jsonc' --include='.dev.vars' --include='.env.*' . --exclude-dir='.git' --exclude-dir='node_modules' --exclude-dir='technical_docs' 2>/dev/null || echo "✅ 無遺漏"

# 檢查舊 Account ID
grep -r '9288c023577aa2f6ce20582b6c4bdda0' --include='*.jsonc' . --exclude-dir='.git' 2>/dev/null || echo "✅ 無遺漏"

# 檢查舊 Database ID
grep -r 'd15ec66a-762c-40a2-bc8e-d64a1c8eb440' --include='*.jsonc' . --exclude-dir='.git' 2>/dev/null || echo "✅ 無遺漏"
```

---

## 🔐 需要手動輸入的 Secrets

### 當 Katherine 提供新 Account ID 時：

```bash
# 將 [NEW_ACCOUNT_ID] 替換為實際 ID
sed -i '' 's/"account_id": "9288c023577aa2f6ce20582b6c4bdda0"/"account_id": "[NEW_ACCOUNT_ID]"/g' backend/wrangler.jsonc

# 驗證
grep '"account_id"' backend/wrangler.jsonc
```

### 當 Katherine 提供 Google OAuth 憑證時：

```bash
cd backend

# 設置 Client ID
echo '[GOOGLE_CLIENT_ID]' | wrangler secret put GOOGLE_CLIENT_ID

# 設置 Client Secret
echo '[GOOGLE_CLIENT_SECRET]' | wrangler secret put GOOGLE_CLIENT_SECRET

# 設置 Redirect URI
echo 'https://coach-backend.katherine84522.workers.dev/api/auth/google/callback' | wrangler secret put GOOGLE_REDIRECT_URI

# 驗證
wrangler secret list | grep GOOGLE
```

---

## 📦 複製其他 Secrets（自動化）

```bash
cd backend

# 方法 1: 逐個複製（如果有存取權限）
OPENAI_KEY=$(grep '^OPENAI_API_KEY=' .dev.vars | cut -d '=' -f2)
echo "$OPENAI_KEY" | wrangler secret put OPENAI_API_KEY

# 方法 2: 使用腳本複製所有 secrets
while IFS='=' read -r key value; do
    [[ "$key" =~ ^[A-Z_]+$ ]] && wrangler secret put "$key" <<< "$value"
done < .dev.vars

# 設置應用 URLs
echo 'https://coach-backend.katherine84522.workers.dev' | wrangler secret put BACKEND_URL
echo 'https://coach-rocks-frontend.pages.dev' | wrangler secret put FRONTEND_URL
echo 'noreply@coachrocks.com' | wrangler secret put FROM_EMAIL
echo 'CoachRocks AI' | wrangler secret put APP_NAME
```

---

## 📧 RESEND 郵件服務快速設定（AUTO_008）

**關鍵點**:
- 開發環境：自動使用測試域名 `onboarding@resend.dev`
- 生產環境：需要驗證 `coachrocks.com` 域名（Phase 6）
- API Key：從舊帳戶複製到新帳戶

### 快速設置

```bash
# 1️⃣ 設置 RESEND_API_KEY Secret
cd backend
wrangler secret put RESEND_API_KEY
# 粘貼: [使用舊帳戶的 RESEND_API_KEY]

# 2️⃣ 驗證設置
wrangler secret list | grep RESEND

# 3️⃣ 測試郵件發送
node test-resend-email.js your-email@example.com

# 預期結果：
# ✅ 郵件在 5 秒內送達
# ✅ 來自地址：onboarding@resend.dev（開發）
```

### 不同環境配置說明

| 環境 | 發送者 | 需要驗證 | 時機 | 配置位置 |
|------|--------|---------|------|---------|
| 開發 | `onboarding@resend.dev` | ❌ 否 | 立即 | `backend/.dev.vars` |
| 生產 | `noreply@coachrocks.com` | ✅ 是 | Phase 6 | RESEND Dashboard + Cloudflare DNS |

### RESEND 域名驗證（生產環境 - Phase 6 執行）

```bash
# 執行於：Phase 6 域名上線後

步驟：
1. RESEND Dashboard → Domains → Add Domain
2. 輸入：coachrocks.com
3. RESEND 提供 DNS 記錄（CNAME、TXT）
4. 複製記錄到 Cloudflare：Dashboard → coachrocks.com → DNS
5. 等待驗證完成（5-30 分鐘）
6. 驗證後即可使用 noreply@coachrocks.com 發送郵件
```

### 快速故障排查

```bash
# 檢查 1: API Key 是否設置
cd backend && wrangler secret list | grep RESEND

# 檢查 2: 環境變數是否正確
grep -E "RESEND|FROM_EMAIL" backend/.dev.vars

# 檢查 3: 郵件是否能發送
node test-resend-email.js test@example.com
# 檢查終端是否有 "✅ Email sent successfully" 訊息

# 檢查 4: 生產環境郵件服務（域名上線後）
curl -I https://api.coachrocks.com/api/health
# 應返回 200 狀態碼
```

---

## 🗄️ 資料庫遷移（當 Katherine 已建立新 Database 時）

```bash
# 當獲得新的 Database ID 時，更新 wrangler.jsonc
sed -i '' 's/"database_id": "d15ec66a-762c-40a2-bc8e-d64a1c8eb440"/"database_id": "[NEW_DATABASE_ID]"/g' backend/wrangler.jsonc

# 驗證
grep '"database_id"' backend/wrangler.jsonc
```

---

## ✅ 部署前檢查清單

```bash
# 檢查 1: 沒有遺漏的舊值
echo "=== 最終檢查 ===" && \
grep -r 'gamepig1976' . --include='*.ts' --include='*.js' --include='*.jsonc' --exclude-dir='.git' --exclude-dir='node_modules' --exclude-dir='technical_docs' 2>/dev/null && echo "❌ 發現遺漏！" || echo "✅ 無遺漏"

# 檢查 2: Git 配置
echo "" && echo "=== Git 配置 ===" && git config user.email

# 檢查 3: 配置檔案
echo "" && echo "=== 配置檔案 ===" && \
grep -E '(account_id|database_id|VITE_BACKEND|GOOGLE_REDIRECT)' backend/wrangler.jsonc frontend/.env.production backend/.dev.vars 2>/dev/null | head -10

# 檢查 4: Secrets
echo "" && echo "=== Wrangler Secrets ===" && \
cd backend && wrangler secret list | head -15
```

---

## 🚀 部署指令

```bash
# 後端部署
cd backend
npm run deploy

# 驗證後端
curl https://coach-backend.katherine84522.workers.dev/api/health

# 前端構建和部署
cd ../frontend
npm run build
wrangler pages deploy dist --project-name=coach-rocks-frontend

# 驗證前端
echo "訪問: https://coach-rocks-frontend.pages.dev"
```

---

## 🔄 快速回滾指令

### 如果部署失敗

```bash
# 回滾所有代碼改動
git checkout backend/wrangler.jsonc frontend/.env.production

# 使用舊帳戶部署（如果還需要）
cd backend && wrangler deploy
```

### 如果發現遺漏的舊值

```bash
# 快速修復（替換所有舊值）
find . -type f \( -name '*.ts' -o -name '*.js' \) ! -path '*./.git/*' -exec sed -i '' 's/gamepig1976/katherine84522/g' {} +

# 重新部署
cd backend && wrangler deploy
```

---

## 📊 執行順序速查

```
1️⃣  批量更新 URL (Step 1)
    ↓
2️⃣  更新 Git 配置 (Step 2)
    ↓
3️⃣  等待 Katherine 提供 Account ID
    ↓
4️⃣  更新 Account ID (Step 3)
    ↓
5️⃣  更新腳本郵箱 (Step 4)
    ↓
6️⃣  驗證無遺漏 (Step 5)
    ↓
7️⃣  等待 Katherine 建立 Google OAuth 憑證
    ↓
8️⃣  更新 Google OAuth Secrets
    ↓
9️⃣  複製其他 Secrets
    ↓
🔟 等待 Katherine 完成資料庫遷移
    ↓
1️⃣1️⃣ 更新 Database ID
    ↓
1️⃣2️⃣ 執行最終驗證檢查
    ↓
1️⃣3️⃣ 部署後端和前端
```

---

## 🆘 常見問題快速修復

| 問題 | 檢查命令 | 修復命令 |
|------|----------|---------|
| account_id 錯誤 | `grep account_id backend/wrangler.jsonc` | `sed -i '' 's/OLD_ID/NEW_ID/g' backend/wrangler.jsonc` |
| OAuth redirect 不匹配 | `grep GOOGLE_REDIRECT backend/.dev.vars` | 確認 URL 為 `https://coach-backend.katherine84522.workers.dev/api/auth/google/callback` |
| 資料庫無法連接 | `grep database_id backend/wrangler.jsonc` | `sed -i '' 's/OLD_DB_ID/NEW_DB_ID/g' backend/wrangler.jsonc` |
| 舊 URL 仍存在 | `grep -r 'gamepig1976'` | `find ... -exec sed -i '' 's|gamepig1976|katherine84522|g' {} +` |

---

## 💾 檔案備份提醒

部署前，建議備份關鍵檔案：

```bash
# 備份配置
cp backend/wrangler.jsonc backend/wrangler.jsonc.bak
cp frontend/.env.production frontend/.env.production.bak
cp backend/.dev.vars backend/.dev.vars.bak

# 查看差異（在執行改動後）
diff -u backend/wrangler.jsonc.bak backend/wrangler.jsonc
```

---

## 📞 關鍵信息存儲位置

| 信息 | 位置 | 用途 |
|------|------|------|
| 完整教學 | `PROJECT_OWNERSHIP_TRANSFER_GUIDE.md` | 詳細說明 |
| JSON 指令 | `AI_TRANSFER_INSTRUCTIONS.json` | AI 執行參考 |
| 此快速參考 | `TRANSFER_QUICK_REFERENCE.md` | 快速查詢 |

---

**版本**: 1.0
**最後更新**: 2025-11-19
**用途**: AI 快速參考和即時執行

---

## 🌐 第 6 階段 - 域名轉移至 coachrocks.com（正式上線）

### 轉移架構

```
舊域名（過渡）          →  新域名（生產）
coach-backend.katherine84522.workers.dev  →  api.coachrocks.com
coach-rocks-frontend.pages.dev             →  coachrocks.com
```

### Step 1: 購買並驗證域名（Katherine 手動）

```bash
# Option A: 通過 Cloudflare Registrar
1. 登入 https://dash.cloudflare.com
2. 選擇 "Domain Registration"
3. 搜尋 coachrocks.com → 購買（約 $10-15/年）
4. Cloudflare 自動配置 Nameservers

# Option B: 通過其他註冊商
1. 購買後，更新 Nameservers 為：
   - ns1.cloudflare.com
   - ns2.cloudflare.com
2. 在 Cloudflare Dashboard 添加域名
3. 等待驗證（5-30 分鐘）
```

### Step 2: AI 批量更新域名（AUTO_009）

```bash
# 1️⃣ 替換後端域名
find . -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.jsx' -o -name '*.js' -o -name '*.jsonc' -o -name '.dev.vars' -o -name '.env.*' -o -name '*.sh' \) ! -path '*./.git/*' ! -path '*/node_modules/*' ! -path '*/.wrangler/*' -exec sed -i '' 's|coach-backend\.katherine84522\.workers\.dev|api.coachrocks.com|g' {} +

# 2️⃣ 替換前端域名
find . -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.jsx' -o -name '*.js' -o -name '*.jsonc' -o -name '.env.*' \) ! -path '*./.git/*' ! -path '*/node_modules/*' -exec sed -i '' 's|coach-rocks-frontend\.pages\.dev|coachrocks.com|g' {} +

# 3️⃣ 更新 CORS 配置
find . -type f -name '*.ts' ! -path '*/node_modules/*' -exec sed -i '' "s|'https://coach-rocks-frontend.pages.dev'|'https://coachrocks.com'|g" {} +

# 4️⃣ 驗證替換
grep -r 'coach-backend.katherine84522.workers.dev\|coach-rocks-frontend.pages.dev' \
  --include='*.ts' --include='*.js' . --exclude-dir='.git' --exclude-dir='node_modules' 2>/dev/null || echo "✅ 全部已更新"
```

### Step 3: AI 更新 Google OAuth（AUTO_010）

```bash
cd backend

# 設置新的 Redirect URI
echo 'https://api.coachrocks.com/api/auth/google/callback' | wrangler secret put GOOGLE_REDIRECT_URI

# 驗證
wrangler secret list | grep GOOGLE_REDIRECT
```

**同時在 Google Console 手動更新**:
```
1. 登入 https://console.cloud.google.com/
2. 選擇 coach-rocks 專案 → Credentials
3. 編輯 OAuth 2.0 Client ID
4. 在 "Authorized redirect URIs" 中：
   - 移除：https://coach-backend.katherine84522.workers.dev/api/auth/google/callback
   - 新增：https://api.coachrocks.com/api/auth/google/callback
5. 保存並測試：訪問 https://api.coachrocks.com/api/auth/google/init
```

### Step 4: 在 Cloudflare 配置 Workers 自訂域名（Katherine 手動 - MANUAL_DOMAIN_002）

```
最詳細教學：

1. 登入 Cloudflare Dashboard → 選擇 coachrocks.com 域名
2. 前往 "Workers & Pages" → 選擇 "coach-backend" Worker
3. 進入 Worker 的 "Settings" → "Domains & Routes"
4. 點擊 "Add Route"
5. 設置:
   Route Pattern: api.coachrocks.com/*
   Worker: coach-backend
6. 點擊 "Save"

驗證：
- 訪問 https://api.coachrocks.com/api/health
- 應返回 { "status": "ok" }
- 檢查 DNS 記錄中是否自動創建 CNAME：api.coachrocks.com → coach-backend.workers.dev

SSL/TLS 配置（自動）:
- Cloudflare 自動管理，驗證：
  1. 前往 "SSL/TLS" → "Edge Certificates"
  2. 應顯示 "Full" 加密
  3. 等待 24 小時確保証書完全頒發
  4. 測試: curl -I https://api.coachrocks.com/api/health
```

### Step 5: 在 Cloudflare 配置 Pages 自訂域名（Katherine 手動 - MANUAL_DOMAIN_003）

```
最詳細教學：

1. 登入 Cloudflare Dashboard → 選擇 coachrocks.com 域名
2. 前往 "Workers & Pages" → "Pages" → "coach-rocks-frontend"
3. 選擇 "Custom domains" 標籤
4. 點擊 "Set up a custom domain"
5. 輸入 "coachrocks.com"（根域名）
6. Cloudflare 自動驗證 DNS 和配置
7. 驗證：訪問 https://coachrocks.com → 應顯示應用首頁

DNS 驗證（應自動配置）:
前往 Cloudflare "DNS" 標籤，應有：
  Type: CNAME
  Name: @ (或 coachrocks.com)
  Target: coach-rocks-frontend.pages.dev
  Proxy status: Proxied (橙色雲)

可選：添加 www.coachrocks.com
1. 重複上述步驟
2. 輸入 "www.coachrocks.com"
3. 設置重定向: www → coachrocks.com（可選）
```

### Step 6: 配置域名重定向（Katherine 手動 - MANUAL_DOMAIN_004）

```
目的: 舊的 workers.dev 域名自動重定向到新域名

方案 A: 使用 Cloudflare Redirect Rules（推薦）
1. 登入 Dashboard → coachrocks.com 域名
2. 前往 "Rules" → "Redirect Rules"
3. 建立規則:

   規則 1: 後端重定向
   - Incoming request matches: coach-backend.katherine84522.workers.dev
   - Then: Dynamic Redirect
   - Target: https://api.coachrocks.com{request_uri}
   - Status code: 301 (Permanent Redirect)

   規則 2: 前端重定向（可選）
   - Incoming request matches: coach-rocks-frontend.pages.dev
   - Then: Dynamic Redirect
   - Target: https://coachrocks.com{request_uri}
   - Status code: 301

4. 測試重定向:
   curl -L https://coach-backend.katherine84522.workers.dev/api/health
   最終應返回 api.coachrocks.com 的響應

方案 B: 在 Workers 代碼中實現（如方案 A 不可用）
在 backend/src/index.ts 最開始添加：

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    // 重定向舊後端域名
    if (url.hostname === 'coach-backend.katherine84522.workers.dev') {
      url.hostname = 'api.coachrocks.com';
      return Response.redirect(url.toString(), 301);
    }

    // 繼續正常處理...
```

### Step 7: AI 驗證域名轉移完整性（AUTO_011）

```bash
# 1️⃣ 檢查是否有遺漏的舊域名
echo "=== 檢查舊域名遺漏 ===" && \
grep -r 'katherine84522.workers.dev\|pages.dev' \
  --include='*.ts' --include='*.js' --include='*.jsonc' --include='.env.*' \
  . --exclude-dir='.git' --exclude-dir='node_modules' --exclude-dir='technical_docs' 2>/dev/null || echo "✅ 無遺漏"

# 2️⃣ 驗證新域名已使用
echo "" && echo "=== 驗證新域名配置 ===" && \
grep -r 'api.coachrocks.com\|coachrocks.com' \
  --include='*.ts' --include='*.js' \
  . --exclude-dir='.git' --exclude-dir='node_modules' 2>/dev/null | head -15

# 3️⃣ 驗證環境變數
echo "" && echo "=== 驗證環境變數 ===" && \
cd backend && \
echo "GOOGLE_REDIRECT_URI: $(wrangler secret list 2>/dev/null | grep GOOGLE_REDIRECT || echo '未設置')" && \
echo "BACKEND_URL: $(wrangler secret list 2>/dev/null | grep BACKEND_URL || echo '未設置')"

# 4️⃣ 連接性測試
echo "" && echo "=== 連接性測試 ===" && \
echo -n "API 健康檢查: " && curl -s -o /dev/null -w "%{http_code}\n" https://api.coachrocks.com/api/health && \
echo -n "前端訪問: " && curl -s -o /dev/null -w "%{http_code}\n" https://coachrocks.com
```

### 快速檢查清單

- [ ] ✅ 域名已購買並驗證（coachrocks.com）
- [ ] ✅ Nameservers 指向 Cloudflare
- [ ] ✅ AUTO_009: 批量更新域名完成
- [ ] ✅ AUTO_010: Google OAuth 更新完成
- [ ] ✅ MANUAL_DOMAIN_002: Workers 自訂域名配置完成
- [ ] ✅ MANUAL_DOMAIN_003: Pages 自訂域名配置完成
- [ ] ✅ MANUAL_DOMAIN_004: 域名重定向配置完成
- [ ] ✅ AUTO_011: 域名驗證通過
- [ ] ✅ 舊域名重定向正常運作
- [ ] ✅ SSL/TLS 証書已頒發
- [ ] ✅ 用戶可通過 coachrocks.com 正常訪問

### 故障排除

| 問題 | 症狀 | 解決方法 |
|------|------|---------|
| **API 無法訪問** | curl https://api.coachrocks.com 返回 404 | 檢查 Cloudflare Workers Routes 是否配置了 api.coachrocks.com/* |
| **OAuth 失敗** | 登入時 redirect_uri_mismatch | 確認 Google Console 中的 Redirect URI 為 https://api.coachrocks.com/api/auth/google/callback |
| **SSL 証書未頒發** | curl 返回 ERR_SSL_VERSION_OR_CIPHER_MISMATCH | 等待 24-48 小時或手動申請 SSL |
| **舊域名不重定向** | 訪問 coach-backend.katherine84522... 返回 404 | 確認 Redirect Rules 已配置或在 Workers 代碼中添加重定向 |
| **CORS 錯誤** | 瀏覽器報告 CORS blocked | 確認後端 CORS 配置已更新為 coachrocks.com |
