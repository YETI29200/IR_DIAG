import Database from 'better-sqlite3';
import { randomBytes } from 'crypto';

const db = new Database('./data/diagnostic.db');

function generateContactToken() {
    return 'CTK' + randomBytes(8).toString('hex').toUpperCase();
}

try {
    // 1. Add contact_token column to mission_contacts
    try {
        db.exec(`ALTER TABLE mission_contacts ADD COLUMN contact_token TEXT`);
        console.log('✅ Added contact_token column to mission_contacts');
    } catch (e) {
        if (e.message.includes('duplicate column')) {
            console.log('ℹ️  contact_token column already exists');
        } else throw e;
    }

    // 2. Add contact_id column to sessions
    try {
        db.exec(`ALTER TABLE sessions ADD COLUMN contact_id INTEGER REFERENCES mission_contacts(id)`);
        console.log('✅ Added contact_id column to sessions');
    } catch (e) {
        if (e.message.includes('duplicate column')) {
            console.log('ℹ️  contact_id column already exists');
        } else throw e;
    }

    // 3. Generate tokens for all existing contacts that don't have one
    const contacts = db.prepare(`SELECT id FROM mission_contacts WHERE contact_token IS NULL`).all();
    const stmt = db.prepare(`UPDATE mission_contacts SET contact_token = ? WHERE id = ?`);
    for (const c of contacts) {
        stmt.run(generateContactToken(), c.id);
    }
    console.log(`✅ Generated tokens for ${contacts.length} existing contacts`);

    console.log('\n🎉 Migration completed successfully!');
} catch (err) {
    console.error('❌ Migration error:', err.message);
}
