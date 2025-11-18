/**
 * 檢查資料庫中的 Mind Map 資料
 * 用途：診斷哪些會議有 Mind Map 資料，哪些沒有
 * 
 * 執行方式：
 * 1. 確保已設定 Cloudflare D1 資料庫綁定
 * 2. 執行：wrangler d1 execute coachdb --remote --command "SELECT meeting_id, meeting_title, client_name, CASE WHEN mind_map IS NULL OR mind_map = '' THEN 'NO' ELSE 'YES' END as has_mindmap, LENGTH(mind_map) as mindmap_length FROM meetings ORDER BY created_at DESC LIMIT 20"
 * 
 * 或使用本地開發環境：
 * wrangler d1 execute coachdb --local --command "SELECT meeting_id, meeting_title, client_name, CASE WHEN mind_map IS NULL OR mind_map = '' THEN 'NO' ELSE 'YES' END as has_mindmap, LENGTH(mind_map) as mindmap_length FROM meetings ORDER BY created_at DESC LIMIT 20"
 */

console.log(`
=== Mind Map 資料檢查腳本 ===

這個腳本會檢查資料庫中哪些會議有 Mind Map 資料。

執行方式（選擇其中一種）：

1. 檢查遠端資料庫（生產環境）：
   wrangler d1 execute coachdb --remote --command "SELECT meeting_id, meeting_title, client_name, CASE WHEN mind_map IS NULL OR mind_map = '' THEN 'NO' ELSE 'YES' END as has_mindmap, LENGTH(mind_map) as mindmap_length FROM meetings ORDER BY created_at DESC LIMIT 20"

2. 檢查本地資料庫（開發環境）：
   wrangler d1 execute coachdb --local --command "SELECT meeting_id, meeting_title, client_name, CASE WHEN mind_map IS NULL OR mind_map = '' THEN 'NO' ELSE 'YES' END as has_mindmap, LENGTH(mind_map) as mindmap_length FROM meetings ORDER BY created_at DESC LIMIT 20"

3. 查看特定會議的 Mind Map 內容：
   wrangler d1 execute coachdb --remote --command "SELECT meeting_id, meeting_title, SUBSTR(mind_map, 1, 200) as mindmap_preview FROM meetings WHERE meeting_id = 'YOUR_MEETING_ID'"

4. 統計有 Mind Map 的會議數量：
   wrangler d1 execute coachdb --remote --command "SELECT COUNT(*) as total_meetings, SUM(CASE WHEN mind_map IS NOT NULL AND mind_map != '' THEN 1 ELSE 0 END) as meetings_with_mindmap FROM meetings"

=== Mind Map 生成流程 ===

Mind Map 在以下情況會自動生成：

1. 新會議分析流程（startAnalysisWithEmail）：
   - Step 5: 呼叫 openaiService.generateMindMap()
   - 使用 summary 或 fileContent 作為輸入
   - 類型：'sales' (discovery) 或 'consulting' (regular)
   - 儲存到：meetings.mind_map 欄位

2. 已認證會議分析（analyzeAuthenticatedMeeting）：
   - Step 5: 呼叫 openaiService.generateMindMap()
   - 同樣的流程和儲存位置

3. 生成邏輯（OpenAIService.generateMindMap）：
   - 使用 Cloudflare AI Gateway
   - 系統提示詞：根據類型（sales/consulting）選擇不同的提示
   - 用戶提示詞：包含 summary 和 Mermaid 語法規則
   - 返回：Mermaid mindmap 格式的字串

=== 如果會議沒有 Mind Map ===

可能原因：
1. 會議是在 Mind Map 功能實作之前建立的
2. Mind Map 生成失敗（但分析繼續進行，不會中斷）
3. 資料庫欄位為 NULL 或空字串

解決方案：
1. 重新分析該會議（如果後端有提供此功能）
2. 使用 generateMindMap 端點手動生成
3. 等待新會議分析完成（新會議會自動生成 Mind Map）

`)

