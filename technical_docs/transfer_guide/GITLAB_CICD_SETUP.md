# GitLab CI/CD 轉移流程 - 完整設置指南

**更新時間**: 2025-11-19
**目標**: 完全自動化 CoachRocks 專案轉移，無需本地執行

---

## 🎯 概覽

使用 GitLab CI/CD Pipeline 進行完全自動化的專案轉移，具有以下優勢：

- ✅ **跨平台支援** - 無論客戶使用 Windows/Mac/Linux
- ✅ **無需本地環境** - GitLab Runner 負責執行
- ✅ **手動檢查點** - 關鍵步驟需要人工確認
- ✅ **完整日誌** - 所有操作都有可追蹤的記錄
- ✅ **自動化驗證** - 每步都有完整性檢查

---

## 📋 轉移流程（5 個 Phase）

| Phase | 名稱 | 執行者 | 狀態 |
|-------|------|--------|------|
| **1** | Cloudflare 帳戶準備 | 使用者（手動）| ⏸️ 需等待 |
| **2** | 自動化 URL 更新 | GitLab CI | ⚙️ 自動 |
| **3** | Google OAuth & RESEND | 使用者 + GitLab | 🔄 混合 |
| **4** | 資料庫遷移 | 使用者 + GitLab | 🔄 混合 |
| **5** | 驗證和部署 | GitLab CI | ⚙️ 自動 |

---

## 🚀 快速開始（5 分鐘）

### 步驟 1: 檢查 GitLab CI/CD 配置

確認 `.gitlab-ci.yml` 已在專案根目錄：

```bash
# 檢查文件是否存在
ls -la .gitlab-ci.yml

# 查看配置
cat .gitlab-ci.yml | head -50
```

### 步驟 2: 訪問 GitLab CI/CD 設置

在 GitLab 專案中導航：

```
專案 → Settings → CI/CD → Variables
```

### 步驟 3: 添加必要的 Variables

根據下面的「Variables 設置」部分配置。

---

## 🔧 GitLab Variables 設置指南

### 必需的 Variables 列表

| 變數名稱 | 值 | 類型 | 時機 | 說明 |
|---------|-----|------|------|------|
| `NEW_ACCOUNT_ID` | `[新帳戶 ID]` | String | Phase 1 後 | Cloudflare 新帳戶的 Account ID |
| `GOOGLE_CLIENT_ID` | `[OAuth Client ID]` | String | Phase 3 前 | Google Cloud Console 獲取 |
| `GOOGLE_CLIENT_SECRET` | `[OAuth Secret]` | String (Protected) | Phase 3 前 | Google Cloud Console 獲取（敏感） |
| `NEW_DATABASE_ID` | `[新 Database ID]` | String | Phase 4 後 | 新帳戶的 D1 Database ID |

---

## 📖 詳細設置步驟

### Phase 1: Cloudflare 帳戶準備（手動）

1. **登入 Cloudflare Dashboard**
   - 前往 https://dash.cloudflare.com
   - 使用 使用者 的新帳戶登入

2. **獲取 Account ID**
   ```
   位置: Dashboard 右上角 → 帳戶 ID
   格式: 32 位的十六進制字符串（例：a1b2c3d4e5f6...）
   ```

3. **建立 Cloudflare Workers**
   ```
   Workers → Create service
   名稱: coach-backend
   默認環境即可
   記錄 URL: https://coach-backend.katherine84522.workers.dev
   ```

4. **建立 Cloudflare Pages**
   ```
   Pages → Create project
   名稱: coach-rocks-frontend
   記錄 URL: https://coach-rocks-frontend.pages.dev
   ```

5. **設置 NEW_ACCOUNT_ID Variable**

   在 GitLab 中：
   ```
   設置 → CI/CD → Variables → Add Variable

   Key: NEW_ACCOUNT_ID
   Value: [複製的 Cloudflare Account ID]

   ☐ Protected: 可選
   ☐ Masked: 不需要（Account ID 不是敏感信息）

   Scope: All environments
   ```

6. **在 GitLab 中手動觸發 Pipeline**
   ```
   Build → Pipelines → Play (phase_1_wait_for_cloudflare_setup 旁邊)
   ```
   - Pipeline 會顯示設置步驟提示
   - 完成後，點擊下一個 Job 的 Play 按鈕

### Phase 2: 自動化 URL 更新（完全自動）

⏳ **無需操作** - GitLab CI/CD 將自動執行：

- ✓ AUTO_001: 批量更新後端 URL（gamepig1976 → katherine84522）
- ✓ AUTO_002: 更新 Git 用戶郵箱
- ✓ AUTO_003: 更新 Wrangler Account ID
- ✓ AUTO_005: 驗證沒有遺漏的舊值

所有操作都有詳細的日誌輸出。

### Phase 3: Google OAuth & RESEND 配置（混合）

#### Step 3.1: 建立 Google OAuth 憑證

1. **前往 Google Cloud Console**
   - https://console.cloud.google.com/

