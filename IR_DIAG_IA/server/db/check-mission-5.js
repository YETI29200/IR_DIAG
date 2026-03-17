// Script to check mission 5 and its consultant
import { getDb, closeDb } from './index.js'

const db = getDb()

try {
  // Check mission 5
  const mission = db.prepare(`
    SELECT id, consultant_id, organization_name, status, created_at
    FROM missions
    WHERE id = 5
  `).get()

  if (!mission) {
    console.log('❌ Mission 5 does not exist!')
    process.exit(1)
  }

  console.log('📋 Mission 5:')
  console.log(`   ID: ${mission.id}`)
  console.log(`   Organisation: ${mission.organization_name}`)
  console.log(`   Consultant ID: ${mission.consultant_id}`)
  console.log(`   Status: ${mission.status}`)
  console.log(`   Created: ${mission.created_at}`)

  // Check consultant assigned to mission 5
  const consultant = db.prepare(`
    SELECT id, email, first_name, last_name
    FROM consultants
    WHERE id = ?
  `).get(mission.consultant_id)

  if (consultant) {
    console.log(`\n👤 Consultant assigné à la mission 5:`)
    console.log(`   ID: ${consultant.id}`)
    console.log(`   Email: ${consultant.email}`)
    console.log(`   Name: ${consultant.first_name} ${consultant.last_name}`)
  } else {
    console.log(`\n❌ Aucun consultant trouvé avec l'ID ${mission.consultant_id}`)
  }

  // Check deniaux@gmail.com
  const deniaux = db.prepare(`
    SELECT id, email, first_name, last_name
    FROM consultants
    WHERE email = 'deniaux@gmail.com'
  `).get()

  if (deniaux) {
    console.log(`\n👤 Utilisateur deniaux@gmail.com:`)
    console.log(`   ID: ${deniaux.id}`)
    console.log(`   Email: ${deniaux.email}`)
    console.log(`   Name: ${deniaux.first_name} ${deniaux.last_name}`)
    
    if (deniaux.id === mission.consultant_id) {
      console.log(`\n✅ L'utilisateur est bien assigné à la mission 5`)
    } else {
      console.log(`\n❌ PROBLÈME: L'utilisateur (ID: ${deniaux.id}) n'est PAS assigné à la mission 5 (consultant_id: ${mission.consultant_id})`)
      console.log(`\n💡 Solution: Mettre à jour la mission 5 pour assigner l'utilisateur deniaux@gmail.com`)
    }
  } else {
    console.log(`\n❌ Utilisateur deniaux@gmail.com n'existe pas`)
  }

} catch (error) {
  console.error('Error:', error.message)
  process.exit(1)
} finally {
  closeDb()
}
