-- Seed file: Insert benchmark data
-- This data comes from the existing Python application

-- Create benchmarks table
CREATE TABLE IF NOT EXISTS benchmarks (
    id SERIAL PRIMARY KEY,
    level VARCHAR(50) UNIQUE NOT NULL,
    avg_ev DECIMAL(5,2),
    top_8th_ev DECIMAL(5,2),
    avg_la DECIMAL(5,2),
    hhb_la DECIMAL(5,2),
    avg_bat_speed DECIMAL(5,2),
    top_90_bat_speed DECIMAL(5,2),
    avg_time_to_contact DECIMAL(5,3),
    avg_attack_angle DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert benchmark data
INSERT INTO benchmarks (level, avg_ev, top_8th_ev, avg_la, hhb_la, avg_bat_speed, top_90_bat_speed, avg_time_to_contact, avg_attack_angle) VALUES
('10u', 50.00, 61.00, 12.14, 8.78, NULL, NULL, NULL, NULL),
('12u', 59.00, 72.00, 12.14, 8.78, NULL, NULL, NULL, NULL),
('14u', 68.00, 80.00, 12.14, 8.78, NULL, NULL, NULL, NULL),
('JV/16u', 72.65, 85.00, 16.51, 11.47, NULL, NULL, NULL, NULL),
('Var/18u', 78.00, 91.50, 16.51, 11.47, NULL, NULL, NULL, NULL),
('Youth', 58.40, 70.19, 12.14, 8.78, 49.21, 52.81, 0.190, 11.78),
('High School', 74.54, 86.75, 16.51, 11.47, 62.40, 67.02, 0.163, 9.80),
('College', 81.57, 94.44, 17.57, 12.86, 67.53, 72.54, 0.154, 10.52),
('Indy', 85.99, 98.12, 18.68, 14.74, 69.20, 74.04, 0.154, 10.62),
('Affiliate', 85.49, 98.71, 18.77, 15.55, 70.17, 75.14, 0.147, 11.09)
ON CONFLICT (level) DO UPDATE SET
    avg_ev = EXCLUDED.avg_ev,
    top_8th_ev = EXCLUDED.top_8th_ev,
    avg_la = EXCLUDED.avg_la,
    hhb_la = EXCLUDED.hhb_la,
    avg_bat_speed = EXCLUDED.avg_bat_speed,
    top_90_bat_speed = EXCLUDED.top_90_bat_speed,
    avg_time_to_contact = EXCLUDED.avg_time_to_contact,
    avg_attack_angle = EXCLUDED.avg_attack_angle; 