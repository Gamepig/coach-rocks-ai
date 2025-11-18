-- Script to delete all clients for user katherine84522@gmail.com
-- This will also cascade delete associated meetings due to foreign key constraints

-- First, let's see what we're about to delete
SELECT
  'User Info' as type,
  u.user_id,
  u.email,
  (SELECT COUNT(*) FROM clients WHERE user_id = u.user_id) as client_count,
  (SELECT COUNT(*) FROM meetings WHERE user_id = u.user_id) as meeting_count
FROM users u
WHERE u.email = 'katherine84522@gmail.com';

-- Show clients to be deleted
SELECT
  'Clients to be deleted' as type,
  c.client_id,
  c.name,
  c.email,
  c.created_at,
  (SELECT COUNT(*) FROM meetings WHERE client_id = c.client_id) as meeting_count
FROM clients c
JOIN users u ON c.user_id = u.user_id
WHERE u.email = 'katherine84522@gmail.com';

-- Show meetings to be deleted (will be cascade deleted when clients are deleted)
SELECT
  'Meetings to be deleted' as type,
  m.meeting_id,
  m.client_name,
  m.meeting_title,
  m.created_at
FROM meetings m
JOIN users u ON m.user_id = u.user_id
WHERE u.email = 'katherine84522@gmail.com';

-- ACTUAL DELETION (uncomment the lines below to execute)
-- DELETE FROM clients
-- WHERE user_id = (
--   SELECT user_id FROM users WHERE email = 'katherine84522@gmail.com'
-- );

-- Verify deletion
-- SELECT
--   'After deletion' as type,
--   (SELECT COUNT(*) FROM clients WHERE user_id = (SELECT user_id FROM users WHERE email = 'katherine84522@gmail.com')) as client_count,
--   (SELECT COUNT(*) FROM meetings WHERE user_id = (SELECT user_id FROM users WHERE email = 'katherine84522@gmail.com')) as meeting_count;