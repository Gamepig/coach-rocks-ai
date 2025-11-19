# CoachRocks AI - 專案轉移指南

**轉移目標**: 從 `gamepig1976@gmail.com` 轉移至 `katherine84522@gmail.com`

---

## 📚 文件導覽

### 1️⃣ **PROJECT_OWNERSHIP_TRANSFER_GUIDE.md** ⭐ 主要文檔
- 📖 **用途**: 完整的轉移指南（推薦首先閱讀）
- 🎯 **內容**:
  - 轉移值映射表（所有需要更新的值）
  - 6 個 Phase 的詳細說明
  - 自動化操作 (AUTO_001 ~ AUTO_011)
  - 手動操作步驟（含 Cloudflare Dashboard 導航）
  - 回滾計劃（緊急情況）
- ⏱️ **閱讀時間**: 15-20 分鐘
- 🔑 **關鍵信息**:
  - Phase 3 (AUTO_008)：RESEND 郵件服務詳細設定
  - Phase 6：域名遷移至 coachrocks.com

---

### 2️⃣ **TRANSFER_QUICK_REFERENCE.md** ⚡ 快速參考
- 📖 **用途**: 快速查閱和實際操作指南
- 🎯 **內容**:
  - 轉移值對照表
  - AI 可立即執行的命令
  - RESEND 郵件服務快速設定（AUTO_008）
  - 部署前檢查清單
  - 常見問題快速修復
- ⏱️ **閱讀時間**: 5-10 分鐘
- 📋 **用法**: 在執行轉移時參考此文檔

---

### 3️⃣ **AI_TRANSFER_INSTRUCTIONS.json** 🤖 AI 可執行指令集
- 📖 **用途**: 結構化的 JSON 格式，用於 AI 自動化執行
- 🎯 **內容**:
  - 5 個 Phase 的完整定義
  - 每個 Phase 的 Step 定義（包含 AUTO_008 RESEND 配置）
  - bash 命令和驗證方法
  - 可執行條件和依賴關係
- 💡 **用法**:
  - 提供給 AI（Claude、Cursor 等）來自動執行轉移
  - 結構化的操作參數便於自動化處理

---

### 4️⃣ **DOMAIN_MIGRATION_JSON_SUPPLEMENT.json** 📦 域名遷移補充
- 📖 **用途**: Phase 6（域名遷移）的詳細 JSON 結構
- 🎯 **內容**:
  - Phase 6 的所有操作（AUTO_009, AUTO_010, AUTO_011）
  - MANUAL_DOMAIN_001 ~ 004 的詳細步驟
  - DNS 配置規範
  - 部署檢查清單
  - 回滾場景和解決方案
- 💡 **用法**:
  - 可集成到主 AI_TRANSFER_INSTRUCTIONS.json 中
  - 單獨查閱 Phase 6 詳細信息

---

### 5️⃣ **GITLAB_CICD_SETUP.md** 🚀 GitLab CI/CD 自動化
- 📖 **用途**: 完全自動化 GitLab CI/CD Pipeline 轉移指南
- 🎯 **內容**:
  - GitLab CI/CD Pipeline 架構（5 個 Phase）
  - GitLab Variables 配置步驟
  - 手動檢查點和確認流程
  - 監控和除錯指南
  - 常見問題和解決方案
- ⏱️ **閱讀時間**: 10-15 分鐘
- 🔑 **關鍵信息**:
  - ✅ 完全跨平台支援（Windows/Mac/Linux）
  - ✅ 無需本地 Bash 環境
  - ✅ 自動驗證和錯誤檢查
  - ✅ 手動檢查點確保安全

---

## 🚀 GitLab CI/CD 用戶 - 完全自動化轉移

**最推薦方案：直接在 GitLab CI/CD 中執行，無需本地環境**

### 適用場景
- ✅ Katherine 使用 Windows（無 Bash 環境）
- ✅ 需要完整的自動化流程
- ✅ 不想在本地安裝開發環境
- ✅ 需要詳細的執行日誌和追蹤

### 3 步快速開始

```
1️⃣ 配置 GitLab Variables（Phase 1 後）
   → Settings → CI/CD → Variables → 添加 NEW_ACCOUNT_ID

2️⃣ 觸發 Pipeline
   → Build → Pipelines → Play 按鈕（手動檢查點）

3️⃣ 監控執行進度
   → Build → Pipelines → 查看每個 Job 的日誌
```

### GitLab CI/CD Pipeline 優勢

| 特性 | 優勢 |
|------|------|
| **跨平台** | Windows、Mac、Linux 一視同仁 |
| **無本地環境** | GitLab Runner 負責執行，無需安裝工具 |
| **自動驗證** | 每步都有完整性檢查 |
| **手動確認** | 關鍵步驟（Phase 1、3、4）需要人工確認 |
| **完整日誌** | 所有操作都可追蹤 |
| **安全管理** | 敏感信息通過 Protected Variables 保護 |

