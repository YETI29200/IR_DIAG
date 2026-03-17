// Script to generate fake contacts (5 per service) for a mission
import { getDb, closeDb } from './index.js'

const db = getDb()

// List of common French first names
const firstNames = [
  'Marie', 'Jean', 'Pierre', 'Sophie', 'Thomas', 'Julie', 'Nicolas', 'Céline',
  'David', 'Isabelle', 'Laurent', 'Caroline', 'Sébastien', 'Valérie', 'Julien',
  'Emilie', 'Antoine', 'Camille', 'Vincent', 'Audrey', 'Fabien', 'Marion',
  'Guillaume', 'Claire', 'Romain', 'Pauline', 'Alexandre', 'Laura', 'Maxime',
  'Sarah', 'Florian', 'Amélie', 'Baptiste', 'Elodie', 'Jérôme', 'Nathalie',
  'Olivier', 'Stéphanie', 'François', 'Cécilia', 'Lucas', 'Aurélie', 'Adrien',
  'Mélanie', 'Matthieu', 'Sandrine', 'Benjamin', 'Coralie', 'Raphaël', 'Lucie'
]

// List of common French last names
const lastNames = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit',
  'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel',
  'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel',
  'Girard', 'André', 'Lefevre', 'Mercier', 'Dupont', 'Lambert', 'Bonnet',
  'François', 'Martinez', 'Legrand', 'Garnier', 'Faure', 'Rousseau', 'Blanc',
  'Guerin', 'Muller', 'Henry', 'Dupuis', 'Dumas', 'Lopez', 'Fabre', 'Blanchard',
  'Marie', 'Brun', 'Dufour', 'Barbier', 'Arnaud', 'Vidal', 'Giraud'
]

// List of common roles
const roles = [
  'Directeur', 'Directrice', 'Manager', 'Chef de projet', 'Responsable',
  'Ingénieur', 'Consultant', 'Analyste', 'Développeur', 'Architecte',
  'Expert', 'Spécialiste', 'Coordonnateur', 'Superviseur', 'Coordinateur'
]

// Generate a random email from name
function generateEmail(firstName, lastName, serviceCode) {
  const domain = 'example.com'
  const base = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`
  return `${base}@${domain}`
}

// Generate a random phone number
function generatePhone() {
  const prefix = ['01', '02', '03', '04', '05', '06', '07', '09']
  const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)]
  const number = Math.floor(10000000 + Math.random() * 90000000)
  return `+33 ${randomPrefix.slice(1)} ${String(number).slice(0, 2)} ${String(number).slice(2, 4)} ${String(number).slice(4, 6)} ${String(number).slice(6, 8)}`
}

// Get mission ID from command line argument
const missionIdArg = process.argv[2]

if (!missionIdArg) {
  console.log('Usage: node server/db/generate-fake-contacts.js <mission_id>')
  console.log('Example: node server/db/generate-fake-contacts.js 5')
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

  console.log(`\n🔄 Génération de contacts fictifs pour la mission ${missionId}: ${mission.organization_name}\n`)

  // Get all services for this mission
  const services = db.prepare(`
    SELECT id, name, code
    FROM mission_services
    WHERE mission_id = ?
    ORDER BY id
  `).all(missionId)

  if (services.length === 0) {
    console.log(`❌ Aucun service trouvé pour cette mission`)
    process.exit(1)
  }

  console.log(`📦 ${services.length} service(s) trouvé(s): ${services.map(s => s.name).join(', ')}\n`)

  // Count existing contacts per service
  const existingContacts = db.prepare(`
    SELECT service_id, COUNT(*) as count
    FROM mission_contacts
    WHERE mission_id = ?
    GROUP BY service_id
  `).all(missionId)

  const existingCounts = {}
  existingContacts.forEach(c => {
    existingCounts[c.service_id || 'null'] = c.count
  })

  // Prepare statement
  const insertContactStmt = db.prepare(`
    INSERT INTO mission_contacts (mission_id, service_id, first_name, last_name, role, email, phone, is_primary, is_referent)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)
  `)

  const transaction = db.transaction(() => {
    let totalCreated = 0

    for (const service of services) {
      const existingCount = existingCounts[service.id] || 0
      const needed = 5 - existingCount

      if (needed <= 0) {
        console.log(`  ✅ ${service.name}: Déjà ${existingCount} contact(s) (suffisant)`)
        continue
      }

      console.log(`  📝 ${service.name}: Création de ${needed} contact(s) supplémentaire(s)...`)

      const createdContacts = []
      const usedNames = new Set()

      for (let i = 0; i < needed; i++) {
        // Generate unique name
        let firstName, lastName, fullName
        let attempts = 0
        do {
          firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
          lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
          fullName = `${firstName} ${lastName}`
          attempts++
        } while (usedNames.has(fullName) && attempts < 100)

        usedNames.add(fullName)

        const role = roles[Math.floor(Math.random() * roles.length)]
        const email = generateEmail(firstName, lastName, service.code)
        const phone = generatePhone()

        insertContactStmt.run(
          missionId,
          service.id,
          firstName,
          lastName,
          role,
          email,
          phone
        )

        createdContacts.push(fullName)
        totalCreated++
      }

      console.log(`     ✅ Créé: ${createdContacts.join(', ')}`)
    }

    return totalCreated
  })

  const totalCreated = transaction()

  console.log(`\n✅ Génération terminée! ${totalCreated} contact(s) créé(s)\n`)

  // Verify final counts
  console.log(`📊 Vérification finale par service:`)
  for (const service of services) {
    const count = db.prepare(`
      SELECT COUNT(*) as count
      FROM mission_contacts
      WHERE mission_id = ? AND service_id = ?
    `).get(missionId, service.id).count
    console.log(`   - ${service.name}: ${count} contact(s)`)
  }

} catch (error) {
  console.error('❌ Erreur:', error.message)
  console.error(error.stack)
  process.exit(1)
} finally {
  closeDb()
}

