import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'data/diagnostic.db');

const db = new Database(dbPath);

const mission = db.prepare('SELECT id FROM missions ORDER BY created_at DESC LIMIT 1').get();
if (mission) {
    console.log('Recovering mapping for Mission ID:', mission.id);

    // Get logs
    const logs = db.prepare('SELECT contact_id, body_html FROM email_logs WHERE mission_id = ?').all(mission.id);
    console.log(`Found ${logs.length} email logs.`);

    // Get services mapping
    const services = db.prepare('SELECT id, code FROM mission_services WHERE mission_id = ?').all(mission.id);
    const serviceCodeToId = {};
    services.forEach(s => serviceCodeToId[s.code] = s.id);

    const updates = [];
    logs.forEach(log => {
        // Extract service code from link like: service=SRV...
        const match = log.body_html.match(/service=([^"&\s?]+)/);
        if (match && match[1]) {
            const code = match[1];
            const serviceId = serviceCodeToId[code];
            if (serviceId) {
                updates.push({ contactId: log.contact_id, serviceId });
            }
        }
    });

    console.log(`Proposed ${updates.length} updates:`, JSON.stringify(updates, null, 2));
} else {
    console.log('No mission found.');
}
