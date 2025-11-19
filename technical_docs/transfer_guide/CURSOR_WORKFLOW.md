# Cursor IDE - CoachRocks AI 專案轉移工作流指南

**目標**: 在 Cursor 中高效執行專案轉移任務
**適用於**: Cursor IDE 用戶
**最後更新**: 2025-11-19

---

## 🎯 快速開始（3 分鐘）

### 1️⃣ 在 Cursor 中打開專案

```bash
# 方法 A: 命令行
cursor /Users/gamepig/projects/coach-rocks-main

# 方法 B: 在 Cursor 中手動打開
File → Open Folder → 選擇 coach-rocks-main
```

### 2️⃣ 打開轉移指南

在 Cursor 中按 `Cmd+P`（Mac）或 `Ctrl+P`（Windows/Linux），搜尋：
```
technical_docs/transfer_guide/README.md
```

### 3️⃣ 使用 AI Agent 開始轉移

按 `Cmd+Shift+I`（Mac）打開 AI Composer，貼上下方的 Prompt：

```
請協助執行 CoachRocks AI 專案所有權轉移。
開始前，請確認：
1. 已打開 technical_docs/transfer_guide/PROJECT_OWNERSHIP_TRANSFER_GUIDE.md
2. 已準備好 Katherine 的新 Cloudflare Account ID
3. 已閱讀 Phase 概覽

然後按照 Phase 順序執行轉移步驟。
```

---

## 📚 文件導覽（Cursor 中）

### 推薦的 Cursor 標籤頁布局

```
┌─────────────────────────────────────────┐
│ 1. README.md（參考）     [快速導覽]     │
├─────────────────────────────────────────┤
│ 2. TRANSFER_QUICK_REFERENCE.md（執行）  │
├─────────────────────────────────────────┤
│ 3. 終端（執行命令）                     │
├─────────────────────────────────────────┤
│ 4. PROJECT_OWNERSHIP_TRANSFER_GUIDE.md  │
│    （詳細參考）                        │
└─────────────────────────────────────────┘
```

**設置方法**:
1. 在 Cursor 中打開上述 4 個文件
2. 右鍵標籤 → "Split Right" 排列成 2 列
3. 左欄：參考文件 | 右欄：終端和執行區域

---

## 🤖 Cursor AI Agent 工作流

### Phase 1: Cloudflare 帳戶準備

**Cursor Composer Prompt**:
```
[從 technical_docs/transfer_guide/ 打開以下文件進行參考]
- PROJECT_OWNERSHIP_TRANSFER_GUIDE.md（查看 Phase 1 部分）
- README.md（查看 Phase 概覽表格）

[幫我完成以下步驟]
1. 確認已閱讀 P1_S1、P1_S2、P1_S3
2. 提醒我需要向 Katherine 索要的信息：
   - 新的 Cloudflare Account ID
   - 新的 Database ID（後續用）
3. 列出 Phase 1 完成後的檢查點
```

### Phase 2: 自動化 URL 更新

**Cursor 終端工作流**:
```
1. 在 Cursor 內置終端中執行下列命令
2. AI Agent 會幫你驗證執行結果
```

**Prompt 給 Cursor AI**:
```
Katherine 已提供新的 Cloudflare Account ID：[ID_HERE]

請幫我執行 Phase 2 的自動化 URL 更新：
- 打開 TRANSFER_QUICK_REFERENCE.md 中的「AI 可立即執行的命令」
- 執行命令 Step 1（批量更新後端 URL）
- 執行命令 Step 2（更新 Git 配置）
- 執行命令 Step 4（驗證沒有遺漏）

[Cursor AI 將在終端中執行這些命令]
```

### Phase 3: OAuth & RESEND 配置

**分兩部分執行**:

**Part A: 手動設置（使用 Cursor 編輯器）**
```
1. Cmd+F 搜尋「RESEND_API_KEY」
2. 根據 PROJECT_OWNERSHIP_TRANSFER_GUIDE.md Step 8️⃣ 配置
3. Cursor 會高亮所有相關的環境變數
```

