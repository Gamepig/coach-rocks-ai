# 自動分析服務 (Auto Analysis Service)

**模組名稱**: Auto Analysis Service
**主要功能**: 統一處理 Zoom 和 Google Meet 自動化分析觸發
**最後更新**: 2025-11-18

---

## 📋 功能描述

自動分析服務是會議平台整合的核心服務，負責統一處理來自 Zoom 和 Google Meet Webhook 的會議記錄，自動觸發 AI 分析流程。

### 主要用途場景

1. **會議過濾** - 根據時長和參與者數量篩選需要分析的會議
2. **客戶匹配** - 根據參與者 email/name 自動匹配已有客戶
3. **自動分析觸發** - 調用 OpenAI 服務進行會議分析
4. **錯誤追蹤** - 使用 Correlation ID 追蹤完整分析流程
5. **多 Provider 支援** - 統一處理不同平台的會議資料

---

## 📂 檔案位置

### 核心服務檔案

- **`backend/src/services/autoAnalysisService.ts`** - 自動分析服務類別

### Webhook 端點檔案

- **`backend/src/endpoints/zoomWebhook.ts`** - Zoom Webhook 端點 (未實作)
- **`backend/src/endpoints/googleWebhook.ts`** - Google Meet Webhook 端點

---

## 🔧 主要函數

### AutoAnalysisService 類別

#### 1. `triggerAnalysis(input: AutoAnalysisInput)`

**用途**: 主入口函數，觸發自動分析流程

**參數**:
```typescript
{
  provider: 'zoom' | 'google';
  meetingId: string;
  title: string;
  transcript: string;
  duration: number;  // 分鐘
  participants: Array<{
    name: string;
    email?: string;
  }>;
  recordingUrl?: string;
  metadata?: Record<string, any>;
}
```

**回傳值**:
```typescript
Promise<{
  success: boolean;
  message: string;
  meetingId: string;
  userId?: string;
  clientId?: string;
  correlationId: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}>
```

**流程步驟**:
1. 產生 Correlation ID (追蹤 ID)
2. 驗證輸入資料
3. 應用過濾器 (時長、參與者)
4. 識別使用者 (從參與者 email)
5. 匹配或建立客戶
6. 執行 AI 分析
7. 儲存結果

**呼叫位置**:
- `googleWebhook.ts` (當 Google Meet 會議結束時)
- `zoomWebhook.ts` (當 Zoom 會議結束時 - 未實作)

---

#### 2. `validateInput(input: AutoAnalysisInput)`

**用途**: 驗證輸入資料完整性

**驗證項目**:
- Provider 必須是 'zoom' 或 'google'
- 必要欄位不可為空 (meetingId, title, transcript)
- Duration 必須為正數
- Participants 至少 1 人

**回傳值**:
```typescript
string | null  // 錯誤訊息或 null (驗證通過)
```

---

#### 3. `shouldAnalyzeMeeting(duration: number, participantCount: number)`

**用途**: 判斷會議是否應該被分析

**預設過濾條件**:
```typescript
{
  minDuration: 15,      // 最少 15 分鐘
  minParticipants: 1    // 至少 1 人
}
```

**回傳值**:
```typescript
boolean
```

**過濾邏輯**:
- 會議時長 >= 15 分鐘
- 參與者數量 >= 1
- 可擴充支援 maxDuration, maxParticipants

---

#### 4. `identifyUser(participants: Array<{name, email?}>)`

**用途**: 從參與者中識別系統使用者 (教練)

**識別邏輯**:
1. 遍歷所有參與者
2. 檢查 email 是否在 users 表中
3. 找到第一個匹配的使用者

**回傳值**:
```typescript
Promise<{
  userId: string;
  email: string;
} | null>
```

**呼叫位置**:
- `triggerAnalysis()` 內部

---

#### 5. `matchOrCreateClient(userId, participants, excludeEmail)`

**用途**: 匹配現有客戶或創建新客戶

**參數**:
- `userId` (string) - 使用者 ID (教練)
- `participants` (Array) - 參與者列表
- `excludeEmail` (string) - 排除的 email (教練自己)

