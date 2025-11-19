# CoachRocks AI - 環境變數設置完整教學

**文件版本**: 1.0
**最後更新**: 2025-11-19
**適用於**: Cloudflare Workers & GitLab CI/CD
**預計時間**: 15-20 分鐘

---

## 📋 目錄

- [概述](#概述)
- [Part 1: Cloudflare Workers Secrets](#part-1-cloudflare-workers-secrets)
- [Part 2: GitLab CI/CD Variables](#part-2-gitlab-cicd-variables)
- [驗證設置](#驗證設置)
- [常見問題](#常見問題)
- [檢查清單](#檢查清單)

---

## 概述

本教學將引導您完成 CoachRocks AI 專案所需的環境變數設置。

### 需要設置的變數

| 變數名 | 設置位置 | 用途 | 必須 |
|--------|---------|------|------|
| `FRONTEND_URL` | Cloudflare Workers | CORS 允許來源 | ✅ |
| `CLOUDFLARE_ACCOUNT_ID` | GitLab CI/CD | Cloudflare 帳戶識別 | ✅ |
| `BACKEND_URL` | GitLab CI/CD | 後端 API URL | ✅ |
| `FRONTEND_URL` | GitLab CI/CD | 前端應用 URL | ✅ |

### 前置需求

- ✅ Cloudflare 帳號並有 Workers 管理權限
- ✅ GitLab 帳號並有專案 Maintainer/Owner 權限
- ✅ （CLI 方法）已安裝 Node.js 和 npm

---

## Part 1: Cloudflare Workers Secrets

### 為什麼需要設置？

Cloudflare Workers Secrets 用於安全地儲存敏感資訊，在代碼運行時可以訪問這些值，但值本身不會暴露在代碼或 Dashboard 中。

### 需要設置的 Secret

```
FRONTEND_URL = https://coach-rocks-frontend.pages.dev
```

**用途**: 允許前端應用透過 CORS 訪問後端 API

---

### 方法一：使用 Wrangler CLI（推薦）

**優點**: 快速、簡單、適合開發者

#### 步驟 1: 安裝 Wrangler

```bash
# 檢查是否已安裝
wrangler --version

# 如果未安裝，執行安裝
npm install -g wrangler

# 預期輸出類似
# wrangler 4.45.2
```

#### 步驟 2: 登入 Cloudflare

```bash
wrangler login
```

**會發生什麼**:
1. 自動開啟瀏覽器
2. 要求您登入 Cloudflare 帳號
3. 授權 Wrangler 訪問您的帳戶
4. 完成後返回終端

**驗證登入**:
```bash
wrangler whoami

# 預期輸出
# 👋 You are logged in with an OAuth Token, associated with the email '<your-email>@example.com'!
```

#### 步驟 3: 進入專案目錄

```bash
cd /path/to/coach-rocks-main/backend
```

**替換 `/path/to/` 為您的實際路徑**

#### 步驟 4: 設置 FRONTEND_URL Secret

```bash
wrangler secret put FRONTEND_URL
```

**互動過程**:
```
⛅️ wrangler 4.45.2
─────────────────────────────────────────────
✔ Enter a secret value: ›
```

**輸入**（不含引號）:
```
https://coach-rocks-frontend.pages.dev
```

**按 Enter 後看到**:
```
🌀 Creating the secret for the Worker "coach-backend"
✨ Success! Uploaded secret FRONTEND_URL
```

#### 步驟 5: 驗證 Secret

```bash
wrangler secret list
```

**預期輸出**（應包含 FRONTEND_URL）:
```json
[
  {
    "name": "FRONTEND_URL",
    "type": "secret_text"
  },
  // ... 其他 secrets
]
```

✅ **完成！** Cloudflare Workers Secret 設置完成

---

### 方法二：使用 Cloudflare Dashboard

**優點**: 視覺化介面、不需要 CLI 工具

#### 步驟 1: 登入 Cloudflare

1. 開啟瀏覽器
2. 前往：**https://dash.cloudflare.com/**
3. 輸入您的帳號密碼登入

#### 步驟 2: 前往 Workers & Pages

1. 在左側導航欄，點擊 **"Workers & Pages"**

   ```
   左側選單:
   ├─ Home
   ├─ Websites
   ├─ Analytics & Logs
   └─ ⭐ Workers & Pages  ← 點擊這裡
   ```

2. 在 Workers 列表中，找到並點擊 **"coach-backend"**

   如果看不到，請檢查：
   - 右上角帳戶切換器（確認在正確的帳戶下）
   - Worker 是否存在

#### 步驟 3: 進入 Settings

1. 在 Worker 詳情頁面，點擊頂部的 **"Settings"** 標籤

   ```
   頂部標籤:
   Overview | Metrics | Logs | Settings | Triggers
                                 ^^^^^^^^
   ```

2. 向下滾動到 **"Variables and Secrets"** 區塊

#### 步驟 4: 添加 Secret

1. 在 "Variables and Secrets" 區塊中，點擊 **"Add"** 按鈕

2. 在彈出的表單中：

   **Type（類型）**:
   - 選擇 **"Secret"** （⚠️ 不是 "Variable"）

   **Variable name（變數名稱）**:
   ```
   FRONTEND_URL
   ```

   **Value（值）**:
   ```
   https://coach-rocks-frontend.pages.dev
   ```

3. 點擊 **"Add variable"** 或 **"Save"**

#### 步驟 5: 部署變更（重要！）

**⚠️ 關鍵步驟**: 添加 Secret 後必須部署才會生效

1. 在同一頁面頂部或底部，找到 **"Deploy"** 按鈕
2. 點擊 **"Deploy"**
3. 等待部署完成（通常 10-30 秒）
4. 看到成功訊息

#### 步驟 6: 驗證

1. 返回 **Settings** > **Variables and Secrets**
2. 應該看到 `FRONTEND_URL` 列在 **"Secrets"** 區塊
3. 值顯示為 `••••••`（隱藏狀態）

✅ **完成！** Cloudflare Workers Secret 設置完成

---

### 🟢 可選：DEV_FRONTEND_URL

**僅在需要自訂開發環境前端 port 時設置**

如果您的本地開發環境使用預設的 `http://localhost:5173`，可以跳過此步驟。

**如需設置**:

**CLI 方法**:
```bash
wrangler secret put DEV_FRONTEND_URL
# 輸入: http://localhost:5173
# 或其他 port，例如: http://localhost:5174
```

**Dashboard 方法**:
- 與上述步驟相同
- Variable name: `DEV_FRONTEND_URL`
- Value: `http://localhost:5173`（或您的自訂 port）

---

## Part 2: GitLab CI/CD Variables

### 為什麼需要設置？

GitLab CI/CD Variables 用於在自動化部署流程中提供環境配置，避免將敏感信息（如 Account ID）硬編碼在代碼中。

### 需要設置的 Variables

| Variable 名稱 | 值 | Protected | Masked |
|--------------|---|-----------|--------|
| `CLOUDFLARE_ACCOUNT_ID` | `9288c023577aa2f6ce20582b6c4bdda0` | ✅ | ✅ |
| `BACKEND_URL` | `https://coach-backend.gamepig1976.workers.dev` | ✅ | ❌ |
| `FRONTEND_URL` | `https://coach-rocks-frontend.pages.dev` | ✅ | ❌ |

---

### 詳細設置步驟

#### 步驟 1: 前往 GitLab CI/CD Settings

**方法 A - 直接連結**（推薦）:
```
https://gitlab.com/coach-rocks/coach-rocks/-/settings/ci_cd
```
直接在瀏覽器中開啟上述連結

**方法 B - 手動導航**:

1. 前往 **https://gitlab.com/**
2. 登入您的 GitLab 帳號
3. 點擊左上角 **Projects** > **Your projects**
4. 找到並點擊 **coach-rocks/coach-rocks** 專案
5. 在左側邊欄，點擊 **Settings** > **CI/CD**

#### 步驟 2: 展開 Variables 區塊

1. 在 CI/CD Settings 頁面，找到 **"Variables"** 區塊
2. 點擊右側的 **"Expand"** 按鈕
3. 應該會看到現有變數列表（如果有的話）

---

### Variable 1: CLOUDFLARE_ACCOUNT_ID 🔒

**這是最敏感的變數，需要同時 Protected 和 Masked**

#### 步驟 1: 點擊 Add variable

在 Variables 區塊中，點擊 **"Add variable"** 按鈕

#### 步驟 2: 填寫表單

**基本資訊**:

| 欄位 | 值 |
|------|---|
| **Key** | `CLOUDFLARE_ACCOUNT_ID` |
| **Value** | `9288c023577aa2f6ce20582b6c4bdda0` |
| **Type** | Variable（預設） |

**範圍設置**:

| 欄位 | 值 |
|------|---|
| **Environment scope** | All (default) 或輸入 `*` |

**保護設置**（重要！）:

| 選項 | 勾選 | 說明 |
|------|------|------|
| **Protect variable** | ✅ 勾選 | 只有 protected branches（如 main）可訪問 |
| **Mask variable** | ✅ 勾選 | 在 Pipeline 日誌中顯示為 `[MASKED]` |
| **Expand variable reference** | ❌ 不勾選 | 不展開變數引用 |

**Visibility** (2025 新介面):

如果看到此選項，選擇 **"Masked and hidden"**（最安全）

#### 步驟 3: 儲存

1. 檢查所有欄位填寫正確
2. 點擊 **"Add variable"** 按鈕
3. 變數應該出現在列表中

#### 驗證

確認列表中顯示：
```
CLOUDFLARE_ACCOUNT_ID
  Protected: Yes
  Masked: Yes
  Environments: All (default)
```

✅ **Variable 1 完成！**

---

### Variable 2: BACKEND_URL

**後端 API 基礎 URL**

#### 步驟 1: 點擊 Add variable

再次點擊 **"Add variable"** 按鈕

#### 步驟 2: 填寫表單

**基本資訊**:

| 欄位 | 值 |
|------|---|
| **Key** | `BACKEND_URL` |
| **Value** | `https://coach-backend.gamepig1976.workers.dev` |
| **Type** | Variable |

**範圍設置**:

| 欄位 | 值 |
|------|---|
| **Environment scope** | All (default) 或 `*` |

**保護設置**:

| 選項 | 勾選 | 說明 |
|------|------|------|
| **Protect variable** | ✅ 勾選 | Protected |
| **Mask variable** | ❌ **不勾選** | ⚠️ URL 包含 `://` 無法被 mask |
| **Expand variable reference** | ❌ 不勾選 | 不展開 |

**Visibility**:

選擇 **"Visible"**（因為無法 mask）

#### 步驟 3: 儲存

點擊 **"Add variable"**

**⚠️ 注意**: 如果勾選 Mask 可能會出現錯誤或警告，這是正常的（URL 包含特殊字符）

#### 驗證

確認列表中顯示：
```
BACKEND_URL
  Protected: Yes
  Masked: No
  Environments: All (default)
```

✅ **Variable 2 完成！**

---

### Variable 3: FRONTEND_URL

**前端應用 URL**

#### 步驟 1: 點擊 Add variable

第三次點擊 **"Add variable"** 按鈕

#### 步驟 2: 填寫表單

**基本資訊**:

| 欄位 | 值 |
|------|---|
| **Key** | `FRONTEND_URL` |
| **Value** | `https://coach-rocks-frontend.pages.dev` |
| **Type** | Variable |

**範圍設置**:

| 欄位 | 值 |
|------|---|
| **Environment scope** | All (default) 或 `*` |

**保護設置**:

| 選項 | 勾選 | 說明 |
|------|------|------|
| **Protect variable** | ✅ 勾選 | Protected |
| **Mask variable** | ❌ 不勾選 | URL 無法 mask |
| **Expand variable reference** | ❌ 不勾選 | 不展開 |

**Visibility**:

選擇 **"Visible"**

#### 步驟 3: 儲存

點擊 **"Add variable"**

#### 驗證

確認列表中顯示：
```
FRONTEND_URL
  Protected: Yes
  Masked: No
  Environments: All (default)
```

✅ **Variable 3 完成！**

---

## 驗證設置

### Cloudflare Workers Secrets

**CLI 驗證**:
```bash
cd backend
wrangler secret list
```

**預期輸出**（應包含）:
```json
[
  {
    "name": "FRONTEND_URL",
    "type": "secret_text"
  }
]
```

**Dashboard 驗證**:
1. Cloudflare Dashboard > Workers & Pages > coach-backend
2. Settings > Variables and Secrets
3. 確認 **Secrets** 區塊有 `FRONTEND_URL`（值顯示為 `••••••`）

---

### GitLab CI/CD Variables

**訪問**:
```
GitLab > coach-rocks 專案 > Settings > CI/CD > Variables
```

**應該看到 3 個變數**:

| Key | Protected | Masked | Environments |
|-----|-----------|--------|--------------|
| CLOUDFLARE_ACCOUNT_ID | ✅ Yes | ✅ Yes | All (default) |
| BACKEND_URL | ✅ Yes | ❌ No | All (default) |
| FRONTEND_URL | ✅ Yes | ❌ No | All (default) |

**值的顯示**:
- Masked 變數：顯示為 `•••••`
- 非 Masked 變數：點擊 "Reveal values" 才顯示完整值

---

## 常見問題

### Q1: Wrangler 提示 "Not logged in"

**問題**:
```
⛔️ Error: Not logged in
```

**解決方法**:
```bash
wrangler login
# 會開啟瀏覽器進行 OAuth 認證
```

---

### Q2: GitLab 無法 Mask URL 變數

**問題**: 勾選 "Mask variable" 時出現錯誤或警告

**原因**: URL 包含不支援的字符（`://`、`.`）

**解決方法**:
- ✅ 不勾選 "Mask variable"
- ✅ URL 本身不包含密鑰，不 mask 也是安全的
- ✅ 已有 "Protect variable" 保護

---

### Q3: 找不到 coach-backend Worker

**問題**: Cloudflare Dashboard 中看不到 Worker

**檢查事項**:
1. 確認在正確的 Cloudflare 帳戶（右上角帳戶切換器）
2. 確認 Worker 已部署（可能名稱不同）
3. 檢查 `backend/wrangler.jsonc` 的 `name` 欄位

**驗證 Worker 名稱**:
```bash
cd backend
cat wrangler.jsonc | grep '"name"'
# 應輸出: "name": "coach-backend",
```

---

### Q4: Protected 變數在測試分支無法使用

**問題**: 非 main 分支的 Pipeline 失敗，提示找不到變數

**原因**: Protected 變數只在 protected branches 可用

**解決方法**:

**選項 1** - 設置測試分支為 protected:
1. GitLab > Settings > Repository > Protected Branches
2. 添加測試分支（如 `develop`）

**選項 2** - 臨時取消 Protect（不推薦）:
1. 編輯變數
2. 取消勾選 "Protect variable"
3. 測試完成後重新勾選

**選項 3** - 直接在 main 分支測試（推薦用於生產設置）

---

### Q5: Secret 設置後代碼仍無法訪問

**問題**: 代碼中 `env.FRONTEND_URL` 為 undefined

**檢查事項**:

1. **Dashboard 方法需要 Deploy**:
   - 設置後必須點擊 "Deploy" 按鈕
   - 等待部署完成（10-30 秒）

2. **等待生效**:
   - CLI 方法：通常立即生效
   - Dashboard 方法：需要部署後生效
   - 建議等待 30-60 秒後重試

3. **檢查 Worker 名稱**:
   - Secret 關聯到特定 Worker
   - 確認 Worker 名稱正確

4. **檢查 types.ts**:
   ```typescript
   // backend/src/types.ts 應包含
   export interface Env {
     FRONTEND_URL: string;
     // ...
   }
   ```

---

### Q6: GitLab Pipeline 提示變數不存在

**問題**: CI/CD 日誌顯示 `CLOUDFLARE_ACCOUNT_ID: unbound variable`

**可能原因**:

1. **變數名稱拼寫錯誤**:
   - 檢查 Key 是否完全一致（大小寫敏感）
   - `CLOUDFLARE_ACCOUNT_ID` ≠ `Cloudflare_Account_Id`

2. **Environment scope 不匹配**:
   - 確認設置為 "All (default)" 或 `*`

3. **變數尚未儲存**:
   - 重新檢查變數列表
   - 確認有點擊 "Add variable"

---

## 檢查清單

### Cloudflare Workers

**設置前**:
- [ ] 已登入 Cloudflare 帳號
- [ ] 有 Workers 管理權限
- [ ] （CLI）已安裝 wrangler 並登入

**設置過程**:
- [ ] 已設置 `FRONTEND_URL` Secret
- [ ] 值為：`https://coach-rocks-frontend.pages.dev`
- [ ] （Dashboard）已點擊 Deploy

**驗證**:
- [ ] `wrangler secret list` 顯示 FRONTEND_URL
- [ ] 或 Dashboard 顯示 Secret（值為 `••••••`）

---

### GitLab CI/CD

**設置前**:
- [ ] 已登入 GitLab 帳號
- [ ] 有專案 Maintainer 或 Owner 權限
- [ ] 已前往 Settings > CI/CD > Variables

**Variable 1 - CLOUDFLARE_ACCOUNT_ID**:
- [ ] Key: `CLOUDFLARE_ACCOUNT_ID`
- [ ] Value: `9288c023577aa2f6ce20582b6c4bdda0`
- [ ] ✅ Protect variable: 已勾選
- [ ] ✅ Mask variable: 已勾選
- [ ] Environment scope: All (default)

**Variable 2 - BACKEND_URL**:
- [ ] Key: `BACKEND_URL`
- [ ] Value: `https://coach-backend.gamepig1976.workers.dev`
- [ ] ✅ Protect variable: 已勾選
- [ ] ❌ Mask variable: 未勾選（URL 無法 mask）
- [ ] Environment scope: All (default)

**Variable 3 - FRONTEND_URL**:
- [ ] Key: `FRONTEND_URL`
- [ ] Value: `https://coach-rocks-frontend.pages.dev`
- [ ] ✅ Protect variable: 已勾選
- [ ] ❌ Mask variable: 未勾選
- [ ] Environment scope: All (default)

**驗證**:
- [ ] Variables 列表顯示所有 3 個變數
- [ ] 每個變數的 Protected 狀態正確
- [ ] 每個變數的 Masked 狀態正確

---

### 總體檢查

- [ ] 總共設置 4 個環境變數（1 個 Cloudflare + 3 個 GitLab）
- [ ] 所有設置已驗證成功
- [ ] 已等待 30-60 秒讓變更生效

---

## 參考資料

### 官方文檔

**Cloudflare Workers**:
- Secrets 管理: https://developers.cloudflare.com/workers/configuration/secrets/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/commands/

**GitLab CI/CD**:
- Variables 文檔: https://docs.gitlab.com/ci/variables/
- Protected Variables: https://docs.gitlab.com/ci/variables/#protect-a-cicd-variable
- Masked Variables: https://docs.gitlab.com/ci/variables/#mask-a-cicd-variable

---

## 下一步

完成本教學後，您已成功設置所有必要的環境變數。

**後續步驟**:
1. ✅ 修改代碼，將硬編碼替換為環境變數
2. ✅ 測試部署流程
3. ✅ 驗證功能正常運作

---

**文件版本**: 1.0
**製作日期**: 2025-11-19
**製作者**: CoachRocks AI Development Team
**審核狀態**: ✅ 已驗證

**問題回報**: 如遇到本教學未涵蓋的問題，請聯繫技術團隊。
