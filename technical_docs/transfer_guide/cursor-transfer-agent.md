# Cursor AI Agent - 轉移自動化 Prompt 集合

**目的**: 提供可直接複製-貼上到 Cursor Composer 的自動化指令
**使用方式**: 在 Cursor 中按 `Cmd+Shift+I` 打開 Composer，複製下方 Prompt
**進度追蹤**: 完成每個 Phase 後勾選 ✅

---

## 🚀 初始化：轉移前準備

**何時執行**: 開始轉移前
**預期時間**: 5 分鐘

### Prompt: 環境檢查和準備

```
請幫我做轉移前的環境檢查。

參考文件位置：technical_docs/transfer_guide/

請執行以下檢查：
1. 驗證 Node.js、Git、Wrangler 已安裝
2. 確認當前在 /coach-rocks-main 目錄
3. 檢查 Git 遠程倉庫配置
4. 列出當前 Git 用戶配置
5. 檢查 backend/.dev.vars 是否存在

命令：
node --version
git --version
wrangler --version
pwd
git remote -v
git config user.email
git config user.name
ls -la backend/.dev.vars

然後告訴我是否所有環境都準備就緒。
如果有任何缺失，提出安裝/配置建議。
```

**檢查清單**:
- [ ] Node.js 版本 >= 16
- [ ] Git 已配置用戶郵箱
- [ ] Wrangler 已安裝
- [ ] backend/.dev.vars 存在
- [ ] 在正確的目錄中

---

## 📋 Phase 1: Cloudflare 帳戶準備

**何時執行**: 開始轉移前，由 Katherine 手動完成
**預期時間**: 20-30 分鐘（手動）

### 信息收集清單

等待 Katherine 提供以下信息：

```
需要向 Katherine 索要：

☐ 新的 Cloudflare Account ID
  位置：https://dash.cloudflare.com → 右上角
  格式：32 字符的十六進制 (如: 9288c023577aa2f6ce20582b6c4bdda0)

☐ 新的 Workers URL
  格式：https://coach-backend.katherine84522.workers.dev

☐ 新的 Pages URL
  格式：https://coach-rocks-frontend.pages.dev

☐ 新的 Database ID（用於 Phase 4）
  位置：Cloudflare Dashboard → D1 Database
  格式：UUID (如: d15ec66a-762c-40a2-bc8e-d64a1c8eb440)
```

**提醒**: 在執行 Phase 2 前必須獲得新 Account ID
**將信息保存到** (臨時):
```bash
# 建立臨時文件存儲信息（轉移完後刪除）
cat > /tmp/transfer_info.txt << 'EOF'
NEW_ACCOUNT_ID=[待獲得]
NEW_DATABASE_ID=[待獲得]
EOF
```

---

## ⚡ Phase 2: 自動化 URL 和配置更新

**何時執行**: 獲得新 Account ID 後
**預期時間**: 10-15 分鐘
**AI 可自動執行**: ✅ 是

### Prompt 1: 批量更新後端 URL

```
[前置信息]
新的後端 URL：https://coach-backend.katherine84522.workers.dev
舊的後端 URL：https://coach-backend.gamepig1976.workers.dev

[任務]
參考 technical_docs/transfer_guide/TRANSFER_QUICK_REFERENCE.md 中的
「AI 可立即執行的命令 → Step 1」

請幫我批量替換所有檔案中的後端 URL。

具體步驟：
1. 使用 find + sed 命令搜尋並替換
2. 執行完後驗證（grep 檢查沒有遺漏）

完成後顯示：
- 被修改的檔案數量
- 被替換的次數
- 驗證命令的結果

涉及文件：*.ts, *.tsx, *.js, *.jsonc, .dev.vars, .env.*
排除：.git/, node_modules/, technical_docs/
```

**驗證命令** (自動包含在 Prompt 中):
```bash
# 應返回 0
grep -r 'coach-backend.gamepig1976' . \
  --include='*.ts' --include='*.js' --include='*.jsonc' \
  --exclude-dir='.git' --exclude-dir='node_modules' | wc -l
```

### Prompt 2: 更新 Git 配置

```
參考 technical_docs/transfer_guide/TRANSFER_QUICK_REFERENCE.md
「Step 2：更新 Git 配置」

請幫我設置新的 Git 用戶郵箱：katherine84522@gmail.com

執行：
git config user.email 'katherine84522@gmail.com'

然後驗證配置是否生效：
git config user.email

顯示驗證結果。
```

