import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'data/diagnostic.db');

const db = new Database(dbPath);

const mission = db.prepare('SELECT id FROM missions ORDER BY created_at DESC LIMIT 1').get();
if (mission) {
    console.log('Restoring mapping for Mission ID:', mission.id);

    // Get logs
    const logs = db.prepare('SELECT contact_id, body_html FROM email_logs WHERE mission_id = ?').all(mission.id);
    console.log(`Found ${logs.length} email logs.`);

    // Get services mapping
    const services = db.prepare('SELECT id, code FROM mission_services WHERE mission_id = ?').all(mission.id);
    const serviceCodeToId = {};
    services.forEach(s => serviceCodeToId[s.code] = s.id);

    let restoredCount = 0;
    const updateStmt = db.prepare('UPDATE mission_contacts SET service_id = ? WHERE id = ?');

    logs.forEach(log => {
        // Extract service code from link like: service=SRV...
        const match = log.body_html.match(/service=([^"&\s?]+)/);
        if (match && match[1]) {
            const code = match[1];
            const serviceId = serviceCodeToId[code];
            if (serviceId) {
                updateStmt.run(serviceId, log.contact_id);
                restoredCount++;
            }
        }
    });

    console.log(`Successfully restored ${restoredCount} contacts mapping.`);
} else {
    console.log('No mission found.');
}
