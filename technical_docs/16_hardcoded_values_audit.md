# 硬編碼值審查報告

**審查日期**: 2025-11-19
**狀態**: ✅ 已完成環境判斷重構 / ⚠️ 發現其他硬編碼

---

## 執行摘要

✅ **已完成**: 所有 `window.location.hostname.includes('pages.dev')` 環境判斷已移除
⚠️ **發現**: 其他類型的硬編碼需要評估是否需要改進

---

## 1. 環境判斷硬編碼 ✅ 已修復

### 已移除的硬編碼（6 個文件）

| 文件 | 原代碼 | 新代碼 | 狀態 |
|------|--------|--------|------|
| `frontend/src/App.jsx:158` | `window.location.hostname.includes('pages.dev')` | `isProduction()` | ✅ 已改 |
| `frontend/src/services/api.js:44` | `window.location.hostname.includes('pages.dev')` | `isProduction()` | ✅ 已改 |
| `frontend/src/contexts/AuthContext.jsx:194` | `window.location.hostname.includes('pages.dev')` | `isProduction()` | ✅ 已改 |
| `frontend/src/components/LoginPage/LoginPage.jsx:14` | `window.location.hostname.includes('pages.dev')` | `isProduction()` | ✅ 已改 |
| `frontend/src/components/LoginPrompt/LoginPrompt.jsx:115` | `window.location.hostname.includes('pages.dev')` | `isProduction()` | ✅ 已改 |
| `frontend/src/utils/envDiagnostics.js:12` | `window.location.hostname.includes('pages.dev')` | `isProduction()` | ✅ 已改 |

### 解決方案

創建統一的環境配置模組：`frontend/src/config/environment.js`

**未來維護**：
- 更換域名時只需修改環境變數 `VITE_PRODUCTION_DOMAINS`
- 無需修改任何代碼

---

## 2. 前端其他硬編碼

### 2.1 後端 URL 硬編碼 ✅ 可接受

| 位置 | 值 | 用途 | 優先級 | 建議 |
|------|-----|------|--------|------|
| `api.js:7` | `https://coach-backend.gamepig1976.workers.dev` | 預設 fallback URL | ✅ 可接受 | 保持現狀 |

**原因**: 這是作為 fallback 使用，當環境變數未設置時的安全預設值。

### 2.2 未使用的環境變數 ⚠️ 建議清理

以下環境變數已定義但未使用：

```bash
# .env.development / .env.production
VITE_API_ROOT=...              # ❌ 未使用
VITE_API_OPENAI_BASE=...       # ❌ 未使用
```

**建議**: 移除未使用的環境變數，避免混淆。

### 2.3 錯誤訊息中的 URL ✅ 可接受

錯誤訊息中包含硬編碼的範例 URL：
- `AuthContext.jsx`: Google OAuth 設置說明
- `LoginPage.jsx`: OAuth 配置指引
- `LoginPrompt.jsx`: 環境變數設置步驟

**原因**: 這些是給用戶看的說明文字，硬編碼是合理的。

---

## 3. 後端硬編碼

### 3.1 CORS 允許的 localhost 端口 ⚠️ 建議保持

**位置**: `backend/src/index.ts:52-61`

```typescript
const localhostOrigins = [
  'http://localhost:5173',  // Primary frontend port
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:3000',  // Create React App default
  'http://localhost:3001',
  'http://localhost:8080',  // Vue/Webpack dev server
  'http://localhost:4173',  // Vite preview mode
  'http://localhost:4174',
];
```

**評估**:
- ✅ **優點**: 支援多個開發端口，方便團隊開發
- ⚠️ **缺點**: 硬編碼在代碼中

**建議**:
1. **保持現狀**（優先）：這些是標準的開發端口，變更頻率極低
2. **進階方案**：移至環境變數 `DEV_ALLOWED_ORIGINS`（如果需要更靈活配置）

### 3.2 localhost 判斷邏輯 ✅ 合理

多處使用 `hostname === 'localhost' || hostname === '127.0.0.1'`：

| 文件 | 用途 | 評估 |
|------|------|------|
| `backend/src/auth/google.ts:217` | 判斷是否為本地請求 | ✅ 合理 |
| `backend/src/middleware/session.ts:165` | Cookie 安全設置 | ✅ 合理 |
| `backend/src/endpoints/authGoogleInit.ts:43` | 開發環境偵測 | ✅ 合理 |
| `backend/src/endpoints/verifyEmailAndViewResults.ts:19` | 來源驗證 | ✅ 合理 |

**原因**: localhost 是標準的本地開發標識，不需要配置化。

### 3.3 調試日誌中的 URL ✅ 可接受

