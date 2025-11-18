# 資料庫服務 (Database Service)

**模組名稱**: Database Service
**主要功能**: Cloudflare D1 SQLite 資料庫操作與管理
**最後更新**: 2025-11-18

---

## 📋 功能描述

資料庫服務是 CoachRocks AI 的資料持久化層，負責所有與 Cloudflare D1 (SQLite) 資料庫的互動，包括使用者、客戶、會議、標籤、Reels 等所有業務資料的 CRUD 操作。

### 主要用途場景

1. **使用者管理** - 創建使用者、Session Token 管理、認證驗證
2. **客戶管理** - 儲存客戶資訊、標籤關聯、客戶檢視
3. **會議管理** - 儲存會議分析結果、檢視歷史會議
4. **Reels 管理** - 儲存社交媒體內容、收藏、發布狀態
5. **Dashboard 數據** - 統計資料、近期活動、數據聚合
6. **標籤系統** - 標籤 CRUD、客戶標籤關聯

---

## 📂 檔案位置

### 核心服務檔案

- **`backend/src/services/database.ts`** - 資料庫服務類別

### 資料庫遷移檔案

- **`backend/migrations/0001_initialize.sql`** - 初始資料庫結構
- **`backend/migrations/0002_add_google_auth.sql`** - Google OAuth 欄位
- **`backend/migrations/0004_add_onboarding_status.sql`** - Onboarding 狀態
- **`backend/migrations/0005_add_meeting_provider_columns.sql`** - 會議提供者欄位
- **`backend/migrations/0006_add_analysis_rate_limiting.sql`** - 分析速率限制

### 相關配置檔案

- **`backend/wrangler.jsonc`** - D1 資料庫綁定配置

---

## 📊 資料庫結構

### 核心資料表

#### 1. `users` - 使用者表

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    plan TEXT CHECK(plan IN ('free', 'basic', 'pro')) NOT NULL DEFAULT 'free',
    verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    session_expires_at TIMESTAMP WITH TIME ZONE,
    clients_columns_settings TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

**關鍵欄位**:
- `user_id` - 使用者唯一識別碼 (UUID)
- `email` - 電子郵件 (唯一)
- `plan` - 訂閱方案 ('free', 'basic', 'pro')
- `clients_columns_settings` - 客戶表格欄位設定 (JSON)

---

#### 2. `clients` - 客戶表

```sql
CREATE TABLE clients (
    client_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active',
    notes TEXT,
    total_sessions INTEGER DEFAULT 0,
    last_session_date DATE,
    tags TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

**關鍵欄位**:
- `client_id` - 客戶唯一識別碼 (UUID)
- `user_id` - 所屬使用者 (外鍵)
- `status` - 客戶狀態 ('Active', 'Inactive', 'Prospect'...)
- `tags` - 標籤 (JSON 陣列)

---

#### 3. `meetings` - 會議表

```sql
CREATE TABLE meetings (
    meeting_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    client_id UUID NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    meeting_title TEXT NOT NULL,
    meeting_date DATE NOT NULL,
    is_discovery BOOLEAN NOT NULL DEFAULT FALSE,
    transcript TEXT,
    summary TEXT,
    pain_point TEXT,
    suggestion TEXT,
    goal TEXT,
    sales_technique_advice TEXT,
    coaching_advice TEXT,
    action_items_client TEXT,
    action_items_coach TEXT,
    mind_map TEXT,
    email_content TEXT,
    resources_list TEXT,
    next_meeting_prep TEXT,
    analysis_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);