**匹配邏輯**:
1. 過濾掉教練自己 (excludeEmail)
2. 遍歷剩餘參與者
3. 根據 email 或 name 匹配現有客戶
4. 若無匹配則創建新客戶

**回傳值**:
```typescript
Promise<{
  clientId: string;
  clientName: string;
  isNewClient: boolean;
}>
```

**客戶命名規則**:
- 優先使用 participant.name
- 若無則使用 email 前綴
- 多人會議: "會議 - 2025-11-18"

---

#### 6. `executeAnalysis(userId, clientId, clientName, transcript, title)`

**用途**: 執行完整的 AI 分析流程

**分析步驟**:
1. 偵測會議類型 (Discovery / Consulting)
2. 產生結構化摘要
3. 產生心智圖 (Mermaid)
4. 產生後續郵件
5. 產生 Reels 腳本
6. 儲存所有結果到資料庫

**回傳值**:
```typescript
Promise<string>  // meeting_id
```

**錯誤處理**:
- 每步驟獨立 try-catch
- 失敗時繼續執行其他步驟
- 記錄詳細錯誤日誌

---

#### 7. `generateCorrelationId(provider, meetingId)`

**用途**: 產生追蹤 ID 用於日誌關聯

**格式**:
```
zoom-abc123-def456
google-xyz789-uvw123
```

**用途**:
- 追蹤完整分析流程
- 關聯所有相關日誌
- 除錯與問題定位

---

## 📊 類型定義

### AutoAnalysisInput

```typescript
interface AutoAnalysisInput {
  provider: 'zoom' | 'google';
  meetingId: string;
  title: string;
  transcript: string;
  duration: number;
  participants: Array<{
    name: string;
    email?: string;
  }>;
  recordingUrl?: string;
  metadata?: Record<string, any>;
}
```

### AutoAnalysisResult

```typescript
interface AutoAnalysisResult {
  success: boolean;
  message: string;
  meetingId: string;
  userId?: string;
  clientId?: string;
  correlationId: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### AnalysisFilters

```typescript
interface AnalysisFilters {
  minDuration: number;      // 分鐘
  maxDuration?: number;     // 分鐘 (選用)
  minParticipants: number;
  maxParticipants?: number; // 選用
}
```

---

## 🏗️ 設計概念

### 架構設計

```
┌─────────────────────────────────────────┐
│   Webhook Endpoints                    │
│   (Zoom / Google Meet)                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   AutoAnalysisService                  │
│   ┌─────────────────────────────────┐  │
│   │  1. 驗證輸入                   │  │
│   │  2. 過濾會議                   │  │
│   │  3. 識別使用者                 │  │
│   │  4. 匹配/建立客戶              │  │
│   │  5. 執行分析                   │  │
│   └─────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│  OpenAIService│   │DatabaseService│
└───────────────┘   └───────────────┘
```

### 設計模式

1. **Strategy Pattern (策略模式)**
   - 不同 Provider 使用相同介面
   - 統一處理流程，差異化處理資料格式

2. **Pipeline Pattern (管道模式)**
   - 分析流程分為多個步驟
   - 每步驟獨立可測試
   - 步驟失敗不影響後續步驟

3. **Correlation ID Pattern**
   - 追蹤分散式系統中的請求
   - 關聯所有相關日誌
   - 方便除錯與監控

---

## 📍 函數變數使用位置

### Webhook 調用範例

```typescript
// googleWebhook.ts (未來實作)
const autoAnalysis = new AutoAnalysisService(env)

const result = await autoAnalysis.triggerAnalysis({
  provider: 'google',
  meetingId: event.meetingId,
  title: event.meetingTitle,
  transcript: event.transcript,
  duration: event.duration,
  participants: event.participants,
  recordingUrl: event.recordingUrl,
  metadata: event.metadata
})

