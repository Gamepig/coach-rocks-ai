# 階段一：環境變數設置詳細指引

**更新日期**: 2025-11-19
**版本**: 2.0 (基於 2025 年最新介面)
**預計時間**: 15-20 分鐘

---

## 📋 階段一概述

本階段需要設置以下環境變數：
- ✅ **Cloudflare Workers Secrets**: 1 個必須（FRONTEND_URL）
- ✅ **GitLab CI/CD Variables**: 3 個必須

**重要**: 請在修改代碼之前完成本階段所有設置，以確保部署順利。

---

## 🎯 Part A: Cloudflare Workers Secrets 設置

### 必須設置的 Secret

| Secret 名稱 | 值 | 用途 |
|------------|---|------|
| `FRONTEND_URL` | `https://coach-rocks-frontend.pages.dev` | CORS 允許來源 |

---

### 方法一：使用 Wrangler CLI（推薦）⏱️ 2 分鐘

#### 前置需求檢查
```bash
# 檢查 wrangler 是否已安裝
wrangler --version

# 如果未安裝，執行安裝
npm install -g wrangler

# 檢查是否已登入 Cloudflare
wrangler whoami
```

#### 設置步驟

**步驟 1**: 進入後端目錄
```bash
cd /Users/gamepig/projects/coach-rocks-main/backend
```

**步驟 2**: 設置 FRONTEND_URL Secret
```bash
wrangler secret put FRONTEND_URL
```

**步驟 3**: 輸入 Secret 值
當看到提示 `Enter a secret value:` 時，輸入：
```
https://coach-rocks-frontend.pages.dev
```
（不要包含引號）

**步驟 4**: 確認成功訊息
應該看到類似輸出：
```
✔ Successfully created secret for variable FRONTEND_URL
```

#### 驗證設置
```bash
# 列出所有 Secrets（不會顯示值）
wrangler secret list

# 應該看到
# {
#   "FRONTEND_URL": "..."
# }
```

---

### 方法二：使用 Cloudflare Dashboard ⏱️ 5 分鐘

#### 步驟 1: 登入 Cloudflare Dashboard

1. 開啟瀏覽器，前往：https://dash.cloudflare.com/
2. 使用您的 Cloudflare 帳號登入

#### 步驟 2: 前往 Workers & Pages

1. 在左側導航欄中，點擊 **"Workers & Pages"**
2. 在清單中找到並點擊 **"coach-backend"**
   - 如果看不到，確認您在正確的帳戶下（右上角帳戶切換器）

#### 步驟 3: 前往 Settings

1. 在 Worker 詳情頁面，點擊頂部的 **"Settings"** 標籤
2. 向下滾動找到 **"Variables and Secrets"** 區塊

#### 步驟 4: 添加 Secret

1. 在 "Variables and Secrets" 區塊中，點擊 **"Add"** 按鈕

2. 在彈出的表單中填寫：
   - **Type**: 選擇 **"Secret"**（重要！不是 "Variable"）
   - **Variable name**: 輸入 `FRONTEND_URL`
   - **Value**: 輸入 `https://coach-rocks-frontend.pages.dev`

3. 點擊 **"Add variable"** 或 **"Save"** 按鈕

#### 步驟 5: 部署變更（重要！）

**⚠️ 關鍵步驟**：添加 Secret 後，必須部署才會生效

1. 在同一頁面頂部，找到 **"Deploy"** 按鈕
2. 點擊 **"Deploy"**
3. 等待部署完成（通常 10-30 秒）

#### 驗證設置

1. 返回 "Settings" > "Variables and Secrets"
2. 應該看到 `FRONTEND_URL` 列在 **"Secrets"** 區塊中
   - 注意：值會顯示為 `••••••`（隱藏狀態）

---

### 🟢 可選設置：DEV_FRONTEND_URL

**用途**: 僅在需要自訂開發環境前端 port 時設置

如果您的開發環境使用預設的 `http://localhost:5173`，可以跳過此步驟。

**如需設置**（與上述步驟相同）：
```bash
# CLI 方法
wrangler secret put DEV_FRONTEND_URL
# 輸入: http://localhost:5173

# 或使用其他 port，例如
# 輸入: http://localhost:5174
```

---

## 🎯 Part B: GitLab CI/CD Variables 設置

### 必須設置的 Variables

