
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'data', 'diagnostic.db');
const db = new Database(dbPath);

console.log('--- Current Data Status ---');
const countBefore = db.prepare('SELECT COUNT(*) as count FROM flash_diagnostics').get().count;
console.log(`Flash Diags count: ${countBefore}`);

console.log('\n--- Performing WAL Checkpoint ---');
// This moves data from .db-wal to .db
db.pragma('wal_checkpoint(FULL)');

const countAfter = db.prepare('SELECT COUNT(*) as count FROM flash_diagnostics').get().count;
console.log(`Flash Diags count after checkpoint: ${countAfter}`);

if (countAfter > countBefore) {
    console.log('✅ New data was found in WAL file and merged!');
} else {
    console.log('ℹ️ No new data was found in WAL relative to what the DB already saw.');
}

console.log('\n--- Latest 5 Entries ---');
const latest = db.prepare('SELECT created_at, organization_name FROM flash_diagnostics ORDER BY created_at DESC LIMIT 5').all();
latest.forEach(row => console.log(`${row.created_at} | ${row.organization_name}`));

db.close();
