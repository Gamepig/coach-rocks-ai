-- Check meeting analyses for user katherine84522@gmail.com
-- This will show all meetings with their analysis status and content

-- First, get user info and counts
SELECT
  'User Summary' as type,
  u.user_id,
  u.email,
  u.verified,
  (SELECT COUNT(*) FROM meetings WHERE user_id = u.user_id) as meeting_count,
  (SELECT COUNT(*) FROM clients WHERE user_id = u.user_id) as client_count
FROM users u
WHERE u.email = 'katherine84522@gmail.com';

-- Show all meetings with analysis details
SELECT
  'Meeting Analysis Details' as type,
  m.meeting_id,
  m.client_id,
  m.client_name,
  m.meeting_title,
  m.meeting_date,
  m.created_at,
  m.analysis_status,
  -- Analysis content status
  CASE WHEN m.summary IS NOT NULL AND LENGTH(m.summary) > 0 THEN 'YES' ELSE 'NO' END as has_summary,
  CASE WHEN m.pain_point IS NOT NULL AND LENGTH(m.pain_point) > 0 THEN 'YES' ELSE 'NO' END as has_pain_point,
  CASE WHEN m.goal IS NOT NULL AND LENGTH(m.goal) > 0 THEN 'YES' ELSE 'NO' END as has_goal,
  CASE WHEN m.suggestion IS NOT NULL AND LENGTH(m.suggestion) > 0 THEN 'YES' ELSE 'NO' END as has_suggestions,
  CASE WHEN m.action_items_client IS NOT NULL AND LENGTH(m.action_items_client) > 0 THEN 'YES' ELSE 'NO' END as has_client_actions,
  CASE WHEN m.action_items_coach IS NOT NULL AND LENGTH(m.action_items_coach) > 0 THEN 'YES' ELSE 'NO' END as has_coach_actions,
  CASE WHEN m.email_content IS NOT NULL AND LENGTH(m.email_content) > 0 THEN 'YES' ELSE 'NO' END as has_email,
  -- Content lengths for debugging
  CASE WHEN m.summary IS NOT NULL THEN LENGTH(m.summary) ELSE 0 END as summary_length,
  CASE WHEN m.transcript IS NOT NULL THEN LENGTH(m.transcript) ELSE 0 END as transcript_length
FROM meetings m
JOIN users u ON m.user_id = u.user_id
WHERE u.email = 'katherine84522@gmail.com'
ORDER BY m.created_at DESC;

-- Show actual content snippets (first 200 chars) for debugging
SELECT
  'Content Snippets' as type,
  m.meeting_id,
  m.meeting_title,
  CASE
    WHEN m.summary IS NOT NULL THEN SUBSTR(m.summary, 1, 200) || '...'
    ELSE 'NO SUMMARY'
  END as summary_snippet,
  CASE
    WHEN m.pain_point IS NOT NULL THEN SUBSTR(m.pain_point, 1, 100) || '...'
    ELSE 'NO PAIN POINT'
  END as pain_point_snippet
FROM meetings m
JOIN users u ON m.user_id = u.user_id
WHERE u.email = 'katherine84522@gmail.com'
ORDER BY m.created_at DESC;