
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'data', 'diagnostic.db');
const db = new Database(dbPath);

const consultants = db.prepare('SELECT id, email, first_name, last_name FROM consultants').all();
console.log('Consultants:', JSON.stringify(consultants, null, 2));

const roles = db.prepare('SELECT * FROM user_roles').all();
console.log('User Roles:', JSON.stringify(roles, null, 2));

db.close();