| Variable 名稱 | 值 | Protected | Masked |
|--------------|---|-----------|--------|
| `CLOUDFLARE_ACCOUNT_ID` | `9288c023577aa2f6ce20582b6c4bdda0` | ✅ | ✅ |
| `BACKEND_URL` | `https://coach-backend.gamepig1976.workers.dev` | ✅ | ❌ |
| `FRONTEND_URL` | `https://coach-rocks-frontend.pages.dev` | ✅ | ❌ |

---

### 詳細設置步驟 ⏱️ 10 分鐘

#### 步驟 1: 登入 GitLab

1. 開啟瀏覽器，前往：https://gitlab.com/
2. 使用您的 GitLab 帳號登入

#### 步驟 2: 前往專案

1. 在導航欄中點擊 **"Projects"** > **"Your projects"**
2. 找到並點擊 **"coach-rocks"** 專案
   - 完整路徑應為：`coach-rocks/coach-rocks`
   - 或直接前往：https://gitlab.com/coach-rocks/coach-rocks

#### 步驟 3: 前往 CI/CD Settings

1. 在左側邊欄中，找到 **"Settings"** > **"CI/CD"**
2. 點擊進入 CI/CD 設置頁面

#### 步驟 4: 展開 Variables 區塊

1. 找到 **"Variables"** 區塊
2. 點擊右側的 **"Expand"** 按鈕
3. 應該會看到現有的變數列表（如果有的話）

---

### Variable 1: CLOUDFLARE_ACCOUNT_ID 🔒

#### 步驟 1: 點擊 Add variable

1. 在 Variables 區塊中，點擊 **"Add variable"** 按鈕

#### 步驟 2: 填寫表單

在彈出的表單中，按照以下順序填寫：

**基本資訊**:
- **Key**: `CLOUDFLARE_ACCOUNT_ID`
- **Value**: `9288c023577aa2f6ce20582b6c4bdda0`
- **Type**: 選擇 **"Variable"**（預設）

**範圍設置**:
- **Environment scope**: 選擇 **"All (default)"** 或 `*`

**保護設置**（重要！）:
- ✅ **Protect variable**: **勾選**
  - 說明：只有 protected branches（如 main）可以訪問
- ✅ **Mask variable**: **勾選**
  - 說明：在日誌中隱藏為 `[MASKED]`

**其他選項**:
- ❌ **Expand variable reference**: **不勾選**
- ❌ **Raw**: **不勾選**（保持預設）

**Visibility** (2025 年新介面):
- 如果看到 Visibility 選項，選擇 **"Masked"** 或 **"Masked and hidden"**

#### 步驟 3: 儲存

1. 檢查所有欄位填寫正確
2. 點擊 **"Add variable"** 按鈕
3. 應該會看到變數出現在列表中

#### 驗證

確認 `CLOUDFLARE_ACCOUNT_ID` 顯示：
- ✅ Protected: **Yes**
- ✅ Masked: **Yes**
- ✅ State: **All**（環境範圍）

---

### Variable 2: BACKEND_URL

#### 步驟 1: 點擊 Add variable

1. 再次點擊 **"Add variable"** 按鈕

#### 步驟 2: 填寫表單

**基本資訊**:
- **Key**: `BACKEND_URL`
- **Value**: `https://coach-backend.gamepig1976.workers.dev`
- **Type**: **"Variable"**

**範圍設置**:
- **Environment scope**: **"All (default)"** 或 `*`

**保護設置**:
- ✅ **Protect variable**: **勾選**
- ❌ **Mask variable**: **不勾選**
  - ⚠️ 重要：URL 無法被 mask（包含特殊字符 `://`）
  - 如果勾選 Mask，GitLab 可能會顯示錯誤或警告

**其他選項**:
- ❌ **Expand variable reference**: **不勾選**

**Visibility**:
- 如果看到此選項，選擇 **"Visible"**（因為無法 mask）

#### 步驟 3: 儲存

1. 點擊 **"Add variable"**
2. 如果出現關於無法 mask 的警告，選擇繼續（URL 本身不敏感）

#### 驗證

確認 `BACKEND_URL` 顯示：
- ✅ Protected: **Yes**
- ❌ Masked: **No**
- ✅ State: **All**

---

### Variable 3: FRONTEND_URL

#### 步驟 1: 點擊 Add variable

1. 第三次點擊 **"Add variable"** 按鈕

#### 步驟 2: 填寫表單

**基本資訊**:
- **Key**: `FRONTEND_URL`
- **Value**: `https://coach-rocks-frontend.pages.dev`
- **Type**: **"Variable"**

**範圍設置**:
- **Environment scope**: **"All (default)"** 或 `*`