```

**關鍵欄位**:
- `meeting_id` - 會議唯一識別碼 (UUID)
- `analysis_status` - 分析狀態 ('pending', 'processing', 'completed', 'failed')
- `is_discovery` - 是否為探索會議
- `*_advice`, `*_items` - JSON 格式的分析結果欄位

---

#### 4. `reels_ideas` - Reels 腳本表

```sql
CREATE TABLE reels_ideas (
    reels_ideas_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    meeting_id UUID NOT NULL,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    hook TEXT,
    content TEXT NOT NULL,
    tags TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (meeting_id) REFERENCES meetings(meeting_id) ON DELETE CASCADE
);
```

---

#### 5. `tags` - 標籤表

```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
);
```

---

#### 6. `client_tags` - 客戶標籤關聯表

```sql
CREATE TABLE client_tags (
    id UUID PRIMARY KEY,
    client_id UUID NOT NULL,
    tag_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(client_id, tag_id)
);
```

---

#### 7. `session_tokens` - Session Token 表

```sql
CREATE TABLE session_tokens (
    token_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

---

## 🔧 主要函數

### 使用者管理 (User Management)

#### 1. `createOrUpdateUser(email: string)`

**用途**: 創建新使用者或取得現有使用者

**參數**:
- `email` (string) - 使用者電子郵件

**回傳值**:
```typescript
Promise<{
  userId: string;
  isNewUser: boolean;
}>
```

**呼叫位置**:
- `authGoogle.ts:145`
- `authGoogleNew.ts`

**設計邏輯**:
- 查詢是否有相同 email 的使用者
- 若不存在則創建新使用者 (UUID, email, default plan)
- 若存在則回傳現有使用者 ID

---

#### 2. `getUserByEmail(email: string)`

**用途**: 根據 email 取得使用者資訊

**參數**:
- `email` (string) - 使用者電子郵件

**回傳值**:
```typescript
Promise<any | null>
```

**呼叫位置**:
- `login.ts`
- `loginNew.ts`

---

#### 3. `createSessionToken(userId, tokenHash, expiresAt, userAgent?, ipAddress?)`

**用途**: 創建新的 Session Token

**參數**:
- `userId` (string) - 使用者 ID
- `tokenHash` (string) - Token 的 SHA-256 雜湊
- `expiresAt` (Date) - 過期時間
- `userAgent` (string, optional) - 使用者瀏覽器資訊
- `ipAddress` (string, optional) - 使用者 IP 位址

**回傳值**:
```typescript
Promise<string> // token_id
```

**呼叫位置**:
- `authGoogle.ts:176-182`
- `loginNew.ts`

**安全設計**:
- 儲存 Token 的 SHA-256 雜湊，不儲存原始 Token
- 記錄 User-Agent 和 IP 用於安全審計
- 設定過期時間，預設 30 天

---

#### 4. `getUserBySessionToken(tokenHash: string)`

**用途**: 根據 Session Token 取得使用者資訊

**參數**:
- `tokenHash` (string) - Token 的 SHA-256 雜湊

**回傳值**:
```typescript
Promise<any | null>
```

**查詢邏輯**:
```sql
SELECT u.* FROM users u
JOIN session_tokens st ON u.user_id = st.user_id
WHERE st.token_hash = ?
  AND st.is_active = TRUE
  AND st.expires_at > datetime('now')
```

**呼叫位置**:
- `middleware/auth.ts:34`

---

#### 5. `invalidateSessionToken(tokenHash: string)`

**用途**: 使特定 Session Token 失效 (登出)

**參數**:
- `tokenHash` (string) - Token 的 SHA-256 雜湊

**呼叫位置**:
- `logout.ts`

---

#### 6. `invalidateAllUserSessions(userId: string)`

**用途**: 使使用者的所有 Session Token 失效 (全部登出)

**參數**:
- `userId` (string) - 使用者 ID

**使用場景**:
- 使用者更改密碼
- 安全性事件回應

---

### 客戶管理 (Client Management)

#### 7. `saveClient(client: any)`

**用途**: 儲存或更新客戶資訊

**參數**:
```typescript
{
  userId: string;
  name: string;
  email?: string;
}
```

**回傳值**:
```typescript
Promise<string> // client_id
```

**呼叫位置**:
- `analyzeAuthenticatedMeeting.ts:122-130`

**設計邏輯**:
- 檢查是否已有相同名稱的客戶 (同一 userId)
- 若存在則更新 email
- 若不存在則創建新客戶 (UUID)

---

#### 8. `getClientById(clientId: string)`

**用途**: 根據 ID 取得客戶資訊

**參數**:
- `clientId` (string) - 客戶 ID

**回傳值**:
```typescript
Promise<any | null>
```

**呼叫位置**:
- `updateClient.ts:53`
- `listClients.ts`

---

#### 9. `getClientsWithTags(userId: string)`

**用途**: 取得使用者的所有客戶及其標籤

**參數**:
- `userId` (string) - 使用者 ID

**回傳值**:
```typescript
Promise<Array<{
  client_id: string;
  name: string;
  email: string;
  status: string;
  tags: Array<{ id: string; name: string; color: string }>;
  meetingsCount: number;
  lastSessionDate: string;
}>>
```

**查詢邏輯**:
- 聯結 `clients`, `client_tags`, `tags` 三張表
- 計算每個客戶的會議數量
- 聚合客戶的所有標籤

**呼叫位置**:
- `listClients.ts:48`

---

#### 10. `getClientsWithCounts(userId: string)`

**用途**: 取得客戶列表及統計數據

**參數**:
- `userId` (string) - 使用者 ID

**回傳值**:
```typescript
Promise<Array<{
  client_id: string;
  client_name: string;
  meetingsCount: number;
  lastMeetingDate: string;
}>>
```

**呼叫位置**:
- `dashboard.ts`

---

#### 11. `updateClient(clientId, updates)`

**用途**: 更新客戶資訊

**參數**:
```typescript
{
  name?: string;
  email?: string;
  status?: string;
  notes?: string;
  tags?: string[];
}
```

**回傳值**:
```typescript
Promise<void>
```

**呼叫位置**:
- `updateClient.ts:67-97`

**動態 SQL 設計**:
- 只更新提供的欄位
- 使用動態 SQL 建構 UPDATE 語句

---

### 會議管理 (Meeting Management)

#### 12. `saveMeeting(meeting: any)`

**用途**: 儲存會議分析結果

**參數**:
```typescript
{
  userId: string;
  clientId: string;
  clientName: string;
  meetingTitle: string;
  meetingDate: string;
  isDiscovery: boolean;
  transcript?: string;
  summary?: string;
  painPoint?: string;
  suggestion?: string;
  goal?: string;
  salesTechniqueAdvice?: any[];
  coachingAdvice?: any[];
  actionItemsClient?: any[];
  actionItemsCoach?: any[];
  mindMap?: string;
  emailContent?: string;
  resourcesList?: string;
  nextMeetingPrep?: any;
}
```

**回傳值**:
```typescript
Promise<string> // meeting_id
```

**呼叫位置**:
- `analyzeAuthenticatedMeeting.ts:215`
- `startAnalysisWithEmail.ts:212`

**資料處理**:
- JSON 陣列欄位使用 `JSON.stringify()` 儲存
- 自動產生 UUID 作為 meeting_id
- 設定 created_at 時間戳

---

#### 13. `getMeeting(id: string)`

**用途**: 根據 ID 取得會議詳細資訊

**參數**:
- `id` (string) - 會議 ID

**回傳值**:
```typescript
Promise<any | null>
```

**資料處理**:
- 自動解析 JSON 欄位 (`sales_technique_advice`, `coaching_advice`, `action_items_*`)
- 轉換為前端友好的欄位名稱

**呼叫位置**:
- `getMeetingById.ts:55`
- `generateMindMap.ts:65`
- `generateFollowUpEmail.ts:65`

---

#### 14. `getAllMeetings(userId: string)`

**用途**: 取得使用者的所有會議

**參數**:
- `userId` (string) - 使用者 ID

**回傳值**:
```typescript
Promise<any[]>
```

**排序**:
- 依 `created_at` 降序排列 (最新在前)

**呼叫位置**:
- `listMeetings.ts:48`

---

#### 15. `getMeetingsByClient(userId: string, clientId: string)`

**用途**: 取得特定客戶的所有會議

**參數**:
- `userId` (string) - 使用者 ID
- `clientId` (string) - 客戶 ID

**回傳值**:
```typescript
Promise<any[]>
```

**呼叫位置**:
- `generateNextMeetingPrep.ts:67-71`

**應用場景**:
- 產生下次會議準備建議
- 檢視客戶歷史會議記錄

---

#### 16. `updateMeetingNextMeetingPrep(meetingId, nextMeetingPrep)`

**用途**: 更新會議的下次準備建議

**參數**:
- `meetingId` (string) - 會議 ID
- `nextMeetingPrep` (any) - 準備建議物件

**呼叫位置**:
- `generateNextMeetingPrep.ts:97-101`

---

#### 17. `deleteMeeting(id: string)`

**用途**: 刪除會議記錄

**參數**:
- `id` (string) - 會議 ID

**注意事項**:
- 會觸發級聯刪除 (CASCADE) 相關的 Reels

---

### Reels 管理 (Reels Management)

#### 18. `saveReelsIdeas(userId, meetingId, reels)`

**用途**: 批次儲存 Reels 腳本

**參數**:
```typescript
{
  userId: string;
  meetingId: string;
  reels: Array<{
    hook: string;
    narrative?: string;
    content?: string;
    callToAction?: string;
    hashtags?: string[];
    tags?: string[];
  }>;
}
```

**回傳值**:
```typescript
Promise<void>
```

**呼叫位置**:
- `analyzeAuthenticatedMeeting.ts:342-346`
- `startAnalysisWithEmail.ts:339-343`

**設計邏輯**:
- 批次插入多個 Reels
- 使用事務確保一致性

---

#### 19. `getReelsByUser(userId: string)`

**用途**: 取得使用者的所有 Reels

**參數**:
- `userId` (string) - 使用者 ID

**回傳值**:
```typescript
Promise<Array<{
  reels_ideas_id: string;
  meeting_id: string;
  hook: string;
  content: string;
  tags: string[];
  is_favorite: boolean;
  is_published: boolean;
  created_at: string;
  meeting_title: string;
  client_name: string;
}>>
```

**查詢邏輯**:
- 聯結 `meetings` 表取得會議標題和客戶名稱
- 解析 JSON 格式的 tags

**呼叫位置**:
- `reels.ts:52`

---

#### 20. `updateReel(id, fields)`

**用途**: 更新 Reel 資訊

**參數**:
```typescript
{
  hook?: string | null;
  content?: string | null;
  tags?: string[] | null;
}
```

**呼叫位置**:
- `reels.ts:110-135`

---

#### 21. `setReelFavorite(id: string, isFavorite: boolean)`

**用途**: 設定 Reel 收藏狀態

**參數**:
- `id` (string) - Reel ID
- `isFavorite` (boolean) - 是否收藏

**呼叫位置**:
- `reels.ts:161`

---

#### 22. `deleteReel(id: string)`

**用途**: 刪除 Reel

**參數**:
- `id` (string) - Reel ID

**呼叫位置**:
- `reels.ts:186`

**安全檢查**:
- 確認 Reel 屬於當前使用者

---

### 標籤系統 (Tag System)

#### 23. `getTagsByUser(userId: string)`

**用途**: 取得使用者的所有標籤及使用次數

**參數**:
- `userId` (string) - 使用者 ID

**回傳值**:
```typescript
Promise<Array<{
  id: string;
  name: string;
  color: string;
  created_at: string;
  clientCount: number;
}>>
```

**查詢邏輯**:
- 計算每個標籤被多少客戶使用
- 依名稱排序

**呼叫位置**:
- `tags.ts:51`

---

#### 24. `createTag(tag)`

**用途**: 創建新標籤

**參數**:
```typescript
{
  userId: string;
  name: string;
  color: string;
}
```

**回傳值**:
```typescript
Promise<string> // tag_id
```

**唯一性約束**:
- 同一使用者不可有重複名稱的標籤 (UNIQUE constraint)

**呼叫位置**:
- `tags.ts:94-103`

---

#### 25. `updateTag(tagId, updates)`

**用途**: 更新標籤資訊

**參數**:
```typescript
{
  name?: string;
  color?: string;
}
```

**呼叫位置**:
- `tags.ts:143-172`

---

#### 26. `deleteTag(tagId: string)`

**用途**: 刪除標籤

**參數**:
- `tagId` (string) - 標籤 ID

**級聯效果**:
- 自動刪除 `client_tags` 中的關聯記錄 (CASCADE)

**呼叫位置**:
- `tags.ts:195`

---

#### 27. `assignTagToClient(clientId, tagId)`

**用途**: 將標籤分配給客戶

**參數**:
- `clientId` (string) - 客戶 ID
- `tagId` (string) - 標籤 ID

**唯一性約束**:
- 同一客戶不可重複分配相同標籤 (UNIQUE constraint)

**呼叫位置**:
- `clientTags.ts:93-102`

---

#### 28. `removeTagFromClient(clientId, tagId)`

**用途**: 從客戶移除標籤

**參數**:
- `clientId` (string) - 客戶 ID
- `tagId` (string) - 標籤 ID

**呼叫位置**:
- `clientTags.ts:129`

---

### Dashboard 數據 (Dashboard Data)

#### 29. `getDashboardStats(userId: string)`

**用途**: 取得 Dashboard 統計數據

**參數**:
- `userId` (string) - 使用者 ID

**回傳值**:
```typescript
Promise<{
  totalClients: number;
  totalMeetings: number;
  totalReels: number;
  recentActivity: Array<any>;
}>
```

**統計邏輯**:
- 計算客戶總數
- 計算會議總數
- 計算 Reels 總數
- 取得最近 10 筆活動

**呼叫位置**:
- `dashboard.ts:48`

---

#### 30. `getRecentActivity(userId, limit)`

**用途**: 取得最近活動記錄

**參數**:
- `userId` (string) - 使用者 ID
- `limit` (number) - 回傳筆數，預設 10

**回傳值**:
```typescript
Promise<Array<{
  type: string;
  title: string;
  timestamp: string;
  client_name: string;
}>>
```

**活動類型**:
- 會議建立
- Reels 生成
- 客戶新增

**呼叫位置**:
- `dashboard.ts:76`

---

## 📍 函數變數使用位置

### 使用者認證流程

```typescript
// authGoogle.ts:145 - Google OAuth 登入
const { userId, isNewUser } = await databaseService.createOrUpdateUser(email)

// authGoogle.ts:176-182 - 建立 Session Token
const tokenId = await databaseService.createSessionToken(
  userId,
  tokenHash,
  expiresAt,
  userAgent,
  ipAddress
)
```

### 會議分析流程

```typescript
// analyzeAuthenticatedMeeting.ts:122-130 - 建立新客戶
const finalClientId = crypto.randomUUID()
await databaseService.saveClient({
  userId,
  name: clientName,
  email: null
})

// analyzeAuthenticatedMeeting.ts:215 - 儲存會議記錄
const meetingId = await databaseService.saveMeeting({
  userId,
  clientId: finalClientId,
  clientName: finalClientName,
  meetingTitle: fileName,
  meetingDate,
  isDiscovery: isDiscoveryMeeting,
  transcript: fileContent,
  summary: summaryJson,
  // ... 其他欄位
})

// analyzeAuthenticatedMeeting.ts:342-346 - 儲存 Reels
await databaseService.saveReelsIdeas(
  userId,
  meetingId,
  parsedReels
)
```

### 標籤管理流程

```typescript
// clientTags.ts:93-102 - 分配標籤給客戶
await databaseService.assignTagToClient(clientId, tagId)

// clientTags.ts:129 - 移除客戶標籤
await databaseService.removeTagFromClient(clientId, tagId)
```

---

## 🏗️ 設計概念

### 架構設計

```
┌─────────────────────────────────────────┐
│   API Endpoints                        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   DatabaseService (database.ts)        │
│   ┌─────────────────────────────────┐  │
│   │  User Management               │  │
│   │  Client Management             │  │
│   │  Meeting Management            │  │
│   │  Reels Management              │  │
│   │  Tag Management                │  │
│   │  Dashboard Data                │  │
│   └─────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   Cloudflare D1 (SQLite)               │
│   ┌─────────────────────────────────┐  │
│   │  users, clients, meetings      │  │
│   │  reels_ideas, tags             │  │
│   │  client_tags, session_tokens   │  │
│   └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 設計模式

1. **Repository Pattern (倉儲模式)**
   - DatabaseService 作為資料存取層
   - 封裝所有 SQL 查詢邏輯
   - 提供業務友好的介面

2. **Prepared Statements (預編譯語句)**
   - 所有 SQL 使用 `db.prepare().bind()` 模式
   - 防止 SQL Injection 攻擊
   - 提升查詢效能

3. **Foreign Key Cascading (外鍵級聯)**
   - 使用 `ON DELETE CASCADE`
   - 刪除使用者時自動刪除所有相關資料
   - 保持資料一致性

4. **JSON 欄位儲存**
   - 陣列資料使用 `JSON.stringify()` 儲存
   - 讀取時使用 `JSON.parse()` 解析
   - 適合非關聯性資料

5. **UUID 作為主鍵**
   - 使用 `crypto.randomUUID()` 產生
   - 避免 ID 碰撞
   - 支援分散式系統

---

## ❓ QA 常見問題

### Q1: 為什麼使用 D1 而不是傳統 PostgreSQL？

**A**:
- **Serverless**: 與 Cloudflare Workers 完美整合
- **成本**: 免費額度足夠小型應用 (5GB 儲存)
- **效能**: SQLite 在單一資料庫讀取效能優異
- **簡單**: 無需管理伺服器，自動備份

### Q2: D1 有什麼限制？

**A**:
- **寫入效能**: 每秒約 1000 次寫入 (SQLite 限制)
- **資料庫大小**: 單一資料庫最大 2GB (可升級)
- **並發**: 不支援跨區域寫入
- **功能**: 部分 PostgreSQL 功能不支援 (如 JSON 運算子)

### Q3: 如何處理並發寫入？

**A**:
```typescript
// D1 自動處理鎖定，但建議避免高頻並發寫入
try {
  await db.prepare(`INSERT INTO ...`).run()
} catch (error) {
  // 重試邏輯
  if (error.message.includes('database is locked')) {
    await new Promise(resolve => setTimeout(resolve, 100))
    await db.prepare(`INSERT INTO ...`).run()
  }
}
```

### Q4: 如何執行資料庫遷移？

**A**:
```bash
# 本地開發環境
wrangler d1 migrations apply coachdb --local

# 生產環境
wrangler d1 migrations apply coachdb --remote

# 查看遷移狀態
wrangler d1 migrations list coachdb
```

### Q5: 如何備份 D1 資料庫？

**A**:
- **自動備份**: D1 每天自動備份
- **手動匯出**:
```bash
# 匯出到 SQL 檔案
wrangler d1 export coachdb --output=backup.sql

# 匯入
wrangler d1 execute coachdb --file=backup.sql
```

### Q6: Session Token 如何清理？

**A**:
```typescript
// cleanupExpiredSessions() - database.ts:963
async cleanupExpiredSessions(): Promise<void> {
  await this.db.prepare(`
    DELETE FROM session_tokens
    WHERE expires_at < datetime('now')
  `).run()
}

// 建議定期執行 (如每日)
// 使用 Cloudflare Cron Triggers
```

---

## 🐛 Debug 說明

### 查詢 D1 資料庫

```bash
# 開發環境 (本地 SQLite)
wrangler d1 execute coachdb --local --command="SELECT * FROM users LIMIT 5"

# 生產環境
wrangler d1 execute coachdb --remote --command="SELECT * FROM users LIMIT 5"

# 使用檔案執行複雜查詢
wrangler d1 execute coachdb --file=query.sql
```

### 常見查詢範例

```sql
-- 檢查會議分析狀態
SELECT meeting_id, client_name, analysis_status, created_at
FROM meetings
WHERE user_id = 'xxx'
ORDER BY created_at DESC
LIMIT 10;

-- 檢查孤立的 Session Tokens
SELECT token_id, user_id, expires_at, is_active
FROM session_tokens
WHERE is_active = TRUE
AND expires_at < datetime('now');

-- 檢查客戶的標籤關聯
SELECT c.name, t.name as tag_name, t.color
FROM clients c
LEFT JOIN client_tags ct ON c.client_id = ct.client_id
LEFT JOIN tags t ON ct.tag_id = t.id
WHERE c.user_id = 'xxx';
```

### 日誌追蹤

```typescript
// database.ts 內建詳細日誌
console.log('Client saved successfully')
console.log('Meeting saved successfully')
console.error('Error saving client:', error)

// 在端點中啟用
console.log('DB query result:', result)
```

### 常見錯誤排查

#### 錯誤 1: `UNIQUE constraint failed`

**原因**: 違反唯一性約束

**範例**:
```
UNIQUE constraint failed: tags.user_id, tags.name
```

**解決方案**:
- 檢查是否已有相同名稱的標籤
- 在插入前先查詢

```typescript
const existing = await databaseService.getTagsByUser(userId)
const isDuplicate = existing.some(tag => tag.name === newTagName)
if (isDuplicate) {
  throw new Error('Tag name already exists')
}
```

#### 錯誤 2: `FOREIGN KEY constraint failed`

**原因**: 外鍵參照的記錄不存在

**範例**:
```
FOREIGN KEY constraint failed (client_id not found)
```

**解決方案**:
- 確認客戶存在才建立會議
- 使用事務確保一致性

#### 錯誤 3: `database is locked`

**原因**: SQLite 寫入鎖定

**解決方案**:
- 實作重試邏輯 (exponential backoff)
- 避免長時間鎖定
- 減少並發寫入

---

## 🔒 安全考量

### SQL Injection 防護

```typescript
// ✅ 正確：使用 Prepared Statements
const stmt = db.prepare(`SELECT * FROM users WHERE email = ?`)
await stmt.bind(email).first()

// ❌ 錯誤：字串拼接
const query = `SELECT * FROM users WHERE email = '${email}'`
await db.prepare(query).first()
```

### 敏感資料保護

- ✅ 密碼使用 bcrypt 雜湊儲存
- ✅ Session Token 儲存 SHA-256 雜湊
- ✅ 不在日誌記錄密碼或 Token

### 資源擁有權檢查

```typescript
// 確保使用者只能存取自己的資料
const client = await db.prepare(`
  SELECT * FROM clients WHERE client_id = ? AND user_id = ?
`).bind(clientId, userId).first()

if (!client) {
  throw new Error('Client not found or access denied')
}
```

---

## 📚 相關文件

- [03_meeting_analysis.md](./03_meeting_analysis.md) - 會議分析服務
- [01_google_oauth.md](./01_google_oauth.md) - Google OAuth 認證
- [10_cloudflare_deployment.md](./10_cloudflare_deployment.md) - Cloudflare 部署
- [Cloudflare D1 文件](https://developers.cloudflare.com/d1/) - 官方文件

---

**文件版本**: 1.0
**維護者**: Development Team
**更新記錄**:
- 2025-11-18: 初始版本建立
