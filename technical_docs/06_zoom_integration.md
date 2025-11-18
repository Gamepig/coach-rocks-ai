# Zoom 整合 (Zoom Integration)

**模組名稱**: Zoom Integration
**主要功能**: Zoom Webhook 接收與會議自動分析
**狀態**: 🚧 **未實作 (Planned)**
**最後更新**: 2025-11-18

---

## 📋 功能描述

Zoom 整合模組將接收 Zoom Webhooks，自動獲取會議記錄和錄音，並觸發 AI 分析流程。

###主要用途場景

1. **Webhook 接收** - 接收 Zoom 會議結束事件
2. **錄音下載** - 自動下載會議錄音檔案
3. **轉錄服務** - 將錄音轉換為文字 (Whisper API)
4. **自動分析** - 調用 AutoAnalysisService 進行分析
5. **OAuth 認證** - Zoom OAuth 2.0 認證流程

---

## 📂 檔案位置

### 核心檔案 (未實作)

- **`backend/src/endpoints/zoomWebhook.ts`** - Zoom Webhook 端點 (佔位檔案)
- **`backend/src/services/zoomService.ts`** - Zoom API 服務 (待建立)

---

## 🔧 規劃功能

### 1. Zoom Webhook 端點

**路由**: `POST /api/zoom/webhook`

**功能**:
- 接收 Zoom Webhook 事件
- 驗證 Webhook 簽章
- 處理會議結束事件 (`recording.completed`)
- 調用 AutoAnalysisService

**事件類型**:
```json
{
  "event": "recording.completed",
  "payload": {
    "object": {
      "id": "meeting_id",
      "uuid": "meeting_uuid",
      "host_id": "host_id",
      "topic": "Meeting Title",
      "start_time": "2025-11-18T10:00:00Z",
      "duration": 60,
      "recording_files": [{
        "id": "file_id",
        "recording_start": "2025-11-18T10:00:00Z",
        "recording_end": "2025-11-18T11:00:00Z",
        "file_type": "MP4",
        "file_size": 123456789,
        "download_url": "https://zoom.us/rec/download/..."
      }]
    }
  }
}
```

---

### 2. Zoom OAuth 2.0 認證

**流程**:
1. 使用者點擊「連接 Zoom」
2. 重導向至 Zoom 授權頁面
3. 使用者授權後返回應用
4. 交換 Authorization Code 取得 Access Token
5. 儲存 Token 到 D1 資料庫

**Token 儲存結構**:
```sql
CREATE TABLE zoom_tokens (
  token_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

---

### 3. 錄音下載與轉錄

**流程**:
```typescript
// 1. 下載錄音
const recording = await downloadZoomRecording(downloadUrl, accessToken)

// 2. 轉錄音檔 (OpenAI Whisper)
const transcript = await openaiService.transcribeAudio(recording)

// 3. 觸發分析
const result = await autoAnalysisService.triggerAnalysis({
  provider: 'zoom',
  meetingId: meetingUuid,
  title: topic,
  transcript: transcript,
  duration: duration,
  participants: participants,
  recordingUrl: downloadUrl
})
```

---

## 🏗️ 架構設計

```
┌─────────────────────────────────────────┐
│   Zoom Platform                        │
│   (Meeting ends)                       │
└─────────────────┬───────────────────────┘
                  │
                  ▼ Webhook
┌─────────────────────────────────────────┐
│   zoomWebhook.ts                       │
│   1. 驗證簽章                         │
│   2. 解析事件                         │
│   3. 下載錄音                         │
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

### Phase 1: OAuth 認證
- [ ] 建立 Zoom App 並取得 Client ID/Secret
- [ ] 實作 OAuth 授權流程
- [ ] 建立 zoom_tokens 資料表
- [ ] Token 刷新機制

### Phase 2: Webhook 接收
- [ ] 設定 Zoom Webhook URL
- [ ] 實作 Webhook 簽章驗證
- [ ] 處理 `recording.completed` 事件
- [ ] 錯誤處理與重試邏輯

### Phase 3: 錄音處理
- [ ] 實作錄音下載功能
- [ ] 整合 OpenAI Whisper API
- [ ] 處理大型錄音檔案 (>25MB)
- [ ] 暫存檔案管理

### Phase 4: 自動分析整合
- [ ] 調用 AutoAnalysisService
- [ ] 參與者資訊提取
- [ ] 會議時長計算
- [ ] 結果儲存與通知

---

## ❓ QA 常見問題

### Q1: 為什麼 Zoom 整合尚未實作？

**A**:
- 優先實作 Google Meet 整合 (與現有 Google OAuth 整合)
- Zoom 需要額外的 OAuth App 設定
- 需要 Zoom Pro 帳號才能使用 Webhook

### Q2: Zoom Webhook 如何驗證？

**A**:
```typescript
// Zoom 使用 HMAC SHA256 簽章
import crypto from 'crypto'

function verifyZoomWebhook(body: string, signature: string, secret: string): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  return signature === hash
}
```

### Q3: Zoom 錄音檔案過大如何處理？

**A**:
- Whisper API 限制：25MB
- 解決方案：
  1. 下載錄音後壓縮
  2. 分段上傳至 Whisper
  3. 合併轉錄結果

### Q4: Zoom Token 過期如何處理？

**A**:
```typescript
// Token 刷新流程
async function refreshZoomToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  })

  const data = await response.json()
  return data.access_token
}
```

---

## 🔒 安全考量

### Webhook 驗證

- ✅ 驗證 Zoom Webhook 簽章
- ✅ 檢查事件時間戳 (防止重放攻擊)
- ✅ IP 白名單 (Zoom Webhook IP 範圍)

### Token 儲存

- ✅ 加密儲存 Access Token 和 Refresh Token
- ✅ 定期刷新 Token
- ✅ Token 過期處理

### 錄音下載

- ✅ 驗證下載 URL 來源
- ✅ 限制檔案大小
- ✅ 下載後即刪除暫存檔案

---

## 📚 相關文件

- [05_auto_analysis.md](./05_auto_analysis.md) - 自動分析服務
- [03_meeting_analysis.md](./03_meeting_analysis.md) - 會議分析服務
- [07_google_meet_integration.md](./07_google_meet_integration.md) - Google Meet 整合
- [Zoom Webhook 文件](https://developers.zoom.us/docs/api/rest/webhook-reference/) - 官方文件

---

**文件版本**: 1.0 (規劃階段)
**維護者**: Development Team
**狀態**: 🚧 未實作
**優先級**: P2 (中等優先)
**預計實作時間**: 2-3 週