### Prompt 3: 批量驗證沒有遺漏

```
參考 technical_docs/transfer_guide/TRANSFER_QUICK_REFERENCE.md
「Step 4：驗證沒有遺漏」

請執行以下三個驗證檢查：

1️⃣ 檢查舊的後端 URL
2️⃣ 檢查舊的 Account ID
3️⃣ 檢查舊的郵箱（gamepig1976）

對於每個檢查：
- 執行 grep 命令
- 如果有結果，列出所有匹配行
- 如果沒有結果，顯示 ✅ 驗證通過

最後匯總所有驗證結果。
```

**檢查清單**:
- [ ] 後端 URL 已更新
- [ ] Git 配置已更新
- [ ] 所有舊值已驗證替換

---

## 🔐 Phase 3: Google OAuth & RESEND 配置

**何時執行**: Phase 2 驗證通過後
**預期時間**: 15-20 分鐘
**AI 可自動執行**: ✅ 部分（需要 Katherine 提供 OAuth 憑證）

### Step 1: 準備 Google OAuth 信息

**向 Katherine 索要**:
```
☐ Google OAuth Client ID
  來自：Google Cloud Console 創建的 OAuth 認證
  格式：xxx-xxx.apps.googleusercontent.com

☐ Google OAuth Client Secret
  格式：GOCSPX-xxxxxxxx
```

### Prompt 1: 設置 Google OAuth Secrets

```
[信息提供]
Google OAuth Client ID：[ID_HERE]
Google OAuth Client Secret：[SECRET_HERE]
Google OAuth Redirect URI：https://coach-backend.katherine84522.workers.dev/api/auth/google/callback

[任務]
參考 technical_docs/transfer_guide/PROJECT_OWNERSHIP_TRANSFER_GUIDE.md
「Phase 2：Google OAuth 更新」和
「AUTO_006：更新 Google OAuth Secrets」

請幫我在 Cloudflare Workers 中設置 Google OAuth Secrets。

執行步驟：
1. cd backend
2. wrangler secret put GOOGLE_CLIENT_ID
   [粘貼 Client ID]
3. wrangler secret put GOOGLE_CLIENT_SECRET
   [粘貼 Client Secret]
4. wrangler secret put GOOGLE_REDIRECT_URI
   [輸入上方的 Redirect URI]

然後驗證所有 Secrets 已設置：
wrangler secret list | grep -E 'GOOGLE|REDIRECT'

顯示驗證結果。
```

### Prompt 2: 配置 RESEND 郵件服務（AUTO_008）

```
[任務]
參考 technical_docs/transfer_guide/PROJECT_OWNERSHIP_TRANSFER_GUIDE.md
「Phase 3 → Step 8️⃣：RESEND 郵件服務設定」

請幫我配置 RESEND 郵件服務。

執行步驟：
1. cd backend
2. wrangler secret put RESEND_API_KEY
   [粘貼舊帳戶的 API Key: 見 backend/.dev.vars 中的 RESEND_API_KEY]
3. 驗證設置
   wrangler secret list | grep RESEND

然後執行郵件測試（可選）：
node test-resend-email.js test@example.com

說明測試結果。
```

### Prompt 3: 複製其他 Secrets（AUTO_007）

```
[任務]
參考 technical_docs/transfer_guide/TRANSFER_QUICK_REFERENCE.md
「複製其他 Secrets（自動化）」

請幫我設置以下 Secrets：

1️⃣ API Keys（複製自舊帳戶）
  - OPENAI_API_KEY
  - PERPLEXITY_API_KEY
  - SERPER_API_KEY
  - JWT_SECRET

2️⃣ 應用 URLs（更新為新值）
  - BACKEND_URL: https://coach-backend.katherine84522.workers.dev
  - FRONTEND_URL: https://coach-rocks-frontend.pages.dev
  - FROM_EMAIL: noreply@coachrocks.com
  - APP_NAME: CoachRocks AI

執行命令：
cd backend
wrangler secret put [SECRET_NAME]
[粘貼 SECRET_VALUE]

最後驗證：
wrangler secret list

顯示所有已設置的 Secrets 列表。
```

