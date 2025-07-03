-- Migration 009: Unique session constraint
ALTER TABLE sessions ADD CONSTRAINT unique_player_session UNIQUE (player_id, session_date, session_type); 