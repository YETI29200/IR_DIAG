// Authentication routes
import { getDb } from '../db/index.js'
import { scryptSync, randomBytes, createHmac } from 'crypto'
import { getConsultantRoles } from '../utils/roles.js'

// Helper functions
function hashPassword(password, salt) {
  return scryptSync(password, salt, 64).toString('hex')
}

function verifyPassword(password, hash, salt) {
  const computedHash = hashPassword(password, salt)
  return computedHash === hash
}

function generateToken() {
  return randomBytes(32).toString('hex')
}

function signToken(token) {
  const secret = process.env.SESSION_SECRET || 'default-secret-change-in-production'
  return createHmac('sha256', secret).update(token).digest('hex')
}

function createSession(consultantId) {
  const db = getDb()
  const token = generateToken()
  const signedToken = signToken(token)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  // Store session in memory (in production, use Redis or database)
  // For simplicity, we'll return the token and validate it by checking consultant exists
  return {
    token: signedToken,
    expiresAt: expiresAt.toISOString()
  }
}

export default async function authRoutes(req, res, url, body) {
  // POST /api/auth/login
  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    const { email, password } = body || {}

    if (!email || !password) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Email and password required' }))
      return
    }

    try {
      const db = getDb()
      const consultant = db.prepare(`
        SELECT id, email, password_hash, salt, first_name, last_name, job_title, phone, signature_html, created_at, suspended
        FROM consultants
        WHERE email = ?
      `).get(email)

      if (!consultant || !verifyPassword(password, consultant.password_hash, consultant.salt)) {
        res.writeHead(401, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid credentials' }))
        return
      }

      // Check if consultant is suspended
      if (consultant.suspended) {
        res.writeHead(403, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Compte suspendu. Veuillez contacter l\'administrateur.' }))
        return
      }

      const session = createSession(consultant.id)
      const roles = getConsultantRoles(consultant.id)
      
      console.log(`[Auth] Login successful for ${email}, ID: ${consultant.id}, Roles:`, roles)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        token: session.token,
        consultant: {
          id: consultant.id,
          email: consultant.email,
          firstName: consultant.first_name,
          lastName: consultant.last_name,
          jobTitle: consultant.job_title,
          phone: consultant.phone,
          signatureHtml: consultant.signature_html,
          createdAt: consultant.created_at,
          roles: roles
        },
        expiresAt: session.expiresAt
      }))
    } catch (error) {
      console.error('Login error:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
    return
  }

  // POST /api/auth/signup
  if (req.method === 'POST' && url.pathname === '/api/auth/signup') {
    const { email, password, firstName, lastName, jobTitle, phone } = body || {}

    if (!email || !password || !firstName || !lastName) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Email, password, first name, and last name required' }))
      return
    }

    try {
      const db = getDb()
      const salt = randomBytes(16).toString('hex')
      const passwordHash = hashPassword(password, salt)

      const result = db.prepare(`
        INSERT INTO consultants (email, password_hash, salt, first_name, last_name, job_title, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(email, passwordHash, salt, firstName, lastName, jobTitle || null, phone || null)

      // Assign consultant role by default
      db.prepare(`
        INSERT INTO user_roles (consultant_id, role)
        VALUES (?, 'consultant')
      `).run(result.lastInsertRowid)

      const session = createSession(result.lastInsertRowid)
      const roles = getConsultantRoles(result.lastInsertRowid)

      res.writeHead(201, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        token: session.token,
        consultant: {
          id: result.lastInsertRowid,
          email,
          firstName,
          lastName,
          jobTitle,
          phone,
          roles: roles
        },
        expiresAt: session.expiresAt
      }))
    } catch (error) {
      if (error.message.includes('UNIQUE constraint')) {
        res.writeHead(409, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Email already exists' }))
      } else {
        console.error('Signup error:', error)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Internal server error' }))
      }
    }
    return
  }

  // GET /api/auth/me (verify token)
  if (req.method === 'GET' && url.pathname === '/api/auth/me') {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Unauthorized' }))
      return
    }

    const token = authHeader.substring(7)
    // In a real implementation, we'd validate the token signature
    // For now, we'll use a simple approach: extract consultant ID from token if stored
    // This is a simplified version - in production, use proper JWT or session storage

    try {
      // For this implementation, we'll need to store sessions in DB
      // For now, return a placeholder - this will be enhanced
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ message: 'Token validation placeholder' }))
    } catch (error) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid token' }))
    }
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
}

