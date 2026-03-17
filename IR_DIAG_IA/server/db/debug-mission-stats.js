// Script to debug mission statistics
import { getDb, closeDb } from './index.js'

const db = getDb()

// Find mission by organization name
const mission = db.prepare(`
  SELECT id, organization_name
  FROM missions
  WHERE organization_name LIKE '%I&R%' OR organization_name LIKE '%ASSOCIATION%'
  LIMIT 1
`).get()

if (!mission) {
  console.log('Mission I&R not found')
  process.exit(1)
}

const missionId = mission.id
console.log(`\n=== Mission: ${mission.organization_name} (ID: ${missionId}) ===\n`)

// Count services
const servicesCount = db.prepare(`
  SELECT COUNT(*) as count FROM mission_services WHERE mission_id = ?
`).get(missionId)
console.log(`Services count: ${servicesCount.count}`)

// List all services
const services = db.prepare(`
  SELECT id, name, code FROM mission_services WHERE mission_id = ?
`).all(missionId)
console.log(`Services list:`)
services.forEach(s => {
  console.log(`  - ${s.name} (${s.code})`)
})

// Count contacts
const contactsCount = db.prepare(`
  SELECT COUNT(*) as count FROM mission_contacts WHERE mission_id = ?
`).get(missionId)
console.log(`\nContacts count: ${contactsCount.count}`)

// List all contacts
const contacts = db.prepare(`
  SELECT id, first_name, last_name, email, service_id 
  FROM mission_contacts 
  WHERE mission_id = ?
`).all(missionId)
console.log(`Contacts list:`)
contacts.forEach(c => {
  const serviceName = c.service_id ? 
    db.prepare(`SELECT name FROM mission_services WHERE id = ?`).get(c.service_id)?.name || 'Unknown' :
    'No service'
  console.log(`  - ${c.first_name} ${c.last_name} (${c.email}) - Service: ${serviceName}`)
})

// Count by service
console.log(`\nContacts by service:`)
services.forEach(s => {
  const count = db.prepare(`
    SELECT COUNT(*) as count 
    FROM mission_contacts 
    WHERE mission_id = ? AND service_id = ?
  `).get(missionId, s.id).count
  console.log(`  - ${s.name}: ${count} contact(s)`)
})

closeDb()

