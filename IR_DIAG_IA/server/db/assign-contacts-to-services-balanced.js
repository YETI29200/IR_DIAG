// Script to assign existing contacts to services for balanced test data
import { getDb, closeDb } from './index.js'

const missionIdArg = process.argv[2]

if (!missionIdArg) {
  console.log('Usage: node server/db/assign-contacts-to-services-balanced.js <mission_id>')
  console.log('Example: node server/db/assign-contacts-to-services-balanced.js 5')
  process.exit(1)
}

const missionId = parseInt(missionIdArg)
const db = getDb()

try {
  // Get all services for this mission
  const services = db.prepare(`
    SELECT id, name, code
    FROM mission_services
    WHERE mission_id = ?
    ORDER BY id
  `).all(missionId)

  if (services.length === 0) {
    console.log(`❌ Aucun service trouvé pour la mission ${missionId}`)
    process.exit(1)
  }

  console.log(`\n📋 ${services.length} service(s) trouvé(s):`)
  services.forEach(s => {
    console.log(`   - ${s.name} (${s.code}) - ID: ${s.id}`)
  })

  // Get all contacts without service assignment
  const contacts = db.prepare(`
    SELECT id, first_name, last_name, email
    FROM mission_contacts
    WHERE mission_id = ? AND service_id IS NULL
    ORDER BY id
  `).all(missionId)

  if (contacts.length === 0) {
    console.log(`\n✅ Tous les contacts sont déjà assignés à un service`)
    process.exit(0)
  }

  console.log(`\n👥 ${contacts.length} contact(s) à assigner\n`)

  // Assign contacts evenly to services (5 per service for 20 contacts and 4 services)
  const contactsPerService = Math.floor(contacts.length / services.length)
  const remainingContacts = contacts.length % services.length

  let contactIndex = 0

  const updateStmt = db.prepare(`
    UPDATE mission_contacts
    SET service_id = ?
    WHERE id = ?
  `)

  const transaction = db.transaction(() => {
    services.forEach((service, serviceIndex) => {
      // First services get one extra contact if there are remaining contacts
      const countForThisService = contactsPerService + (serviceIndex < remainingContacts ? 1 : 0)
      
      console.log(`📝 Assignation de ${countForThisService} contact(s) au service ${service.name}:`)
      
      for (let i = 0; i < countForThisService && contactIndex < contacts.length; i++) {
        const contact = contacts[contactIndex]
        updateStmt.run(service.id, contact.id)
        console.log(`   ✅ ${contact.first_name} ${contact.last_name} (${contact.email})`)
        contactIndex++
      }
    })
  })

  transaction()

  console.log(`\n✅ ${contacts.length} contact(s) assigné(s) avec succès!\n`)

  // Verify assignment
  const verification = db.prepare(`
    SELECT s.name, COUNT(c.id) as count
    FROM mission_services s
    LEFT JOIN mission_contacts c ON c.service_id = s.id AND c.mission_id = ?
    WHERE s.mission_id = ?
    GROUP BY s.id, s.name
    ORDER BY s.id
  `).all(missionId, missionId)

  console.log('📊 Vérification de l\'assignation:')
  verification.forEach(v => {
    console.log(`   - ${v.name}: ${v.count} contact(s)`)
  })

} catch (error) {
  console.error('❌ Erreur:', error)
  console.error(error.stack)
  process.exit(1)
} finally {
  closeDb()
}

