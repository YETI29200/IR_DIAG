// Questionnaire routes
import { getDb } from '../db/index.js'
import { randomBytes } from 'crypto'
import { invalidateCache } from '../utils/cache.js'

function generateAnonymousToken() {
  return randomBytes(16).toString('hex')
}

export default async function questionnaireRoutes(req, res, url, body) {
  const db = getDb()

  console.log(`[Questionnaire] Route called: ${req.method} ${url.pathname}`)

  // GET /api/questionnaire/:type/:missionId?service=CODE
  const routeMatch = url.pathname.match(/^\/api\/questionnaire\/(flash|full)\/\d+$/)
  if (req.method === 'GET' && routeMatch) {
    const parts = url.pathname.split('/')
    const type = parts[3]
    const missionId = parseInt(parts[4])
    const serviceCode = url.searchParams.get('service')

    console.log(`[Questionnaire] GET request: type=${type}, missionId=${missionId}, serviceCode=${serviceCode}`)

    try {
      // Vérifier d'abord si la mission existe (peu importe son statut)
      const missionCheck = db.prepare(`
        SELECT id, organization_name, questionnaire_type, status
        FROM missions
        WHERE id = ?
      `).get(missionId)

      if (!missionCheck) {
        console.log(`[Questionnaire] Mission ${missionId} not found`)
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Mission introuvable', missionId }))
        return
      }

      // Récupérer la mission : on autorise 'active' et 'draft' (pour test)
      const mission = db.prepare(`
        SELECT id, organization_name, questionnaire_type, status
        FROM missions
        WHERE id = ? AND status IN ('in_progress', 'preparation')
      `).get(missionId)

      if (!mission) {
        console.log(`[Questionnaire] Mission ${missionId} exists but is not active (status: ${missionCheck.status})`)
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          error: 'Mission non disponible',
          message: `La mission n'est pas active (statut: ${missionCheck.status}). Seules les missions "en cours" peuvent être complétées.`,
          missionId,
          currentStatus: missionCheck.status
        }))
        return
      }

      // Get service if code provided
      let service = null
      if (serviceCode) {
        service = db.prepare(`
          SELECT id, name, code
          FROM mission_services
          WHERE mission_id = ? AND code = ?
        `).get(missionId, serviceCode)
      }

      // Resolve contact from contact token (cid param) for per-contact tracking
      const contactToken = url.searchParams.get('cid')
      let resolvedContact = null
      if (contactToken) {
        resolvedContact = db.prepare(`
          SELECT id, first_name, last_name, email
          FROM mission_contacts
          WHERE contact_token = ? AND mission_id = ?
        `).get(contactToken, missionId)
      }

      // Get or create session
      let session = null
      const existingToken = url.searchParams.get('token')

      if (existingToken) {
        session = db.prepare(`
          SELECT id, mission_id, service_id, contact_id, anonymous_token, started_at, completed_at
          FROM sessions
          WHERE anonymous_token = ? AND mission_id = ?
        `).get(existingToken, missionId)
      }

      // Also check if this contact already has a session (resume)
      if (!session && resolvedContact) {
        session = db.prepare(`
          SELECT id, mission_id, service_id, contact_id, anonymous_token, started_at, completed_at
          FROM sessions
          WHERE contact_id = ? AND mission_id = ?
        `).get(resolvedContact.id, missionId)
      }

      if (!session) {
        const token = generateAnonymousToken()
        const result = db.prepare(`
          INSERT INTO sessions (mission_id, service_id, contact_id, anonymous_token)
          VALUES (?, ?, ?, ?)
        `).run(missionId, service?.id || null, resolvedContact?.id || null, token)

        session = {
          id: result.lastInsertRowid,
          missionId,
          serviceId: service?.id || null,
          contactId: resolvedContact?.id || null,
          anonymousToken: token,
          startedAt: new Date().toISOString(),
          completedAt: null
        }
      }

      // Get questions from JSON file
      const questions = getQuestionsForType(type)
      const scaleLabels = getScaleLabels()

      // Get existing responses
      const responses = db.prepare(`
        SELECT question_id, dimension, answer_value
        FROM responses
        WHERE session_id = ?
      `).all(session.id)

      const responseMap = {}
      responses.forEach(r => {
        responseMap[r.question_id] = r.answer_value
      })

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        mission: {
          id: mission.id,
          organizationName: mission.organization_name,
          questionnaireType: mission.questionnaire_type
        },
        service: service ? {
          id: service.id,
          name: service.name,
          code: service.code
        } : null,
        session: {
          id: session.id,
          token: session.anonymousToken,
          startedAt: session.startedAt,
          completedAt: session.completedAt
        },
        questions,
        scaleLabels,
        responses: responseMap
      }))
    } catch (error) {
      console.error('Error loading questionnaire:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
    return
  }

  // POST /api/questionnaire/response (save answer)
  if (req.method === 'POST' && url.pathname === '/api/questionnaire/response') {
    const { sessionId, questionId, dimension, answerValue } = body || {}

    if (!sessionId || !questionId || dimension === undefined || answerValue === undefined) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'sessionId, questionId, dimension, and answerValue required' }))
      return
    }

    // Validate answer value (0-4: 0-3 for agreement scale, 4 for "Ne sais pas")
    if (answerValue < 0 || answerValue > 4) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'answerValue must be between 0 and 4' }))
      return
    }

    try {
      // Get mission_id and service_id from session for cache invalidation
      const session = db.prepare(`
        SELECT mission_id, service_id FROM sessions WHERE id = ?
      `).get(sessionId)

      if (!session) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Session not found' }))
        return
      }

      db.prepare(`
        INSERT INTO responses (session_id, question_id, dimension, answer_value)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(session_id, question_id) DO UPDATE SET
          answer_value = excluded.answer_value,
          created_at = datetime('now')
      `).run(sessionId, questionId, dimension, answerValue)

      // Invalidate cache for this mission (and optionally service)
      invalidateCache(db, session.mission_id, session.service_id || null)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true }))
    } catch (error) {
      console.error('Error saving response:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
    return
  }

  // POST /api/questionnaire/complete
  if (req.method === 'POST' && url.pathname === '/api/questionnaire/complete') {
    const { sessionId, isAnonymous } = body || {}

    if (!sessionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'sessionId required' }))
      return
    }

    try {
      // Get mission_id and service_id from session for cache invalidation
      const session = db.prepare(`
        SELECT s.mission_id, s.service_id, m.questionnaire_type
        FROM sessions s
        JOIN missions m ON s.mission_id = m.id
        WHERE s.id = ?
      `).get(sessionId)

      if (!session) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Session not found' }))
        return
      }

      // Mark session as completed and save anonymity choice
      db.prepare(`
        UPDATE sessions
        SET completed_at = datetime('now'),
            is_anonymous = ?
        WHERE id = ?
      `).run(isAnonymous ? 1 : 0, sessionId)

      // Invalidate cache when session is completed (results may change)
      invalidateCache(db, session.mission_id, session.service_id || null)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true }))
    } catch (error) {
      console.error('Error completing session:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
    return
  }


  // Route not matched
  console.log(`[Questionnaire] Route not matched: ${req.method} ${url.pathname}`)
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found', path: url.pathname }))
}

// Load questions from JSON file
import { getFullQuestions, getFlashQuestions, getScaleLabels } from '../utils/questions.js'

function getQuestionsForType(type) {
  if (type === 'flash') {
    return getFlashQuestions()
  } else {
    return getFullQuestions()
  }
}

