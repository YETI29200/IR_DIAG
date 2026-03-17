// Debug service-level aggregation
import { getDb } from '../db/index.js'

const missionId = process.argv[2] || '5'
const db = getDb()

// Get mission
const mission = db.prepare('SELECT * FROM missions WHERE id = ?').get(missionId)
if (!mission) {
  console.error('Mission not found')
  process.exit(1)
}

// Get first service
const service = db.prepare('SELECT * FROM mission_services WHERE mission_id = ? LIMIT 1').get(missionId)
if (!service) {
  console.error('No service found')
  process.exit(1)
}

// Get all sessions for this service
const sessions = db.prepare(`
  SELECT id FROM sessions WHERE mission_id = ? AND service_id = ?
`).all(missionId, service.id)

console.log(`\n📊 Debug agrégation pour ${service.name}`)
console.log(`Nombre de sessions: ${sessions.length}`)

// Calculate individual scores per session
const individualScores = {}
sessions.forEach(session => {
  const responses = db.prepare(`
    SELECT dimension, answer_value
    FROM responses
    WHERE session_id = ? AND answer_value != 4
  `).all(session.id)
  
  // Group by dimension
  const byDim = {}
  responses.forEach(r => {
    if (!byDim[r.dimension]) {
      byDim[r.dimension] = { total: 0, count: 0 }
    }
    byDim[r.dimension].total += r.answer_value
    byDim[r.dimension].count += 1
  })
  
  // Calculate score per dimension for this session
  Object.keys(byDim).forEach(dim => {
    const data = byDim[dim]
    const avgValue = data.total / data.count
    const score = (avgValue / 3) * 100
    
    if (!individualScores[dim]) {
      individualScores[dim] = []
    }
    individualScores[dim].push(score)
  })
})

// Show individual scores for first dimension
const firstDim = Object.keys(individualScores)[0]
if (firstDim) {
  console.log(`\n${firstDim} - Scores individuels:`)
  individualScores[firstDim].forEach((score, idx) => {
    console.log(`  Session ${idx + 1}: ${score.toFixed(2)}%`)
  })
  const avgIndividual = individualScores[firstDim].reduce((a, b) => a + b, 0) / individualScores[firstDim].length
  console.log(`  Moyenne individuelle: ${avgIndividual.toFixed(2)}%`)
}

// Now calculate service-level score (aggregate all responses)
const allResponses = db.prepare(`
  SELECT r.dimension, r.answer_value
  FROM responses r
  JOIN sessions s ON r.session_id = s.id
  WHERE s.mission_id = ? AND s.service_id = ? AND r.answer_value != 4
`).all(missionId, service.id)

const byDimService = {}
allResponses.forEach(r => {
  if (!byDimService[r.dimension]) {
    byDimService[r.dimension] = { total: 0, count: 0 }
  }
  byDimService[r.dimension].total += r.answer_value
  byDimService[r.dimension].count += 1
})

if (firstDim && byDimService[firstDim]) {
  const data = byDimService[firstDim]
  const avgValue = data.total / data.count
  const score = (avgValue / 3) * 100
  const avgIndividual = individualScores[firstDim].reduce((a, b) => a + b, 0) / individualScores[firstDim].length
  console.log(`\n${firstDim} - Score service (agrégé):`)
  console.log(`  Total: ${data.total}, Count: ${data.count}`)
  console.log(`  Average value: ${avgValue.toFixed(2)}`)
  console.log(`  Score service: ${score.toFixed(2)}%`)
  console.log(`  Moyenne individuelle: ${avgIndividual.toFixed(2)}%`)
  console.log(`  Différence: ${(score - avgIndividual).toFixed(2)}%`)
}

