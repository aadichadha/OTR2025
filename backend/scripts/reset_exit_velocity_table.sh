#!/usr/bin/env bash
set -euo pipefail
DB_PATH="../database/otrbaseball.db"
BACKUP="${DB_PATH%.sqlite*}_backup_$(date +%Y%m%d_%H%M%S).sqlite3"
cp "$DB_PATH" "$BACKUP"

sqlite3 "$DB_PATH" <<'SQL'
PRAGMA foreign_keys = OFF;
DROP TABLE IF EXISTS exit_velocity_data;
CREATE TABLE exit_velocity_data (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id    INTEGER NOT NULL,
  strike_zone   TEXT,
  exit_velocity REAL NOT NULL,
  launch_angle  REAL NOT NULL,
  distance      REAL NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
    ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED
);
PRAGMA foreign_keys = ON;
.quit
SQL

echo "✅ exit_velocity_data rebuilt with DEFERRABLE FK"