### 推薦的執行順序

1. 📖 **讀 GITLAB_CICD_SETUP.md**（10 分鐘）- 了解完整流程
2. ⚙️ **設置 GitLab Variables**（5 分鐘）- 手動添加帳戶 ID
3. ▶️ **觸發 Pipeline**（自動）- GitLab CI/CD 自動執行
4. 🔍 **監控日誌**（自動）- 查看執行進度和結果

### 相關文件

- 📖 [GITLAB_CICD_SETUP.md](./GITLAB_CICD_SETUP.md) - **詳細設置指南**
- ⚙️ [.gitlab-ci.yml](../../.gitlab-ci.yml) - Pipeline 配置（自動載入）
- ⚡ [TRANSFER_QUICK_REFERENCE.md](./TRANSFER_QUICK_REFERENCE.md) - 快速參考

---

## 🎨 Cursor IDE 用戶 - 快速開始指南

**如果您正在使用 Cursor IDE，這裡是最快的入門方式**：

### 3 分鐘快速開始

```bash
# 1. 在 Cursor 中打開專案
cursor /Users/gamepig/projects/coach-rocks-main

# 2. 打開轉移指南
按 Cmd+P → 搜尋 "CURSOR_WORKFLOW.md"

# 3. 按照指南操作
參考 CURSOR_WORKFLOW.md 進行轉移
```

### 推薦的 Cursor 工作流

| 文件 | 用途 | 何時用 |
|------|------|--------|
| **CURSOR_WORKFLOW.md** ⭐ | Cursor IDE 完整工作流指南 | **開始前必讀** |
| **cursor-transfer-agent.md** 🤖 | 複製-貼上 AI Prompt | **執行轉移時** |
| **.cursorules** 📋 | Cursor 規則和提醒 | transfer_guide/ 資料夾中 |
| TRANSFER_QUICK_REFERENCE.md ⚡ | 快速參考和命令 | **查詢特定操作** |

### Cursor 獨特優勢

✅ **Cursor Composer**: 批量編輯多個檔案
✅ **AI Agent**: 自動執行 Bash 命令
✅ **終端集成**: 在 IDE 中執行和驗證
✅ **智能提示**: .cursorules 自動提醒規則

### 步驟

1. **打開 CURSOR_WORKFLOW.md** (5 分鐘了解工作流)
2. **打開 cursor-transfer-agent.md** (複製 Prompt 開始執行)
3. **參考 TRANSFER_QUICK_REFERENCE.md** (查詢特定命令)
4. **觀察 .cursorules** 提醒 (IDE 自動幫助)

**[👉 更多細節見 CURSOR_WORKFLOW.md]**

---

## 🚀 快速開始（非 Cursor 用戶）

### 推薦流程

1. **開始前（5 分鐘）**
   ```bash
   # 閱讀主要指南（理解整體流程）
   cat PROJECT_OWNERSHIP_TRANSFER_GUIDE.md | head -200
   ```

2. **Phase 1-5（轉移帳戶、配置）**
   ```bash
   # 逐步參考快速指南執行操作
   cat TRANSFER_QUICK_REFERENCE.md

   # 或提供給 AI 完整指令
   cat AI_TRANSFER_INSTRUCTIONS.json | jq '.phases.phase_1, .phases.phase_2'
   ```

3. **Phase 6（域名遷移）**
   ```bash
   # 查閱主要指南的 Phase 6 部分或補充文檔
   grep -A 200 "第 6 階段" PROJECT_OWNERSHIP_TRANSFER_GUIDE.md

   # 或查看 JSON 補充文檔
   cat DOMAIN_MIGRATION_JSON_SUPPLEMENT.json
   ```

---

## 📋 Phase 概覽

| Phase | 名稱 | 執行者 | 時機 |
|-------|------|--------|------|
| **1️⃣** | Cloudflare 帳戶準備 | Katherine | 開始前 |
| **2️⃣** | 自動化 URL 更新 | AI | Phase 1 後 |
| **3️⃣** | Google OAuth & RESEND 配置 | 混合 | Phase 2 後 |
| **4️⃣** | 資料庫遷移 | 混合 | Phase 3 後 |
| **5️⃣** | 驗證和測試 | 混合 | Phase 4 後 |
| **6️⃣** | 域名遷移至 coachrocks.com | 混合 | Phase 5 穩定後 |

---

## 🔑 關鍵操作列表

