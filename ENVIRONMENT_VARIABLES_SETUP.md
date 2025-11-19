# CoachRocks AI - 環境變數設置指南

**更新日期**: 2025-11-19
**版本**: 1.0
**適用於**: 硬編碼修改後的環境設置

---

## 📋 概述

本次硬編碼修改需要設置以下環境變數：
- **Cloudflare Workers Secrets**: 1 個必須 + 1 個可選
- **GitLab CI/CD Variables**: 3 個必須

**總操作時間**: 約 15 分鐘
**技術要求**: 需要 Cloudflare 與 GitLab 管理權限

---

## 🎯 快速導航

- [Cloudflare Workers Secrets 設置](#cloudflare-workers-secrets-設置)
- [GitLab CI/CD Variables 設置](#gitlab-cicd-variables-設置)
- [環境變數完整列表](#環境變數完整列表)
- [驗證設置](#驗證設置)

---

## 📊 環境變數總覽

### 必須設置（4 個）

| # | 變數名 | 設置位置 | 優先級 |
|---|--------|---------|--------|
| 1 | `FRONTEND_URL` | Cloudflare Workers | 🔴 必須 |
| 2 | `CLOUDFLARE_ACCOUNT_ID` | GitLab CI/CD | 🔴 必須 |
| 3 | `BACKEND_URL` | GitLab CI/CD | 🔴 必須 |
| 4 | `FRONTEND_URL` | GitLab CI/CD | 🔴 必須 |

### 可選設置（1 個）

| # | 變數名 | 設置位置 | 優先級 |
|---|--------|---------|--------|
| 5 | `DEV_FRONTEND_URL` | Cloudflare Workers | 🟢 可選 |

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

### 前往設置頁面 ⏱️ 8 分鐘

#### 步驟
1. 登入 GitLab: `https://gitlab.com`
2. 前往專案: `coach-rocks/coach-rocks`
3. 左側選單: **Settings** > **CI/CD**
4. 展開 **Variables** 區塊
5. 點擊 **Add variable**

---

### 變數 1: CLOUDFLARE_ACCOUNT_ID 🔒

| 欄位 | 值 |
|------|---|
| **Key** | `CLOUDFLARE_ACCOUNT_ID` |
| **Value** | `9288c023577aa2f6ce20582b6c4bdda0` |
| **Type** | Variable |
| **Environment scope** | All (default) |
| **Protect variable** | ✅ 勾選 |
| **Mask variable** | ✅ 勾選 |
| **Expand variable reference** | ❌ 不勾選 |

#### 設置步驟
1. 點擊 **Add variable**
2. Key 輸入: `CLOUDFLARE_ACCOUNT_ID`
3. Value 輸入: `9288c023577aa2f6ce20582b6c4bdda0`
4. Protect variable: ✅ 勾選
5. Mask variable: ✅ 勾選
6. 點擊 **Add variable**

---

### 變數 2: BACKEND_URL

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

### 變數 3: FRONTEND_URL

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

| 變數名 | 值 | 用途 | 必須 | Protect | Mask |
|--------|---|------|------|---------|------|
| `CLOUDFLARE_ACCOUNT_ID` | `9288c023577aa2f6ce20582b6c4bdda0` | Cloudflare 帳戶識別 | ✅ 必須 | ✅ | ✅ |
| `BACKEND_URL` | `https://coach-backend.gamepig1976.workers.dev` | 後端 API 基礎 URL | ✅ 必須 | ✅ | ❌ |
| `FRONTEND_URL` | `https://coach-rocks-frontend.pages.dev` | 前端應用 URL | ✅ 必須 | ✅ | ❌ |

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
3. 應該看到 3 個變數：
   - ✅ `CLOUDFLARE_ACCOUNT_ID` (Protected, Masked)
   - ✅ `BACKEND_URL` (Protected)
   - ✅ `FRONTEND_URL` (Protected)

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
- [ ] 設置 `CLOUDFLARE_ACCOUNT_ID` (Protected + Masked)
- [ ] 設置 `BACKEND_URL` (Protected)
- [ ] 設置 `FRONTEND_URL` (Protected)
- [ ] 驗證所有變數已正確設置

### 完成後
- [ ] 所有必須變數已設置
- [ ] 已驗證變數正確顯示
- [ ] 準備好進行代碼部署

---

**文件版本**: 1.0
**製作者**: Claude Code
**審核狀態**: ✅ 完成

**重要提示**: 請在修改代碼並部署前完成所有必須變數的設置，以避免服務中斷。
