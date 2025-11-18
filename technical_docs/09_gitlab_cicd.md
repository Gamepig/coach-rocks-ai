# GitLab CI/CD 自動部署技術文件

**功能名稱**: GitLab CI/CD Automated Deployment
**最後更新**: 2025-11-18
**負責人**: DevOps Team

---

## 📋 目錄

1. [功能描述](#功能描述)
2. [檔案位置](#檔案位置)
3. [主要配置](#主要配置)
4. [部署流程](#部署流程)
5. [環境變數](#環境變數)
6. [QA 常見問題](#qa-常見問題)
7. [Debug 說明](#debug-說明)

---

## 功能描述

### 概述

GitLab CI/CD 自動部署系統實現了全自動化的部署流程,當程式碼推送到 `main` 或 `master` 分支時,自動觸發部署到 Cloudflare Workers (後端) 和 Cloudflare Pages (前端)。

### 核心功能

1. **後端 Worker 部署** (`deploy-backend`)
   - 安裝依賴 (pnpm)
   - TypeScript 編譯檢查
   - 清除快取
   - 部署到 Cloudflare Workers
   - 健康檢查驗證

2. **前端 Pages 部署** (`deploy-frontend`)
   - 安裝依賴 (pnpm)
   - 建置前端 (Vite)
   - 部署到 Cloudflare Pages
   - 環境變數注入

### 技術特點

- ✅ **完全自動化**: Push 到 main/master 自動觸發
- ✅ **零 Dashboard 設定**: 完全透過 CLI 部署
- ✅ **健康檢查**: 部署後自動驗證
- ✅ **快取清除**: 確保使用最新程式碼
- ✅ **並行部署**: 後端和前端分階段部署
- ✅ **錯誤處理**: 部署失敗時中止流程

---

## 檔案位置

### 配置檔案

| 檔案路徑 | 功能 | 行數 |
|---------|------|------|
| `.gitlab-ci.yml` | GitLab CI/CD 主配置檔 | 80 行 |
| `backend/wrangler.jsonc` | Cloudflare Workers 配置 | 88 行 |
| `backend/package.json` | Backend 依賴與腳本 | ~50 行 |
| `frontend/package.json` | Frontend 依賴與腳本 | ~60 行 |

### 相關腳本

| 檔案路徑 | 功能 |
|---------|------|
| `backend/src/index.ts` | Workers 入口點 |
| `frontend/vite.config.js` | Vite 建置配置 |

---

## 主要配置

### GitLab CI/CD Pipeline 結構

```yaml
stages:
  - deploy-backend   # 階段 1: 後端部署
  - deploy-frontend  # 階段 2: 前端部署
```

**執行順序**:
1. `deploy-backend` 先執行
2. `deploy-frontend` 在後端成功後執行
3. 任何階段失敗會中止整個 pipeline

---

### deploy-backend Job

**檔案**: `.gitlab-ci.yml:13-48`

```yaml
deploy-backend:
  stage: deploy-backend
  image: node:20
  before_script:
    - npm install -g pnpm@8 wrangler
    - cd backend
    - pnpm install
  script:
    - export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN}"
    - export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID}"
    - npx tsc --noEmit
    - rm -rf node_modules/.cache dist .wrangler
    - wrangler deploy
    - sleep 2
    - curl -f https://coach-backend.gamepig1976.workers.dev/api/health
  environment:
    name: production
    url: https://coach-backend.gamepig1976.workers.dev
  rules:
    - if: $CI_COMMIT_BRANCH == "main" || $CI_COMMIT_BRANCH == "master"
      when: on_success
```

**關鍵步驟**:
1. 安裝 pnpm 和 wrangler
2. 安裝專案依賴
3. TypeScript 編譯檢查 (`npx tsc --noEmit`)
4. 清除快取 (`rm -rf ...`)
5. 部署 (`wrangler deploy`)
6. 健康檢查 (`curl -f .../api/health`)

---

### deploy-frontend Job

**檔案**: `.gitlab-ci.yml:50-78`

```yaml
deploy-frontend:
  stage: deploy-frontend
  image: node:20
  before_script:
    - npm install -g pnpm@8 wrangler
    - cd frontend
    - pnpm install
  script:
    - export VITE_BACKEND_BASE_URL="${VITE_BACKEND_BASE_URL}"
    - export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID}"
    - pnpm build
    - wrangler pages deploy dist --project-name=coach-rocks-frontend
  environment:
    name: production
    url: https://coach-rocks-frontend.pages.dev
  rules:
    - if: $CI_COMMIT_BRANCH == "main" || $CI_COMMIT_BRANCH == "master"
      when: on_success
```

**關鍵步驟**:
1. 安裝 pnpm 和 wrangler
2. 安裝專案依賴
3. 建置前端 (`pnpm build`)
4. 部署到 Pages (`wrangler pages deploy`)

---

## 部署流程

### 完整部署流程

```
┌─────────────────┐
│  Push to main   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  GitLab CI/CD Trigger                   │
│  (Auto-triggered by rules)               │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Stage 1: deploy-backend                │
├─────────────────────────────────────────┤
│  1. Install pnpm & wrangler             │
│  2. Install backend dependencies        │
│  3. TypeScript compilation check        │
│  4. Clear cache                         │
│  5. Deploy to Cloudflare Workers        │
│  6. Health check                        │
└────────┬────────────────────────────────┘
         │ (success)
         ▼
┌─────────────────────────────────────────┐
│  Stage 2: deploy-frontend               │
├─────────────────────────────────────────┤
│  1. Install pnpm & wrangler             │
│  2. Install frontend dependencies       │
│  3. Build frontend (Vite)               │
│  4. Deploy to Cloudflare Pages          │
└────────┬────────────────────────────────┘
         │ (success)
         ▼
┌─────────────────────────────────────────┐
│  Deployment Complete                    │
│  ✅ Backend: workers.dev                │
│  ✅ Frontend: pages.dev                 │
└─────────────────────────────────────────┘
```

### 部署時間估計

| 階段 | 時間 | 說明 |
|------|------|------|
| Backend 依賴安裝 | ~1-2 分鐘 | pnpm install |
| Backend TypeScript 檢查 | ~10-20 秒 | tsc --noEmit |
| Backend 部署 | ~30-60 秒 | wrangler deploy |
| Backend 健康檢查 | ~2-5 秒 | curl |
| Frontend 依賴安裝 | ~1-2 分鐘 | pnpm install |
| Frontend 建置 | ~30-60 秒 | vite build |
| Frontend 部署 | ~30-60 秒 | wrangler pages deploy |
| **總計** | **~4-7 分鐘** | 完整部署流程 |

---

## 環境變數

### GitLab CI/CD Variables (必須設定)

在 GitLab > Settings > CI/CD > Variables 中設定:

#### CLOUDFLARE_API_TOKEN

- **用途**: Cloudflare API 認證
- **取得方式**: Cloudflare Dashboard > My Profile > API Tokens
- **權限需求**:
  - Account > Workers Scripts > Edit
  - Account > Cloudflare Pages > Edit
- **範例**: `abc123def456...`
- **類型**: Protected, Masked
- **設定位置**: GitLab > Settings > CI/CD > Variables

**產生步驟**:
1. 前往 https://dash.cloudflare.com/profile/api-tokens
2. 點選「Create Token」
3. 選擇「Create Custom Token」
4. 權限設定:
   - Account > Workers Scripts > Edit
   - Account > Cloudflare Pages > Edit
5. 複製 Token 並儲存

---

#### CLOUDFLARE_ACCOUNT_ID

- **用途**: Cloudflare Account ID
- **取得方式**: Cloudflare Dashboard > Workers & Pages > 右側欄
- **範例**: `9288c023577aa2f6ce20582b6c4bdda0`
- **類型**: Protected
- **設定位置**: GitLab > Settings > CI/CD > Variables

---

#### VITE_BACKEND_BASE_URL

- **用途**: 前端建置時注入的後端 API URL
- **開發環境**: `http://localhost:8788`
- **生產環境**: `https://coach-backend.gamepig1976.workers.dev`
- **類型**: Protected
- **設定位置**: GitLab > Settings > CI/CD > Variables

---

### 檢查清單

部署前確認以下變數已在 GitLab 設定:

```bash
# 在 GitLab > Settings > CI/CD > Variables 檢查:
# - CLOUDFLARE_API_TOKEN (Protected, Masked)
# - CLOUDFLARE_ACCOUNT_ID (Protected)
# - VITE_BACKEND_BASE_URL (Protected)
```

---

## QA 常見問題

### Q1: Pipeline 觸發但 Job 不執行

**問題**: Push 到 main 分支但 Job 不執行

**原因**: 分支名稱不符合 rules 條件

**解決方案**:
1. 確認分支名稱是 `main` 或 `master`:
   ```bash
   git branch
   ```
2. 檢查 `.gitlab-ci.yml` 的 rules 設定:
   ```yaml
   rules:
     - if: $CI_COMMIT_BRANCH == "main" || $CI_COMMIT_BRANCH == "master"
   ```
3. 如果使用其他分支名稱,修改 rules 條件

---

### Q2: wrangler deploy 失敗 - Unauthorized

**問題**: `wrangler deploy` 回應 401 Unauthorized

**原因**:
- `CLOUDFLARE_API_TOKEN` 未設定或無效
- Token 權限不足

**解決方案**:
1. 檢查 GitLab Variables:
   - 確認 `CLOUDFLARE_API_TOKEN` 已設定
   - 確認 Token 類型為 Protected, Masked
2. 重新產生 Cloudflare API Token
3. 確認 Token 權限包含:
   - Account > Workers Scripts > Edit
   - Account > Cloudflare Pages > Edit

---

### Q3: TypeScript 編譯失敗

**問題**: `npx tsc --noEmit` 回應編譯錯誤

**原因**: TypeScript 編譯錯誤

**解決方案**:
1. 本地執行 `npx tsc --noEmit` 檢查錯誤
2. 修正所有 TypeScript 錯誤
3. 重新 Push 程式碼

**提醒**: CI/CD 中的 TypeScript 檢查會阻止有編譯錯誤的程式碼部署

---

### Q4: 健康檢查失敗

**問題**: `curl -f .../api/health` 回應 404 或 500

**原因**:
- 後端部署失敗
- Health check endpoint 不存在
- Cloudflare 傳播延遲

**解決方案**:
1. 檢查後端是否有 `/api/health` 端點
2. 增加等待時間 (`sleep 5`)
3. 檢查 Cloudflare Dashboard > Workers 是否部署成功

---

### Q5: Frontend 建置失敗

**問題**: `pnpm build` 失敗

**原因**:
- 依賴安裝失敗
- 環境變數未設定
- Vite 建置錯誤

**解決方案**:
1. 檢查 `VITE_BACKEND_BASE_URL` 是否設定
2. 本地執行 `pnpm build` 檢查錯誤
3. 檢查 `vite.config.js` 配置

---

## Debug 說明

### 查看 CI/CD 日誌

**GitLab UI**:
1. 前往專案 > CI/CD > Pipelines
2. 點選最新的 Pipeline
3. 點選失敗的 Job
4. 查看完整日誌

**關鍵日誌檢查點**:

**Backend 部署**:
```
$ npx tsc --noEmit
$ wrangler deploy
⛅️ wrangler 3.x.x
-------------------
Uploading Worker "coach-backend" to Cloudflare...
 ✨ Success! Your worker has been deployed to https://coach-backend.gamepig1976.workers.dev
```

**Frontend 部署**:
```
$ pnpm build
vite v5.x.x building for production...
✓ 123 modules transformed.
dist/index.html                   1.23 kB │ gzip: 0.64 kB
dist/assets/index-abc123.js     456.78 kB │ gzip: 123.45 kB
✓ built in 12.34s

$ wrangler pages deploy dist --project-name=coach-rocks-frontend
🌎 Uploading... (123/456 files)
✨ Success! Deployed to https://coach-rocks-frontend.pages.dev
```

---

### 本地測試部署流程

**Backend**:
```bash
cd backend
pnpm install
npx tsc --noEmit
wrangler deploy
curl https://coach-backend.gamepig1976.workers.dev/api/health
```

**Frontend**:
```bash
cd frontend
pnpm install
export VITE_BACKEND_BASE_URL=https://coach-backend.gamepig1976.workers.dev
pnpm build
wrangler pages deploy dist --project-name=coach-rocks-frontend
```

---

### 常見錯誤訊息

#### 錯誤 1: pnpm: command not found

```
bash: pnpm: command not found
```

**處理**: 檢查 `before_script` 中的 `npm install -g pnpm@8`

---

#### 錯誤 2: wrangler: command not found

```
bash: wrangler: command not found
```

**處理**: 檢查 `before_script` 中的 `npm install -g wrangler`

---

#### 錯誤 3: Authentication error

```
[ERROR] Authentication error: Missing API token
```

**處理**: 檢查 GitLab Variables 中的 `CLOUDFLARE_API_TOKEN`

---

## 相關文件

- [Cloudflare 部署](./10_cloudflare_deployment.md)
- [Google OAuth 認證](./01_google_oauth.md)
- [GitLab CI/CD 官方文件](https://docs.gitlab.com/ee/ci/)
- [Wrangler CLI 文件](https://developers.cloudflare.com/workers/wrangler/)

---

**文件版本**: 1.0
**建立日期**: 2025-11-18
**最後更新**: 2025-11-18
