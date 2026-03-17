
import Database from 'better-sqlite3';

const db = new Database('./data/diagnostic.db');

function checkTable(tableName) {
    console.log(`\n--- ${tableName} ---`);
    try {
        const info = db.prepare(`PRAGMA table_info(${tableName})`).all();
        console.log(JSON.stringify(info, null, 2));
    } catch (e) {
        console.log(`Error checking ${tableName}: ${e.message}`);
    }
}

checkTable('missions');
checkTable('flash_diagnostics');

db.close();