**Part B: AI Agent 協助（使用 Composer）**
```
請根據 technical_docs/transfer_guide/TRANSFER_QUICK_REFERENCE.md
的「📧 RESEND 郵件服務快速設定」部分，在終端中執行：

1. cd backend
2. wrangler secret put RESEND_API_KEY
3. 粘貼 API Key（來自舊帳戶的 .dev.vars）
4. 驗證設置

如果失敗，請檢查錯誤信息並提出解決方案。
```

---

## 🎨 Cursor Composer 批量編輯技巧

### 技巧 1: 批量替換 URL（使用 Composer）

**場景**: 需要替換所有後端 URL（Phase 2）

**步驟**:
1. 按 `Cmd+Shift+I`（Mac）打開 Composer
2. 粘貼下面的 Prompt:

```
我需要批量替換以下值：
舊值: https://coach-backend.gamepig1976.workers.dev
新值: https://coach-backend.katherine84522.workers.dev

請：
1. 搜尋所有包含舊值的檔案
2. 使用 Composer 一次性替換所有檔案
3. 顯示被修改的檔案列表
4. 執行驗證命令確認沒有遺漏

涉及的檔案類型: *.ts, *.tsx, *.js, *.jsonc, .env.*, .dev.vars
```

**Cursor Composer 優勢**:
- ✅ 可視化預覽所有改動
- ✅ 批量編輯多個檔案
- ✅ 可以在 Composer 中即時修改
- ✅ 提交前可以完整查看

### 技巧 2: 配置檔案更新（使用 Composer）

**場景**: 更新 wrangler.jsonc 的 Account ID

**步驟**:
1. 打開 Composer
2. 粘貼以下 Prompt:

```
[參考 PROJECT_OWNERSHIP_TRANSFER_GUIDE.md AUTO_003]

我需要更新 backend/wrangler.jsonc：

將 "account_id": "9288c023577aa2f6ce20582b6c4bdda0"
替換為 "account_id": "[NEW_ACCOUNT_ID]"

請：
1. 打開該檔案
2. 顯示修改前後的對比
3. 告訴我確認修改的命令
```

### 技巧 3: 驗證命令執行（使用 Composer + 終端）

**場景**: 執行驗證檢查清單（Phase 5）

**步驟**:
1. 在 Composer 中粘貼:

```
根據 TRANSFER_QUICK_REFERENCE.md 的「✅ 部署前檢查清單」，
請在終端中逐一執行以下驗證：

1. 沒有遺漏的舊值檢查
2. Git 配置檢查
3. 配置檔案檢查
4. Secrets 檢查

幫我顯示每個檢查的結果，並告訴我是否通過。
```

2. Cursor AI 會在終端執行，並實時顯示結果
3. 如果有失敗，AI 會提出修復建議

---

## 🛠️ 終端工作流（在 Cursor 中執行）

### 設置 Cursor 內置終端