2. **建立新 OAuth 2.0 Client ID**
   ```
   Console 首頁 → 建立專案
   選擇 APIs & Services → Credentials → Create Credentials

   應用類型: Web application
   名稱: coach-rocks-katherine
   ```

3. **配置授權重定向 URI**
   ```
   Authorized redirect URIs:
   https://coach-backend.katherine84522.workers.dev/api/auth/google/callback
   ```

4. **複製 Credentials**
   ```
   下載 JSON 或複製：
   - Client ID (例: 123456789-xxxxx.apps.googleusercontent.com)
   - Client Secret (例: GOCSPX-xxxxx)
   ```

5. **在 GitLab 中設置 Variables**

   設置 1 - Google Client ID（普通）
   ```
   Key: GOOGLE_CLIENT_ID
   Value: [從 Google Cloud Console 複製]
   Protected: ☐ 不需要
   Masked: ☐ 不需要
   ```

   設置 2 - Google Client Secret（敏感）
   ```
   Key: GOOGLE_CLIENT_SECRET
   Value: [從 Google Cloud Console 複製]
   Protected: ☑️ 需要標記為 Protected
   Masked: ☑️ 需要標記為 Masked（不會在日誌中顯示）
   ```

6. **在 GitLab 中手動觸發下一個 Job**
   ```
   Build → Pipelines → Play (phase_3_wait_for_oauth_credentials 旁邊)
   ```

#### Step 3.2: RESEND 郵件服務

⏳ **無需額外操作** - 已自動設置：

- 開發環境: `onboarding@resend.dev`（立即可用）
- 生產環境: `noreply@coachrocks.com`（Phase 6 驗證）

RESEND_API_KEY 將在部署時從舊帳戶自動複製。

### Phase 4: 資料庫遷移（混合）

1. **選擇遷移選項**

   **選項 A: 導出 + 導入（推薦，保留數據）**
   ```
   # 在本地執行
   cd backend
   wrangler d1 export coachdb > backup.sql

   # 下載 backup.sql 文件
   ```

   **選項 B: 新建空資料庫（快速，遺失數據）**
   ```
   # 只需在 Cloudflare Dashboard 手動建立
   ```

2. **在新帳戶建立 D1 資料庫**
   ```
   Cloudflare Dashboard → D1 → Create database
   名稱: coachdb

   複製 Database ID
   ```

3. **設置 NEW_DATABASE_ID Variable**
   ```
   Key: NEW_DATABASE_ID
   Value: [複製的 Database ID]
   Protected: ☐ 不需要
   Masked: ☐ 不需要
   ```

4. **在 GitLab 中手動觸發 Job**
   ```
   Build → Pipelines → Play (phase_4_wait_for_database_setup 旁邊)
   ```

5. **如選擇選項 A，導入備份**
   ```
   # 在新帳戶本地執行
   cd backend
   wrangler d1 import coachdb backup.sql
   ```

### Phase 5: 驗證和部署（完全自動）

⏳ **無需操作** - GitLab CI/CD 將：

- ✓ 最終驗證（無舊值遺漏）
- ✓ 構建後端
- ✓ 構建前端
- ✓ 生成編譯產物

### Phase 6: 實際部署（本地執行）

⚠️ **最後部署需要在本地執行**（需要 Cloudflare 認證）

```bash
# 1. 設置環境變數
export CLOUDFLARE_API_TOKEN=xxx  # Cloudflare API Token
export CLOUDFLARE_ACCOUNT_ID=[新 Account ID]

# 2. 部署後端
cd backend
wrangler deploy

# 3. 部署前端
cd frontend
npm run build
wrangler pages deploy dist --project-name=coach-rocks-frontend

# 4. 設置 Secrets
cd backend
wrangler secret put GOOGLE_CLIENT_ID         # 輸入值
wrangler secret put GOOGLE_CLIENT_SECRET     # 輸入值
wrangler secret put GOOGLE_REDIRECT_URI      # 輸入值
wrangler secret put RESEND_API_KEY           # 輸入值

# 5. 驗證部署
curl -s https://coach-backend.katherine84522.workers.dev/api/health | jq .
```

---

## 📊 Pipeline 執行流程圖

```
Phase 1
├─ phase_1_wait_for_cloudflare_setup （⏸️ 手動觸發）
│  └─ 等待用戶設置 NEW_ACCOUNT_ID Variable
│
Phase 2（自動觸發）
├─ phase_2_batch_replace_urls
├─ phase_2_update_git_config
├─ phase_2_update_wrangler_account_id
└─ phase_2_verify_no_remnants
   └─ 驗證完成後自動進入 Phase 3
│
Phase 3（需手動觸發 OAuth）
├─ phase_3_wait_for_oauth_credentials （⏸️ 手動觸發）
│  └─ 等待用戶設置 GOOGLE_CLIENT_ID/SECRET Variables
├─ phase_3_setup_google_secrets
└─ phase_3_setup_resend
   └─ 驗證完成後自動進入 Phase 4
│
Phase 4（需手動觸發數據庫）
├─ phase_4_wait_for_database_setup （⏸️ 手動觸發）
│  └─ 等待用戶設置 NEW_DATABASE_ID Variable
└─ phase_4_update_database_id
   └─ 驗證完成後自動進入 Phase 5
│
Phase 5（完全自動）
├─ phase_5_final_verification
├─ phase_5_build_backend
├─ phase_5_build_frontend
└─ phase_5_deployment_summary
   └─ 提示本地部署步驟
```

