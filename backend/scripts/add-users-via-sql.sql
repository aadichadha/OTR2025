-- OTR Baseball - Add Demo Users to Production Database
-- Run this directly in Render's PostgreSQL console

-- First, check if users table exists and has the right structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check if demo users already exist
SELECT email, role, created_at FROM users WHERE email IN ('admin@otr.com', 'coach@otr.com', 'player@otr.com');

-- Add demo users (password: password123, hashed with bcrypt)
-- The hash below is for 'password123' with bcrypt salt rounds 10
INSERT INTO users (email, password, name, role, permissions, created_at, updated_at) VALUES
(
  'admin@otr.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Admin User',
  'admin',
  '["view_all_players", "manage_players", "manage_coaches", "manage_users", "view_own_data", "download_reports", "view_analytics", "view_admin_dashboard"]',
  NOW(),
  NOW()
),
(
  'coach@otr.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Coach User',
  'coach',
  '["view_all_players", "manage_players", "view_own_data", "download_reports", "view_analytics", "view_coach_dashboard"]',
  NOW(),
  NOW()
),
(
  'player@otr.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Player User',
  'player',
  '["view_own_data", "download_reports", "view_player_dashboard"]',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  password = EXCLUDED.password,
  updated_at = NOW();

-- Verify users were created
SELECT id, email, name, role, created_at FROM users WHERE email IN ('admin@otr.com', 'coach@otr.com', 'player@otr.com');

-- Show total user count
SELECT COUNT(*) as total_users FROM users; 