// Script to fix mission 5 assignment
import { getDb, closeDb } from './index.js'

const db = getDb()

try {
  // Get the correct consultant (ID 8 - deniaux@gmail.com)
  const consultant = db.prepare(`
    SELECT id, email
    FROM consultants
    WHERE email = 'deniaux@gmail.com'
  `).get()

  if (!consultant) {
    console.log('❌ Consultant deniaux@gmail.com not found!')
    process.exit(1)
  }

  console.log(`✅ Consultant trouvé: ID ${consultant.id}, Email: ${consultant.email}`)

  // Update mission 5
  const result = db.prepare(`
    UPDATE missions
    SET consultant_id = ?
    WHERE id = 5
  `).run(consultant.id)

  if (result.changes > 0) {
    console.log(`✅ Mission 5 mise à jour avec succès!`)
    console.log(`   Nouveau consultant_id: ${consultant.id}`)
    
    // Verify
    const mission = db.prepare(`
      SELECT id, consultant_id, organization_name
      FROM missions
      WHERE id = 5
    `).get()
    
    console.log(`\n📋 Vérification:`)
    console.log(`   Mission ID: ${mission.id}`)
    console.log(`   Organisation: ${mission.organization_name}`)
    console.log(`   Consultant ID: ${mission.consultant_id}`)
  } else {
    console.log(`❌ Aucune mission mise à jour`)
  }

} catch (error) {
  console.error('Error:', error.message)
  process.exit(1)
} finally {
  closeDb()
}
