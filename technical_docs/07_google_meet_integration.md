# Google Meet 整合 (Google Meet Integration)

**模組名稱**: Google Meet Integration
**主要功能**: Google Meet Webhook 接收與會議自動分析
**狀態**: 🚧 **部分實作 (Partial)**
**最後更新**: 2025-11-18

---

## 📋 功能描述

Google Meet 整合模組接收 Google Calendar/Meet Webhooks，自動獲取會議記錄，並觸發 AI 分析流程。

### 主要用途場景

1. **Webhook 接收** - 接收 Google Meet 會議更新事件
2. **錄音取得** - 透過 Google Drive API 取得會議錄音
3. **轉錄服務** - 將錄音轉換為文字 (Whisper API)
4. **自動分析** - 調用 AutoAnalysisService 進行分析
5. **OAuth 認證** - 重用現有 Google OAuth 2.0 認證

---

## 📂 檔案位置

### 核心檔案

- **`backend/src/endpoints/googleWebhook.ts`** - Google Meet Webhook 端點 (佔位檔案)
- **`backend/src/auth/google.ts`** - Google OAuth 認證服務

### 相關服務

- **`backend/src/services/autoAnalysisService.ts`** - 自動分析服務
- **`backend/src/services/openai.ts`** - OpenAI 服務 (含 Whisper API)

---

## 🔧 實作狀態

### ✅ 已完成

1. **Google OAuth 認證** - 使用者可透過 Google 登入
2. **AutoAnalysisService** - 統一分析服務已建立
3. **OpenAI Whisper API** - 音檔轉錄功能已就緒

### 🚧 進行中 / 未完成

1. **Google Meet Webhook 接收** - 端點存在但未實作
2. **Google Calendar API 整合** - 取得會議資訊
3. **Google Drive API 整合** - 下載會議錄音
4. **Webhook 訂閱管理** - 建立/更新/刪除訂閱

---

## 🔧 規劃功能

### 1. Google Meet Webhook 端點

**路由**: `POST /api/google/webhook`

**功能**:
- 接收 Google Calendar 事件變更通知
- 過濾 Meet 會議事件
- 取得會議錄音連結
- 下載並轉錄錄音
- 調用 AutoAnalysisService

**事件類型**:
```json
{
  "kind": "api#channel",
  "id": "channel_id",
  "resourceId": "resource_id",
  "resourceUri": "https://www.googleapis.com/calendar/v3/calendars/...",
  "token": "verification_token",
  "expiration": "1640000000000"
}
```

---

### 2. Google Calendar API 整合

**取得會議資訊**:
```typescript
async function getMeetingDetails(calendarId: string, eventId: string, accessToken: string) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  const event = await response.json()
  return {
    title: event.summary,
    startTime: event.start.dateTime,
    endTime: event.end.dateTime,
    participants: event.attendees.map(a => ({
      name: a.displayName || a.email,
      email: a.email
    })),
    meetingId: event.hangoutLink?.match(/meet\.google\.com\/([^?]+)/)?.[1]
  }
}
```

---

### 3. Google Drive API 整合

**下載會議錄音**:
```typescript
async function downloadMeetRecording(fileId: string, accessToken: string): Promise<Buffer> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  return Buffer.from(await response.arrayBuffer())
}
```

**尋找會議錄音**:
```typescript
async function findMeetingRecording(meetingId: string, accessToken: string): Promise<string | null> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name contains '${meetingId}' and mimeType='video/mp4'`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  const files = await response.json()
  return files.files?.[0]?.id || null
}
```

---

### 4. Webhook 訂閱管理

**建立訂閱**:
```typescript
async function createWebhookSubscription(
  calendarId: string,
  webhookUrl: string,
  accessToken: string
): Promise<{ channelId: string; expiration: number }> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/watch`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        type: 'web_hook',
        address: webhookUrl,
        token: crypto.randomUUID(),  // Verification token
        expiration: Date.now() + (7 * 24 * 60 * 60 * 1000)  // 7 days
      })
    }
  )

  return response.json()
}
```

**儲存訂閱資訊**:
```sql
CREATE TABLE google_webhook_subscriptions (
  subscription_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verification_token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

---

## 🏗️ 架構設計

```
┌─────────────────────────────────────────┐
│   Google Meet                          │
│   (Meeting ends, recording uploaded)  │
└─────────────────┬───────────────────────┘
                  │
                  ▼ Webhook (Calendar Event Change)
