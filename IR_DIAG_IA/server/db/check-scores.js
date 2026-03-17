// Script to check calculated scores
import { getDb, closeDb } from './index.js'
import { getAllDimensions, getDimensionName } from '../utils/questions.js'

const db = getDb()

function calculateDimensionScores(responses, questionnaireType) {
  const dimensionTotals = {}
  const dimensionCounts = {}
  const maxScores = {}

  const allDimensions = getAllDimensions()
  const questionsPerDimension = questionnaireType === 'flash' ? 1 : 8
  const maxPointsPerQuestion = 3

  if (questionnaireType === 'flash') {
    const flashDimensions = allDimensions.slice(0, 5)
    flashDimensions.forEach(dim => {
      maxScores[dim.id] = maxPointsPerQuestion
      dimensionTotals[dim.id] = 0
      dimensionCounts[dim.id] = 0
    })
  } else {
    allDimensions.forEach(dim => {
      maxScores[dim.id] = maxPointsPerQuestion
      dimensionTotals[dim.id] = 0
      dimensionCounts[dim.id] = 0
    })
  }

  responses.forEach(response => {
    const dim = response.dimension
    const value = response.answer_value
    if (dimensionTotals[dim] !== undefined && value !== 4) {
      dimensionTotals[dim] += value
      dimensionCounts[dim] += 1
    }
  })

  const scores = []
  Object.keys(dimensionTotals).forEach(dimension => {
    const total = dimensionTotals[dimension]
    const count = dimensionCounts[dimension]
    const maxValuePerAnswer = maxScores[dimension]
    
    const averageValue = count > 0 ? total / count : 0
    const score = maxValuePerAnswer > 0 ? (averageValue / maxValuePerAnswer) * 100 : 0
    const finalScore = Math.min(100, Math.max(0, score))
    
    scores.push({
      dimension,
      score: Math.round(finalScore * 10) / 10
    })
  })

  return scores
}

const missionId = process.argv[2] || 5

console.log(`\n📊 Analyse des scores calculés pour la mission ${missionId}\n`)

// Get mission
const mission = db.prepare(`
  SELECT id, organization_name, questionnaire_type
  FROM missions
  WHERE id = ?
`).get(missionId)

if (!mission) {
  console.log(`❌ Mission ${missionId} introuvable`)
  process.exit(1)
}

// Get services
const services = db.prepare(`
  SELECT id, name, code
  FROM mission_services
  WHERE mission_id = ?
`).all(missionId)

for (const service of services) {
  console.log(`\n🔍 Service: ${service.name}`)
  
  // Get responses for this service
  const responses = db.prepare(`
    SELECT r.question_id, r.dimension, r.answer_value, r.session_id
    FROM responses r
    JOIN sessions s ON r.session_id = s.id
    WHERE s.mission_id = ? AND s.service_id = ?
  `).all(missionId, service.id)
  
  console.log(`  Total réponses: ${responses.length}`)
  
  // Calculate scores
  const scores = calculateDimensionScores(responses, mission.questionnaire_type)
  
  console.log(`  Scores calculés:`)
  scores.forEach(score => {
    // Check actual responses for this dimension
    const dimResponses = responses.filter(r => r.dimension === score.dimension && r.answer_value !== 4)
    const avgValue = dimResponses.length > 0 ? dimResponses.reduce((sum, r) => sum + r.answer_value, 0) / dimResponses.length : 0
    const expectedScore = (avgValue / 3) * 100
    
    console.log(`    ${score.dimension}: ${score.score}% (attendu: ${expectedScore.toFixed(1)}%, moyenne: ${avgValue.toFixed(2)}/3, ${dimResponses.length} réponses)`)
  })
  
  // Global score
  const globalScore = scores.length > 0
    ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
    : 0
  console.log(`  Score global: ${globalScore.toFixed(1)}%`)
}

closeDb()

