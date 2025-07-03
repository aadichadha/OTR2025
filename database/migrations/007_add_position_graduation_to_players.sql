-- Migration 007: Add position and graduation_year columns to players table
ALTER TABLE players 
ADD COLUMN position VARCHAR(255),
ADD COLUMN graduation_year INTEGER;

-- Add validation check for graduation year
ALTER TABLE players 
ADD CONSTRAINT check_graduation_year 
CHECK (graduation_year IS NULL OR (graduation_year >= 2024 AND graduation_year <= 2030)); 