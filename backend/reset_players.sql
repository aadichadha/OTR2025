DROP TABLE IF EXISTS players;
CREATE TABLE players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    travel_team VARCHAR(255),
    high_school VARCHAR(255),
    position VARCHAR(255),
    graduation_year INTEGER,
    player_code CHAR(4) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 