**檢查清單**:
- [ ] Google OAuth Secrets 已設置
- [ ] RESEND API Key 已設置
- [ ] 其他 Secrets 已複製
- [ ] RESEND 郵件測試通過（可選）

---

## 🗄️ Phase 4: 資料庫遷移

**何時執行**: Phase 3 驗證通過後，並獲得新 Database ID
**預期時間**: 20-30 分鐘
**AI 可自動執行**: ✅ 是

### 前置準備

```
等待 Katherine 提供：
☐ 新的 D1 Database ID
  位置：Cloudflare Dashboard → D1
  格式：UUID
```

### Prompt 1: 更新 Database ID

```
[信息提供]
新的 Database ID：[NEW_DATABASE_ID_HERE]
舊的 Database ID：d15ec66a-762c-40a2-bc8e-d64a1c8eb440

[任務]
參考 technical_docs/transfer_guide/TRANSFER_QUICK_REFERENCE.md
「資料庫遷移」部分

請幫我更新 backend/wrangler.jsonc 中的 Database ID。

執行步驟：
1. 找到 wrangler.jsonc 中的舊 Database ID
2. 替換為新的 Database ID
3. 驗證修改

使用 sed 命令或 Composer 編輯都可以。

完成後顯示：
grep '"database_id"' backend/wrangler.jsonc
```

### Prompt 2: 驗證資料庫連接

```
[任務]
驗證新的資料庫是否正確連接。

執行步驟：
1. 部署後端（wrangler deploy）
2. 測試資料庫連接
3. 檢查是否有錯誤

如果有錯誤，提出解決方案。
```

**檢查清單**:
- [ ] Database ID 已更新
- [ ] wrangler.jsonc 驗證無誤
- [ ] 資料庫連接測試通過

---

## ✅ Phase 5: 驗證和測試

**何時執行**: Phase 4 完成後
**預期時間**: 15-20 分鐘
**AI 可自動執行**: ✅ 是

### Prompt 1: 執行完整的部署前檢查清單

```
[任務]
參考 technical_docs/transfer_guide/TRANSFER_QUICK_REFERENCE.md
「✅ 部署前檢查清單」

請幫我執行所有驗證檢查。對於每個檢查：
1. 執行命令
2. 顯示結果
3. 告訴我是否通過 (✅ 或 ❌)

檢查項目：
1️⃣ 沒有遺漏的舊值
2️⃣ Git 配置
3️⃣ 配置檔案（account_id, database_id）
4️⃣ Wrangler Secrets 列表

最後提供完整的驗證報告。
```

### Prompt 2: 部署測試

```
[任務]
執行部署測試以確保一切正常。

執行步驟：
1. 部署後端：cd backend && wrangler deploy
2. 驗證部署：curl -I https://coach-backend.katherine84522.workers.dev
3. 檢查日誌是否有錯誤

如果成功，應該返回 200 狀態碼。
如果有錯誤，提出修復建議。

顯示部署結果。
```

### Prompt 3: 最終驗證報告

```
[任務]
基於之前的所有檢查，提供最終驗證報告。

報告應包含：
✅ 已完成的項目（綠色 ✅）
❌ 需要修復的項目（紅色 ❌）
⚠️ 警告信息（黃色 ⚠️）

最後告訴我是否可以進行 Phase 6（域名遷移）。
```

**檢查清單**:
- [ ] 所有驗證檢查通過
- [ ] 部署測試成功
- [ ] 沒有錯誤或警告
- [ ] 準備進行 Phase 6

---

## 🌐 Phase 6: 域名遷移至 coachrocks.com

**何時執行**: Phase 5 完全通過，應用穩定運行後
**預期時間**: 45-60 分鐘（包含手動步驟）
**AI 可自動執行**: ✅ 部分

### Prompt 1: 域名購買和驗證（MANUAL_DOMAIN_001）

```
[前置信息]
新域名：coachrocks.com

[任務]
這是一個手動步驟。請提醒 Katherine 執行以下操作：

1️⃣ 購買域名
   - 選項 A：通過 Cloudflare Registrar（推薦）
   - 選項 B：通過其他註冊商（GoDaddy、Namecheap等）

2️⃣ 在 Cloudflare 中添加域名
   - 登入 https://dash.cloudflare.com
   - 點擊 "Add a Site"
   - 輸入 "coachrocks.com"
   - 等待驗證（5-30 分鐘）

3️⃣ 驗證域名狀態
   應該看到 "Active" 狀態和 "Active Nameserver"

完成後，請告訴我：
- 域名購買確認
- Cloudflare Dashboard 中的域名狀態
- DNS 記錄是否可編輯
```