---

## ✅ Variables 檢查清單

在開始轉移前，確保已設置：

```
□ NEW_ACCOUNT_ID（Phase 1 後設置）
□ GOOGLE_CLIENT_ID（Phase 3 前設置）
□ GOOGLE_CLIENT_SECRET（Phase 3 前設置，標記為 Protected + Masked）
□ NEW_DATABASE_ID（Phase 4 後設置）
```

在 GitLab 驗證：
```
設置 → CI/CD → Variables → 檢查上述 4 個變數已設置
```

---

## 🔍 監控 Pipeline 執行

### 查看 Pipeline 狀態

1. **在 GitLab 中導航**
   ```
   Build → Pipelines
   ```

2. **查看每個 Job 的詳細日誌**
   ```
   點擊 Job 名稱 → 查看完整輸出
   ```

3. **檢查 Artifacts**
   ```
   Pipeline 完成 → Artifacts → 下載編譯產物
   ```

### 常見日誌輸出

**成功**：
```
✅ URL 替換完成
✅ 驗證: 剩餘舊 URL = 0
✅ 所有驗證通過
```

**錯誤**：
```
❌ 錯誤: NEW_ACCOUNT_ID 未設置
❌ 錯誤: 還有 5 個舊 URL 未替換
```

---

## 🆘 常見問題

### Q1: Phase X Job 始終不觸發？

**A**: 檢查：
- [ ] 前一個 Phase 的 Job 已完成
- [ ] 相關 Variables 已設置
- [ ] 手動 Job（`when: manual`）需要點擊 Play 按鈕

### Q2: 提示「Variable XXX 未設置」？

**A**:
1. 前往 `Settings → CI/CD → Variables`
2. 確認變數名稱完全相符（區分大小寫）
3. 確認變數值正確（複製時避免多餘空格）

### Q3: URL 替換後仍有遺漏？

**A**: 檢查輸出日誌：
```
grep -r 'gamepig1976' . --exclude-dir=.git --exclude-dir=node_modules
```

手動修復，然後在 GitLab 中 Retry Job。

### Q4: 部署到 Cloudflare 失敗？

**A**: 確認：
- [ ] `CLOUDFLARE_API_TOKEN` 有效
- [ ] `CLOUDFLARE_ACCOUNT_ID` 正確
- [ ] `wrangler` 已安裝：`npm install -g wrangler`

---

## 📝 使用步驟總結

### Day 1: 準備（30 分鐘）

1. ✓ 確認 `.gitlab-ci.yml` 存在
2. ✓ 前往 Cloudflare Dashboard 記錄新帳戶 ID
3. ✓ 在 GitLab 設置 `NEW_ACCOUNT_ID` Variable
4. ✓ 觸發 Phase 1 Job

### Day 2: 自動化處理（15 分鐘）

1. ✓ 前往 Google Cloud Console 建立 OAuth
2. ✓ 在 GitLab 設置 `GOOGLE_CLIENT_ID` 和 `SECRET` Variables
3. ✓ 觸發 Phase 3 Job

### Day 3: 資料庫遷移（20 分鐘）

1. ✓ 選擇遷移方案（A 或 B）
2. ✓ 在 Cloudflare 建立新 D1 資料庫
3. ✓ 在 GitLab 設置 `NEW_DATABASE_ID` Variable
4. ✓ 觸發 Phase 4 Job
5. ✓ Phase 5 自動完成

### Day 4: 部署（30 分鐘）

1. ✓ 下載編譯產物（可選）
2. ✓ 執行本地部署指令
3. ✓ 驗證部署成功

---

## 🎯 最後確認

轉移完成後驗證：

```bash
# 1. 檢查後端
curl -s https://coach-backend.katherine84522.workers.dev/api/health

# 2. 檢查前端
curl -s https://coach-rocks-frontend.pages.dev | grep -o "title"

# 3. 檢查 Google OAuth
curl -s https://coach-backend.katherine84522.workers.dev/api/auth/google/init | jq .
```

✅ 所有檢查通過 → **轉移完成！**

---

## 📚 相關文件

- 📖 [PROJECT_OWNERSHIP_TRANSFER_GUIDE.md](./PROJECT_OWNERSHIP_TRANSFER_GUIDE.md) - 完整轉移指南
- ⚡ [TRANSFER_QUICK_REFERENCE.md](./TRANSFER_QUICK_REFERENCE.md) - 快速查閱
- 🤖 [cursor-transfer-agent.md](./cursor-transfer-agent.md) - Cursor IDE Prompts
