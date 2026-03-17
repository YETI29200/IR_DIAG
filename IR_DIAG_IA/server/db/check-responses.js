// Script to check response distribution
import { getDb, closeDb } from './index.js'

const db = getDb()

const missionId = process.argv[2] || 5

console.log(`\n📊 Analyse des réponses pour la mission ${missionId}\n`)

// Distribution des valeurs de réponses
const distribution = db.prepare(`
  SELECT r.answer_value, COUNT(*) as count
  FROM responses r
  JOIN sessions s ON r.session_id = s.id
  WHERE s.mission_id = ? AND r.answer_value != 4
  GROUP BY r.answer_value
  ORDER BY r.answer_value
`).all(missionId)

console.log('Distribution des réponses:')
let total = 0
distribution.forEach(r => {
  total += r.count
  const percent = ((r.count / total) * 100).toFixed(1)
  console.log(`  Valeur ${r.answer_value}: ${r.count} réponses`)
})
console.log(`  Total: ${total} réponses\n`)

// Moyenne globale
const avg = db.prepare(`
  SELECT AVG(r.answer_value) as avg
  FROM responses r
  JOIN sessions s ON r.session_id = s.id
  WHERE s.mission_id = ? AND r.answer_value != 4
`).get(missionId)

console.log(`Moyenne globale: ${avg.avg.toFixed(2)}/3 = ${((avg.avg / 3) * 100).toFixed(1)}%\n`)

// Par service
const services = db.prepare(`
  SELECT s.id, s.name, s.code
  FROM mission_services s
  WHERE s.mission_id = ?
`).all(missionId)

console.log('Par service:')
for (const service of services) {
  const serviceAvg = db.prepare(`
    SELECT AVG(r.answer_value) as avg
    FROM responses r
    JOIN sessions s ON r.session_id = s.id
    WHERE s.mission_id = ? AND s.service_id = ? AND r.answer_value != 4
  `).get(missionId, service.id)
  
  const score = ((serviceAvg.avg / 3) * 100).toFixed(1)
  console.log(`  ${service.name}: moyenne ${serviceAvg.avg.toFixed(2)}/3 = ${score}%`)
}

closeDb()

