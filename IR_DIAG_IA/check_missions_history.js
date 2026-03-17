
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'data', 'diagnostic.db');
const db = new Database(dbPath);

console.log('--- Missions History ---');
const missions = db.prepare(`
    SELECT id, organization_name, created_at 
    FROM missions 
    ORDER BY created_at DESC
`).all();

missions.forEach(row => {
    console.log(`${row.created_at} | ${row.organization_name}`);
});

console.log('\n--- Total Count ---');
console.log(missions.length);

db.close();
