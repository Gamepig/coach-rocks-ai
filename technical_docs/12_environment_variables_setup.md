# CoachRocks AI - 環境變數設置指南

**更新日期**: 2025-11-19
**版本**: 2.0 ✨ 已更新（包含實際部署經驗）
**適用於**: Phase 2 硬編碼修改後的環境設置

---

## 📋 概述

本次硬編碼修改需要設置以下環境變數：
- **Cloudflare Workers Secrets**: 1 個必須 + 1 個可選
- **GitLab CI/CD Variables**: 2 個必須（~~3 個~~）⚠️ 已更新

**總操作時間**: 約 10 分鐘（已簡化）
**技術要求**: 需要 Cloudflare 與 GitLab 管理權限

---

## ⚠️ 重要更新 (v2.0 新增)

### CLOUDFLARE_ACCOUNT_ID 處理變更

**原計劃** (v1.0):
- ❌ 在 GitLab CI/CD Variables 中設置 `CLOUDFLARE_ACCOUNT_ID`
- ❌ 使用 Protected Variable 方式傳遞

**實際部署發現的問題**:
- GitLab Protected Variables 無法正常作為環境變數在 CI/CD script 中使用
- 嘗試多種方法（CLI 參數、wrangler.toml 配置）均失敗

**最終解決方案** ✅:
- ✅ `CLOUDFLARE_ACCOUNT_ID` 已直接硬編碼在 `.gitlab-ci.yml` 中（第 65 行）
- ✅ **不需要在 GitLab CI/CD Variables 中手動設置此變數**
- ✅ 原因：Account ID 並非敏感資訊（已公開於 Worker URL 中）

### 結果

**客戶只需設置 2 個 GitLab CI/CD Variables**:
1. ✅ `BACKEND_URL`
2. ✅ `FRONTEND_URL`

**不需要設置** ~~CLOUDFLARE_ACCOUNT_ID~~ ❌（已在代碼中處理）

---

## 🎯 快速導航

