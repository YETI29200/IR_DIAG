# Database check script (PowerShell)
$DB_PATH = "./data/diagnostic.db"

Write-Host "Checking database: $DB_PATH"

if (-not (Test-Path $DB_PATH)) {
    Write-Error "Error: Database file not found at $DB_PATH"
    return
}

Write-Host "--- Table List ---"
node -e "const db = require('better-sqlite3')('$DB_PATH'); console.log(db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\'').all().map(t => t.name).join(', '))"

Write-Host "--- Table structure for 'missions' ---"
node -e "const db = require('better-sqlite3')('$DB_PATH'); try { console.log(JSON.stringify(db.prepare('PRAGMA table_info(missions)').all(), null, 2)); } catch(e) { console.log('missions table missing'); }"
