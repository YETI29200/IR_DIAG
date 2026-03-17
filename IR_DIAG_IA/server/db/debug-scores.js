// Debug score calculation
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

// Get responses for this service
const responses = db.prepare(`
  SELECT r.question_id, r.dimension, r.answer_value, r.session_id
  FROM responses r
  JOIN sessions s ON r.session_id = s.id
  WHERE s.mission_id = ? AND s.service_id = ?
`).all(missionId, service.id)

console.log(`\n📊 Debug calcul des scores pour ${service.name}`)
console.log(`Total réponses: ${responses.length}`)

// Group by dimension
const byDimension = {}
responses.forEach(r => {
  if (r.answer_value !== 4) { // Exclude "Ne sais pas"
    if (!byDimension[r.dimension]) {
      byDimension[r.dimension] = { total: 0, count: 0, values: [] }
    }
    byDimension[r.dimension].total += r.answer_value
    byDimension[r.dimension].count += 1
    byDimension[r.dimension].values.push(r.answer_value)
  }
})

// Calculate scores
Object.keys(byDimension).slice(0, 3).forEach(dim => {
  const data = byDimension[dim]
  const averageValue = data.total / data.count
  const score = (averageValue / 3) * 100
  const finalScore = Math.min(100, Math.max(0, score))
  
  console.log(`\n${dim}:`)
  console.log(`  Total: ${data.total}`)
  console.log(`  Count: ${data.count}`)
  console.log(`  Average value: ${averageValue.toFixed(2)}`)
  console.log(`  Score calculé: ${score.toFixed(2)}%`)
  console.log(`  Final score: ${finalScore.toFixed(2)}%`)
  console.log(`  Sample values: ${data.values.slice(0, 10).join(', ')}`)
})