if (result.success) {
  console.log(`✅ 分析完成 - Meeting ID: ${result.meetingId}`)
} else {
  console.error(`❌ 分析失敗 - ${result.error?.message}`)
}
```

---

## ❓ QA 常見問題

### Q1: 如何處理沒有 email 的參與者？

**A**:
- 使用參與者 name 匹配現有客戶
- 若無匹配則建立新客戶，email 設為 null
- 未來可手動補充 email

### Q2: 多人會議如何分配客戶？

**A**:
- 目前實作：選擇第一個非教練參與者
- 未來改進：支援多客戶會議
- 建議：一對一會議優先

### Q3: 會議過濾條件可以自訂嗎？

**A**:
- 目前固定：15 分鐘、1 人
- 未來改進：每個使用者可自訂過濾條件
- 儲存在 users 表的 settings 欄位

### Q4: Correlation ID 如何追蹤？

**A**:
```bash
# 使用 wrangler tail 過濾日誌
wrangler tail --format pretty | grep "zoom-abc123"

# 所有相關日誌都包含相同 Correlation ID
# [zoom-abc123-def456] 📌 開始自動分析觸發
# [zoom-abc123-def456] ✅ 使用者識別成功
# [zoom-abc123-def456] ✅ 客戶匹配成功
```

### Q5: 自動分析失敗如何重試？

**A**:
- 目前：失敗後返回錯誤，不重試
- 未來改進：
  - 儲存失敗會議到佇列
  - 支援手動重新觸發分析
  - 使用 Cloudflare Queues 實作重試邏輯

---

## 🐛 Debug 說明

### 詳細日誌追蹤

```typescript
// autoAnalysisService.ts 內建詳細日誌
console.log(`[${correlationId}] 📌 開始自動分析觸發`)
console.log(`[${correlationId}] ✅ 使用者識別成功: ${userId}`)
console.log(`[${correlationId}] ✅ 客戶匹配成功: ${clientId}`)
console.warn(`[${correlationId}] ⚠️  會議過濾失敗`)
console.error(`[${correlationId}] ❌ 分析執行失敗`)
```

### 常見錯誤排查

#### 錯誤 1: `USER_NOT_FOUND`

**原因**: 參與者中沒有系統註冊的使用者 (教練)

**解決方案**:
- 確認教練已註冊系統
- 確認 Webhook 傳遞的 email 正確
- 檢查 users 表中的 email

#### 錯誤 2: `MEETING_FILTERED`

**原因**: 會議不符合過濾條件

**解決方案**:
```typescript
// 檢查會議資訊
console.log('Duration:', duration, 'Participants:', participants.length)

// 調整過濾條件 (如需要)
private readonly filters: AnalysisFilters = {
  minDuration: 10,  // 降低最低時長
  minParticipants: 1
}
```

#### 錯誤 3: `ANALYSIS_EXECUTION_FAILED`

**原因**: AI 分析過程中發生錯誤

**解決方案**:
- 查看 Correlation ID 追蹤完整日誌
- 檢查 OpenAI API 狀態
- 確認 transcript 內容有效

---

## 🔒 安全考量

### Webhook 驗證

```typescript
// 驗證 Webhook 來源
const signature = request.headers.get('X-Zoom-Signature')
const isValid = verifyWebhookSignature(body, signature, WEBHOOK_SECRET)

if (!isValid) {
  return new Response('Invalid signature', { status: 401 })
}
```

### 敏感資料處理

- ✅ 不記錄完整 transcript 到日誌
- ✅ 不記錄參與者個人資訊
- ✅ 使用 Correlation ID 而非真實 ID

### 資源擁有權

```typescript
// 確認使用者擁有客戶
const client = await db.prepare(`
  SELECT * FROM clients WHERE client_id = ? AND user_id = ?
`).bind(clientId, userId).first()
```

---

## 📚 相關文件

- [03_meeting_analysis.md](./03_meeting_analysis.md) - 會議分析服務
- [04_database_service.md](./04_database_service.md) - 資料庫服務
- [06_zoom_integration.md](./06_zoom_integration.md) - Zoom 整合
- [07_google_meet_integration.md](./07_google_meet_integration.md) - Google Meet 整合

---

**文件版本**: 1.0
**維護者**: Development Team
**更新記錄**:
- 2025-11-18: 初始版本建立
