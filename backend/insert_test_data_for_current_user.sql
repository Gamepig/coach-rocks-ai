-- 為 gamepig1976@gmail.com 使用者生成測試資料
-- User ID: f1a59e62-b6b9-4963-bc73-ada258cb741b
-- 執行方式: wrangler d1 execute coachdb --remote --file=./insert_test_data_for_current_user.sql

-- 1. 插入標籤
INSERT INTO tags (id, user_id, name, color, created_at) VALUES
  ('tag-vip-' || substr(hex(randomblob(16)), 1, 24), 'f1a59e62-b6b9-4963-bc73-ada258cb741b', 'VIP', '#FF6B6B', datetime('now')),
  ('tag-high-' || substr(hex(randomblob(16)), 1, 24), 'f1a59e62-b6b9-4963-bc73-ada258cb741b', 'High Priority', '#4ECDC4', datetime('now')),
  ('tag-follow-' || substr(hex(randomblob(16)), 1, 24), 'f1a59e62-b6b9-4963-bc73-ada258cb741b', 'Follow Up', '#FFE66D', datetime('now')),
  ('tag-new-' || substr(hex(randomblob(16)), 1, 24), 'f1a59e62-b6b9-4963-bc73-ada258cb741b', 'New Client', '#95E1D3', datetime('now')),
  ('tag-long-' || substr(hex(randomblob(16)), 1, 24), 'f1a59e62-b6b9-4963-bc73-ada258cb741b', 'Long Term', '#AA96DA', datetime('now')),
  ('tag-corp-' || substr(hex(randomblob(16)), 1, 24), 'f1a59e62-b6b9-4963-bc73-ada258cb741b', 'Corporate', '#FCBAD3', datetime('now'));

-- 2. 插入客戶（使用固定 ID 以便後續關聯標籤）
INSERT INTO clients (client_id, user_id, name, email, status, notes, source, lead_status, engagement_type, program, start_date, contract_status, invoice_status, created_at, session_counts) VALUES
  ('client-sarah-' || substr(hex(randomblob(16)), 1, 20), 'f1a59e62-b6b9-4963-bc73-ada258cb741b', 'Sarah Johnson', 'sarah.johnson@techstart.com', 'Active', 'Marketing director at TechStart. Focus on team performance and conversion optimization.', 'Referral', 'Converted', 'Executive Coaching', 'Leadership Development', date('now', '-90 days'), 'Active', 'Paid', datetime('now', '-90 days'), 10),
  ('client-mike-' || substr(hex(randomblob(16)), 1, 20), 'f1a59e62-b6b9-4963-bc73-ada258cb741b', 'Mike Chen', 'mike.chen@innovate.com', 'Active', 'Startup founder. Needs help with customer acquisition and scaling.', 'Website', 'Converted', 'Business Coaching', 'Growth Strategy', date('now', '-60 days'), 'Active', 'Paid', datetime('now', '-60 days'), 5),
  ('client-lisa-' || substr(hex(randomblob(16)), 1, 20), 'f1a59e62-b6b9-4963-bc73-ada258cb741b', 'Lisa Rodriguez', 'lisa.rodriguez@digitalpro.com', 'Active', 'Team leader struggling with motivation and performance.', 'LinkedIn', 'Converted', 'Team Leadership', 'Performance Improvement', date('now', '-45 days'), 'Active', 'Sent', datetime('now', '-45 days'), 3),
  ('client-robert-' || substr(hex(randomblob(16)), 1, 20), 'f1a59e62-b6b9-4963-bc73-ada258cb741b', 'Robert Kim', 'robert.kim@corp.com', 'Prospect', 'Interested in executive coaching. Initial consultation scheduled.', 'Email Campaign', 'Qualified', 'Executive Coaching', NULL, NULL, 'Pending', 'Pending', datetime('now', '-30 days'), 0);