### Prompt 2: 批量更新域名（AUTO_009）

```
[信息提供]
舊的後端域名：coach-backend.katherine84522.workers.dev
新的後端域名：api.coachrocks.com

舊的前端域名：coach-rocks-frontend.pages.dev
新的前端域名：coachrocks.com

[任務]
參考 technical_docs/transfer_guide/PROJECT_OWNERSHIP_TRANSFER_GUIDE.md
「自動化操作 1: 批量更新域名（AUTO_009）」

請幫我批量替換所有檔案中的域名。

執行步驟：
1️⃣ 替換後端域名
2️⃣ 替換前端域名
3️⃣ 更新 CORS 允許來源
4️⃣ 驗證沒有遺漏

完成後顯示被修改的檔案數量和驗證結果。
```

### Prompt 3: 更新 Google OAuth（AUTO_010）

```
[任務]
參考 technical_docs/transfer_guide/PROJECT_OWNERSHIP_TRANSFER_GUIDE.md
「自動化操作 2: 更新 Google OAuth（AUTO_010）」

Google OAuth Redirect URI 需要更新：

舊值：https://coach-backend.katherine84522.workers.dev/api/auth/google/callback
新值：https://api.coachrocks.com/api/auth/google/callback

請幫我在代碼中更新此值，然後提醒：
「需要在 Google Cloud Console 中手動更新 Authorized redirect URIs」

執行步驟：
1️⃣ 在代碼中搜尋舊的 Redirect URI
2️⃣ 替換為新的 Redirect URI
3️⃣ 驗證替換成功
4️⃣ 提供手動步驟提醒

手動步驟：
- 登入 https://console.cloud.google.com/
- 前往 OAuth 應用設置
- 更新 Authorized redirect URIs
- 保存更改
```

### Prompt 4: Cloudflare 自訂域名配置（手動步驟）

```
[前置信息]
新域名已驗證：coachrocks.com

[任務]
這是手動步驟。請提醒 Katherine 執行以下操作：

1️⃣ 配置 Workers 自訂域名（MANUAL_DOMAIN_002）
   - Cloudflare Dashboard → Workers → coach-backend → Settings
   - Domains & Routes → Add Route
   - Route Pattern: api.coachrocks.com/*
   - Worker: coach-backend
   - 保存並等待 SSL 證書頒發（24 小時）

2️⃣ 配置 Pages 自訂域名（MANUAL_DOMAIN_003）
   - Cloudflare Dashboard → Pages → coach-rocks-frontend → Custom domains
   - 添加域名：coachrocks.com
   - 可選：添加 www 重定向 (www.coachrocks.com)
   - 驗證 DNS 配置

3️⃣ 配置域名重定向（MANUAL_DOMAIN_004）
   舊域名應重定向到新域名：
   - coach-backend.katherine84522.workers.dev → api.coachrocks.com
   - coach-rocks-frontend.pages.dev → coachrocks.com

   兩種方法：
   - 方法 A：使用 Cloudflare Redirect Rules（推薦）
   - 方法 B：修改代碼添加重定向邏輯

完成後，請告訴我上述三個步驟都已完成。
```

### Prompt 5: 驗證域名轉移完整性（AUTO_011）

```
[任務]
參考 technical_docs/transfer_guide/TRANSFER_QUICK_REFERENCE.md
「第 6 階段 → Step 7」

請幫我驗證域名轉移是否完整。

執行驗證檢查：
1️⃣ API 健康檢查
   curl -I https://api.coachrocks.com/api/health

2️⃣ 前端健康檢查
   curl -I https://coachrocks.com

3️⃣ 舊域名重定向檢查
   curl -I https://coach-backend.katherine84522.workers.dev

4️⃣ DNS 配置檢查
   dig coachrocks.com
   dig api.coachrocks.com

對於每個檢查：
- 顯示結果
- 標記為 ✅ (通過) 或 ❌ (失敗)
- 如果失敗，提出修復建議

最後提供完整的域名轉移驗證報告。
```

