-- Migration 004: Create bat_speed_data table (Blast data)
CREATE TABLE bat_speed_data (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    bat_speed DECIMAL(5,2), -- Column H
    attack_angle DECIMAL(5,2), -- Column K
    time_to_contact DECIMAL(5,3), -- Column P
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_bat_speed_session_id ON bat_speed_data(session_id); 