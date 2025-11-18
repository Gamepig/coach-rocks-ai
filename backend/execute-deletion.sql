-- Delete all clients for user katherine84522@gmail.com
-- This will also cascade delete associated meetings, tags, and reels due to foreign key constraints

DELETE FROM clients
WHERE user_id = (
  SELECT user_id FROM users WHERE email = 'katherine84522@gmail.com'
);

-- Verify deletion
SELECT
  'After deletion' as type,
  (SELECT COUNT(*) FROM clients WHERE user_id = (SELECT user_id FROM users WHERE email = 'katherine84522@gmail.com')) as client_count,
  (SELECT COUNT(*) FROM meetings WHERE user_id = (SELECT user_id FROM users WHERE email = 'katherine84522@gmail.com')) as meeting_count;