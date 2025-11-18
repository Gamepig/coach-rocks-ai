-- ================================================================
-- 刪除沒有 EMAIL 的 Clients 及其相關記錄
-- ================================================================
--
-- 這個腳本會安全地刪除所有 email 欄位為 NULL 的 clients
-- 由於外鍵級聯刪除 (ON DELETE CASCADE)，相關的 meetings 和其他記錄也會被刪除
--
-- 執行步驟：
-- 1. 先執行查詢部分，確認要刪除的記錄
-- 2. 確認無誤後，執行刪除命令
-- ================================================================

-- ================== 步驟 1: 查詢要刪除的記錄 ==================

-- 1.1 查詢沒有 email 的 clients 數量
SELECT
    COUNT(*) as clients_without_email_count
FROM clients
WHERE email IS NULL OR email = '';

-- 1.2 列出所有沒有 email 的 clients
SELECT
    client_id,
    user_id,
    name,
    email,
    created_at,
    status
FROM clients
WHERE email IS NULL OR email = ''
ORDER BY created_at DESC;

-- 1.3 查詢相關的 meetings 數量（這些會被級聯刪除）
SELECT
    COUNT(*) as related_meetings_count
FROM meetings
WHERE client_id IN (
    SELECT client_id
    FROM clients
    WHERE email IS NULL OR email = ''
);

-- 1.4 列出相關的 meetings（預覽將被刪除的會議）
SELECT
    m.meeting_id,
    m.client_id,
    c.name as client_name,
    m.meeting_title,
    m.meeting_date,
    m.analysis_status,
    m.created_at
FROM meetings m
JOIN clients c ON m.client_id = c.client_id
WHERE c.email IS NULL OR c.email = ''
ORDER BY m.created_at DESC;

-- 1.5 統計摘要
SELECT
    'Clients' as record_type,
    COUNT(*) as count_to_delete
FROM clients
WHERE email IS NULL OR email = ''

UNION ALL

SELECT
    'Meetings' as record_type,
    COUNT(*) as count_to_delete
FROM meetings
WHERE client_id IN (
    SELECT client_id
    FROM clients
    WHERE email IS NULL OR email = ''
);

-- ================== 步驟 2: 執行刪除（請先確認上述查詢結果） ==================

-- ⚠️ 警告：這個操作無法復原！
-- ⚠️ 請確保已經備份重要數據！
-- ⚠️ 執行前請先確認上述查詢結果符合預期！

-- 2.1 刪除沒有 email 的 clients
-- （相關的 meetings 和其他記錄會被自動級聯刪除）
DELETE FROM clients
WHERE email IS NULL OR email = '';

-- ================== 步驟 3: 驗證刪除結果 ==================

-- 3.1 確認沒有 email 的 clients 已被刪除
SELECT
    COUNT(*) as remaining_clients_without_email
FROM clients
WHERE email IS NULL OR email = '';
-- 預期結果：0

-- 3.2 查看當前所有 clients 的統計
SELECT
    COUNT(*) as total_clients,
    COUNT(email) as clients_with_email,
    COUNT(*) - COUNT(email) as clients_without_email
FROM clients;

-- 3.3 查看操作完成時間
SELECT
    NOW() as deletion_completed_at;