### 自動化操作（AI 執行）
- ✅ AUTO_001：批量更新後端 URL
- ✅ AUTO_002：更新 Git 配置
- ✅ AUTO_003：更新 wrangler.jsonc Account ID
- ✅ AUTO_004：更新腳本中的郵箱
- ✅ AUTO_005：驗證沒有遺漏的舊值
- ✅ AUTO_006：設置 Google OAuth Secrets
- ✅ AUTO_007：複製其他 Secrets
- ✅ **AUTO_008：RESEND 郵件服務配置** ⭐ 新增
- ✅ AUTO_009：批量更新域名（Phase 6）
- ✅ AUTO_010：更新 Google OAuth 回調 URI（Phase 6）
- ✅ AUTO_011：驗證域名轉移完整性（Phase 6）

### 手動操作（Katherine 執行）
- ⚙️ P1_S1：獲取新 Cloudflare Account ID
- ⚙️ P1_S2：建立新 Workers
- ⚙️ P1_S3：建立新 Pages
- ⚙️ P3_S1：建立 Google OAuth 憑證
- ⚙️ P4_S1：遷移 D1 資料庫
- ⚙️ MANUAL_DOMAIN_001：購買域名（Phase 6）
- ⚙️ MANUAL_DOMAIN_002：配置 Workers 自訂域名（Phase 6）
- ⚙️ MANUAL_DOMAIN_003：配置 Pages 自訂域名（Phase 6）
- ⚙️ MANUAL_DOMAIN_004：配置域名重定向（Phase 6）

---

## 📧 RESEND 郵件服務（Auto_008）⭐ 新增

**快速提示**:
- ✅ **開發環境**: 自動使用 `onboarding@resend.dev`（無需驗證）
- ✅ **生產環境**: 需驗證 `coachrocks.com`（Phase 6）

**設定步驟**:
```bash
# 1. 設置 API Key
cd backend
wrangler secret put RESEND_API_KEY

# 2. 驗證
wrangler secret list | grep RESEND

# 3. 測試郵件（可選）
node test-resend-email.js test@example.com
```

詳見：
- 📖 `PROJECT_OWNERSHIP_TRANSFER_GUIDE.md` → Step 8️⃣
- ⚡ `TRANSFER_QUICK_REFERENCE.md` → 📧 RESEND 郵件服務快速設定

---

## 🆘 常見問題

### Q1: 從哪個文檔開始？
**A**: 按順序：
1. 本 README（快速概覽）
2. `PROJECT_OWNERSHIP_TRANSFER_GUIDE.md`（完整理解）
3. `TRANSFER_QUICK_REFERENCE.md`（實際操作）

### Q2: 郵件服務配置在哪裡？
**A**: AUTO_008 - RESEND 郵件服務配置
- 詳見：`PROJECT_OWNERSHIP_TRANSFER_GUIDE.md` → **Step 8️⃣**
- 快速設定：`TRANSFER_QUICK_REFERENCE.md` → **📧 RESEND 郵件服務快速設定**

### Q3: 如何安全的進行轉移？
**A**:
1. 完整備份原始代碼
2. 逐個 Phase 執行，每個 Phase 後驗證
3. 保持 Phase 3 和 Phase 4 的驗證指令
4. 參考「回滾計劃」以防出錯

### Q4: 如果遇到錯誤？
**A**:
1. 查看 `PROJECT_OWNERSHIP_TRANSFER_GUIDE.md` → 回滾計劃
2. 查看 `TRANSFER_QUICK_REFERENCE.md` → 🆘 常見問題快速修復
3. 檢查驗證命令輸出

---

## 📊 檔案大小和複雜度

| 文檔 | 大小 | 複雜度 | 用途 |
|------|------|--------|------|
| PROJECT_OWNERSHIP_TRANSFER_GUIDE.md | 41KB | 🟡 中等 | 完整指南 |
| TRANSFER_QUICK_REFERENCE.md | 17KB | 🟢 簡單 | 快速參考 |
| AI_TRANSFER_INSTRUCTIONS.json | 17KB | 🟡 中等 | AI 自動化 |
| DOMAIN_MIGRATION_JSON_SUPPLEMENT.json | 15KB | 🟠 複雜 | Phase 6 詳細 |

---

## 🔐 安全提示

⚠️ **重要**:
- 不要將這些文檔中的密鑰和 ID 提交到公開倉庫
- 在實際轉移前備份所有配置
- 始終使用 `wrangler secret put` 來設置敏感信息（不要使用 echo）
- RESEND API Key 應在授權人員間安全傳遞

---

## 📝 最後更新

- **日期**: 2025-11-19
- **新增**: AUTO_008 RESEND 郵件服務詳細配置
- **版本**: 1.0

---

**準備好開始轉移了嗎？** 從 `PROJECT_OWNERSHIP_TRANSFER_GUIDE.md` 開始！🚀
