import Database from 'better-sqlite3';

const db = new Database('./data/diagnostic.db');

try {
    db.exec(`
    PRAGMA foreign_keys=off;
    BEGIN TRANSACTION;
    ALTER TABLE email_logs RENAME TO email_logs_old;
    CREATE TABLE email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mission_id INTEGER,
      contact_id INTEGER,
      template_name TEXT,
      subject TEXT NOT NULL,
      body_html TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'simulated_sent',
      sent_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES mission_contacts(id) ON DELETE SET NULL
    );
    INSERT INTO email_logs SELECT * FROM email_logs_old;
    DROP TABLE email_logs_old;
    COMMIT;
    PRAGMA foreign_keys=on;
  `);
    console.log('Fixed email_logs table check constraint in DB.');
} catch (e) {
    console.log('Error:', e.message);
}
