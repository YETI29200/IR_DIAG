// Script to add a user to the database
import { getDb, closeDb } from './index.js'
import { scryptSync, randomBytes } from 'crypto'

const db = getDb()

// Helper to hash password
function hashPassword(password, salt) {
  const hash = scryptSync(password, salt, 64).toString('hex')
  return hash
}

// Get email and password from command line arguments
const email = process.argv[2]
const password = process.argv[3]
const firstName = process.argv[4] || 'Yann'
const lastName = process.argv[5] || 'DENIAUX'

if (!email || !password) {
  console.error('Usage: node server/db/add-user.js <email> <password> [firstName] [lastName]')
  process.exit(1)
}

try {
  // Check if user already exists
  const existing = db.prepare('SELECT id FROM consultants WHERE email = ?').get(email)
  if (existing) {
    console.error(`User with email ${email} already exists!`)
    process.exit(1)
  }

  // Generate salt and hash password
  const salt = randomBytes(16).toString('hex')
  const passwordHash = hashPassword(password, salt)

  // Insert consultant
  const result = db.prepare(`
    INSERT INTO consultants (email, password_hash, salt, first_name, last_name, job_title)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(email, passwordHash, salt, firstName, lastName, 'Consultant')

  const consultantId = result.lastInsertRowid

  // Assign consultant role
  db.prepare(`
    INSERT INTO user_roles (consultant_id, role)
    VALUES (?, 'consultant')
  `).run(consultantId)

  console.log(`✅ User created successfully!`)
  console.log(`   Email: ${email}`)
  console.log(`   Name: ${firstName} ${lastName}`)
  console.log(`   ID: ${consultantId}`)
  console.log(`   Role: consultant`)
} catch (error) {
  console.error('Error creating user:', error.message)
  process.exit(1)
} finally {
  closeDb()
}

