// Script to verify that cascade deletion is working correctly
// Run this after deleting a mission to check if all related data was deleted
import { getDb, closeDb } from './index.js'

const db = getDb()

// Get a list of all missions
const missions = db.prepare(`SELECT id, organization_name FROM missions`).all()

console.log('=== Verification de la suppression en cascade ===\n')

for (const mission of missions) {
  const missionId = mission.id
  
  const services = db.prepare(`SELECT COUNT(*) as count FROM mission_services WHERE mission_id = ?`).get(missionId).count
  const contacts = db.prepare(`SELECT COUNT(*) as count FROM mission_contacts WHERE mission_id = ?`).get(missionId).count
  const sessions = db.prepare(`SELECT COUNT(*) as count FROM sessions WHERE mission_id = ?`).get(missionId).count
  const recommendations = db.prepare(`SELECT COUNT(*) as count FROM recommendations WHERE mission_id = ?`).get(missionId).count
  const emailLogs = db.prepare(`SELECT COUNT(*) as count FROM email_logs WHERE mission_id = ?`).get(missionId).count
  
  // Count responses through sessions
  const responses = db.prepare(`
    SELECT COUNT(*) as count 
    FROM responses r
    JOIN sessions s ON r.session_id = s.id
    WHERE s.mission_id = ?
  `).get(missionId).count
  
  // Count recommendation history through recommendations
  const recHistory = db.prepare(`
    SELECT COUNT(*) as count 
    FROM recommendations_history rh
    JOIN recommendations r ON rh.recommendation_id = r.id
    WHERE r.mission_id = ?
  `).get(missionId).count
  
  console.log(`Mission ${missionId}: ${mission.organization_name}`)
  console.log(`  - Services: ${services}`)
  console.log(`  - Contacts: ${contacts}`)
  console.log(`  - Sessions: ${sessions}`)
  console.log(`  - Responses: ${responses}`)
  console.log(`  - Recommendations: ${recommendations}`)
  console.log(`  - Recommendation History: ${recHistory}`)
  console.log(`  - Email Logs: ${emailLogs}`)
  console.log('')
}

// Check for orphaned data (data that references non-existent missions)
const orphanedServices = db.prepare(`
  SELECT COUNT(*) as count 
  FROM mission_services ms
  LEFT JOIN missions m ON ms.mission_id = m.id
  WHERE m.id IS NULL
`).get().count

const orphanedContacts = db.prepare(`
  SELECT COUNT(*) as count 
  FROM mission_contacts mc
  LEFT JOIN missions m ON mc.mission_id = m.id
  WHERE m.id IS NULL
`).get().count

const orphanedSessions = db.prepare(`
  SELECT COUNT(*) as count 
  FROM sessions s
  LEFT JOIN missions m ON s.mission_id = m.id
  WHERE m.id IS NULL
`).get().count

const orphanedRecommendations = db.prepare(`
  SELECT COUNT(*) as count 
  FROM recommendations r
  LEFT JOIN missions m ON r.mission_id = m.id
  WHERE m.id IS NULL
`).get().count

const orphanedEmailLogs = db.prepare(`
  SELECT COUNT(*) as count 
  FROM email_logs el
  LEFT JOIN missions m ON el.mission_id = m.id
  WHERE m.id IS NULL
`).get().count

console.log('=== Données orphelines (devraient être 0) ===')
console.log(`  - Services orphelins: ${orphanedServices}`)
console.log(`  - Contacts orphelins: ${orphanedContacts}`)
console.log(`  - Sessions orphelines: ${orphanedSessions}`)
console.log(`  - Recommendations orphelines: ${orphanedRecommendations}`)
console.log(`  - Email logs orphelins: ${orphanedEmailLogs}`)

if (orphanedServices > 0 || orphanedContacts > 0 || orphanedSessions > 0 || orphanedRecommendations > 0 || orphanedEmailLogs > 0) {
  console.log('\n⚠️  ATTENTION: Des données orphelines ont été détectées !')
  console.log('   Cela signifie que la suppression en cascade ne fonctionne pas correctement.')
  process.exit(1)
} else {
  console.log('\n✅ Aucune donnée orpheline détectée. La suppression en cascade fonctionne correctement.')
}

closeDb()

