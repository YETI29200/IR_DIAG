// Script to reset a user's password
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

if (!email || !password) {
  console.error('Usage: node server/db/reset-password.js <email> <new-password>')
  process.exit(1)
}

try {
  // Check if user exists
  const consultant = db.prepare('SELECT id, email FROM consultants WHERE email = ?').get(email)
  if (!consultant) {
    console.error(`❌ User with email ${email} does not exist!`)
    process.exit(1)
  }

  // Generate new salt and hash password
  const salt = randomBytes(16).toString('hex')
  const passwordHash = hashPassword(password, salt)

  // Update password
  db.prepare(`
    UPDATE consultants
    SET password_hash = ?, salt = ?
    WHERE email = ?
  `).run(passwordHash, salt, email)

  console.log(`✅ Password reset successfully!`)
  console.log(`   Email: ${email}`)
  console.log(`   New password: ${password}`)
} catch (error) {
  console.error('Error resetting password:', error.message)
  process.exit(1)
} finally {
  closeDb()
}