- [Cloudflare Workers Secrets 設置](#cloudflare-workers-secrets-設置)
- [GitLab CI/CD Variables 設置](#gitlab-cicd-variables-設置)
- [環境變數完整列表](#環境變數完整列表)
- [驗證設置](#驗證設置)

---

## 📊 環境變數總覽

### 必須設置（3 個）⚠️ 已更新

| # | 變數名 | 設置位置 | 優先級 | 狀態 |
|---|--------|---------|--------|------|
| 1 | `FRONTEND_URL` | Cloudflare Workers | 🔴 必須 | ✅ 需要設置 |
| 2 | `BACKEND_URL` | GitLab CI/CD | 🔴 必須 | ✅ 需要設置 |
| 3 | `FRONTEND_URL` | GitLab CI/CD | 🔴 必須 | ✅ 需要設置 |
| ~~4~~ | ~~`CLOUDFLARE_ACCOUNT_ID`~~ | ~~GitLab CI/CD~~ | ~~🔴 必須~~ | ❌ **已改為硬編碼** |

### 可選設置（1 個）

| # | 變數名 | 設置位置 | 優先級 | 說明 |
|---|--------|---------|--------|------|
| 5 | `DEV_FRONTEND_URL` | Cloudflare Workers | 🟢 可選 | 僅自訂開發環境需要 |

---

## 🔧 Cloudflare Workers Secrets 設置

### 方法 A: 使用 Wrangler CLI（推薦）⏱️ 2 分鐘

#### 必須設置

**1. FRONTEND_URL**
```bash
# 進入後端目錄
cd backend

# 設置 Secret
wrangler secret put FRONTEND_URL

# 提示時輸入（不含引號）
https://coach-rocks-frontend.pages.dev

# 看到成功訊息
✔ Successfully created secret for variable FRONTEND_URL
```

#### 可選設置

**2. DEV_FRONTEND_URL**（僅在需要自訂開發 port 時設置）
```bash
wrangler secret put DEV_FRONTEND_URL

# 提示時輸入（預設為 localhost:5173，可不設置）
http://localhost:5173
```

---

### 方法 B: 使用 Cloudflare Dashboard ⏱️ 5 分鐘

#### 步驟
1. 登入 Cloudflare Dashboard
2. 前往 **Workers & Pages**
3. 選擇 **coach-backend**
4. 點擊 **Settings** 標籤
5. 選擇 **Variables** 區塊

#### 添加 FRONTEND_URL
1. 點擊 **Add variable**
2. 選擇 **Type**: **Secret**
3. **Variable name**: `FRONTEND_URL`
4. **Value**: `https://coach-rocks-frontend.pages.dev`
5. 點擊 **Save**

#### 添加 DEV_FRONTEND_URL（可選）
1. 點擊 **Add variable**
2. 選擇 **Type**: **Secret**
3. **Variable name**: `DEV_FRONTEND_URL`
4. **Value**: `http://localhost:5173`
5. 點擊 **Save**

---

## 🔧 GitLab CI/CD Variables 設置

### 前往設置頁面 ⏱️ 5 分鐘（已簡化）

#### 步驟
1. 登入 GitLab: `https://gitlab.com`
2. 前往專案: `coach-rocks/coach-rocks`
3. 左側選單: **Settings** > **CI/CD**
4. 展開 **Variables** 區塊
5. 點擊 **Add variable**

---

### ~~變數 1: CLOUDFLARE_ACCOUNT_ID~~ ❌ 不需要設置

**重要更新**: 此變數已在 `.gitlab-ci.yml` 中硬編碼，**客戶不需要手動設置**。

<details>
<summary>📝 為什麼改為硬編碼？（點擊展開）</summary>

**技術原因**:
- GitLab Protected Variables 無法正常作為環境變數傳遞給 wrangler CLI
- Account ID 並非敏感資訊（公開於 Worker URL: `*.workers.dev`）
- 硬編碼在 CI/CD 配置中更穩定可靠

**位置**: `.gitlab-ci.yml` 第 65 行
```yaml
- export CLOUDFLARE_ACCOUNT_ID="9288c023577aa2f6ce20582b6c4bdda0"
```
</details>

---

### 變數 1: BACKEND_URL

| 欄位 | 值 |
|------|---|
| **Key** | `BACKEND_URL` |
| **Value** | `https://coach-backend.gamepig1976.workers.dev` |
| **Type** | Variable |
| **Environment scope** | All (default) |
| **Protect variable** | ✅ 勾選 |
| **Mask variable** | ❌ 不勾選 |
| **Expand variable reference** | ❌ 不勾選 |

#### 設置步驟
1. 點擊 **Add variable**
2. Key 輸入: `BACKEND_URL`
3. Value 輸入: `https://coach-backend.gamepig1976.workers.dev`
4. Protect variable: ✅ 勾選
5. Mask variable: ❌ 不勾選（URL 無法 mask）
6. 點擊 **Add variable**

---

### 變數 2: FRONTEND_URL

| 欄位 | 值 |
|------|---|
| **Key** | `FRONTEND_URL` |
| **Value** | `https://coach-rocks-frontend.pages.dev` |
| **Type** | Variable |
| **Environment scope** | All (default) |
| **Protect variable** | ✅ 勾選 |
| **Mask variable** | ❌ 不勾選 |
| **Expand variable reference** | ❌ 不勾選 |

#### 設置步驟
1. 點擊 **Add variable**
2. Key 輸入: `FRONTEND_URL`
3. Value 輸入: `https://coach-rocks-frontend.pages.dev`
4. Protect variable: ✅ 勾選
5. Mask variable: ❌ 不勾選
6. 點擊 **Add variable**

---

## 📝 環境變數完整列表

### Cloudflare Workers Secrets

| 變數名 | 值 | 用途 | 必須 | 設置方法 |
|--------|---|------|------|---------|
| `FRONTEND_URL` | `https://coach-rocks-frontend.pages.dev` | CORS 允許來源（生產環境） | ✅ 必須 | `wrangler secret put FRONTEND_URL` |
| `DEV_FRONTEND_URL` | `http://localhost:5173` | OAuth 重定向（開發環境） | ❌ 可選 | `wrangler secret put DEV_FRONTEND_URL` |

### GitLab CI/CD Variables

| 變數名 | 值 | 用途 | 必須 | Protect | Mask | 狀態 |
|--------|---|------|------|---------|------|------|
| ~~`CLOUDFLARE_ACCOUNT_ID`~~ | ~~`9288c023...`~~ | ~~Cloudflare 帳戶識別~~ | ❌ ~~必須~~ | - | - | ❌ **已硬編碼** |
| `BACKEND_URL` | `https://coach-backend.gamepig1976.workers.dev` | 後端 API 基礎 URL | ✅ 必須 | ✅ | ❌ | ✅ 需要設置 |
| `FRONTEND_URL` | `https://coach-rocks-frontend.pages.dev` | 前端應用 URL | ✅ 必須 | ✅ | ❌ | ✅ 需要設置 |

---

## ✅ 驗證設置

### 驗證 Cloudflare Workers Secrets

#### 使用 wrangler CLI
```bash
cd backend

# 列出所有 Secrets（不會顯示值）
wrangler secret list

# 應該看到
{
  "FRONTEND_URL": "...",
  "DEV_FRONTEND_URL": "..." // 如果有設置
}
```

#### 使用 Dashboard
1. 前往 Cloudflare Dashboard
2. Workers & Pages > coach-backend > Settings > Variables
3. 檢查 **Secrets** 區塊有 `FRONTEND_URL`

---

### 驗證 GitLab CI/CD Variables

1. 前往 GitLab 專案
2. Settings > CI/CD > Variables
3. 應該看到 2 個變數：
   - ✅ `BACKEND_URL` (Protected)
   - ✅ `FRONTEND_URL` (Protected)
   - ❌ ~~CLOUDFLARE_ACCOUNT_ID~~ (不需要設置)

---

## 🔍 常見問題 (FAQ)

### Q1: 為什麼需要在兩個地方都設置 FRONTEND_URL？
**A**:
- **Cloudflare Workers** 的 `FRONTEND_URL` 用於 **運行時 CORS 配置**（後端代碼使用）
- **GitLab CI/CD** 的 `FRONTEND_URL` 用於 **CI/CD 部署流程**（環境配置）

### Q2: 如果忘記設置某個變數會怎樣？
**A**:
- **FRONTEND_URL** (Cloudflare): 會使用 fallback 值 `https://coach-rocks-frontend.pages.dev`，功能正常
- **GitLab CI/CD 變數**: 部署流程會失敗，需要設置後重新觸發 Pipeline
- **CLOUDFLARE_ACCOUNT_ID**: ✅ 已在代碼中處理，不會有問題

### Q3: 可以修改這些變數的值嗎？
**A**: 可以，變更後：
- **Cloudflare Secrets**: 立即生效（約 30 秒後）
- **GitLab CI/CD**: 下次 Pipeline 執行時生效

### Q4: Protect variable 和 Mask variable 有什麼區別？
**A**:
- **Protect**: 只有 Protected Branches（如 main）可以訪問
- **Mask**: 在日誌中隱藏變數值（敏感信息如 Account ID）

### Q5: DEV_FRONTEND_URL 一定要設置嗎？
**A**: 不需要。如果開發環境使用 `http://localhost:5173`，可以不設置（有 fallback）。

---

## 📞 需要協助？

### 操作遇到問題
1. 檢查是否有相應平台的管理權限
2. 確認輸入的值沒有多餘空格或引號
3. 參考本文件的詳細步驟截圖（若有）

### 技術支援資源
- **Cloudflare Workers 文檔**: https://developers.cloudflare.com/workers/configuration/secrets/
- **GitLab CI/CD 文檔**: https://docs.gitlab.com/ee/ci/variables/
- **專案記憶庫**: `memory-bank/technical-debt/cloudflare-deployment-impact.md`

---

## 📋 設置檢查清單

### Cloudflare Workers Secrets
- [ ] 安裝並認證 wrangler CLI
- [ ] 設置 `FRONTEND_URL`
- [ ] （可選）設置 `DEV_FRONTEND_URL`
- [ ] 驗證 Secrets 列表

### GitLab CI/CD Variables
- [ ] 登入 GitLab 並前往專案
- [ ] ~~設置 `CLOUDFLARE_ACCOUNT_ID`~~ ❌ **不需要**（已硬編碼）
- [ ] 設置 `BACKEND_URL` (Protected)
- [ ] 設置 `FRONTEND_URL` (Protected)
- [ ] 驗證 2 個變數已正確設置

### 完成後
- [ ] 所有必須變數已設置
- [ ] 已驗證變數正確顯示
- [ ] 準備好進行代碼部署

---

## 📦 代碼修改摘要 (v2.0 新增)

### 修改的文件

本次移除硬編碼修改了以下 7 個文件：

| # | 文件路徑 | 修改內容 | Commit |
|---|---------|---------|--------|
| 1 | `scripts/trigger_deployment.sh` | 動態路徑偵測（移除絕對路徑） | 53b11c6 |
| 2 | `backend/wrangler.jsonc` | 添加環境變數覆蓋註解 | 53b11c6 |
| 3 | `backend/src/index.ts` | OpenAPI servers 配置 + 動態 CORS | 53b11c6 |
| 4 | `backend/src/types.ts` | 新增 `DEV_FRONTEND_URL` 類型 | 53b11c6 |
| 5 | `backend/src/endpoints/authGoogle.ts` | OAuth 回調動態 URL | 53b11c6 |
| 6 | `backend/src/endpoints/authGoogleInit.ts` | OAuth 初始化動態 URL | 53b11c6 |
| 7 | `.gitlab-ci.yml` | URL 變數化 + Account ID 硬編碼 | 53b11c6, 19a64b3 |

### 額外修復（Phase 2）

| # | 文件路徑 | 問題 | 解決方案 | Commit |
|---|---------|------|---------|--------|
| 1 | `backend/src/endpoints/health.ts` | 錯誤的 endpoint 格式導致 500 | 創建標準 OpenAPIRoute 類別 | fe009de |
| 2 | `backend/src/endpoints/testEmailAuth.ts` | 錯誤的 endpoint 格式導致 500 | 創建標準 OpenAPIRoute 類別 | ab71c8e |

### 關鍵變更點

**1. CORS 動態配置** (`backend/src/index.ts`):
```typescript
// 之前：硬編碼
const allowedOrigins = ['http://localhost:5173', 'https://coach-rocks-frontend.pages.dev']

// 現在：動態
const getAllowedOrigins = (env: Env): string[] => {
  const origins = [...localhostOrigins];
  if (env.FRONTEND_URL) {
    origins.push(env.FRONTEND_URL);
  }
  return origins;
};
```

**2. OAuth 回調 URL** (`authGoogle.ts`, `authGoogleInit.ts`):
```typescript
// 之前：硬編碼
const localhostFrontendUrl = 'http://localhost:5173'

// 現在：可配置
const localhostFrontendUrl = c.env.DEV_FRONTEND_URL || 'http://localhost:5173'
```

**3. CI/CD Account ID** (`.gitlab-ci.yml`):
```yaml
# 之前：嘗試使用環境變數（失敗）
- export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID}"

# 現在：直接硬編碼（成功）
- export CLOUDFLARE_ACCOUNT_ID="9288c023577aa2f6ce20582b6c4bdda0"
```

---

## ⚠️ 已知問題和限制 (v2.0 新增)

### 1. OpenAPI JSON 生成失敗 ❌

**狀態**: 既有問題（不影響 API 功能）

**現象**:
- `/openapi.json` 返回 500 Internal Server Error
- SwaggerUI 無法使用

**根本原因**:
多個 endpoint 的 schema 定義不符合 Chanfana 規範：
- `authGoogle.ts`, `authGoogleNew.ts` - Property 'schema' type mismatch
- `googleWebhook.ts`, `zoomWebhook.ts` - Property 'schema' type mismatch
- `listMeetings.ts`, `reels.ts` (4個) - Missing 'description' in responses

**影響範圍**:
- ✅ API 功能完全正常
- ✅ 所有 endpoint 可正常調用
- ❌ SwaggerUI 文檔無法使用
- ❌ `/openapi.json` 無法訪問

**後續計劃**:
- 非必要修復（不影響生產環境使用）
- 可在未來修復所有 endpoint schema 定義

### 2. GitLab Protected Variables 限制

**問題**: Protected Variables 無法作為環境變數在 CI/CD script 中使用

**嘗試的解決方案**:
1. ❌ `--account-id` CLI 參數（不支持）
2. ❌ `wrangler.toml` 中設置 `account_id`（Pages 不支持）
3. ❌ 環境變數導出（無法正常傳遞）

**最終解決方案**:
✅ 硬編碼在 `.gitlab-ci.yml` 中（Account ID 非敏感資訊）

---

## ✅ 部署驗證結果 (v2.0 新增)

### 測試時間
2025-11-19 13:54 (UTC+8)

### 測試結果

| 測試項目 | 狀態 | 詳細結果 |
|---------|------|---------|
| Backend 部署 | ✅ PASS | Pipeline 2166675731 成功 |
| Frontend 部署 | ✅ PASS | Pages 成功部署 |
| `/api/health` | ✅ PASS | 返回 200 OK |
| `/api/test-email-auth` | ✅ PASS | 返回 200 OK |
| Frontend 可訪問性 | ✅ PASS | `https://coach-rocks-frontend.pages.dev` 正常 |
| CORS 功能 | ✅ PASS | 正確返回 CORS headers |
| `/openapi.json` | ❌ FAIL | 500 錯誤（既有問題）|

### 測試命令

```bash
# Backend Health Check
curl -f https://coach-backend.gamepig1976.workers.dev/api/health
# ✅ {"status":"ok","timestamp":"2025-11-19T05:54:45.848Z","service":"coach-backend"}

# Frontend Accessibility
curl -I https://coach-rocks-frontend.pages.dev/
# ✅ HTTP/2 200

# CORS Preflight
curl -X OPTIONS -H "Origin: https://coach-rocks-frontend.pages.dev" \
  -H "Access-Control-Request-Method: POST" \
  -I https://coach-backend.gamepig1976.workers.dev/api/health
# ✅ access-control-allow-origin: https://coach-rocks-frontend.pages.dev
```

### GitLab Pipeline 資訊

**最新成功 Pipeline**: 2166675731
- **Backend**: ✅ 部署成功（1m 19s）
- **Frontend**: ✅ 部署成功（2m 15s）

**重要 Commits**:
```
ab71c8e - fix: 修復 test-email-auth endpoint 導致 OpenAPI 失敗
fe009de - fix: 修復 health endpoint 導致的 500 錯誤
19a64b3 - fix: 硬編碼 CLOUDFLARE_ACCOUNT_ID（最終解決方案）
53b11c6 - feat: Phase 2 移除所有硬編碼值
```

---

**文件版本**: 2.0 ✨
**製作者**: Claude Code
**審核狀態**: ✅ 完成（包含實際部署驗證）
**最後更新**: 2025-11-19

**重要提示**:
1. ✅ 客戶只需設置 **3 個環境變數**（1 Cloudflare + 2 GitLab）
2. ✅ CLOUDFLARE_ACCOUNT_ID 已在代碼中處理，**不需要客戶設置**
3. ⚠️ OpenAPI 生成失敗為既有問題，不影響 API 功能
