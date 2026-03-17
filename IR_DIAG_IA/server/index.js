// Minimal Node.js HTTP server (no frameworks)
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, existsSync, createReadStream, statSync } from 'fs'
import { getDb, closeDb } from './db/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env file (if exists)
const envPath = join(__dirname, '..', '.env')
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
        process.env[key.trim()] = value
      }
    }
  })
  console.log('Environment variables loaded from .env')
} else {
  console.log('No .env file found. Using default environment variables.')
}

const PORT = process.env.PORT || 3000

// Initialize database tables
const db = getDb()
try {
  // Create timeline_steps table if it doesn't exist
  const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='timeline_steps'").get()

  if (!tableInfo) {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS timeline_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mission_id INTEGER NOT NULL,
        step_number INTEGER NOT NULL,
        step_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        planned_date TEXT,
        completed_date TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(mission_id, step_number, step_type),
        FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
      )
    `).run()

    db.prepare('CREATE INDEX IF NOT EXISTS idx_timeline_steps_mission ON timeline_steps(mission_id)').run()
    console.log('✅ Table "timeline_steps" created successfully')
  }

  // Force a WAL checkpoint on startup to merge any outstanding changes from the -wal file
  db.pragma('wal_checkpoint(FULL)');
  console.log('📦 Database Checkpoint performed on startup');
} catch (error) {
  console.error('Error initializing database or performing checkpoint:', error)
}

// Import route handlers
import authRoutes from './routes/auth.js'
import missionRoutes from './routes/missions.js'
import questionnaireRoutes from './routes/questionnaire.js'
import resultsRoutes from './routes/results.js'
import healthRoutes from './routes/health.js'
import emailRoutes from './routes/emails.js'
import consultantRoutes from './routes/consultants.js'
import exportRoutes from './routes/export.js'
import flashRoutes from './routes/flash.js'

const server = createServer(async (req, res) => {
  // CORS headers - Allow both ports 5173 and 5175
  const origin = req.headers.origin || ''
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:5175']
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  const url = new URL(req.url, `http://${req.headers.host}`)
  const path = url.pathname

  // Parse JSON body with size limit to prevent memory issues
  const MAX_BODY_SIZE = 10 * 1024 * 1024 // 10MB limit
  let body = ''
  let bodySize = 0
  let bodyError = null

  req.on('data', chunk => {
    if (bodyError) return // Stop processing if we already have an error

    const chunkSize = chunk.length
    bodySize += chunkSize

    if (bodySize > MAX_BODY_SIZE) {
      bodyError = new Error('Request body too large')
      res.writeHead(413, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Request body too large. Maximum size: 10MB' }))
      return
    }

    body += chunk.toString()
  })

  req.on('error', (error) => {
    console.error('[Server] Error reading request body:', error)
    if (!res.headersSent) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Error reading request body', message: error.message }))
    }
  })

  req.on('end', async () => {
    // Skip if we already sent an error response
    if (bodyError || res.headersSent) {
      return
    }

    console.log(`[${new Date().toISOString()}] ${req.method} ${path}`)
    let parsedBody = null
    if (body && req.headers['content-type']?.includes('application/json')) {
      try {
        parsedBody = JSON.parse(body)
        // Log body size for debugging (but not the full body for large requests)
        if (bodySize > 10000) {
          console.log(`[Server] Parsed large body (${bodySize} bytes)`)
        } else {
          console.log('[Server] Parsed body:', parsedBody)
        }
      } catch (e) {
        console.error('[Server] Error parsing JSON:', e.message)
        console.error('[Server] Body preview:', body.substring(0, 200))
        if (!res.headersSent) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid JSON', message: e.message }))
        }
        return
      }
    }

    // Route handling
    try {
      if (path === '/api/admin/consolidated-data') {
        const consultantId = url.searchParams.get('consultantId')
        if (!consultantId) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'consultantId required' }))
          return
        }

        const consultantIdNum = parseInt(consultantId)
        const { isAdmin } = await import('./utils/roles.js')
        if (!isAdmin(consultantIdNum)) {
          res.writeHead(403, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Admin access required for consolidated data' }))
          return
        }

        const missions = db.prepare(`
          SELECT m.id, m.consultant_id as consultantId, m.organization_name as organizationName, m.sector, m.employees, 
                 m.questionnaire_type as questionnaireType, m.status, m.created_at as createdAt, m.maturity_percent as maturityPercent,
                 c.first_name || ' ' || c.last_name as consultantName,
                 (SELECT COUNT(*) FROM mission_contacts WHERE mission_id = m.id) as contactsCount,
                 (SELECT COUNT(*) FROM sessions WHERE mission_id = m.id AND completed_at IS NOT NULL) as completedCount,
                 (SELECT COUNT(*) FROM mission_services WHERE mission_id = m.id) as servicesCount
          FROM missions m
          LEFT JOIN consultants c ON m.consultant_id = c.id
          ORDER BY m.created_at DESC
        `).all()

        const flashPublic = db.prepare(`
          SELECT id, organization_name as organizationName, sector, employees, 
                 'flash' as questionnaireType, 'active' as status, created_at as createdAt, global_score as maturityPercent,
                 'Public (Automatique)' as consultantName, 'public' as source,
                 1 as contactsCount, 1 as completedCount, 0 as servicesCount
          FROM flash_diagnostics
          ORDER BY created_at DESC
        `).all()

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          missions: missions.map(m => ({ ...m, source: 'consultant' })),
          flashPublic
        }))
        return
      }

      if (path.startsWith('/api/auth')) {
        console.log('Routing to authRoutes')
        await authRoutes(req, res, url, parsedBody)
      } else if (path.startsWith('/api/missions')) {
        console.log('Routing to missionRoutes')
        await missionRoutes(req, res, url, parsedBody)
      } else if (path.startsWith('/api/questionnaire')) {
        console.log('Routing to questionnaireRoutes')
        await questionnaireRoutes(req, res, url, parsedBody)
      } else if (path.startsWith('/api/results')) {
        console.log('Routing to resultsRoutes')
        await resultsRoutes(req, res, url, parsedBody)
      } else if (path.startsWith('/api/emails')) {
        console.log('Routing to emailRoutes')
        await emailRoutes(req, res, url, parsedBody)
      } else if (path.startsWith('/api/health')) {
        console.log('Routing to healthRoutes')
        await healthRoutes(req, res, url, parsedBody)
      } else if (path.startsWith('/api/consultants')) {
        console.log('Routing to consultantRoutes')
        await consultantRoutes(req, res, url, parsedBody)
      } else if (path.startsWith('/api/export')) {
        console.log('Routing to exportRoutes')
        await exportRoutes(req, res, url, parsedBody)
      } else if (path.startsWith('/api/flash')) {
        console.log('Routing to flashRoutes')
        await flashRoutes(req, res, url, parsedBody)
      } else if (req.method === 'GET' && !path.startsWith('/api')) {
        // Try to serve static file
        // Sanitize path to prevent directory traversal
        const safePath = path.replace(/^(\.\.[\/\\])+/, '')

        let filePath = join(__dirname, '..', 'client', 'dist', safePath === '/' ? 'index.html' : safePath.startsWith('/') ? safePath.substring(1) : safePath)

        // Safety check to prevent directory traversal
        if (!filePath.startsWith(join(__dirname, '..', 'client', 'dist'))) {
          res.writeHead(403); res.end('Forbidden'); return
        }

        if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
          // Fallback to index.html for SPA (Single Page Application)
          // Only if we accept html
          if (req.headers.accept && req.headers.accept.includes('text/html')) {
            filePath = join(__dirname, '..', 'client', 'dist', 'index.html')
          } else {
            // If requesting a specific asset that doesn't exist, return 404
            res.writeHead(404); res.end('Not Found'); return
          }
        }

        if (existsSync(filePath)) {
          const ext = filePath.split('.').pop().toLowerCase()
          const mimeTypes = {
            'html': 'text/html',
            'js': 'text/javascript',
            'css': 'text/css',
            'json': 'application/json',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'svg': 'image/svg+xml',
            'ico': 'image/x-icon',
            'woff': 'font/woff',
            'woff2': 'font/woff2',
            'ttf': 'font/ttf'
          }
          const contentType = mimeTypes[ext] || 'application/octet-stream'

          res.writeHead(200, { 'Content-Type': contentType })
          createReadStream(filePath).pipe(res)
        } else {
          console.log('Static file not found (and no index.html fallback):', filePath)
          res.writeHead(404); res.end('Not Found')
        }
      } else {
        console.log('Route not found:', path)
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Not found', path }))
      }
    } catch (error) {
      console.error('Server error:', error)
      console.error('Error stack:', error.stack)
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }))
      }
    }
  })
})

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  console.error('Error stack:', error.stack)
  // Don't exit, keep server running
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // Don't exit, keep server running
})

server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
  console.log(`✅ Health check available at http://localhost:${PORT}/api/health`)
}).on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`)
    console.error(`   Please stop the other process or change the PORT in .env`)
    console.error(`   To find the process: netstat -ano | findstr :${PORT}`)
  } else {
    console.error(`❌ Server error:`, error.message)
  }
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  closeDb()
  server.close()
})

process.on('SIGINT', () => {
  closeDb()
  server.close()
  process.exit(0)
})
