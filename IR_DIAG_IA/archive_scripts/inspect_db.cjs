const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'data', 'diagnostic.db');

try {
    const db = new Database(dbPath);
    const missions = db.prepare("SELECT id, organization_name, questionnaire_type FROM missions").all();
    console.log("MISSIONS:", JSON.stringify(missions, null, 2));

    if (missions.length > 0) {
        const missionId = missions[0].id;
        const responses = db.prepare("SELECT COUNT(*) as count FROM responses r JOIN sessions s ON r.session_id = s.id WHERE s.mission_id = ?").get(missionId);
        console.log(`RESPONSES for mission ${missionId}:`, responses.count);
    }
} catch (e) {
    console.error("DB ERROR:", e.message);
}
