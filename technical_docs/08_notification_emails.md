# 通知郵件系統技術文件

**功能名稱**: Notification Email Service (Resend/MailChannels)
**最後更新**: 2025-11-18
**負責人**: Backend Team

---

## 📋 目錄

1. [功能描述](#功能描述)
2. [檔案位置](#檔案位置)
3. [主要函數](#主要函數)
4. [相關函數](#相關函數)
5. [函數與變數列表](#函數與變數列表)
6. [設計概念](#設計概念)
7. [函數變數使用位置](#函數變數使用位置)
8. [環境變數](#環境變數)
9. [郵件範本](#郵件範本)
10. [QA 常見問題](#qa-常見問題)
11. [Debug 說明](#debug-說明)

---

## 功能描述

### 概述

CoachRocks AI 通知郵件系統使用 HTTP-based Email API 服務發送郵件，以兼容 Cloudflare Workers 的限制。系統採用雙重備援機制，確保郵件發送的可靠性。

### 核心功能

1. **Resend API（主要服務）**
   - HTTP API：100% 兼容 Cloudflare Workers
   - 測試域名：`onboarding@resend.dev`（開發環境，無需 DNS 配置）
   - 自訂域名：`noreply@coachrocks.com`（生產環境，需要 DNS 驗證）
   - 免費額度：3,000 封/月

2. **MailChannels API（備援服務）**
   - 免費方案：10,000 封/月
   - 原生 Cloudflare Workers 支援
   - 需要 DNS SPF 配置

3. **郵件通知類型**
   - 分析開始通知（新用戶）
   - 分析處理通知（已驗證用戶）
   - 分析完成通知（成功/失敗）

4. **智慧錯誤分類**
   - 根據錯誤類型提供針對性建議
   - 7 種錯誤類別：超時、API錯誤、檔案格式、檔案大小、資料庫、網路、未知

### 技術特點

- ✅ **雙重備援**: Resend → MailChannels 自動切換
- ✅ **環境自適應**: 開發/生產環境自動識別
- ✅ **HTML + Text**: 支援 HTML 和純文字格式
- ✅ **智慧錯誤分類**: 針對性建議提升用戶體驗
- ✅ **Graceful Degradation**: 郵件發送失敗不影響主流程

---

## 檔案位置

### 核心檔案

| 檔案路徑 | 功能 | 行數 |
|---------|------|------|
| `backend/src/services/gmail.ts` | 郵件服務核心實作 | 732 行 |
| `backend/RESEND_IMPLEMENTATION_SUMMARY.md` | Resend 實施摘要 | 335 行 |
| `backend/MAILCHANNELS_CONFIG.md` | MailChannels 配置指南 | 176 行 |
| `backend/ENV_SETUP.md` | 環境變數設定指南 | 275 行 |

### 相關文件

| 檔案路徑 | 功能 |
|---------|------|
| `backend/RESEND_READY_TO_USE.md` | Resend 快速上手指南 |
| `backend/RESEND_CUSTOMER_DNS_SETUP_GUIDE.md` | 客戶 DNS 設定指南 |
| `backend/EMAIL_FIX_COMPLETE_SUMMARY.md` | Email 修復完整摘要 |

---

## 主要函數

### 1. sendEmail()

**功能**: 核心郵件發送函數，支援 Resend（主要）→ MailChannels（備援）雙重機制

**檔案**: `backend/src/services/gmail.ts:168-357`

**函數簽名**:
```typescript
async function sendEmail(
  env: Env,
  message: EmailMessage
): Promise<boolean>
```

**參數**:
- `env`: Cloudflare Workers 環境變數
- `message`: 郵件內容對象
  - `to`: 收件人（字串或陣列）
  - `subject`: 郵件主題
  - `html`: HTML 內容（可選）
  - `text`: 純文字內容（可選）
  - `from`: 發件人（可選）

**回傳值**: `Promise<boolean>` - 發送成功返回 `true`，失敗返回 `false`

**發送流程**:
```
1. 優先使用 Resend API（如果配置了 RESEND_API_KEY）
   ├─ 開發環境：使用 onboarding@resend.dev（無需 DNS）
   └─ 生產環境：使用 noreply@coachrocks.com（需要 DNS 驗證）

2. 如果 Resend 失敗，自動切換到 MailChannels API
   └─ 需要配置 DNS SPF 記錄

3. 如果兩者都失敗，記錄錯誤並返回 false（不拋出異常）
```

**範例**:
```typescript
const success = await sendEmail(env, {
  to: "user@example.com",
  subject: "歡迎使用 CoachRocks AI",
  html: "<h1>歡迎!</h1>",
  text: "歡迎!"
})
```

---

### 2. sendAnalysisStartedEmail()

**功能**: 發送分析開始通知郵件（給新用戶）

**檔案**: `backend/src/services/gmail.ts:389-471`

**函數簽名**:
```typescript
async function sendAnalysisStartedEmail(
  env: Env,
  email: string,
  token: string,
  fileName: string
): Promise<boolean>
```

**參數**:
- `env`: 環境變數
- `email`: 收件人郵箱
- `token`: 驗證 Token
- `fileName`: 檔案名稱

**回傳值**: `Promise<boolean>` - 發送成功返回 `true`

**郵件內容**:
- 主題: `🚀 Your Analysis Started - {fileName}`
- 包含分析進度說明
- 分析內容預覽：客戶洞察、行動項目、教練建議等

---

### 3. sendNotificationEmail()

**功能**: 發送分析處理通知郵件（給已驗證用戶）

**檔案**: `backend/src/services/gmail.ts:476-549`

**函數簽名**:
```typescript
async function sendNotificationEmail(
  env: Env,
  email: string,
  token: string,
  fileName: string
): Promise<boolean>
```

**參數**:
- `env`: 環境變數
- `email`: 收件人郵箱
- `token`: 驗證 Token
- `fileName`: 檔案名稱

**回傳值**: `Promise<boolean>` - 發送成功返回 `true`

**郵件內容**:
- 主題: `🎉 Your analysis is processing - {fileName}`
- 包含進度查看連結
- 完成通知預告

---

### 4. sendAnalysisCompleteEmail()

**功能**: 發送分析完成通知郵件（支援成功和失敗兩種狀態）

**檔案**: `backend/src/services/gmail.ts:556-731`

**函數簽名**:
```typescript
async function sendAnalysisCompleteEmail(
  env: Env,
  email: string,
  token: string,
  fileName: string,
  clientName?: string,
  status: 'completed' | 'failed' = 'completed',
  errorMessage?: string
): Promise<boolean>
```

**參數**:
- `env`: 環境變數
- `email`: 收件人郵箱
- `token`: 驗證 Token
- `fileName`: 檔案名稱
- `clientName`: 客戶名稱（可選）
- `status`: 分析狀態（`'completed'` 或 `'failed'`）
- `errorMessage`: 錯誤訊息（失敗時提供）

**回傳值**: `Promise<boolean>` - 發送成功返回 `true`

**郵件內容**:
- **成功郵件**:
  - 主題: `✅ Analysis Complete - {clientName} Meeting`
  - 包含查看結果連結
  - 列出所有分析內容

- **失敗郵件**:
  - 主題: `{錯誤圖標} {錯誤標題} - {fileName}`
  - 智慧錯誤分類（7種類別）
  - 針對性解決建議
  - 技術詳情

---

## 相關函數

### 5. classifyError()

**功能**: 根據錯誤訊息分類錯誤類型，提供針對性建議

**檔案**: `backend/src/services/gmail.ts:28-147`

**函數簽名**:
```typescript
function classifyError(errorMessage: string): ErrorClassification
```

**錯誤類別**:
1. **timeout**: 超時錯誤（分析時間過長）
2. **api_error**: AI 服務錯誤（OpenAI、Cloudflare AI 等）
3. **file_format**: 檔案格式錯誤
4. **file_size**: 檔案大小超限
5. **database**: 資料庫錯誤
6. **network**: 網路連線錯誤
7. **unknown**: 未知錯誤

**回傳值**:
```typescript
interface ErrorClassification {
  category: ErrorCategory
  title: string              // 錯誤標題
  userMessage: string        // 用戶友善訊息
  technicalDetails: string   // 技術詳情
  suggestions: string[]      // 解決建議列表
  icon: string              // 圖標
}
```

**範例**:
```typescript
const classification = classifyError("Request timeout after 30 seconds")
// 回傳:
// {
//   category: 'timeout',
//   title: 'Analysis Timeout',
//   userMessage: 'The analysis took too long...',
//   technicalDetails: 'Request timeout after 30 seconds',
//   suggestions: [
//     'Try uploading a shorter meeting transcript',
//     'If using MP4 video, consider uploading a DOCX transcript instead',
//     ...
//   ],
//   icon: '⏱️'
// }
```

---

### 6. stripHtml()

**功能**: 從 HTML 內容移除 HTML 標籤，生成純文字版本

**檔案**: `backend/src/services/gmail.ts:362-370`

**函數簽名**:
```typescript
function stripHtml(html: string): string
```

**處理邏輯**:
- 移除 HTML 標籤 (`<[^>]*>`)
- 轉換 HTML 實體 (`&nbsp;`, `&lt;`, `&gt;`, `&amp;`)
- 去除首尾空白

---

### 7. getBackendUrl()

**功能**: 動態獲取後端 URL（避免硬編碼）

**檔案**: `backend/src/services/gmail.ts:379-387`

**函數簽名**:
```typescript
function getBackendUrl(env: Env): string
```

**邏輯**:
- 如果 `env.BACKEND_URL` 存在，直接返回
- 否則拋出錯誤（必須配置 BACKEND_URL）

---

## 函數與變數列表

### 匯出函數（Public API）

| 函數名稱 | 功能 | 回傳值 |
|---------|------|--------|
| `sendEmail()` | 核心郵件發送（Resend/MailChannels） | `Promise<boolean>` |
| `sendAnalysisStartedEmail()` | 分析開始通知（新用戶） | `Promise<boolean>` |
| `sendNotificationEmail()` | 分析處理通知（已驗證用戶） | `Promise<boolean>` |
| `sendAnalysisCompleteEmail()` | 分析完成通知（成功/失敗） | `Promise<boolean>` |

### 內部函數（Private）

| 函數名稱 | 功能 | 回傳值 |
|---------|------|--------|
| `classifyError()` | 錯誤訊息分類 | `ErrorClassification` |
| `stripHtml()` | HTML 轉純文字 | `string` |
| `getBackendUrl()` | 獲取後端 URL | `string` |

### 介面定義

#### EmailMessage
```typescript
interface EmailMessage {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
}
```

#### ErrorClassification
```typescript
interface ErrorClassification {
  category: ErrorCategory
  title: string
  userMessage: string
  technicalDetails: string
  suggestions: string[]
  icon: string
}
```

#### ErrorCategory
```typescript
type ErrorCategory =
  | 'timeout'
  | 'api_error'
  | 'file_format'
  | 'file_size'
  | 'database'
  | 'network'
  | 'unknown'
```

---

## 設計概念

### 1. 雙重備援架構

```
┌─────────────────────────────────────┐
│  應用發起郵件請求                      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  檢查 RESEND_API_KEY                 │
└────────────┬────────────────────────┘
             │
    ┌────────┴────────┐
    │ 有 Key         │ 沒有 Key
    │                │
    ▼                ▼
┌──────────┐   ┌──────────────┐
│ Resend   │   │ MailChannels │
│  API     │   │ (Primary)    │
└────┬─────┘   └──────┬───────┘
     │                │
     │ 失敗           │
     └────────┬───────┘
              │
              ▼
    ┌──────────────────────┐
    │  MailChannels        │
    │  (Fallback)          │
    └──────────┬───────────┘
               │
               ▼
     ┌──────────────────────┐
     │  返回成功或失敗        │
     └──────────────────────┘
```

**設計原則**:
- **主服務**: Resend API（開發環境友善，支援測試域名）
- **備援服務**: MailChannels API（免費額度大，原生 Cloudflare 支援）
- **Graceful Degradation**: 郵件發送失敗不中斷主流程

---

### 2. 環境自適應

**檔案**: `backend/src/services/gmail.ts:248-258`

```typescript
// 判斷是否為生產環境
const isProduction = env.FRONTEND_URL?.startsWith('https://') || false

// 開發環境：使用測試域名
if (!isProduction && fromEmail.includes('@coachrocks.com')) {
  resendFromEmail = "onboarding@resend.dev"
  resendEnvironment = "development"
}
```

**邏輯**:
- **開發環境** (`FRONTEND_URL` 不以 `https://` 開頭):
  - 使用 `onboarding@resend.dev`（Resend 測試域名）
  - 無需 DNS 配置，立即可用

- **生產環境** (`FRONTEND_URL` 以 `https://` 開頭):
  - 使用 `noreply@coachrocks.com`（自訂域名）
  - 需要配置 DNS 記錄（DKIM、SPF、DMARC）

---

### 3. 智慧錯誤分類

**檔案**: `backend/src/services/gmail.ts:28-147`

錯誤分類器根據錯誤訊息關鍵字，分類為 7 種類別，並提供針對性建議：

| 錯誤類別 | 關鍵字 | 圖標 | 建議 |
|---------|-------|------|------|
| **timeout** | timeout, exceeded, time limit | ⏱️ | 上傳較短的會議記錄、使用 DOCX 而非 MP4 |
| **api_error** | api, openai, rate limit, quota | 🤖 | 等待幾分鐘重試、非高峰時段上傳 |
| **file_format** | format, parse, invalid, corrupt | 📄 | 確認檔案格式、重新儲存檔案 |
| **file_size** | size, large, limit, 1gb | 📦 | 壓縮視訊、分割大檔案 |
| **database** | database, d1, sql, query | 💾 | 重新上傳、聯繫支援 |
| **network** | network, fetch, connection | 🌐 | 檢查網路連線、停用 VPN |
| **unknown** | 其他 | ⚠️ | 重新上傳、確認檔案格式 |

**設計好處**:
- 提升用戶體驗（針對性建議而非通用錯誤訊息）
- 降低支援成本（用戶能自行解決常見問題）
- 提高分析成功率（引導用戶正確使用）

---

## 函數變數使用位置

### sendEmail() 使用位置

| 呼叫位置 | 函數 | 用途 |
|---------|------|------|
| `gmail.ts:464-470` | `sendAnalysisStartedEmail()` | 發送分析開始郵件 |
| `gmail.ts:542-548` | `sendNotificationEmail()` | 發送分析處理郵件 |
| `gmail.ts:724-730` | `sendAnalysisCompleteEmail()` | 發送分析完成郵件 |

### sendAnalysisStartedEmail() 使用位置

| 呼叫位置 | 用途 |
|---------|------|
| `analyzeAuthenticatedMeeting.ts` | 新用戶首次分析時發送通知 |

### sendNotificationEmail() 使用位置

| 呼叫位置 | 用途 |
|---------|------|
| `analyzeAuthenticatedMeeting.ts` | 已驗證用戶發起分析時發送通知 |

### sendAnalysisCompleteEmail() 使用位置

| 呼叫位置 | 用途 |
|---------|------|
| `analyzeAuthenticatedMeeting.ts` | 分析完成時發送結果郵件（成功/失敗） |

---

## 環境變數

### 必要環境變數

#### RESEND_API_KEY

- **用途**: Resend API 認證金鑰（主要郵件服務）
- **取得方式**: [Resend Dashboard](https://resend.com/api-keys)
- **範例**: `re_Jcgku2wZ_MPQrHu2Mu2tzumUrZx9uwtb3`
- **設定方式**:
  ```bash
  # 本地開發
  echo "RESEND_API_KEY=re_your_api_key" >> backend/.dev.vars

  # 生產環境
  wrangler secret put RESEND_API_KEY
  ```

#### FROM_EMAIL

- **用途**: 發件人郵箱地址
- **開發環境**: `onboarding@resend.dev`（自動使用）
- **生產環境**: `noreply@coachrocks.com`（需要 DNS 驗證）
- **設定方式**:
  ```bash
  wrangler secret put FROM_EMAIL
  # 輸入: noreply@coachrocks.com
  ```

#### APP_NAME

- **用途**: 應用程式名稱（顯示在郵件發件人）
- **範例**: `CoachRocks AI`
- **設定方式**:
  ```bash
  wrangler secret put APP_NAME
  # 輸入: CoachRocks AI
  ```

#### BACKEND_URL

- **用途**: 後端 API URL（用於生成郵件中的連結）
- **範例**: `https://coach-backend.gamepig1976.workers.dev`
- **設定方式**:
  ```bash
  wrangler secret put BACKEND_URL
  # 輸入: https://coach-backend.gamepig1976.workers.dev
  ```

#### FRONTEND_URL

- **用途**: 前端應用 URL（用於判斷環境）
- **開發環境**: `http://localhost:5173`
- **生產環境**: `https://coach-rocks-frontend.pages.dev`
- **設定方式**:
  ```bash
  wrangler secret put FRONTEND_URL
  # 輸入: https://coach-rocks-frontend.pages.dev
  ```

### 可選環境變數（已廢棄但保留）

#### GMAIL_SMTP_USER

- **狀態**: 已廢棄（保留作為備援參考）
- **原因**: Cloudflare Workers 不支援 SMTP 協議

#### GMAIL_SMTP_PASSWORD

- **狀態**: 已廢棄（保留作為備援參考）
- **原因**: Cloudflare Workers 不支援 SMTP 協議

---

## 郵件範本

### 1. 分析開始郵件（Analysis Started）

**主題**: `🚀 Your Analysis Started - {fileName}`

**發送時機**: 新用戶首次上傳檔案並開始分析

**HTML 內容重點**:
- 🚀 分析開始標題
- 檔案名稱顯示
- 分析內容預覽（客戶洞察、行動項目、教練建議、社交媒體內容）
- 📧 完成通知預告

---

### 2. 分析處理郵件（Analysis Processing）

**主題**: `🎉 Your analysis is processing - {fileName}`

**發送時機**: 已驗證用戶發起分析

**HTML 內容重點**:
- 🎉 分析處理標題
- 檔案名稱顯示
- 📊 查看進度按鈕（連結到後端驗證端點）
- 📧 完成通知預告

---

### 3. 分析完成郵件（Analysis Complete - Success）

**主題**: `✅ Analysis Complete - {clientName} Meeting`

**發送時機**: 分析成功完成

**HTML 內容重點**:
- ✅ 分析完成標題（彩虹漸層背景）
- 客戶名稱或檔案名稱
- 🚀 分析內容列表（5 項）
- 🎉 查看完整分析按鈕（大號、彩虹漸層）

---

### 4. 分析失敗郵件（Analysis Complete - Failed）

**主題**: `{錯誤圖標} {錯誤標題} - {fileName}`

**發送時機**: 分析失敗

**HTML 內容重點**:
- {圖標} 錯誤標題（紅色漸層背景）
- ⚠️ 技術詳情區塊（錯誤訊息）
- 📋 解決建議列表（針對性建議，根據錯誤類別）
- 道歉訊息

**錯誤類別範例**:
- ⏱️ Analysis Timeout
- 🤖 AI Service Error
- 📄 File Format Issue
- 📦 File Size Limit Exceeded
- 💾 Data Storage Error
- 🌐 Network Connection Error
- ⚠️ Unexpected Error

---

## QA 常見問題

### Q1: 為什麼不使用 Gmail SMTP？

**問題**: 為什麼不直接使用 Gmail SMTP 發送郵件？

**原因**: Cloudflare Workers **不支援 TCP Socket 連線**

**技術限制**:
- Gmail SMTP 需要 TCP 連線（port 465/587）
- Cloudflare Workers 只支援 HTTP/HTTPS `fetch` API
- Workers 無法建立 TCP Socket

**解決方案**:
- 使用 HTTP-based Email API（Resend、MailChannels）
- 這些服務提供 HTTP API，完全兼容 Workers

**參考文件**: `backend/GMAIL_SMTP_LIMITATION_ANALYSIS.md`

---

### Q2: 如何切換到自訂域名？

**問題**: 如何從測試域名 `onboarding@resend.dev` 切換到自訂域名 `noreply@coachrocks.com`？

**解決方案**:

1. **在 Resend Dashboard 添加域名**:
   - 登入 [Resend Dashboard](https://resend.com/domains)
   - 點擊「Add Domain」
   - 輸入 `coachrocks.com`

2. **配置 DNS 記錄**（在 Cloudflare DNS 或 GoDaddy）:
   ```
   類型: TXT
   名稱: resend._domainkey
   內容: [從 Resend Dashboard 複製]

   類型: TXT
   名稱: send
   內容: v=spf1 include:amazonsns.com include:sendgrid.net ~all

   類型: MX
   名稱: send
   內容: [從 Resend Dashboard 複製]
   優先級: 10

   類型: TXT
   名稱: _dmarc
   內容: v=DMARC1; p=none;
   ```

3. **等待 DNS 傳播**（5-30 分鐘）

4. **驗證域名**:
   - 在 Resend Dashboard 檢查域名狀態
   - 應顯示 ✅ Verified

5. **更新環境變數**:
   - 設定 `FRONTEND_URL` 為生產 URL（以 `https://` 開頭）
   - 系統會自動使用 `noreply@coachrocks.com`

**參考文件**: `backend/RESEND_CUSTOMER_DNS_SETUP_GUIDE.md`

---

### Q3: 郵件進入垃圾箱怎麼辦？

**問題**: 發送的郵件進入收件人的垃圾郵件箱

**原因**:
- 使用測試域名 `onboarding@resend.dev`（信譽度較低）
- 缺少 SPF/DKIM/DMARC 記錄

**解決方案**:

**方案 A: 短期（測試域名）**:
- 告知用戶檢查垃圾郵件箱
- 將 `onboarding@resend.dev` 加入白名單
- 這是測試域名的正常現象

**方案 B: 長期（自訂域名）**:
1. 配置自訂域名（參考 Q2）
2. 確保 DNS 記錄完整:
   - SPF: `v=spf1 include:relay.mailchannels.net ~all`
   - DKIM: （從 Resend Dashboard 複製）
   - DMARC: `v=DMARC1; p=none;`
3. 建立郵件信譽（需要時間）

---

### Q4: 如何測試郵件發送？

**問題**: 如何測試郵件發送功能是否正常？

**解決方案**:

**方法 1: 使用應用 UI**:
1. 訪問 CoachRocks AI 應用
2. 上傳測試檔案
3. 填入測試郵箱
4. 檢查收件箱（包括垃圾郵件）

**方法 2: 直接 API 調用**:
```bash
curl -X POST https://coach-backend.gamepig1976.workers.dev/api/start-analysis-with-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-test-email@example.com",
    "fileContent": "Test meeting transcript",
    "fileName": "Test Meeting"
  }'
```

**預期日誌**:
```
🚀 [RESEND] Sending email via Resend API (development)...
   To: your-test-email@example.com | Subject: Your Analysis Results
✅ [RESEND] Email sent successfully!
   Email ID: abc123...
   Status: completed
```

---

### Q5: Resend 和 MailChannels 如何選擇？

**問題**: 應該使用 Resend 還是 MailChannels？

**建議**: 使用 **Resend 作為主要服務**，MailChannels 作為備援

**原因**:

| 特性 | Resend | MailChannels |
|------|--------|-------------|
| **開發環境** | ✅ 測試域名（無需 DNS） | ❌ 需要 DNS 配置 |
| **設定難度** | ✅ 簡單（只需 API Key） | ⚠️ 中等（需要 DNS SPF） |
| **免費額度** | 3,000 封/月 | 10,000 封/月 |
| **文檔支援** | ✅ 優秀 | ⚠️ 一般 |
| **專業形象** | ✅ 可自訂域名 | ✅ 可自訂域名 |

**建議配置**:
1. 設定 `RESEND_API_KEY`（主要服務）
2. 配置 DNS SPF 記錄（MailChannels 備援）
3. 系統自動使用 Resend，失敗時切換到 MailChannels

---

### Q6: 郵件發送失敗會影響主流程嗎？

**問題**: 如果郵件發送失敗，會導致分析流程中斷嗎？

**答案**: **不會**

**設計原則**: Graceful Degradation（優雅降級）

**實作細節**:
```typescript
export async function sendEmail(...): Promise<boolean> {
  try {
    // 嘗試發送郵件
    ...
  } catch (error) {
    console.error("❌ Failed to send email:", error)
    // 不拋出異常，返回 false
    return false
  }
}
```

**主流程處理**:
```typescript
// 分析完成後發送郵件
const emailSent = await sendAnalysisCompleteEmail(...)

// 無論郵件是否成功，都繼續主流程
if (emailSent) {
  console.log("✅ Email sent successfully")
} else {
  console.warn("⚠️ Email failed, but analysis completed")
}

// 分析結果已儲存，用戶可直接查看
```

---

## Debug 說明

### 查看郵件發送日誌

#### 使用 Wrangler Tail（即時日誌）

```bash
# 即時查看 Workers 日誌
wrangler tail

# 過濾郵件相關日誌
wrangler tail | grep -E "RESEND|MAILCHANNELS|Email"
```

**日誌範例**:

**成功（Resend）**:
```
🚀 [RESEND] Sending email via Resend API (development)...
   To: user@example.com | Subject: Analysis Complete
✅ [RESEND] Email sent successfully!
   Email ID: c05413e0-517a-4304-8c59-a702a76b8c11
   Status: completed
```

**失敗（Resend）→ 切換到 MailChannels**:
```
⚠️ [RESEND] API error (status 401): Invalid API key
🔄 [FALLBACK] Switching to MailChannels as fallback...
📧 [MAILCHANNELS] Attempting email delivery via MailChannels API...
✅ [MAILCHANNELS] Email sent successfully via fallback service!
```

**兩者都失敗**:
```
⚠️ [RESEND] API Key not configured, skipping primary service
🔄 [FALLBACK] Using MailChannels as primary service...
❌ [MAILCHANNELS] API error (status 400): SPF record not configured
📋 Setup Instructions:
   1. Resend: Create API key at https://resend.com/api-keys
   2. MailChannels: Configure DNS SPF (v=spf1 include:relay.mailchannels.net ~all)
```

---

### 測試環境變數

#### 檢查必要環境變數

```bash
# 本地開發
cat backend/.dev.vars

# 生產環境
wrangler secret list
```

**必要變數清單**:
- `RESEND_API_KEY` ✅
- `FROM_EMAIL` ✅
- `APP_NAME` ✅
- `BACKEND_URL` ✅
- `FRONTEND_URL` ✅

---

### 常見錯誤訊息

#### 錯誤 1: "RESEND_API_KEY not configured"

```
⚠️ [RESEND] API Key not configured, skipping primary service
```

**處理**:
```bash
# 本地開發
echo "RESEND_API_KEY=re_your_api_key" >> backend/.dev.vars

# 生產環境
wrangler secret put RESEND_API_KEY
```

---

#### 錯誤 2: "Invalid API key"

```
⚠️ [RESEND] API error (status 401): Invalid API key
```

**處理**:
1. 檢查 API Key 是否正確
2. 前往 [Resend Dashboard](https://resend.com/api-keys) 重新生成
3. 更新環境變數

---

#### 錯誤 3: "SPF record not configured"

```
❌ [MAILCHANNELS] API error (status 400): SPF record not configured
```

**處理**:
在 Cloudflare DNS 或 GoDaddy 添加 SPF 記錄:
```
類型: TXT
名稱: @
內容: v=spf1 include:relay.mailchannels.net ~all
```

等待 DNS 傳播（5-30 分鐘）。

---

#### 錯誤 4: "BACKEND_URL not configured"

```
❌ BACKEND_URL not configured. Please set BACKEND_URL environment variable.
```

**處理**:
```bash
wrangler secret put BACKEND_URL
# 輸入: https://coach-backend.gamepig1976.workers.dev
```

---

### 驗證郵件功能

#### 完整測試流程

```bash
# 1. 啟動本地開發環境
cd backend
npm run dev

# 2. 在另一個終端發送測試請求
curl -X POST http://localhost:8788/api/start-analysis-with-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-test-email@example.com",
    "fileContent": "This is a test meeting transcript for debugging email functionality.",
    "fileName": "Debug Test Meeting"
  }'

# 3. 檢查 wrangler dev 日誌
# 應該看到 Resend 或 MailChannels 發送成功

# 4. 檢查收件箱
# 郵件應在 5 分鐘內到達（檢查垃圾郵件箱）
```

---

## 相關文件

- [Cloudflare 部署](./10_cloudflare_deployment.md)
- [GitLab CI/CD 自動部署](./09_gitlab_cicd.md)
- [環境變數設定指南](./backend/ENV_SETUP.md)
- [Resend 實施摘要](./backend/RESEND_IMPLEMENTATION_SUMMARY.md)
- [MailChannels 配置指南](./backend/MAILCHANNELS_CONFIG.md)
- [Resend API 文件](https://resend.com/docs)
- [MailChannels 文件](https://mailchannels.zendesk.com/hc/en-us)

---

**文件版本**: 1.0
**建立日期**: 2025-11-18
**最後更新**: 2025-11-18
