# Production Migration Guide

## Issue
The production database is missing invitation-related columns that are defined in the User model:
- `invitation_token`
- `invitation_expires_at` 
- `invitation_status`
- `invited_by`

This causes login failures with the error: `column "invitation_token" does not exist`

## Temporary Fix Applied
The User model has been temporarily modified to exclude invitation fields to allow login to work.

## Permanent Solution
Run the database migration to add the missing columns.

### Option 1: Manual Migration (Recommended)
1. Connect to your production database (PostgreSQL on Render)
2. Run the following SQL commands:

```sql
-- Add invitation_token column
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255) UNIQUE;

-- Add invitation_expires_at column  
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP;

-- Create ENUM type for invitation_status
DO $$ BEGIN
    CREATE TYPE invitation_status_enum AS ENUM ('pending', 'accepted', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add invitation_status column
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_status invitation_status_enum DEFAULT 'pending' NOT NULL;

-- Add invited_by column with foreign key
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON users(invitation_token);
CREATE INDEX IF NOT EXISTS idx_users_invitation_status ON users(invitation_status);
```

### Option 2: Using Migration Script
1. Set the `DATABASE_URL` environment variable in your local environment
2. Run: `NODE_ENV=production npm run migrate:postgres`

### Option 3: Render Console
1. Go to your Render dashboard
2. Access the PostgreSQL database console
3. Run the SQL commands from Option 1

## After Migration
1. Revert the User model changes by uncommenting the invitation fields
2. Deploy the updated code
3. Test login functionality

## Verification
After running the migration, verify the columns exist:
```sql
\d users
```

You should see the new columns in the table structure. 