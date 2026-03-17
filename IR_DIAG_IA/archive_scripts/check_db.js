import initSqlite from 'better-sqlite3';
const db = initSqlite('server/db/database.sqlite');
const tableInfo = db.prepare("PRAGMA table_info(mission_services)").all();
console.log(JSON.stringify(tableInfo, null, 2));
db.close();
