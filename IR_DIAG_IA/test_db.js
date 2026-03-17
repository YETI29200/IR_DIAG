import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./data/diagnostic.db');
const row = db.prepare('SELECT created_at, recommendations_json FROM flash_diagnostics ORDER BY created_at DESC LIMIT 1').get();

fs.writeFileSync('db_output.json', row.recommendations_json);
