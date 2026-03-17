// Health check endpoint
import { getDb } from '../db/index.js'

export default async function healthRoutes(req, res, url, body) {
  if (req.method === 'GET' && url.pathname === '/api/health') {
    try {
      const db = getDb()
      // Test database connection
      db.prepare('SELECT 1').get()
      
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString()
      }))
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        status: 'error',
        database: 'disconnected',
        error: error.message
      }))
    }
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
}