1. **打開終端**: `Ctrl+`` （反引號）
2. **確保在正確目錄**:
   ```bash
   pwd  # 應該顯示 .../coach-rocks-main
   ```

### Phase 1-5 的關鍵命令

```bash
# ===== Phase 2: 自動化 URL 更新 =====
# 執行 AUTO_001: 批量更新後端 URL
find . -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsonc' \) \
  ! -path '*/node_modules/*' ! -path '*/.git/*' \
  -exec sed -i '' 's|coach-backend\.gamepig1976\.workers\.dev|coach-backend.katherine84522.workers.dev|g' {} +

# 驗證 (應該返回 0)
grep -r 'coach-backend.gamepig1976' . --include='*.ts' --include='*.jsonc' | wc -l

# ===== Phase 3: Secrets 設置 =====
cd backend
wrangler secret put RESEND_API_KEY
# 粘貼 API Key

# 驗證
wrangler secret list | grep RESEND

# ===== Phase 5: 部署前檢查 =====
echo "=== 檢查遺漏的舊值 ===" && \
grep -r 'gamepig1976' . --include='*.ts' --include='*.jsonc' \
  --exclude-dir='.git' --exclude-dir='node_modules' 2>/dev/null || echo "✅ 無遺漏"
```

### Cursor AI 終端助手

按 `Cmd+K`（在終端中）可以使用 Cursor AI 幫助：

```
[在終端中按 Cmd+K，然後輸入]

執行 TRANSFER_QUICK_REFERENCE.md 中的「部署前檢查清單」
並告訴我每個檢查是否通過
```

Cursor AI 會：
- ✅ 理解文件內容
- ✅ 執行命令
- ✅ 解釋結果
- ✅ 提出修復建議

---

## ⌨️ 推薦的快捷鍵和工作流設置

### Mac 快捷鍵

```
打開 Cursor 終端             Ctrl + `
打開 AI Composer            Cmd + Shift + I
AI 終端助手                 Cmd + K（在終端中）
快速檔案搜尋                Cmd + P
檔案內搜尋                  Cmd + F
批量替換                    Cmd + H
檔案並排顯示              Cmd + \ (然後 Split Right)
```

### 建議的工作流按鍵綁定（.vscode/keybindings.json）

```json
[
  {
    "key": "cmd+shift+t",
    "command": "workbench.action.terminal.new",
    "when": "terminalFocus == false"
  },
  {
    "key": "cmd+shift+v",
    "command": "editor.action.clipboardPasteAction",
    "when": "editorTextFocus"
  }
]
```

---

## 📋 轉移過程 Cursor 執行清單

### 執行前準備 (5 分鐘)

- [ ] 在 Cursor 中打開 coach-rocks-main 專案
- [ ] 打開 README.md 和 TRANSFER_QUICK_REFERENCE.md
- [ ] 打開 Cursor 內置終端
- [ ] 確認 Node.js、git、wrangler 已安裝

```bash
# 驗證環境
node --version
git --version
wrangler --version
```

### Phase 1: 帳戶準備 (由 Katherine 完成)

- [ ] 向 Katherine 索要新的 Cloudflare Account ID
- [ ] 向 Katherine 索要新建立的 Database ID
- [ ] 確認 Workers 和 Pages 已建立

### Phase 2: 自動化更新 (15 分鐘)

```bash
# 使用下方 Prompt 在 Composer 中執行
```

**Cursor Composer Prompt**:
```
執行 TRANSFER_QUICK_REFERENCE.md 中的「AI 可立即執行的命令」：
- Step 1: 批量更新後端 URL
- Step 2: 更新 Git 配置
- Step 3: 更新腳本中的郵箱
- Step 4: 驗證沒有遺漏

執行完後顯示驗證結果。
```

- [ ] 執行批量 URL 更新
- [ ] 更新 Git 配置
- [ ] 驗證沒有遺漏的舊值

### Phase 3: OAuth & RESEND (10 分鐘)

- [ ] 向 Katherine 索要新的 Google OAuth 憑證
- [ ] 在 Cursor 終端中設置 Google OAuth Secrets
- [ ] 執行 AUTO_008: 配置 RESEND 郵件服務
- [ ] 測試 RESEND 郵件發送

```bash
cd backend
node test-resend-email.js test@example.com
```

- [ ] 確認郵件收到

### Phase 4: 資料庫遷移 (20 分鐘)

- [ ] 向 Katherine 索要新的 Database ID
- [ ] 使用 Composer 更新 wrangler.jsonc
- [ ] 測試資料庫連接

### Phase 5: 驗證和測試 (15 分鐘)

```bash
# 使用 Composer 執行完整的部署前檢查清單
```

**Cursor Composer Prompt**:
```
根據 TRANSFER_QUICK_REFERENCE.md 的「✅ 部署前檢查清單」
執行所有驗證檢查並報告結果。
```

- [ ] 執行所有驗證檢查
- [ ] 確認沒有錯誤
- [ ] 進行部署測試

### Phase 6: 域名遷移 (需要額外時間)

- [ ] 參考 DOMAIN_MIGRATION_JSON_SUPPLEMENT.json
- [ ] 執行 AUTO_009: 批量更新域名
- [ ] 執行 AUTO_010: 更新 Google OAuth 回調
- [ ] 執行 AUTO_011: 驗證域名轉移

---

## 🔍 Cursor 特定的除錯技巧

### 技巧 1: 即時命令執行和查看

```bash
# 在終端按 Cmd+K，輸入
Show git diff for coach-backend.katherine84522.workers.dev changes
```

Cursor AI 會即時顯示所有改動。

### 技巧 2: 智能檔案搜尋

```
Cmd+P，輸入: transfer_guide
```

快速找到轉移指南中的任何檔案。

### 技巧 3: 智能命令建議

```bash
# 輸入到一半時，按 Ctrl+Space 獲得 AI 建議
wrangler secret [Ctrl+Space]
# Cursor 會建議可用的 secrets
```

### 技巧 4: 多文件搜尋和替換

```
Cmd+H 打開「尋找和替換」
在「檔案」欄輸入: *.ts, *.jsonc
一次性替換多個檔案，同時預覽所有改動
```

---

## 🚀 進階: 建立自訂 Cursor 命令

### 步驟 1: 建立命令檔案

在項目根目錄建立 `.cursor/commands/transfer.md`：

```markdown
# 執行專案轉移

自動執行 CoachRocks AI 專案轉移流程。

## 使用方法
在 Cursor 中按 Cmd+Shift+C，搜尋 "transfer"

## 自動化步驟
1. 檢查環境準備
2. 執行 Phase 2-5 的自動化步驟
3. 提供驗證檢查清單
```

### 步驟 2: 使用自訂命令

```bash
Cmd+Shift+C → 搜尋 "transfer" → 按 Enter
```

---

## 💡 最佳實踐

### Do（應該做）
✅ 使用 Cursor Composer 進行批量編輯
✅ 使用 AI Agent 執行複雜命令
✅ 在提交前預覽所有改動
✅ 保持終端和編輯器同時可見
✅ 根據 TRANSFER_QUICK_REFERENCE.md 逐步執行

### Don't（不應該做）
❌ 手動編輯多個檔案（使用 Composer）
❌ 不驗證就提交變更
❌ 忽略錯誤信息
❌ 同時執行多個 Phase
❌ 跳過驗證步驟

---

## 🆘 常見問題

### Q: 如何在 Cursor 中快速找到需要修改的檔案？

**A**: 使用 Cmd+P 搜尋，輸入關鍵字：
```
coach-backend.gamepig1976    # 搜尋舊的後端 URL
RESEND                        # 搜尋 RESEND 相關
account_id                    # 搜尋 Account ID
```

### Q: 執行批量替換時，如何確保沒有替換錯誤？

**A**: 使用 Cursor Composer：
1. 打開 Composer
2. 粘貼替換 Prompt
3. **不要立即 Accept**
4. 查看「修改預覽」確認無誤
5. 然後 Accept 改動

### Q: 如何在 Cursor 中同時監控轉移進度和查看文件？

**A**: 使用分割視圖：
```
1. 打開 TRANSFER_QUICK_REFERENCE.md
2. Cmd + \ (分割窗口)
3. 在右側打開終端（Ctrl + `）
4. 左側參考文件，右側執行命令
```

### Q: 如何回滾錯誤的改動？

**A**: 在 Cursor 中：
1. Cmd+Shift+G 打開 Git Graph
2. 查看最近的提交
3. 點擊「Revert」或使用 Cmd+Z
4. 參考「回滾計劃」（PROJECT_OWNERSHIP_TRANSFER_GUIDE.md）

---

## 📞 更多幫助

- 📖 完整指南: `PROJECT_OWNERSHIP_TRANSFER_GUIDE.md`
- ⚡ 快速參考: `TRANSFER_QUICK_REFERENCE.md`
- 🤖 AI 提示: `cursor-transfer-agent.md`
- 📋 檢查清單: 本文檔中的執行清單

**下一步**: 打開 `cursor-transfer-agent.md`，獲取可複製-貼上的 AI Prompt！

---

*Cursor IDE 優化版本 | 2025-11-19*
