// Script to clean duplicate sessions for a mission
import { getDb, closeDb } from './index.js'

const db = getDb()

// Get mission ID from command line argument
const missionIdArg = process.argv[2]

if (!missionIdArg) {
  console.log('Usage: node server/db/clean-duplicate-sessions.js <mission_id>')
  console.log('Example: node server/db/clean-duplicate-sessions.js 5')
  process.exit(1)
}

const missionId = parseInt(missionIdArg)

try {
  // Verify mission exists
  const mission = db.prepare(`
    SELECT id, organization_name
    FROM missions
    WHERE id = ?
  `).get(missionId)

  if (!mission) {
    console.log(`❌ Mission ${missionId} introuvable`)
    process.exit(1)
  }

  console.log(`\n🧹 Nettoyage des sessions en double pour la mission ${missionId}: ${mission.organization_name}\n`)

  // Get all sessions for this mission
  const allSessions = db.prepare(`
    SELECT id, service_id, anonymous_token, started_at, completed_at
    FROM sessions
    WHERE mission_id = ?
    ORDER BY service_id, started_at
  `).all(missionId)

  console.log(`📊 ${allSessions.length} session(s) trouvée(s) au total\n`)

  // Group sessions by service_id
  const sessionsByService = {}
  allSessions.forEach(session => {
    const key = session.service_id || 'null'
    if (!sessionsByService[key]) {
      sessionsByService[key] = []
    }
    sessionsByService[key].push(session)
  })

  // Find duplicates and keep only the most recent one per service
  const sessionsToDelete = []
  let keptCount = 0

  for (const [serviceKey, sessions] of Object.entries(sessionsByService)) {
    if (sessions.length > 1) {
      // Sort by started_at descending (most recent first)
      sessions.sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
      
      // Keep the first (most recent), delete the rest
      const toKeep = sessions[0]
      const toDelete = sessions.slice(1)
      
      console.log(`  Service ${serviceKey === 'null' ? 'Aucun' : serviceKey}:`)
      console.log(`    ✅ Garde: Session ${toKeep.id} (${new Date(toKeep.started_at).toLocaleString('fr-FR')})`)
      
      toDelete.forEach(session => {
        console.log(`    ❌ Supprime: Session ${session.id} (${new Date(session.started_at).toLocaleString('fr-FR')})`)
        sessionsToDelete.push(session.id)
      })
      
      keptCount++
    } else {
      keptCount++
    }
  }

  if (sessionsToDelete.length === 0) {
    console.log(`\n✅ Aucune session en double trouvée. Tout est propre!`)
    process.exit(0)
  }

  console.log(`\n🗑️  Suppression de ${sessionsToDelete.length} session(s) en double...`)

  // Delete duplicate sessions (responses will be cascade deleted)
  const deleteStmt = db.prepare(`
    DELETE FROM sessions WHERE id = ?
  `)

  const transaction = db.transaction(() => {
    for (const sessionId of sessionsToDelete) {
      deleteStmt.run(sessionId)
    }
  })

  transaction()

  console.log(`✅ ${sessionsToDelete.length} session(s) supprimée(s)`)
  console.log(`✅ ${keptCount} session(s) conservée(s)\n`)

  // Show final statistics
  const finalSessions = db.prepare(`
    SELECT COUNT(*) as count
    FROM sessions
    WHERE mission_id = ?
  `).get(missionId).count

  const finalCompleted = db.prepare(`
    SELECT COUNT(*) as count
    FROM sessions
    WHERE mission_id = ? AND completed_at IS NOT NULL
  `).get(missionId).count

  const totalContacts = db.prepare(`
    SELECT COUNT(*) as count
    FROM mission_contacts
    WHERE mission_id = ?
  `).get(missionId).count

  const completionRate = totalContacts > 0 ? Math.round((finalCompleted / totalContacts) * 100) : 0

  console.log(`📊 Statistiques finales:`)
  console.log(`   - Sessions: ${finalSessions}`)
  console.log(`   - Sessions complétées: ${finalCompleted}`)
  console.log(`   - Contacts: ${totalContacts}`)
  console.log(`   - Taux de complétion: ${completionRate}% (${finalCompleted}/${totalContacts})\n`)

} catch (error) {
  console.error('❌ Erreur:', error.message)
  console.error(error.stack)
  process.exit(1)
} finally {
  closeDb()
}

