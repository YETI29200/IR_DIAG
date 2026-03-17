
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'data', 'database.db');
const db = new Database(dbPath);

console.log('--- Flash Diagnostics History in database.db ---');
try {
    const history = db.prepare(`
        SELECT id, organization_name, contact_name, created_at 
        FROM flash_diagnostics 
        ORDER BY created_at DESC
    `).all();

    history.forEach(row => {
        console.log(`${row.created_at} | ${row.organization_name} | ${row.contact_name}`);
    });

    console.log('\n--- Total Count ---');
    console.log(history.length);
} catch (e) {
    console.log('Error or table not found:', e.message);
}

db.close();
