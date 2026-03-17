// Seed data script for development
import { getDb, closeDb } from './index.js'
import { scryptSync, randomBytes } from 'crypto'

const db = getDb()

// Helper to hash password
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return { hash, salt }
}

console.log('Seeding database...')

// Create admin consultant
const adminPassword = hashPassword('admin123')
const adminResult = db.prepare(`
  INSERT INTO consultants (email, password_hash, salt, first_name, last_name, job_title)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(
  'admin@images-reseaux.fr',
  adminPassword.hash,
  adminPassword.salt,
  'Admin',
  'System',
  'Administrateur'
)

const adminId = adminResult.lastInsertRowid

// Assign admin role
db.prepare(`
  INSERT INTO user_roles (consultant_id, role)
  VALUES (?, 'admin')
`).run(adminId)

// Assign consultant role
db.prepare(`
  INSERT INTO user_roles (consultant_id, role)
  VALUES (?, 'consultant')
`).run(adminId)

// Create test consultant
const consultantPassword = hashPassword('consultant123')
const consultantResult = db.prepare(`
  INSERT INTO consultants (email, password_hash, salt, first_name, last_name, job_title)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(
  'consultant@images-reseaux.fr',
  consultantPassword.hash,
  consultantPassword.salt,
  'Jean',
  'Dupont',
  'Consultant Senior'
)

const consultantId = consultantResult.lastInsertRowid

db.prepare(`
  INSERT INTO user_roles (consultant_id, role)
  VALUES (?, 'consultant')
`).run(consultantId)

// Create test mission
const missionResult = db.prepare(`
  INSERT INTO missions (consultant_id, organization_name, sector, employees, questionnaire_type, status)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(
  consultantId,
  'Acme Corporation',
  'Technologie',
  250,
  'flash',
  'active'
)

const missionId = missionResult.lastInsertRowid

// Create test service
const serviceCode = 'IT001'
// Use relative URL for development
const baseUrl = process.env.BASE_URL || ''
const uniqueLink = `${baseUrl}/questionnaire/flash/${missionId}?service=${serviceCode}`
const serviceResult = db.prepare(`
  INSERT INTO mission_services (mission_id, name, code, unique_link)
  VALUES (?, ?, ?, ?)
`).run(
  missionId,
  'Direction IT',
  serviceCode,
  uniqueLink
)

const serviceId = serviceResult.lastInsertRowid

// Create test contact
db.prepare(`
  INSERT INTO mission_contacts (mission_id, service_id, first_name, last_name, role, email, phone, is_primary)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  missionId,
  serviceId,
  'Marie',
  'Martin',
  'Directrice IT',
  'marie.martin@acme.fr',
  '+33 1 23 45 67 89',
  1
)

console.log('Seed data created:')
console.log('- Admin: admin@images-reseaux.fr / admin123')
console.log('- Consultant: consultant@images-reseaux.fr / consultant123')
console.log('- Test mission ID:', missionId)
console.log('- Test service code:', serviceCode)

closeDb()

