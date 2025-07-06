# 🗄️ Render Database Setup Guide

## 🚨 Database Connection Issue

The local connection to your Render PostgreSQL database is failing due to SSL/network issues. This is common with Render's external connections.

## ✅ Solution: Use Render Dashboard

### Step 1: Access Your Render Dashboard

1. Go to [render.com](https://render.com) and sign in
2. Find your PostgreSQL database service
3. Click on the database name to open it

### Step 2: Open Database Console

1. In your database dashboard, click **"Connect"** tab
2. Look for **"External Connection"** section
3. Click **"Connect"** button next to "psql"
4. This will open a web-based PostgreSQL console

### Step 3: Run the SQL Script

Copy and paste this entire script into the Render console:

```sql
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
```

### Step 4: Verify Success

You should see output like:
```
 id |      email      |     name      |  role  |         created_at         
----+-----------------+---------------+--------+----------------------------
  1 | admin@otr.com   | Admin User    | admin  | 2025-01-06 20:30:00.123456
  2 | coach@otr.com   | Coach User    | coach  | 2025-01-06 20:30:00.123456
  3 | player@otr.com  | Player User   | player | 2025-01-06 20:30:00.123456

 total_users 
-------------
           3
```

## 🔐 Demo Login Credentials

Once the users are added, you can test login with:

- **Admin**: `admin@otr.com` / `password123`
- **Coach**: `coach@otr.com` / `password123`
- **Player**: `player@otr.com` / `password123`

## 🚀 Test Production Login

1. Go to your production frontend URL
2. Try logging in with the credentials above
3. Test different user roles and permissions

## 🔧 Alternative: Quick SQL Commands

If you prefer to run commands one by one:

```sql
-- Check table structure
\d users

-- Check existing users
SELECT email, role FROM users;

-- Add admin user
INSERT INTO users (email, password, name, role, permissions, created_at, updated_at) 
VALUES ('admin@otr.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin', '["view_all_players", "manage_players", "manage_coaches", "manage_users", "view_own_data", "download_reports", "view_analytics", "view_admin_dashboard"]', NOW(), NOW());

-- Add coach user
INSERT INTO users (email, password, name, role, permissions, created_at, updated_at) 
VALUES ('coach@otr.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Coach User', 'coach', '["view_all_players", "manage_players", "view_own_data", "download_reports", "view_analytics", "view_coach_dashboard"]', NOW(), NOW());

-- Add player user
INSERT INTO users (email, password, name, role, permissions, created_at, updated_at) 
VALUES ('player@otr.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Player User', 'player', '["view_own_data", "download_reports", "view_player_dashboard"]', NOW(), NOW());
```

## 🎯 Success Checklist

- [ ] Users table exists with proper columns
- [ ] Demo users added successfully
- [ ] Production backend deployed
- [ ] Production frontend deployed
- [ ] Login works with demo credentials
- [ ] Role-based access working correctly

This method bypasses the SSL connection issues and directly adds users to your production database! 🎉 