-- Migration 005: Create exit_velocity_data table (Hittrax data)
CREATE TABLE exit_velocity_data (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    strike_zone INTEGER, -- Column F
    exit_velocity DECIMAL(5,2), -- Column H
    launch_angle DECIMAL(5,2), -- Column I
    distance DECIMAL(6,2), -- Column J
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_exit_velocity_session_id ON exit_velocity_data(session_id); 