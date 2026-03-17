// Script to randomly assign contacts to services (2 per service)
import { getDb, closeDb } from './index.js'

const db = getDb()

// Get mission ID from command line argument or use all missions
const missionIdArg = process.argv[2]
const missionIds = missionIdArg ? [parseInt(missionIdArg)] : null

try {
  // Get missions to process
  let missions
  if (missionIds) {
    missions = db.prepare(`
      SELECT id, organization_name
      FROM missions
      WHERE id IN (${missionIds.map(() => '?').join(',')})
    `).all(...missionIds)
  } else {
    missions = db.prepare(`
      SELECT id, organization_name
      FROM missions
      ORDER BY id
    `).all()
  }

  if (missions.length === 0) {
    console.log('❌ Aucune mission trouvée')
    process.exit(1)
  }

  console.log(`📋 ${missions.length} mission(s) à traiter\n`)

  for (const mission of missions) {
    console.log(`\n🔄 Traitement de la mission ${mission.id}: ${mission.organization_name}`)

    // Get all services for this mission
    const services = db.prepare(`
      SELECT id, name, code
      FROM mission_services
      WHERE mission_id = ?
      ORDER BY id
    `).all(mission.id)

    if (services.length === 0) {
      console.log(`  ⚠️  Aucun service trouvé pour cette mission`)
      continue
    }

    console.log(`  📦 ${services.length} service(s) trouvé(s): ${services.map(s => s.name).join(', ')}`)

    // Get all contacts for this mission (without service assignment or with null service_id)
    const contacts = db.prepare(`
      SELECT id, first_name, last_name, email, service_id
      FROM mission_contacts
      WHERE mission_id = ?
      ORDER BY id
    `).all(mission.id)

    if (contacts.length === 0) {
      console.log(`  ⚠️  Aucun contact trouvé pour cette mission`)
      continue
    }

    console.log(`  👥 ${contacts.length} contact(s) trouvé(s)`)

    // Shuffle contacts array randomly
    const shuffledContacts = [...contacts].sort(() => Math.random() - 0.5)

    // Calculate how many contacts we need (5 per service)
    const contactsNeeded = services.length * 5
    const contactsToAssign = shuffledContacts.slice(0, contactsNeeded)

    if (contactsToAssign.length < contactsNeeded) {
      console.log(`  ⚠️  Pas assez de contacts (${contactsToAssign.length} disponibles, ${contactsNeeded} nécessaires)`)
      console.log(`  💡 Astuce: Exécutez d'abord "node server/db/generate-fake-contacts.js ${mission.id}" pour créer des contacts supplémentaires`)
    }

    // Assign 5 contacts per service
    let contactIndex = 0
    const updateStmt = db.prepare(`
      UPDATE mission_contacts
      SET service_id = ?
      WHERE id = ?
    `)

    const transaction = db.transaction(() => {
      for (const service of services) {
        const assignedContacts = []
        
        // Assign 5 contacts to this service
        for (let i = 0; i < 5 && contactIndex < contactsToAssign.length; i++) {
          const contact = contactsToAssign[contactIndex]
          updateStmt.run(service.id, contact.id)
          assignedContacts.push(`${contact.first_name} ${contact.last_name}`)
          contactIndex++
        }

        if (assignedContacts.length > 0) {
          console.log(`  ✅ ${service.name}: ${assignedContacts.length} contact(s) assigné(s) - ${assignedContacts.join(', ')}`)
        } else {
          console.log(`  ⚠️  ${service.name}: Aucun contact assigné (pas assez de contacts)`)
        }
      }

      // Set remaining contacts to null service_id
      for (let i = contactIndex; i < contacts.length; i++) {
        const contact = contacts[i]
        updateStmt.run(null, contact.id)
        console.log(`  ℹ️  Contact restant non assigné: ${contact.first_name} ${contact.last_name}`)
      }
    })

    transaction()

    // Verify assignment
    console.log(`\n  📊 Vérification de l'affectation:`)
    for (const service of services) {
      const count = db.prepare(`
        SELECT COUNT(*) as count
        FROM mission_contacts
        WHERE mission_id = ? AND service_id = ?
      `).get(mission.id, service.id).count
      console.log(`    - ${service.name}: ${count} contact(s)`)
    }
  }

  console.log(`\n✅ Affectation terminée avec succès!`)
} catch (error) {
  console.error('❌ Erreur:', error.message)
  console.error(error.stack)
  process.exit(1)
} finally {
  closeDb()
}