-- 3. 插入會議（需要先獲取客戶 ID，這裡使用子查詢）
INSERT INTO meetings (
  meeting_id, user_id, client_id, client_name, meeting_title, meeting_date, is_discovery,
  transcript, summary, pain_point, goal, suggestion, sales_technique_advice, coaching_advice,
  action_items_client, action_items_coach, mind_map, email_content, resources_list,
  next_meeting_prep, additional_notes, analysis_status, created_at, provider, provider_meeting_id, correlation_id
) VALUES
  (
    'meeting-sarah-1-' || substr(hex(randomblob(16)), 1, 20),
    'f1a59e62-b6b9-4963-bc73-ada258cb741b',
    (SELECT client_id FROM clients WHERE user_id = 'f1a59e62-b6b9-4963-bc73-ada258cb741b' AND name = 'Sarah Johnson' LIMIT 1),
    'Sarah Johnson',
    'Initial Discovery Call',
    date('now', '-60 days'),
    1,
    'Sarah discussed her team''s performance challenges and low conversion rates. She mentioned lack of analytics tracking and team training as main concerns.',
    'Sarah is a marketing director struggling with team performance and low conversion rates. Main issues are lack of analytics tracking and team training.',
    'Lack of proper analytics tracking and team training on digital marketing tools',
    'Increase conversion rate by 25% this quarter and improve ROI',
    'Implement analytics platform and develop training program',
    'Ask more specific questions about current analytics setup. Provide data-driven examples of successful implementations.',
    'Focus on progress tracking and celebrate small wins. Encourage data-driven decision making.',
    '["Implement analytics platform","Develop training program","Set up conversion tracking"]',
    '["Follow up on implementation","Provide additional resources","Schedule progress review"]',
    '{"nodes":[{"id":"analytics","label":"Analytics Setup"},{"id":"training","label":"Team Training"}]}',
    'Thank you for our discussion today. Here are the key action items...',
    '["Analytics Best Practices Guide","Team Training Resources"]',
    'Review analytics implementation progress. Discuss training program timeline.',
    'Sarah is highly motivated and responsive. Good candidate for long-term engagement.',
    'completed',
    datetime('now', '-60 days'),
    'zoom',
    'zoom-' || substr(hex(randomblob(16)), 1, 32),
    substr(hex(randomblob(16)), 1, 32)
  ),
  (
    'meeting-sarah-2-' || substr(hex(randomblob(16)), 1, 20),
    'f1a59e62-b6b9-4963-bc73-ada258cb741b',
    (SELECT client_id FROM clients WHERE user_id = 'f1a59e62-b6b9-4963-bc73-ada258cb741b' AND name = 'Sarah Johnson' LIMIT 1),
    'Sarah Johnson',
    'Progress Review Session',
    date('now', '-30 days'),
    0,
    'Sarah has implemented basic analytics but needs help with advanced tracking. Team training is progressing well.',
    'Sarah has implemented basic analytics but needs help with advanced tracking. Team training is progressing well.',
    'Advanced analytics implementation and campaign optimization',
    'Optimize campaigns using data insights',
    'Implement advanced tracking and optimize campaigns based on data',
    'Provide specific examples of advanced tracking. Ask about data insights.',
    'Celebrate progress made. Focus on next steps for optimization.',
    '["Implement advanced tracking","Optimize campaigns","Review performance metrics"]',
    '["Provide optimization resources","Schedule follow-up","Monitor progress"]',
    NULL,
    'Great progress on analytics implementation! Let''s focus on advanced tracking...',
    '["Advanced Analytics Guide","Campaign Optimization Tips"]',
    'Review advanced tracking implementation. Discuss campaign optimization results.',
    'Conversion rates improved by 15%. On track to reach 25% goal.',
    'completed',
    datetime('now', '-30 days'),
    'google',
    'google-' || substr(hex(randomblob(16)), 1, 32),
    substr(hex(randomblob(16)), 1, 32)
  ),
  (
    'meeting-mike-1-' || substr(hex(randomblob(16)), 1, 20),
    'f1a59e62-b6b9-4963-bc73-ada258cb741b',
    (SELECT client_id FROM clients WHERE user_id = 'f1a59e62-b6b9-4963-bc73-ada258cb741b' AND name = 'Mike Chen' LIMIT 1),
    'Mike Chen',
    'Sales Strategy Discovery',
    date('now', '-50 days'),
    1,
    'Mike discussed his startup''s customer acquisition challenges. Has great product but marketing strategy needs improvement.',
    'Mike is a startup founder struggling with customer acquisition. Has great product but marketing strategy needs improvement.',
    'Struggling to scale business with limited customer acquisition',
    'Increase customer acquisition by 50% in the next quarter',
    'Develop comprehensive marketing strategy and customer acquisition plan',
    'Ask about current strategy. Explore pain points in detail.',
    'Build trust and understand business model. Assess readiness for growth.',
    '["Develop marketing strategy","Create customer acquisition plan","Identify target audience"]',
    '["Research industry best practices","Prepare strategy framework","Schedule strategy session"]',
    NULL,
    'Thank you for sharing your challenges. Let''s develop a comprehensive strategy...',
    '["Marketing Strategy Template","Customer Acquisition Guide"]',
    'Review marketing strategy draft. Discuss customer acquisition tactics.',
    'Mike is tech-savvy but needs marketing guidance. Good potential for growth.',
    'completed',
    datetime('now', '-50 days'),
    'zoom',
    'zoom-' || substr(hex(randomblob(16)), 1, 32),
    substr(hex(randomblob(16)), 1, 32)
  );