**位置**:
- `backend/src/endpoints/authGoogle.ts:81-82`
- `backend/src/endpoints/authGoogleInit.ts:171-172`

```typescript
console.log('  - Expected redirect URI:', 'https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback')
```

**評估**:
- 用途：調試日誌，幫助開發者檢查配置
- 影響：不影響功能，僅用於比對

**建議**: 保持現狀，或改為使用環境變數進行比對

### 3.4 OpenAPI 文檔 URL ⚠️ 建議改進

**位置**: `backend/src/index.ts:122`

```typescript
servers: [
  {
    url: "https://coach-backend.gamepig1976.workers.dev",
    description: "Production server"
  }
]
```

**問題**: 硬編碼生產環境 URL

**建議**: 使用環境變數

```typescript
servers: [
  {
    url: env.BACKEND_URL || "https://coach-backend.gamepig1976.workers.dev",
    description: "Production server"
  }
]
```

---

## 4. 配置文件硬編碼

### 4.1 環境變數文件 ✅ 合理

`.env.development` 和 `.env.production` 中的硬編碼 URL 是合理的，這是環境變數文件的用途。

### 4.2 Wrangler 配置 ✅ 正確

`backend/wrangler.jsonc` 已正確使用 Secrets 管理敏感信息，無硬編碼問題。

---

## 5. 改進建議優先級

### 🔴 高優先級（建議立即執行）

1. **移除未使用的環境變數**
   - 文件: `.env.development`, `.env.production`
   - 移除: `VITE_API_ROOT`, `VITE_API_OPENAI_BASE`
   - 工作量: 5 分鐘

### 🟡 中優先級（建議近期執行）

2. **OpenAPI 文檔 server URL 改為動態**
   - 文件: `backend/src/index.ts:122`
   - 使用環境變數 `BACKEND_URL`
   - 工作量: 10 分鐘

### 🟢 低優先級（可選）

3. **調試日誌改為動態比對**
   - 文件: `authGoogle.ts`, `authGoogleInit.ts`
   - 使用環境變數而非硬編碼字串
   - 工作量: 15 分鐘

4. **CORS localhost origins 改為可配置**
   - 文件: `backend/src/index.ts:52-61`
   - 新增環境變數 `DEV_ALLOWED_ORIGINS`
   - 工作量: 20 分鐘
   - **注意**: 除非有特殊需求，否則不建議執行

---

## 6. 實施計劃

### Phase 1: 清理未使用變數（立即執行）

```bash
# 移除 .env.development 中的未使用變數
sed -i '' '/VITE_API_ROOT=/d' frontend/.env.development
sed -i '' '/VITE_API_OPENAI_BASE=/d' frontend/.env.development

# 移除 .env.production 中的未使用變數
sed -i '' '/VITE_API_ROOT=/d' frontend/.env.production
sed -i '' '/VITE_API_OPENAI_BASE=/d' frontend/.env.production
```

### Phase 2: OpenAPI 文檔改進（近期執行）

修改 `backend/src/index.ts`:

```typescript
// 動態獲取 server URL
const getServerUrl = (env: Env) => {
  return env.BACKEND_URL || "https://coach-backend.gamepig1976.workers.dev"
}

// 在 OpenAPI 配置中使用
servers: [
  {
    url: getServerUrl(c.env),
    description: "Production server"
  }
]
```

---

## 7. 維護檢查清單

定期檢查以下項目：

- [ ] 環境變數是否都有被使用？
- [ ] 是否有新的硬編碼環境判斷？
- [ ] OpenAPI 文檔 URL 是否正確？
- [ ] CORS 配置是否需要更新？
- [ ] 錯誤訊息中的範例 URL 是否正確？

---

## 8. 總結

### 當前狀態

✅ **環境判斷**: 已完全移除硬編碼，使用統一配置模組
✅ **後端 URL**: 使用環境變數，有合理的 fallback
✅ **敏感配置**: 正確使用 Secrets 管理
⚠️ **小改進**: 有幾處可優化的硬編碼（非關鍵）

### 整體評估

**代碼質量**: 🟢 良好
**可維護性**: 🟢 優秀（環境判斷已重構）
**待改進項**: 🟡 中等（主要是未使用變數清理）

### 未來維護

當域名變更時：
1. 更新 `VITE_PRODUCTION_DOMAINS` 環境變數
2. 更新 `BACKEND_URL` 和 `FRONTEND_URL` Secrets
3. 更新錯誤訊息中的範例 URL（可選）
4. 無需修改核心邏輯代碼 ✅

---

**報告完成日期**: 2025-11-19
**審查人**: Claude Code
**下次審查**: 2025-12-19（或重大變更時）
