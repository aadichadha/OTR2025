-- Migration: Add invitation fields to users table
-- This migration adds the invitation-related columns that are defined in the User model
-- but missing from the production database

-- Add invitation_token column
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255) UNIQUE;

-- Add invitation_expires_at column
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP;

-- Add invitation_status column with ENUM type
-- Create the ENUM type (will fail silently if it already exists)
CREATE TYPE invitation_status_enum AS ENUM ('pending', 'accepted', 'expired');

-- Add the column with default value
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_status invitation_status_enum DEFAULT 'pending' NOT NULL;

-- Add invited_by column with foreign key reference
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON users(invitation_token);
CREATE INDEX IF NOT EXISTS idx_users_invitation_status ON users(invitation_status); 