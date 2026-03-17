#!/bin/bash

# Database check script
DB_PATH="./data/diagnostic.db"

echo "Checking database: $DB_PATH"

if [ ! -f "$DB_PATH" ]; then
    echo "Error: Database file not found at $DB_PATH"
    exit 1
fi

echo "--- Table List ---"
# Use node if sqlite3 is not available
node -e "const db = require('better-sqlite3')('$DB_PATH'); console.log(db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\'').all().map(t => t.name).join(', '))"

echo "--- Table structure for 'missions' ---"
node -e "const db = require('better-sqlite3')('$DB_PATH'); try { console.log(JSON.stringify(db.prepare('PRAGMA table_info(missions)').all(), null, 2)); } catch(e) { console.log('missions table missing'); }"