┌─────────────────────────────────────────┐
│   googleWebhook.ts                     │
│   1. 驗證 Token                       │
│   2. 取得會議詳情 (Calendar API)     │
│   3. 尋找錄音 (Drive API)            │
│   4. 下載錄音                         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   OpenAIService                        │
│   (Whisper API - 轉錄音檔)            │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   AutoAnalysisService                  │
│   (統一分析流程)                       │
└─────────────────────────────────────────┘
```

---

## 📋 實作檢查清單

### Phase 1: Webhook 基礎
- [ ] 實作 Webhook 端點驗證
- [ ] 處理 Google Calendar 事件通知
- [ ] 建立訂閱管理資料表
- [ ] 實作訂閱建立/刪除功能

### Phase 2: Google API 整合
- [ ] 整合 Google Calendar API
- [ ] 整合 Google Drive API
- [ ] 錄音檔案搜尋邏輯
- [ ] OAuth Scope 權限調整

### Phase 3: 錄音處理
- [ ] 實作錄音下載功能
- [ ] 整合 Whisper API 轉錄
- [ ] 處理大型錄音檔案
- [ ] 暫存檔案管理

### Phase 4: 自動分析整合
- [ ] 調用 AutoAnalysisService
- [ ] 參與者資訊解析
- [ ] 會議時長計算
- [ ] 結果儲存與通知

### Phase 5: 訂閱續約
- [ ] Subscription 過期檢查 (Cron Job)
- [ ] 自動續訂邏輯
- [ ] 訂閱失敗處理

---

## ❓ QA 常見問題

### Q1: Google Meet 整合的難點是什麼？

**A**:
- **錄音延遲**: 會議結束後，Google 需 5-15 分鐘處理錄音
- **錄音位置**: 錄音儲存在主辦人的 Google Drive
- **權限要求**: 需要 Calendar + Drive 讀取權限
- **Webhook 過期**: 訂閱最長 7 天，需自動續訂

### Q2: 如何知道會議有錄音？

**A**:
```typescript
// 方法 1: 檢查 Calendar Event 的 conferenceData
if (event.conferenceData?.createRequest?.requestId) {
  // 會議有 Meet 連結
  // 但無法直接知道是否有錄音
}

// 方法 2: 定期搜尋 Drive (推薦)
const recordingQuery = `
  name contains 'GMT' and
  name contains '${meetingDate}' and
  mimeType='video/mp4' and
  '${userEmail}' in owners
`
```

### Q3: Google Webhook 如何驗證？

**A**:
```typescript
// Google 不使用簽章，使用 Token 驗證
function verifyGoogleWebhook(
  channelId: string,
  resourceId: string,
  token: string
): boolean {
  // 查詢資料庫中的訂閱
  const subscription = await db.prepare(`
    SELECT * FROM google_webhook_subscriptions
    WHERE channel_id = ?
      AND resource_id = ?
      AND verification_token = ?
      AND expires_at > datetime('now')
  `).bind(channelId, resourceId, token).first()

  return !!subscription
}
```

### Q4: Webhook 訂閱如何續訂？

**A**:
```typescript
// 使用 Cloudflare Cron Triggers
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // 每天檢查即將過期的訂閱 (< 1 天)
    const expiringSubscriptions = await db.prepare(`
      SELECT * FROM google_webhook_subscriptions
      WHERE expires_at < datetime('now', '+1 day')
    `).all()

    for (const sub of expiringSubscriptions.results) {
      // 停止舊訂閱
      await stopWebhookSubscription(sub.channel_id, sub.resource_id, accessToken)

      // 建立新訂閱
      const newSub = await createWebhookSubscription(
        sub.calendar_id,
        webhookUrl,
        accessToken
      )

      // 更新資料庫
      await db.prepare(`
        UPDATE google_webhook_subscriptions
        SET channel_id = ?,
            resource_id = ?,
            expires_at = ?
        WHERE subscription_id = ?
      `).bind(newSub.channelId, newSub.resourceId, newSub.expiration, sub.subscription_id).run()
    }
  }
}
```

---

## 🔒 安全考量

### OAuth Scopes

```typescript
const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',  // 讀取行事曆
  'https://www.googleapis.com/auth/drive.readonly',     // 讀取 Drive 檔案
  'https://www.googleapis.com/auth/userinfo.email',     // 使用者 email
  'https://www.googleapis.com/auth/userinfo.profile'    // 使用者資訊
]
```

### Token 儲存

- ✅ 加密儲存 Access Token 和 Refresh Token
- ✅ 自動刷新過期 Token
- ✅ Token 撤銷處理

### Webhook 驗證

- ✅ 驗證 Channel ID 和 Resource ID
- ✅ 驗證 Verification Token
- ✅ 檢查訂閱過期時間

---

## 📚 相關文件

- [05_auto_analysis.md](./05_auto_analysis.md) - 自動分析服務
- [01_google_oauth.md](./01_google_oauth.md) - Google OAuth 認證
- [03_meeting_analysis.md](./03_meeting_analysis.md) - 會議分析服務
- [Google Calendar API](https://developers.google.com/calendar/api) - 官方文件
- [Google Drive API](https://developers.google.com/drive/api) - 官方文件

---

**文件版本**: 1.0 (部分實作)
**維護者**: Development Team
**狀態**: 🚧 進行中
**優先級**: P1 (高優先)
**預計完成時間**: 2-3 週