**保護設置**:
- ✅ **Protect variable**: **勾選**
- ❌ **Mask variable**: **不勾選**（URL 無法 mask）

**其他選項**:
- ❌ **Expand variable reference**: **不勾選**

**Visibility**:
- 選擇 **"Visible"**

#### 步驟 3: 儲存

1. 點擊 **"Add variable"**

#### 驗證

確認 `FRONTEND_URL` 顯示：
- ✅ Protected: **Yes**
- ❌ Masked: **No**
- ✅ State: **All**

---

## ✅ 最終驗證

### Cloudflare Workers Secrets

**CLI 驗證**:
```bash
cd backend
wrangler secret list
```

**預期輸出**:
```json
{
  "FRONTEND_URL": "..."
}
```

**Dashboard 驗證**:
1. Cloudflare Dashboard > Workers & Pages > coach-backend
2. Settings > Variables and Secrets
3. 應該看到 `FRONTEND_URL` 在 Secrets 區塊中

---

### GitLab CI/CD Variables

**步驟**:
1. GitLab > coach-rocks 專案 > Settings > CI/CD > Variables
2. 應該看到 3 個變數

**驗證清單**:
- ✅ `CLOUDFLARE_ACCOUNT_ID` (Protected ✓, Masked ✓)
- ✅ `BACKEND_URL` (Protected ✓, Masked ✗)
- ✅ `FRONTEND_URL` (Protected ✓, Masked ✗)

**總計**: 3 個變數全部設置完成

---

## ⚠️ 常見問題排除

### 問題 1: Wrangler 未登入

**症狀**:
```
⛔️ Error: Not logged in
```

**解決方法**:
```bash
wrangler login
# 會開啟瀏覽器進行認證
```

---

### 問題 2: GitLab 無法 Mask URL

**症狀**: 勾選 Mask variable 時出現錯誤或警告

**原因**: URL 包含不支援的字符（`://`）

**解決方法**: 不勾選 Mask variable（URL 本身不包含敏感信息）

---

### 問題 3: 找不到 coach-backend Worker

**症狀**: Cloudflare Dashboard 中看不到 Worker

**解決方法**:
1. 確認您在正確的 Cloudflare 帳戶下（右上角切換）
2. 確認 Worker 名稱正確（應為 `coach-backend`）
3. 檢查 `backend/wrangler.jsonc` 中的 `name` 欄位

---

### 問題 4: GitLab Protected 變數在非 main 分支無法使用

**症狀**: 測試分支 Pipeline 失敗，提示找不到變數

**原因**: Protected 變數只在 protected branches 可用

**解決方法**:
- 選項 1: 在測試分支臨時取消 Protect variable
- 選項 2: 將測試分支設為 protected branch
- 選項 3: 直接在 main 分支測試（推薦用於生產環境設置）

---

## 🎯 完成檢查清單

### Cloudflare Workers
- [ ] 已安裝並登入 wrangler CLI
- [ ] 已設置 `FRONTEND_URL` Secret
- [ ] 已驗證 Secret 列表顯示 `FRONTEND_URL`
- [ ] （可選）已設置 `DEV_FRONTEND_URL`

### GitLab CI/CD
- [ ] 已登入 GitLab
- [ ] 已前往 coach-rocks 專案
- [ ] 已設置 `CLOUDFLARE_ACCOUNT_ID` (Protected + Masked)
- [ ] 已設置 `BACKEND_URL` (Protected)
- [ ] 已設置 `FRONTEND_URL` (Protected)
- [ ] 已驗證所有 3 個變數顯示正確

### 總體檢查
- [ ] 總共設置 4 個環境變數（1 個 Cloudflare + 3 個 GitLab）
- [ ] 所有設置已驗證成功
- [ ] 已等待 30-60 秒讓 Cloudflare Secret 生效

---

## 📞 需要協助？

### 無法解決的問題
1. 截圖錯誤訊息
2. 檢查帳號權限（是否為專案 Maintainer/Owner）
3. 參考官方文檔：
   - Cloudflare: https://developers.cloudflare.com/workers/configuration/secrets/
   - GitLab: https://docs.gitlab.com/ci/variables/

### 準備進入階段二
完成本階段後，請通知我以便繼續階段二（測試驗證）。

---

**文件版本**: 2.0 (基於 2025 年 11 月最新介面)
**製作者**: Claude Code
**最後驗證**: 2025-11-19

✅ **階段一設置完成後，請回報以便進入階段二（代碼修改與測試）**
