#!/usr/bin/env bash
set -euo pipefail

DB_PATH="$(cd "$(dirname "$0")/.."; pwd)/database/otrbaseball.db"
BACKUP="${DB_PATH%.sqlite*}_backup_$(date +%Y%m%d_%H%M%S).sqlite3"
cp "$DB_PATH" "$BACKUP"

sqlite3 "$DB_PATH" <<'SQL'
PRAGMA foreign_keys = OFF;
DROP TABLE IF EXISTS exit_velocity_data;
-- fresh DDL (matches patched migration)
CREATE TABLE exit_velocity_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    strike_zone INTEGER, -- Column F
    exit_velocity DECIMAL(5,2), -- Column H
    launch_angle DECIMAL(5,2), -- Column I
    distance DECIMAL(6,2), -- Column J
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_exit_velocity_session_id ON exit_velocity_data(session_id);
PRAGMA foreign_keys = ON;
.quit
SQL

echo "✅ exit_velocity_data rebuilt with DEFERRABLE FK at $DB_PATH" 