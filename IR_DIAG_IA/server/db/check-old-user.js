// Script to check old user (ID 6) and reassign missions if needed
import { getDb, closeDb } from './index.js'

const db = getDb()

try {
  // Check old user
  const oldUser = db.prepare(`
    SELECT id, email, first_name, last_name
    FROM consultants
    WHERE id = 6
  `).get()

  if (!oldUser) {
    console.log('✅ L\'ancien utilisateur (ID 6) n\'existe plus')
    process.exit(0)
  }

  console.log(`👤 Ancien utilisateur trouvé:`)
  console.log(`   ID: ${oldUser.id}`)
  console.log(`   Email: ${oldUser.email}`)
  console.log(`   Name: ${oldUser.first_name} ${oldUser.last_name}`)

  // Check missions assigned to old user
  const missions = db.prepare(`
    SELECT id, organization_name, consultant_id
    FROM missions
    WHERE consultant_id = 6
  `).all()

  console.log(`\n📋 Missions assignées à l'ancien utilisateur (ID 6): ${missions.length}`)
  
  if (missions.length > 0) {
    missions.forEach(m => {
      console.log(`   - Mission ${m.id}: ${m.organization_name}`)
    })
    
    // Get new user ID
    const newUser = db.prepare(`
      SELECT id, email
      FROM consultants
      WHERE email = 'deniaux@gmail.com'
    `).get()
    
    if (newUser) {
      console.log(`\n💡 Vous pouvez réassigner ces missions à l'utilisateur ID ${newUser.id} (${newUser.email})`)
    }
  } else {
    console.log(`\n✅ Aucune mission assignée à l'ancien utilisateur`)
  }

} catch (error) {
  console.error('Error:', error.message)
  process.exit(1)
} finally {
  closeDb()
}