-- 4. 插入客戶標籤關聯（使用子查詢獲取標籤和客戶 ID）
INSERT INTO client_tags (id, client_id, tag_id, created_at)
SELECT 
  'ct-' || substr(hex(randomblob(16)), 1, 28),
  c.client_id,
  t.id,
  datetime('now')
FROM clients c
CROSS JOIN tags t
WHERE c.user_id = 'f1a59e62-b6b9-4963-bc73-ada258cb741b'
  AND t.user_id = 'f1a59e62-b6b9-4963-bc73-ada258cb741b'
  AND (
    (c.name = 'Sarah Johnson' AND t.name IN ('VIP', 'High Priority')) OR
    (c.name = 'Mike Chen' AND t.name IN ('New Client', 'Follow Up')) OR
    (c.name = 'Lisa Rodriguez' AND t.name = 'Long Term')
  );

-- 5. 插入 Instagram Posts
INSERT INTO instagram_posts (post_id, user_id, meeting_id, is_favorite, is_published, hook, content, tags, created_at)
SELECT 
  'post-' || substr(hex(randomblob(16)), 1, 28),
  'f1a59e62-b6b9-4963-bc73-ada258cb741b',
  m.meeting_id,
  1,
  1,
  '5 Secrets to Boost Your Team''s Performance',
  'Want to improve your team''s performance? Here are 5 proven strategies that successful leaders use...',
  '["leadership","team-performance","coaching"]',
  datetime('now', '-10 days')
FROM meetings m
WHERE m.user_id = 'f1a59e62-b6b9-4963-bc73-ada258cb741b'
  AND m.client_name = 'Sarah Johnson'
  AND m.meeting_title = 'Initial Discovery Call'
LIMIT 1;

-- 6. 插入 Reels Ideas
INSERT INTO reels_ideas (reels_ideas_id, user_id, meeting_id, is_favorite, is_published, hook, content, tags, created_at)
SELECT 
  'reel-' || substr(hex(randomblob(16)), 1, 28),
  'f1a59e62-b6b9-4963-bc73-ada258cb741b',
  m.meeting_id,
  1,
  0,
  '3 Mistakes That Kill Your Conversion Rate',
  'Are you making these common mistakes? Here''s how to fix them and boost your conversion rate...',
  '["marketing","conversion","tips"]',
  datetime('now', '-5 days')
FROM meetings m
WHERE m.user_id = 'f1a59e62-b6b9-4963-bc73-ada258cb741b'
  AND m.client_name = 'Sarah Johnson'
  AND m.meeting_title = 'Initial Discovery Call'
LIMIT 1;

