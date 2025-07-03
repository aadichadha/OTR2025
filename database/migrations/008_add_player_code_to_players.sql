-- Migration 008: Add player_code to players table
ALTER TABLE players ADD COLUMN player_code CHAR(4) UNIQUE;
-- Backfill player_code for existing players
UPDATE players SET player_code = LPAD((id % 10000)::text, 4, '0') WHERE player_code IS NULL; 