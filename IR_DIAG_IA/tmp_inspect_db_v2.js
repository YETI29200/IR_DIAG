
import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = 'c:/Users/ydeniaux/OneDrive - images-et-reseaux.com/PRIVE/IR_DIAG_IA8v_serveur/IR_DIAG_IA/data/diagnostic.db';
const db = new Database(dbPath);

console.log('--- Tables ---');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables.map(t => t.name).join(', '));

for (const table of tables) {
    const count = db.prepare(`SELECT count(*) as count FROM ${table.name}`).get();
    console.log(`${table.name}: ${count.count} rows`);
}

console.log('\n--- Recent Missions ---');
try {
    const missions = db.prepare('SELECT id, organization_name, status, created_at FROM missions ORDER BY created_at DESC LIMIT 5').all();
    console.log(JSON.stringify(missions, null, 2));
} catch (e) {
    console.log('Error querying missions:', e.message);
}

console.log('\n--- Recent Flash Diagnostics ---');
try {
    const flash = db.prepare('SELECT id, organization_name, contact_name, created_at FROM flash_diagnostics ORDER BY created_at DESC LIMIT 5').all();
    console.log(JSON.stringify(flash, null, 2));
} catch (e) {
    console.log('Error querying flash_diagnostics:', e.message);
}

db.close();