**檢查清單**:
- [ ] 域名已購買並驗證
- [ ] 域名值已批量更新
- [ ] Google OAuth Redirect URI 已更新
- [ ] Workers 自訂域名已配置
- [ ] Pages 自訂域名已配置
- [ ] 域名重定向已配置
- [ ] 所有驗證檢查通過
- [ ] SSL 證書已頒發（24 小時後檢查）

---

## 🎉 轉移完成確認

### Prompt: 最終完成報告

```
[任務]
基於所有 Phase 的完成，提供最終轉移完成報告。

報告應包含：
✅ 已完成的所有 Phase（1-6）
✅ 所有自動化操作的執行狀態
✅ 所有手動步驟的完成確認
✅ 最終驗證結果

最後提供以下建議：
- 後續監控建議（監控應用狀態、錯誤日誌等）
- 備份和恢復計劃
- 定期檢查項目

確認轉移是否完全成功，可以關閉轉移進程。
```

---

## 📊 Prompt 使用快速參考

### 按順序執行

```
1️⃣ 初始化：環境檢查
2️⃣ Phase 1：信息準備（等待 Katherine）
3️⃣ Phase 2：自動化 URL 更新 (3 個 Prompt)
4️⃣ Phase 3：OAuth & RESEND (3 個 Prompt)
5️⃣ Phase 4：資料庫遷移 (2 個 Prompt)
6️⃣ Phase 5：驗證測試 (3 個 Prompt)
7️⃣ Phase 6：域名遷移 (5 個 Prompt + 手動步驟)
8️⃣ 最終：轉移完成確認
```

### Cursor Composer 快捷方式

1. 按 `Cmd+Shift+I`（Mac）打開 Composer
2. 複製上方 Prompt
3. 貼到 Composer
4. 檢查 Prompt 中的 `[信息提供]` 是否已填入
5. 點擊執行或讓 AI 直接執行

### 進度追蹤

在本文件中記錄進度：

```
Phase 1：☐ 準備信息
Phase 2：☐ Step 1 ☐ Step 2 ☐ Step 3
Phase 3：☐ OAuth ☐ RESEND ☐ 其他 Secrets
Phase 4：☐ 更新 ID ☐ 驗證連接
Phase 5：☐ 完整檢查 ☐ 部署測試 ☐ 最終報告
Phase 6：☐ 域名購買 ☐ 批量更新 ☐ 配置自訂域名 ☐ 驗證
最終：☐ 完成確認
```

---

## 🆘 如果 Prompt 執行失敗

### 常見問題

**Q: Cursor Composer 說「權限不足」**
```
A: 執行 Cursor，確認已打開正確的項目目錄
   關閉 Composer，重新嘗試
```

**Q: Bash 命令執行失敗**
```
A: 檢查是否在正確的目錄中（應該是 coach-rocks-main）
   查看錯誤信息，告訴 Cursor AI 具體的錯誤
```

**Q: Secret 設置失敗**
```
A: 確認已登入 Wrangler：wrangler login
   檢查 API Token 是否有效
   嘗試手動執行：wrangler secret put [SECRET_NAME]
```

### 求助步驟

1. 複製完整的錯誤信息
2. 在新的 Composer Prompt 中貼上錯誤
3. 請 Cursor AI 幫你診斷和修復
4. 參考 PROJECT_OWNERSHIP_TRANSFER_GUIDE.md 的「回滾計劃」

---

## 💡 最佳實踐

✅ **應該做**:
- 逐個 Phase 執行，每個 Phase 都要驗證
- 在執行複雜的 Prompt 前備份關鍵檔案
- 隨時檢查終端輸出和錯誤信息
- 遇到問題立即停止，不要盲目繼續

❌ **不應該做**:
- 跳過驗證步驟
- 同時執行多個 Phase
- 忽視錯誤信息
- 不備份就進行批量替換

---

## 🔗 相關文件

- 📖 完整指南: `PROJECT_OWNERSHIP_TRANSFER_GUIDE.md`
- ⚡ 快速參考: `TRANSFER_QUICK_REFERENCE.md`
- 🎨 Cursor 工作流: `CURSOR_WORKFLOW.md`
- 📋 總覽: `README.md`

---

**準備好了嗎？打開 Cursor，複製第一個 Prompt 開始轉移吧！** 🚀

*Cursor AI Agent 優化 | 2025-11-19*
