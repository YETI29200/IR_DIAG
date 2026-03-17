// Script to create admin accounts
import { getDb, closeDb } from './index.js'
import { scryptSync, randomBytes } from 'crypto'

const db = getDb()

// Helper to hash password
function hashPassword(password, salt) {
  const hash = scryptSync(password, salt, 64).toString('hex')
  return hash
}

const adminEmails = [
  'ydeniaux@images-et-reseaux.com',
  'ydeniaux@yartis.fr'
]

const defaultPassword = 'admin123' // Change this in production!

try {
  for (const email of adminEmails) {
    // Check if user already exists
    const existing = db.prepare('SELECT id FROM consultants WHERE email = ?').get(email)
    
    if (existing) {
      console.log(`✅ User ${email} already exists, updating roles...`)
      const consultantId = existing.id
      
      // Remove existing roles
      db.prepare('DELETE FROM user_roles WHERE consultant_id = ?').run(consultantId)
      
      // Add admin and consultant roles
      db.prepare(`
        INSERT INTO user_roles (consultant_id, role)
        VALUES (?, 'admin')
      `).run(consultantId)
      
      db.prepare(`
        INSERT INTO user_roles (consultant_id, role)
        VALUES (?, 'consultant')
      `).run(consultantId)
      
      console.log(`   Roles updated for ${email}`)
    } else {
      // Generate salt and hash password
      const salt = randomBytes(16).toString('hex')
      const passwordHash = hashPassword(defaultPassword, salt)

      // Insert consultant
      const result = db.prepare(`
        INSERT INTO consultants (email, password_hash, salt, first_name, last_name, job_title)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(email, passwordHash, salt, 'Yann', 'DENIAUX', 'Administrateur')

      const consultantId = result.lastInsertRowid

      // Assign admin and consultant roles
      db.prepare(`
        INSERT INTO user_roles (consultant_id, role)
        VALUES (?, 'admin')
      `).run(consultantId)

      db.prepare(`
        INSERT INTO user_roles (consultant_id, role)
        VALUES (?, 'consultant')
      `).run(consultantId)

      console.log(`✅ Admin created: ${email}`)
      console.log(`   Password: ${defaultPassword}`)
      console.log(`   ID: ${consultantId}`)
    }
  }
  
  console.log('\n✅ All admin accounts processed!')
  console.log(`\n⚠️  IMPORTANT: Change the default password (${defaultPassword}) in production!`)
} catch (error) {
  console.error('❌ Error creating admins:', error.message)
  process.exit(1)
} finally {
  closeDb()
}

