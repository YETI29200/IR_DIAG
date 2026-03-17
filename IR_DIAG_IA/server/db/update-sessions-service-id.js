// Script to update sessions service_id based on their contact's service_id
import { getDb, closeDb } from './index.js'

const missionIdArg = process.argv[2]

if (!missionIdArg) {
  console.log('Usage: node server/db/update-sessions-service-id.js <mission_id>')
  console.log('Example: node server/db/update-sessions-service-id.js 5')
  process.exit(1)
}

const missionId = parseInt(missionIdArg)
const db = getDb()

try {
  // Get all sessions for this mission
  const sessions = db.prepare(`
    SELECT s.id, s.service_id, s.anonymous_token
    FROM sessions s
    WHERE s.mission_id = ?
  `).all(missionId)

  console.log(`\n📋 ${sessions.length} session(s) trouvée(s)\n`)

  // For each session, find the corresponding contact by matching anonymous_token
  // Since we can't directly match, we'll use a different approach:
  // Match sessions to contacts by order (assuming one session per contact)
  const contacts = db.prepare(`
    SELECT id, service_id, email
    FROM mission_contacts
    WHERE mission_id = ?
    ORDER BY id
  `).all(missionId)

  console.log(`👥 ${contacts.length} contact(s) trouvé(s)\n`)

  // Update sessions to match contacts' service_id
  // We'll match by order: first session -> first contact, etc.
  const updateStmt = db.prepare(`
    UPDATE sessions
    SET service_id = ?
    WHERE id = ?
  `)

  const transaction = db.transaction(() => {
    let updatedCount = 0
    
    sessions.forEach((session, index) => {
      if (index < contacts.length) {
        const contact = contacts[index]
        if (contact.service_id && session.service_id !== contact.service_id) {
          updateStmt.run(contact.service_id, session.id)
          updatedCount++
          console.log(`✅ Session ${session.id} → Service ID ${contact.service_id} (${contact.email})`)
        }
      }
    })
    
    return updatedCount
  })

  const updatedCount = transaction()

  console.log(`\n✅ ${updatedCount} session(s) mise(s) à jour avec succès!\n`)

  // Verify
  const verification = db.prepare(`
    SELECT s.service_id, COUNT(*) as count
    FROM sessions s
    WHERE s.mission_id = ?
    GROUP BY s.service_id
  `).all(missionId)

  console.log('📊 Vérification:')
  verification.forEach(v => {
    const serviceName = v.service_id 
      ? db.prepare('SELECT name FROM mission_services WHERE id = ?').get(v.service_id)?.name || 'Inconnu'
      : 'Non assigné'
    console.log(`   - ${serviceName}: ${v.count} session(s)`)
  })

} catch (error) {
  console.error('❌ Erreur:', error)
  console.error(error.stack)
  process.exit(1)
} finally {
  closeDb()
}

