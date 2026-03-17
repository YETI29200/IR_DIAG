
import Database from 'better-sqlite3';

const dbPath = 'c:/Users/ydeniaux/OneDrive - images-et-reseaux.com/PRIVE/IR_DIAG_IA8v_serveur/IR_DIAG_IA/data/diagnostic.db';
const db = new Database(dbPath);

console.log('--- Database Inspection ---');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

for (const table of tables) {
    try {
        const count = db.prepare(`SELECT count(*) as count FROM ${table.name}`).get();
        console.log(`Table: ${table.name.padEnd(25)} | Rows: ${count.count}`);
    } catch (e) {
        console.log(`Table: ${table.name.padEnd(25)} | Error: ${e.message}`);
    }
}

console.log('\n--- Recent Missions (last 10) ---');
try {
    const missions = db.prepare('SELECT id, organization_name, status, created_at FROM missions ORDER BY created_at DESC LIMIT 10').all();
    missions.forEach(m => console.log(`${m.id} | ${m.organization_name} | ${m.status} | ${m.created_at}`));
} catch (e) {
    console.log('Error querying missions:', e.message);
}

db.close();
