// Script to check if a user exists and their status
import { getDb, closeDb } from './index.js'

const db = getDb()

const email = process.argv[2]

if (!email) {
  console.error('Usage: node server/db/check-user.js <email>')
  process.exit(1)
}

try {
  const consultant = db.prepare(`
    SELECT id, email, first_name, last_name, job_title, suspended, created_at
    FROM consultants
    WHERE email = ?
  `).get(email)

  if (!consultant) {
    console.log(`❌ User with email ${email} does not exist!`)
    process.exit(1)
  }

  // Get roles
  const roles = db.prepare(`
    SELECT role
    FROM user_roles
    WHERE consultant_id = ?
  `).all(consultant.id).map(r => r.role)

  console.log(`✅ User found:`)
  console.log(`   ID: ${consultant.id}`)
  console.log(`   Email: ${consultant.email}`)
  console.log(`   Name: ${consultant.first_name} ${consultant.last_name}`)
  console.log(`   Job Title: ${consultant.job_title || 'N/A'}`)
  console.log(`   Suspended: ${consultant.suspended ? 'YES ❌' : 'NO ✅'}`)
  console.log(`   Roles: ${roles.join(', ') || 'None'}`)
  console.log(`   Created: ${consultant.created_at}`)
} catch (error) {
  console.error('Error checking user:', error.message)
  process.exit(1)
} finally {
  closeDb()
}
