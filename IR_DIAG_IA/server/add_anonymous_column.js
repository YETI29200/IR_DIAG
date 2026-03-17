import Database from 'better-sqlite3';

const db = new Database('./data/diagnostic.db');

try {
  // Add is_anonymous column to sessions table
  db.exec(`ALTER TABLE sessions ADD COLUMN is_anonymous INTEGER NOT NULL DEFAULT 0`);
  console.log('Added is_anonymous column to sessions table.');
} catch (e) {
  if (e.message.includes('duplicate column')) {
    console.log('Column already exists, skipping.');
  } else {
    console.error('Error:', e.message);
  }
}
