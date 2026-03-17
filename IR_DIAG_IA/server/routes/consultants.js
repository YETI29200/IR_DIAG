// Consultant management routes (admin only)
import { getDb } from '../db/index.js'
import { scryptSync, randomBytes } from 'crypto'
import { isAdmin } from '../utils/roles.js'

function hashPassword(password, salt) {
  return scryptSync(password, salt, 64).toString('hex')
}

export default async function consultantRoutes(req, res, url, body) {
  const db = getDb()

  // Get consultant ID from query params (for authorization)
  const adminId = url.searchParams.get('adminId')
  if (!adminId) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'adminId required for authorization' }))
    return
  }

  const adminIdNum = parseInt(adminId)
  if (!isAdmin(adminIdNum)) {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Unauthorized: Admin access required' }))
    return
  }

  // GET /api/consultants - List all consultants
  if (req.method === 'GET' && url.pathname === '/api/consultants') {
    try {
      const consultants = db.prepare(`
        SELECT 
          c.id,
          c.email,
          c.first_name,
          c.last_name,
          c.job_title,
          c.phone,
          c.suspended,
          c.created_at,
          GROUP_CONCAT(ur.role) as roles
        FROM consultants c
        LEFT JOIN user_roles ur ON c.id = ur.consultant_id
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `).all()

      const formatted = consultants.map(c => ({
        id: c.id,
        email: c.email,
        firstName: c.first_name,
        lastName: c.last_name,
        jobTitle: c.job_title,
        phone: c.phone,
        suspended: Boolean(c.suspended),
        createdAt: c.created_at,
        roles: c.roles ? c.roles.split(',') : []
      }))

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(formatted))
    } catch (error) {
      console.error('Error listing consultants:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
    return
  }

  // POST /api/consultants - Create new consultant
  if (req.method === 'POST' && url.pathname === '/api/consultants') {
    const { email, password, firstName, lastName, jobTitle, phone } = body || {}

    if (!email || !password || !firstName || !lastName) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Email, password, first name, and last name required' }))
      return
    }

    try {
      const salt = randomBytes(16).toString('hex')
      const passwordHash = hashPassword(password, salt)

      const result = db.transaction(() => {
        // Create consultant
        const consultantResult = db.prepare(`
          INSERT INTO consultants (email, password_hash, salt, first_name, last_name, job_title, phone, suspended)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        `).run(email, passwordHash, salt, firstName, lastName, jobTitle || null, phone || null)

        const consultantId = consultantResult.lastInsertRowid

        // Assign consultant role by default
        db.prepare(`
          INSERT INTO user_roles (consultant_id, role)
          VALUES (?, 'consultant')
        `).run(consultantId)

        return consultantId
      })()

      const newConsultant = db.prepare(`
        SELECT 
          c.id,
          c.email,
          c.first_name,
          c.last_name,
          c.job_title,
          c.phone,
          c.suspended,
          c.created_at,
          GROUP_CONCAT(ur.role) as roles
        FROM consultants c
        LEFT JOIN user_roles ur ON c.id = ur.consultant_id
        WHERE c.id = ?
        GROUP BY c.id
      `).get(result)

      res.writeHead(201, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        id: newConsultant.id,
        email: newConsultant.email,
        firstName: newConsultant.first_name,
        lastName: newConsultant.last_name,
        jobTitle: newConsultant.job_title,
        phone: newConsultant.phone,
        suspended: Boolean(newConsultant.suspended),
        createdAt: newConsultant.created_at,
        roles: newConsultant.roles ? newConsultant.roles.split(',') : []
      }))
    } catch (error) {
      if (error.message.includes('UNIQUE constraint')) {
        res.writeHead(409, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Email already exists' }))
      } else {
        console.error('Error creating consultant:', error)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Internal server error' }))
      }
    }
    return
  }

  // PUT /api/consultants/:id/suspend - Suspend/unsuspend consultant
  if (req.method === 'PUT' && url.pathname.match(/^\/api\/consultants\/\d+\/suspend$/)) {
    const consultantId = parseInt(url.pathname.split('/').pop())
    const { suspended } = body || {}

    if (typeof suspended !== 'boolean') {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'suspended (boolean) required' }))
      return
    }

    try {
      // Check if consultant exists
      const consultant = db.prepare(`
        SELECT id, email FROM consultants WHERE id = ?
      `).get(consultantId)

      if (!consultant) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Consultant not found' }))
        return
      }

      // Don't allow suspending admins
      if (isAdmin(consultantId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Cannot suspend an administrator' }))
        return
      }

      db.prepare(`
        UPDATE consultants
        SET suspended = ?
        WHERE id = ?
      `).run(suspended ? 1 : 0, consultantId)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ 
        success: true, 
        message: suspended ? 'Consultant suspendu' : 'Consultant réactivé',
        consultantId 
      }))
    } catch (error) {
      console.error('Error suspending consultant:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
    return
  }

  // DELETE /api/consultants/:id - Delete consultant and reassign missions to admin
  if (req.method === 'DELETE' && url.pathname.match(/^\/api\/consultants\/\d+$/)) {
    const consultantId = parseInt(url.pathname.split('/').pop())

    try {
      // Check if consultant exists
      const consultant = db.prepare(`
        SELECT id, email FROM consultants WHERE id = ?
      `).get(consultantId)

      if (!consultant) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Consultant not found' }))
        return
      }

      // Don't allow deleting admins
      if (isAdmin(consultantId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Cannot delete an administrator' }))
        return
      }

      // Get admin ID (the one making the request)
      // Reassign all missions to the admin
      const reassignedMissions = db.prepare(`
        UPDATE missions
        SET consultant_id = ?
        WHERE consultant_id = ?
      `).run(adminIdNum, consultantId)

      console.log(`[Consultants API] Reassigned ${reassignedMissions.changes} missions from consultant ${consultantId} to admin ${adminIdNum}`)

      // Delete consultant (cascade will handle user_roles)
      db.prepare(`
        DELETE FROM consultants WHERE id = ?
      `).run(consultantId)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ 
        success: true, 
        message: 'Consultant supprimé et missions réaffectées à l\'administrateur',
        consultantId,
        reassignedMissions: reassignedMissions.changes
      }))
    } catch (error) {
      console.error('Error deleting consultant:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
    return
  }

  // PUT /api/consultants/:id/reassign - Reassign missions to another consultant
  if (req.method === 'PUT' && url.pathname.match(/^\/api\/consultants\/\d+\/reassign$/)) {
    const consultantId = parseInt(url.pathname.split('/').pop())
    const { newConsultantId } = body || {}

    if (!newConsultantId) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'newConsultantId required' }))
      return
    }

    try {
      // Check if both consultants exist
      const oldConsultant = db.prepare(`SELECT id FROM consultants WHERE id = ?`).get(consultantId)
      const newConsultant = db.prepare(`SELECT id FROM consultants WHERE id = ?`).get(newConsultantId)

      if (!oldConsultant || !newConsultant) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Consultant not found' }))
        return
      }

      // Reassign missions
      const result = db.prepare(`
        UPDATE missions
        SET consultant_id = ?
        WHERE consultant_id = ?
      `).run(newConsultantId, consultantId)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ 
        success: true, 
        message: `${result.changes} mission(s) réaffectée(s)`,
        reassignedMissions: result.changes
      }))
    } catch (error) {
      console.error('Error reassigning missions:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
}

