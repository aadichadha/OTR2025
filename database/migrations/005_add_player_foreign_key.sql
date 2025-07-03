-- Migration 005: Add player foreign key to sessions table (PostgreSQL version)
-- Drop the existing sessions table and recreate with proper foreign key

-- First, drop dependent tables that reference sessions
DROP TABLE IF EXISTS bat_speed_data CASCADE;
DROP TABLE IF EXISTS exit_velocity_data CASCADE;
DROP TABLE IF EXISTS reports CASCADE;

-- Drop the sessions table
DROP TABLE IF EXISTS sessions CASCADE;

-- Recreate sessions table with proper foreign key
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL,
  session_date DATE NOT NULL,
  session_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Recreate dependent tables
CREATE TABLE bat_speed_data (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    bat_speed DECIMAL(5,2),
    attack_angle DECIMAL(5,2),
    time_to_contact DECIMAL(5,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exit_velocity_data (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    strike_zone INTEGER,
    exit_velocity DECIMAL(5,2),
    launch_angle DECIMAL(5,2),
    distance DECIMAL(6,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    report_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recreate indexes
CREATE INDEX idx_sessions_player_id ON sessions(player_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_sessions_type ON sessions(session_type);
CREATE INDEX idx_bat_speed_session_id ON bat_speed_data(session_id);
CREATE INDEX idx_exit_velocity_session_id ON exit_velocity_data(session_id);
CREATE INDEX idx_reports_session_id ON reports(session_id); 