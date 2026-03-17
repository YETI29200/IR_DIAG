// Results and scoring routes
import { getDb } from '../db/index.js'
import { generateRecommendations, generateRecommendationsWithParams, isOpenAIConfigured, normalizeDimensionKey } from '../utils/openai.js'
import { getAllDimensions, getDimensionName } from '../utils/questions.js'
import { getCachedResults, setCachedResults, ensureCacheTable, invalidateCache } from '../utils/cache.js'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function calculateDimensionScores(responses, questionnaireType) {
  // OPTIMIZED: Reduced logging for performance
  // console.log(`\n[DEBUG calculateDimensionScores] DÉBUT - ${responses.length} réponses, type: ${questionnaireType}`)

  const dimensionTotals = {} // Somme des valeurs 0-3
  const dimensionCounts = {} // Nombre de réponses 0-3
  const dimensionNSPCounts = {} // Nombre de réponses "Ne sais pas" (4)
  const dimensionTotalCounts = {} // Nombre total de réponses (0-4)
  const maxScores = {}

  // Get dimensions from JSON file (cache this if called multiple times)
  const allDimensions = getAllDimensions()

  // Number of questions per dimension
  const questionsPerDimension = questionnaireType === 'flash' ? 1 : 8
  const maxPointsPerQuestion = 3 // 0-3 scale (4 = "Ne sais pas" est mesuré séparément)

  if (questionnaireType === 'flash') {
    // 5 dimensions, 1 question each, max 3 points per question (0-3 scale)
    const flashDimensions = allDimensions.slice(0, 5)
    flashDimensions.forEach(dim => {
      maxScores[dim.id] = maxPointsPerQuestion
      dimensionTotals[dim.id] = 0
      dimensionCounts[dim.id] = 0
      dimensionNSPCounts[dim.id] = 0
      dimensionTotalCounts[dim.id] = 0
    })
  } else {
    // 10 dimensions, 8 questions each, max 3 points per question (0-3 scale)
    allDimensions.forEach(dim => {
      maxScores[dim.id] = maxPointsPerQuestion
      dimensionTotals[dim.id] = 0
      dimensionCounts[dim.id] = 0
      dimensionNSPCounts[dim.id] = 0
      dimensionTotalCounts[dim.id] = 0
    })
  }

  // Calculate totals - SÉPARER scores (0-3) et "Ne sais pas" (4)
  responses.forEach(response => {
    // NORMALIZATION: Important to group 'data' and 'donnees' etc.
    const dim = normalizeDimensionKey(response.dimension)
    const value = response.answer_value

    if (dim && dimensionTotals[dim] !== undefined) {
      dimensionTotalCounts[dim] += 1 // Toutes les réponses comptent

      if (value === 4) {
        // "Ne sais pas" : compté séparément
        dimensionNSPCounts[dim] += 1
      } else {
        // Score 0-3 : utilisé pour le calcul du score
        dimensionTotals[dim] += value
        dimensionCounts[dim] += 1
      }
    }
  })

  // Calculate scores and levels
  // Score = average answer value (0-3) / max answer value * 100
  // Taux NSP = nombre de "Ne sais pas" / nombre total de réponses * 100
  // CRITICAL: Return ALL expected dimensions, even if they have no responses
  const scores = []

  // Get the list of expected dimensions based on questionnaire type
  const expectedDimensions = questionnaireType === 'flash'
    ? allDimensions.slice(0, 5).map(d => d.id)
    : allDimensions.map(d => d.id) // All 10 dimensions for complete questionnaire

  // Process ALL expected dimensions, not just those with responses
  expectedDimensions.forEach(dimension => {
    const total = dimensionTotals[dimension] || 0 // Somme des valeurs 0-3 (0 if no responses)
    const count = dimensionCounts[dimension] || 0 // Nombre de réponses 0-3 (0 if no responses)
    const nspCount = dimensionNSPCounts[dimension] || 0 // Nombre de "Ne sais pas"
    const totalCount = dimensionTotalCounts[dimension] || 0 // Nombre total de réponses
    const maxValuePerAnswer = maxScores[dimension] || maxPointsPerQuestion // 3 (max points per answer)

    // Calculate average answer value (sur réponses 0-3 uniquement)
    const averageValue = count > 0 ? total / count : 0

    // Convert to percentage: (average / max) * 100
    // averageValue is between 0 and 3, so score will be between 0 and 100%
    const score = maxValuePerAnswer > 0 ? (averageValue / maxValuePerAnswer) * 100 : 0

    // Ensure score doesn't exceed 100%
    const finalScore = Math.min(100, Math.max(0, score))

    // Calculate "Ne sais pas" rate
    const nspRate = totalCount > 0 ? (nspCount / totalCount) * 100 : 0

    let level = 'low'
    if (finalScore >= 70) level = 'high'
    else if (finalScore >= 40) level = 'medium'

    scores.push({
      dimension,
      dimensionTitle: getDimensionName(dimension),
      score: Math.round(finalScore * 10) / 10, // Round to 1 decimal, capped at 100
      nspRate: Math.round(nspRate * 10) / 10, // Taux "Ne sais pas" en %
      level,
      maxScore: maxValuePerAnswer,
      questionCount: questionsPerDimension
    })
  })

  // Verify we have the correct number of dimensions
  const expectedCount = questionnaireType === 'flash' ? 5 : 10
  if (scores.length !== expectedCount) {
    console.error(`[ERROR] calculateDimensionScores: Expected ${expectedCount} dimensions, got ${scores.length}`)
    console.error(`[ERROR] Missing dimensions:`, expectedDimensions.filter(d => !scores.find(s => s.dimension === d)))
  }

  return scores
}

// Calculate median score for each dimension based on individual respondent scores
function calculateMedianScores(responses, questionnaireType) {
  const maxPointsPerQuestion = 3 // 0-3 scale (excluding "Ne sais pas" = 4)

  // Group responses by session_id and dimension to calculate individual scores
  const sessionDimensionScores = {} // { sessionId: { dimension: [values] } }

  responses.forEach(response => {
    const sessionId = response.session_id || 'unknown'
    // NORMALIZATION: Important for grouping
    const dim = normalizeDimensionKey(response.dimension)
    const value = response.answer_value

    // Exclude "Ne sais pas" (value 4) from scoring
    if (dim && value !== 4) {
      if (!sessionDimensionScores[sessionId]) {
        sessionDimensionScores[sessionId] = {}
      }
      if (!sessionDimensionScores[sessionId][dim]) {
        sessionDimensionScores[sessionId][dim] = []
      }
      sessionDimensionScores[sessionId][dim].push(value)
    }
  })

  // Calculate score per session per dimension (average of answers for that dimension)
  const dimensionScoresBySession = {} // { dimension: [scores] }

  Object.keys(sessionDimensionScores).forEach(sessionId => {
    Object.keys(sessionDimensionScores[sessionId]).forEach(dimension => {
      const values = sessionDimensionScores[sessionId][dimension]
      const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length
      const score = (avgValue / maxPointsPerQuestion) * 100
      const finalScore = Math.min(100, Math.max(0, score))

      if (!dimensionScoresBySession[dimension]) {
        dimensionScoresBySession[dimension] = []
      }
      dimensionScoresBySession[dimension].push(finalScore)
    })
  })

  // OPTIMIZED: Calculate median for each dimension
  // La médiane est la valeur qui sépare les données en deux parties égales
  // Elle ne peut être calculée que s'il y a au moins une réponse
  const medianScores = []
  Object.keys(dimensionScoresBySession).forEach(dimension => {
    const scores = dimensionScoresBySession[dimension]

    // Si pas de scores, on ne peut pas calculer de médiane
    if (scores.length === 0) {
      return // Skip this dimension
    }

    // OPTIMIZED: Sort only once when needed (for median calculation)
    const sortedScores = scores.sort((a, b) => a - b)

    let median
    if (sortedScores.length % 2 === 0) {
      // Nombre pair de scores : moyenne des deux valeurs centrales
      const mid1 = sortedScores[Math.floor(sortedScores.length / 2) - 1]
      const mid2 = sortedScores[Math.floor(sortedScores.length / 2)]
      median = (mid1 + mid2) / 2
    } else {
      // Nombre impair de scores : valeur centrale
      median = sortedScores[Math.floor(sortedScores.length / 2)]
    }

    // La médiane peut être 0 si toutes les réponses sont à 0, mais elle existe
    medianScores.push({
      dimension,
      median: Math.round(median * 10) / 10 // Round to 1 decimal
    })
  })

  return medianScores
}

// Generate static recommendations based on scores
function generateStaticRecommendations(dimensionScores, questionnaireType) {
  const recommendations = []

  // Find dimensions with low scores
  const lowScores = dimensionScores.filter(s => s.level === 'low')
  const mediumScores = dimensionScores.filter(s => s.level === 'medium')

  if (lowScores.length > 0) {
    const dim = lowScores[0]
    const dimensionMap = {
      ambition: { title: 'Développer l\'ambition IA', desc: 'Créer une vision claire et partagée de l\'IA comme levier stratégique dans votre organisation.' },
      pilotage: { title: 'Renforcer le pilotage', desc: 'Mettre en place un cadre de pilotage et des moyens dédiés pour les projets IA.' },
      organisation: { title: 'Optimiser l\'organisation', desc: 'Adapter l\'organisation pour favoriser la collaboration et l\'expérimentation autour de l\'IA.' },
      culture: { title: 'Favoriser la culture IA', desc: 'Développer une culture d\'innovation et d\'adoption de l\'IA dans l\'organisation.' },
      donnees: { title: 'Valoriser les données', desc: 'Mettre en place une stratégie de gestion et de valorisation des données pour l\'IA.' },
      cas_usage: { title: 'Identifier des cas d\'usage', desc: 'Explorer et identifier des cas d\'usage IA concrets et à forte valeur ajoutée.' },
      ecosysteme: { title: 'Développer l\'écosystème', desc: 'Construire un réseau de partenaires et d\'acteurs pour accompagner vos projets IA.' },
      expertise: { title: 'Développer l\'expertise', desc: 'Investir dans la formation et le développement des compétences IA de vos équipes.' },
      technologie: { title: 'Moderniser la technologie', desc: 'Évaluer et moderniser votre infrastructure technologique pour supporter l\'IA.' },
      mise_en_oeuvre: { title: 'Structurer la mise en œuvre', desc: 'Mettre en place des processus et méthodes pour conduire efficacement les projets IA.' },
      strategy: { title: 'Renforcer la stratégie IA', desc: 'Développer une vision claire et partagée de l\'IA dans votre organisation.' },
      governance: { title: 'Améliorer la gouvernance', desc: 'Mettre en place des processus de gouvernance des données et de l\'IA.' },
      skills: { title: 'Développer les compétences', desc: 'Investir dans la formation et le développement des compétences IA de vos équipes.' },
      usage: { title: 'Accélérer l\'usage', desc: 'Identifier et déployer des cas d\'usage IA concrets dans vos processus métier.' },
      measurement: { title: 'Mettre en place des mesures', desc: 'Définir des KPIs et mesurer l\'impact de vos initiatives IA.' },
      data: { title: 'Améliorer la qualité des données', desc: 'Mettre en place une stratégie de gestion et de qualité des données.' },
      technology: { title: 'Moderniser l\'infrastructure', desc: 'Évaluer et moderniser votre infrastructure technologique pour l\'IA.' },
      ethics: { title: 'Intégrer l\'éthique', desc: 'Développer un cadre éthique pour l\'utilisation responsable de l\'IA.' },
      innovation: { title: 'Stimuler l\'innovation', desc: 'Créer des espaces et processus pour l\'expérimentation et l\'innovation IA.' }
    }

    const rec = dimensionMap[dim.dimension]
    if (rec) {
      recommendations.push({
        dimension: dim.dimension,
        title: rec.title,
        synthesis: rec.desc, // Use description as synthesis for static ones
        description: rec.desc
      })
    }
  }

  if (mediumScores.length > 0 && recommendations.length < 3) {
    const dim = mediumScores[0]
    recommendations.push({
      dimension: dim.dimension,
      title: `Optimiser la dimension ${dim.dimension}`,
      synthesis: `L'organisation présente une base solide sur la thématique ${dim.dimension}.`,
      description: `Vous avez une base solide. Passez au niveau supérieur en approfondissant cette dimension.`
    })
  }

  // Default recommendations if none generated
  if (recommendations.length === 0) {
    recommendations.push({
      dimension: 'global',
      title: 'Maintenir l\'excellence',
      synthesis: 'Votre organisation montre une excellente maturité globale en IA.',
      description: 'Votre organisation montre une bonne maturité. Continuez à innover et à mesurer l\'impact.'
    })
  }

  return recommendations
}

export default async function resultsRoutes(req, res, url, body) {
  console.log('[Results Routes] Request received:', req.method, url.pathname)
  const db = getDb()

  // Ensure cache table exists (safety check)
  ensureCacheTable(db)

  console.log('resultsRoutes called:', req.method, url.pathname)

  // PUT /api/results/recommendations - Save modified recommendations (check this FIRST)
  if (req.method === 'PUT' && url.pathname === '/api/results/recommendations') {
    console.log('PUT /api/results/recommendations - body:', body)
    if (!body || !body.missionId) {
      console.error('Missing missionId in body:', body)
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'missionId and recommendations required', received: body }))
      return
    }

    try {
      const { missionId, serviceId, recommendations } = body

      // Get or create recommendation record
      let rec = db.prepare(`
        SELECT id FROM recommendations
        WHERE mission_id = ? AND (service_id = ? OR (service_id IS NULL AND ? IS NULL))
        ORDER BY created_at DESC
        LIMIT 1
      `).get(missionId, serviceId || null, serviceId || null)

      let recId
      if (rec) {
        recId = rec.id
        // Update existing recommendation
        db.prepare(`
          UPDATE recommendations
          SET payload_json = ?, status = 'draft'
          WHERE id = ?
        `).run(JSON.stringify(recommendations), recId)
      } else {
        // Create new recommendation
        const result = db.prepare(`
          INSERT INTO recommendations (mission_id, service_id, payload_json, status)
          VALUES (?, ?, ?, 'draft')
        `).run(missionId, serviceId || null, JSON.stringify(recommendations))
        recId = result.lastInsertRowid
      }

      // Get current version number
      const maxVersion = db.prepare(`
        SELECT COALESCE(MAX(version_number), 0) as max_version
        FROM recommendations_history
        WHERE recommendation_id = ?
      `).get(recId)

      const nextVersion = (maxVersion?.max_version || 0) + 1

      // Save to history
      db.prepare(`
        INSERT INTO recommendations_history (recommendation_id, payload_json, version_number, change_description)
        VALUES (?, ?, ?, ?)
      `).run(recId, JSON.stringify(recommendations), nextVersion, `Modification version ${nextVersion}`)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        success: true,
        recommendationId: recId,
        version: nextVersion,
        modifiedAt: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error saving recommendations:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        error: 'Internal server error',
        message: error.message || 'Une erreur est survenue lors de la sauvegarde'
      }))
    }
    return
  }

  // POST /api/results/generate-pdf
  if (req.method === 'POST' && url.pathname === '/api/results/generate-pdf') {
    if (!body || !body.missionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'missionId required' }))
      return
    }

    try {
      const { missionId, serviceId } = body

      // 1. Get Mission & Organization info
      const mission = db.prepare('SELECT organization_name, questionnaire_type FROM missions WHERE id = ?').get(missionId)
      if (!mission) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Mission not found' }))
        return
      }

      // 2. Get Scores
      let responses = []
      if (serviceId) {
        responses = db.prepare(`
          SELECT r.answer_value, r.dimension 
          FROM responses r 
          JOIN sessions s ON r.session_id = s.id 
          WHERE s.mission_id = ? AND s.service_id = ?
        `).all(missionId, serviceId)
      } else {
        responses = db.prepare(`
          SELECT r.answer_value, r.dimension 
          FROM responses r 
          JOIN sessions s ON r.session_id = s.id 
          WHERE s.mission_id = ?
        `).all(missionId)
      }

      // We extract raw scores (0-100) for the histogram
      const dimensionScores = calculateDimensionScores(responses, mission.questionnaire_type)
      const dataValues = dimensionScores.map(d => d.score)

      // 3. Get Saved Recommendations
      const recRecord = db.prepare(`
        SELECT payload_json FROM recommendations 
        WHERE mission_id = ? AND (service_id = ? OR (service_id IS NULL AND ? IS NULL))
        ORDER BY created_at DESC LIMIT 1
      `).get(missionId, serviceId || null, serviceId || null)

      let recommendationsText = "Aucune recommandation générée."
      if (recRecord) {
        const payload = JSON.parse(recRecord.payload_json)
        recommendationsText = payload.map(r => `• ${r.title}\n${r.synthesis || r.description}`).join('\n\n')
      }

      // 4. Call Python Script
      const pythonScriptPath = path.join(__dirname, '..', 'utils', 'pdf_generator.py')
      const outputPath = path.join(__dirname, '..', '..', 'temp_report.pdf')

      const labels = dimensionScores.map(d => d.dimensionTitle || d.dimension)
      const recommendationsData = recRecord ? JSON.parse(recRecord.payload_json) : []

      const inputData = JSON.stringify({
        scores: dataValues,
        labels: labels,
        recommendations_data: recommendationsData,
        organization: mission.organization_name
      })

      const pyProcess = spawn('python', [pythonScriptPath, '--json', inputData, '--out', outputPath])

      let pyOutput = ''
      pyProcess.stdout.on('data', (data) => { pyOutput += data.toString() })
      pyProcess.stderr.on('data', (data) => { console.error(`[Python PDF Error] ${data}`) })

      pyProcess.on('close', (code) => {
        if (code === 0 && pyOutput.includes('SUCCESS:')) {
          const pdfPath = pyOutput.split('SUCCESS:')[1].trim()

          if (fs.existsSync(pdfPath)) {
            const stat = fs.statSync(pdfPath)
            res.writeHead(200, {
              'Content-Type': 'application/json', // We'll return the path or trigger download
              'Content-Disposition': `attachment; filename="Rapport_${mission.organization_name.replace(/\s+/g, '_')}.pdf"`,
              'Content-Length': stat.size
            })
            const readStream = fs.createReadStream(pdfPath)
            readStream.pipe(res)

            // Clean up after stream ends
            readStream.on('end', () => {
              try { fs.unlinkSync(pdfPath) } catch (e) { }
            })
          } else {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Generated PDF file not found' }))
          }
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Python script failed', details: pyOutput }))
        }
      })

    } catch (error) {
      console.error('Error generating PDF:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: error.message }))
    }
    return
  }

  // POST /api/results/regenerate - Regenerate recommendations with AI (check this first)
  if (req.method === 'POST' && url.pathname === '/api/results/regenerate') {
    console.log('[Regenerate] ==========================================')
    console.log('[Regenerate] POST /api/results/regenerate - Request received')
    console.log('[Regenerate] Body received:', body ? JSON.stringify(body).substring(0, 200) : 'null')
    console.log('[Regenerate] ==========================================')

    if (!body || !body.missionId) {
      console.error('[Regenerate] ❌ Missing missionId in body:', body)
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'missionId required', received: body }))
      return
    }

    console.log(`[Regenerate] Processing request for missionId=${body.missionId}, serviceId=${body.serviceId || 'GLOBAL'}`)


    // Set a timeout to prevent the request from hanging indefinitely
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.error('[Regenerate] ❌❌❌ TIMEOUT: Request took more than 300 seconds')
        res.writeHead(504, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          error: 'Request timeout',
          message: 'La requête a pris trop de temps (plus de 5 minutes). Veuillez réessayer.'
        }))
      }
    }, 300000) // 5 minutes timeout


    try {
      const { missionId, serviceId, language, tone, detailLevel, priorityAxis, additionalContext } = body
      console.log('[Regenerate] Regenerating recommendations for mission:', missionId, 'service:', serviceId)
      console.log('[Regenerate] Additional context received:', additionalContext)
      console.log('[Regenerate] Context length:', additionalContext?.length || 0)

      // Get mission
      const mission = db.prepare(`
        SELECT id, organization_name, questionnaire_type
        FROM missions
        WHERE id = ?
      `).get(missionId)

      if (!mission) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Mission not found' }))
        return
      }

      // Get dimension scores
      let dimensionScores = []

      if (serviceId) {
        // For a specific service, calculate scores from service responses
        const serviceResponses = db.prepare(`
          SELECT r.question_id, r.dimension, r.answer_value, r.session_id
          FROM responses r
          JOIN sessions s ON r.session_id = s.id
          WHERE s.mission_id = ? AND s.service_id = ?
        `).all(missionId, serviceId)
        dimensionScores = calculateDimensionScores(serviceResponses, mission.questionnaire_type)

        // Calculate and add median scores
        const medianScores = calculateMedianScores(serviceResponses, mission.questionnaire_type)
        // OPTIMIZED: Use Map for O(1) lookup instead of find() which is O(n)
        const medianMap = new Map(medianScores.map(m => [m.dimension, m.median]))
        dimensionScores = dimensionScores.map(score => {
          return {
            ...score,
            median: medianMap.get(score.dimension) ?? 0
          }
        })
      } else {
        // OPTIMIZED: For GLOBAL recommendations, get all responses in one query
        const missionServices = db.prepare(`
          SELECT id FROM mission_services WHERE mission_id = ?
        `).all(missionId)

        // Get all responses for all services in one query (avoid N+1 problem)
        const allServiceResponses = db.prepare(`
          SELECT r.question_id, r.dimension, r.answer_value, r.session_id, s.service_id
          FROM responses r
          JOIN sessions s ON r.session_id = s.id
          WHERE s.mission_id = ?
        `).all(missionId)

        // Group responses by service_id
        const responsesByService = {}
        allServiceResponses.forEach(response => {
          const serviceId = response.service_id
          if (!responsesByService[serviceId]) {
            responsesByService[serviceId] = []
          }
          responsesByService[serviceId].push(response)
        })

        const allServiceDimensionScores = []
        for (const service of missionServices) {
          const serviceResponses = responsesByService[service.id] || []
          const serviceScores = calculateDimensionScores(serviceResponses, mission.questionnaire_type)

          // Add median to scores - OPTIMIZED: Use Map for O(1) lookup
          const medianScores = calculateMedianScores(serviceResponses, mission.questionnaire_type)
          const medianMap = new Map(medianScores.map(m => [m.dimension, m.median]))
          const scoresWithMedian = serviceScores.map(score => {
            return {
              ...score,
              median: medianMap.get(score.dimension) ?? 0
            }
          })
          allServiceDimensionScores.push(scoresWithMedian)
        }

        // Calculate average score for each dimension across all services
        // CRITICAL: Include ALL expected dimensions, even if some services don't have responses for them
        const allDimensions = new Set()
        allServiceDimensionScores.forEach(scores => {
          scores.forEach(score => allDimensions.add(score.dimension))
        })

        // Get expected dimensions based on questionnaire type
        const allExpectedDimensions = getAllDimensions()
        const expectedDimensions = mission.questionnaire_type === 'flash'
          ? allExpectedDimensions.slice(0, 5).map(d => d.id)
          : allExpectedDimensions.map(d => d.id) // All 10 dimensions for complete questionnaire

        // Ensure all expected dimensions are in the set
        expectedDimensions.forEach(dim => allDimensions.add(dim))

        dimensionScores = []
        allDimensions.forEach(dimension => {
          const dimensionScoresList = allServiceDimensionScores
            .map(scores => scores.find(s => s.dimension === dimension))
            .filter(s => s !== undefined)

          if (dimensionScoresList.length > 0) {
            // Calculate average from services that have this dimension
            const avgScore = Math.round(
              dimensionScoresList.reduce((sum, s) => sum + s.score, 0) / dimensionScoresList.length
            )
            const finalScore = Math.min(100, Math.max(0, avgScore))
            const avgLevel = finalScore >= 70 ? 'high' : finalScore >= 40 ? 'medium' : 'low'

            dimensionScores.push({
              dimension,
              score: finalScore,
              level: avgLevel,
              current: finalScore,
              max: 100
            })
          } else {
            // Dimension expected but no service has responses for it - include with score 0
            dimensionScores.push({
              dimension,
              score: 0,
              level: 'low',
              current: 0,
              max: 100
            })
          }
        })

        // Verify we have the correct number of dimensions
        const expectedCount = mission.questionnaire_type === 'flash' ? 5 : 10
        if (dimensionScores.length !== expectedCount) {
          console.error(`[ERROR] Global dimensionScores: Expected ${expectedCount} dimensions, got ${dimensionScores.length}`)
          console.error(`[ERROR] Missing dimensions:`, expectedDimensions.filter(d => !dimensionScores.find(s => s.dimension === d)))
        }
      }

      // Get previous modifications to enrich AI prompt
      let previousModifications = []
      const prevRec = db.prepare(`
        SELECT payload_json FROM recommendations
        WHERE mission_id = ? AND (service_id = ? OR (service_id IS NULL AND ? IS NULL))
        ORDER BY created_at DESC
        LIMIT 1
      `).get(missionId, serviceId || null, serviceId || null)

      if (prevRec) {
        try {
          previousModifications = JSON.parse(prevRec.payload_json)
        } catch (e) {
          console.error('Error parsing previous recommendations:', e)
        }
      }

      // CRITICAL: Verify dimensionScores contains all expected dimensions
      const expectedDimensionCount = mission.questionnaire_type === 'flash' ? 5 : 10
      console.log('[Regenerate] ==========================================')
      console.log('[Regenerate] ===== VÉRIFICATION DES DIMENSIONS =====')
      console.log('[Regenerate] Questionnaire type:', mission.questionnaire_type)
      console.log('[Regenerate] Dimensions attendues:', expectedDimensionCount)
      console.log('[Regenerate] Dimensions reçues:', dimensionScores.length)
      console.log('[Regenerate] Dimensions présentes:', dimensionScores.map(s => s.dimension).join(', '))

      if (dimensionScores.length !== expectedDimensionCount) {
        console.error(`[Regenerate] ❌❌❌ ERREUR CRITIQUE: ${dimensionScores.length} dimensions au lieu de ${expectedDimensionCount} ❌❌❌`)
        const allExpectedDims = getAllDimensions()
        const expectedDims = mission.questionnaire_type === 'flash'
          ? allExpectedDims.slice(0, 5).map(d => d.id)
          : allExpectedDims.map(d => d.id)
        const missingDims = expectedDims.filter(d => !dimensionScores.find(s => s.dimension === d))
        console.error('[Regenerate] Dimensions manquantes:', missingDims)

        // Add missing dimensions with score 0
        missingDims.forEach(dim => {
          dimensionScores.push({
            dimension: dim,
            score: 0,
            level: 'low',
            current: 0,
            max: 100
          })
        })
        console.log('[Regenerate] ✅ Dimensions manquantes ajoutées avec score 0')
        console.log('[Regenerate] Nouveau nombre de dimensions:', dimensionScores.length)
      } else {
        console.log('[Regenerate] ✅ Nombre de dimensions correct')
      }
      console.log('[Regenerate] ==========================================')

      // Generate recommendations with AI (enriched with previous modifications)
      console.log('[Regenerate] ===== PARAMÈTRES REÇUS DU FRONTEND =====')
      console.log('[Regenerate] language:', language, '(type:', typeof language, ')')
      console.log('[Regenerate] tone:', tone)
      console.log('[Regenerate] detailLevel:', detailLevel)
      console.log('[Regenerate] priorityAxis:', priorityAxis)
      console.log('[Regenerate] additionalContext:', additionalContext || '(vide)')
      console.log('[Regenerate] OpenAI configured?', isOpenAIConfigured())
      if (!isOpenAIConfigured()) {
        console.log('[Regenerate] ⚠️ ATTENTION: OPENAI_API_KEY n\'est pas configurée')
        console.log('[Regenerate] Les recommandations seront générées en mode statique (fallback)')
      }
      console.log('[Regenerate] ==========================================')

      if (isOpenAIConfigured()) {
        try {
          console.log('[Regenerate] Appel de generateRecommendationsWithParams avec:')
          console.log('[Regenerate]   - language:', language || '(non spécifié, détection automatique)')
          console.log('[Regenerate]   - tone:', tone)
          console.log('[Regenerate]   - detailLevel:', detailLevel)
          console.log('[Regenerate]   - priorityAxis:', priorityAxis)
          console.log('[Regenerate]   - additionalContext:', additionalContext || '(vide)')

          // STRICT: Ensure language is properly passed - if provided, use it.
          // We trust the frontend to send a valid string or the user to know what they are doing.
          const languageToUse = (language && typeof language === 'string' && language.trim().length > 0)
            ? language.trim()
            : 'fr'

          console.log('[Regenerate] ⚠️ LANGUAGE PARAMETER PROCESSING:')
          console.log('[Regenerate]   - Original language from body:', language, '(type:', typeof language, ')')
          console.log('[Regenerate]   - Processed language to use:', languageToUse)
          console.log('[Regenerate]   - Is English?', languageToUse === 'en')

          console.log('[Regenerate] 🚀 Calling OpenAI with timeout safety...')
          const aiRecommendations = await generateRecommendationsWithParams(
            dimensionScores,
            mission.questionnaire_type,
            mission.organization_name,
            {
              language: languageToUse,
              tone,
              detailLevel,
              priorityAxis,
              additionalContext,
              previousModifications
            }
          )
          console.log('[Regenerate] ✅ generateRecommendationsWithParams returned:', aiRecommendations ? `${aiRecommendations.length} recommendations` : 'null')

          if (aiRecommendations && aiRecommendations.length > 0) {
            // DEDUPLICATION: Ensure one recommendation per dimension
            const seenDimensions = new Set()
            const uniqueRecommendations = aiRecommendations.filter(r => {
              const dim = normalizeDimensionKey(r.dimension)
              if (seenDimensions.has(dim)) return false
              seenDimensions.add(dim)
              return true
            })

            console.log(`[Regenerate] ✅ Deduplicated AI recommendations: ${aiRecommendations.length} -> ${uniqueRecommendations.length}`)

            console.log('[Regenerate] ✅ AI recommendations details:', {
              count: uniqueRecommendations.length,
              dimensions: uniqueRecommendations.map((r) => r.dimension),
              firstRec: uniqueRecommendations[0] ? {
                dimension: uniqueRecommendations[0].dimension,
                title: uniqueRecommendations[0].title,
                hasDescription: !!uniqueRecommendations[0].description,
                descriptionPreview: uniqueRecommendations[0].description?.substring(0, 100)
              } : null
            })

            const recommendationsToSave = uniqueRecommendations

            // Save new recommendations
            let recId
            const existingRec = db.prepare(`
              SELECT id FROM recommendations
              WHERE mission_id = ? AND (service_id = ? OR (service_id IS NULL AND ? IS NULL))
              ORDER BY created_at DESC
              LIMIT 1
            `).get(missionId, serviceId || null, serviceId || null)

            if (existingRec) {
              recId = existingRec.id
              db.prepare(`
                UPDATE recommendations
                SET payload_json = ?, status = 'draft'
                WHERE id = ?
              `).run(JSON.stringify(recommendationsToSave), recId)
              console.log('[Regenerate] ✅ Updated existing recommendation record:', recId)
            } else {
              const result = db.prepare(`
                INSERT INTO recommendations (mission_id, service_id, payload_json, status)
                VALUES (?, ?, ?, 'draft')
              `).run(missionId, serviceId || null, JSON.stringify(recommendationsToSave))
              recId = result.lastInsertRowid
              console.log('[Regenerate] ✅ Created new recommendation record:', recId)
            }

            // CRITICAL: Invalidate cache so GET /api/results returns the new AI recommendations immediately
            console.log('[Regenerate] 🔄 Invalidating cache for mission:', missionId)
            invalidateCache(db, missionId, serviceId || null)

            // Save to history
            const maxVersion = db.prepare(`
              SELECT COALESCE(MAX(version_number), 0) as max_version
              FROM recommendations_history
              WHERE recommendation_id = ?
            `).get(recId)

            const nextVersion = (maxVersion?.max_version || 0) + 1

            db.prepare(`
              INSERT INTO recommendations_history (recommendation_id, payload_json, version_number, change_description)
              VALUES (?, ?, ?, ?)
            `).run(recId, JSON.stringify(recommendationsToSave), nextVersion, `Régénération IA - Version ${nextVersion}`)

            // CRITICAL: Log dimensions just before sending to frontend
            console.log('[API] Sending recommendations to frontend - dimensions:', recommendationsToSave.map((r) => {
              const dim = r.dimension
              return { value: dim, type: typeof dim, stringified: JSON.stringify(dim) }
            }))

            clearTimeout(timeout)
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({
              success: true,
              recommendations: recommendationsToSave,
              version: nextVersion
            }))
            return
          }
        } catch (error) {
          console.error('[Regenerate] ❌❌❌ ERROR generating AI recommendations ❌❌❌')
          console.error('[Regenerate] Error message:', error.message)
          console.error('[Regenerate] Error stack:', error.stack)
          console.error('[Regenerate] Error name:', error.name)
          if (error.originalError) {
            console.error('[Regenerate] Original error:', error.originalError.message)
          }

          // Extract user-friendly message
          let userMessage = error.message || 'Erreur inconnue lors de la génération des recommandations'

          // Provide more specific error messages
          if (userMessage.includes('API error')) {
            userMessage = 'Erreur avec l\'API OpenAI. Vérifiez votre clé API et vos quotas.'
          } else if (userMessage.includes('parse JSON')) {
            userMessage = 'Erreur de format dans la réponse OpenAI. Réessayez.'
          } else if (userMessage.includes('No content')) {
            userMessage = 'OpenAI n\'a pas retourné de contenu. Vérifiez votre configuration.'
          }

          // Send error response to frontend (explicit flag for OpenAI-related errors)
          clearTimeout(timeout)
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({
              error: 'Error generating AI recommendations',
              message: userMessage,
              openaiError: true,
              details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }))
          }
          return
        }
      }

      // Fallback to static if AI not configured or failed
      const staticRecommendations = generateStaticRecommendations(dimensionScores, mission.questionnaire_type)

      clearTimeout(timeout)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        success: true,
        recommendations: staticRecommendations,
        source: 'static'
      }))
    } catch (error) {
      clearTimeout(timeout)
      console.error('[Regenerate] ❌❌❌ ERROR regenerating recommendations ❌❌❌')
      console.error('[Regenerate] Error message:', error.message)
      console.error('[Regenerate] Error stack:', error.stack)
      console.error('[Regenerate] Error name:', error.name)
      // Make sure we always send a response
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          error: 'Internal server error',
          message: error.message || 'Une erreur est survenue lors de la régénération'
        }))
      }
    }
    return
  }


  // GET /api/results?session=ID&mission=ID
  if (req.method === 'GET' && url.pathname === '/api/results') {
    const sessionId = url.searchParams.get('session')
    const missionId = url.searchParams.get('mission')

    if (!sessionId && !missionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'session or mission parameter required' }))
      return
    }

    try {
      // CACHE: Check cache for mission-level results (not for individual sessions)
      if (missionId && !sessionId) {
        const cached = getCachedResults(db, parseInt(missionId), null)
        if (cached) {
          console.log('[Cache] ✅ Returning cached results for mission:', missionId)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(cached))
          return
        }
        console.log('[Cache] ❌ Cache miss or stale for mission:', missionId)
      }

      let responses = []
      let mission = null
      let session = null
      const services = [] // Declare services at the top level
      let allServiceDimensionScores = [] // For calculating global average

      if (sessionId && !missionId) {
        session = db.prepare(`
          SELECT id, mission_id, service_id, anonymous_token, started_at, completed_at
          FROM sessions
          WHERE id = ?
                `).get(sessionId)

        if (!session) {
          res.writeHead(404, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Session not found' }))
          return
        }

        mission = db.prepare(`
          SELECT id, organization_name, questionnaire_type
          FROM missions
          WHERE id = ?
                `).get(session.mission_id)

        responses = db.prepare(`
          SELECT question_id, dimension, answer_value
          FROM responses
          WHERE session_id = ?
                `).all(sessionId)
      } else if (missionId) {
        // If sessionId is also present, we might want to highlight it, 
        // but we definitely want to load the full mission results.
        if (sessionId) {
          session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId)
        }

        mission = db.prepare(`
          SELECT id, organization_name, questionnaire_type
          FROM missions
          WHERE id = ?
                `).get(missionId)

        if (!mission) {
          res.writeHead(404, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Mission not found' }))
          return
        }

        // OPTIMIZED: Get all responses in one query instead of N queries (N+1 problem)
        const missionServices = db.prepare(`
          SELECT id, name, code
          FROM mission_services
          WHERE mission_id = ?
                `).all(missionId)

        // Get all responses for all services in one query
        const allServiceResponses = db.prepare(`
          SELECT r.question_id, r.dimension, r.answer_value, r.session_id, s.service_id
          FROM responses r
          JOIN sessions s ON r.session_id = s.id
          WHERE s.mission_id = ?
                `).all(missionId)

        // Group responses by service_id for faster processing
        const responsesByService = {}
        allServiceResponses.forEach(response => {
          const serviceId = response.service_id
          if (!responsesByService[serviceId]) {
            responsesByService[serviceId] = []
          }
          responsesByService[serviceId].push(response)
        })

        for (const service of missionServices) {
          // Use pre-grouped responses instead of querying again
          const serviceResponses = responsesByService[service.id] || []

          const serviceDimensionScores = calculateDimensionScores(serviceResponses, mission.questionnaire_type)

          // OPTIMIZED: Reduced logging for performance
          // Calculate median scores for this service
          const medianScores = calculateMedianScores(serviceResponses, mission.questionnaire_type)

          // Calculate global score from RAW DATA (0-3) and global NSP rate
          // OPTIMIZED: Reduced logging
          let globalTotal = 0 // Somme des valeurs 0-3
          let globalCount = 0 // Nombre de réponses 0-3
          let globalNSPCount = 0 // Nombre de "Ne sais pas"
          let globalTotalCount = 0 // Nombre total de réponses

          // Sum all raw answer values (0-3) across all dimensions, count NSP separately
          serviceResponses.forEach(response => {
            const value = response.answer_value
            globalTotalCount += 1

            if (value === 4) {
              globalNSPCount += 1
            } else {
              globalTotal += value
              globalCount += 1
            }
          })

          let globalScore = 0
          let globalNSPRate = 0
          if (globalCount > 0) {
            const globalAverageValue = globalTotal / globalCount
            globalScore = Math.min(100, Math.round((globalAverageValue / 3) * 100))
          }

          if (globalTotalCount > 0) {
            globalNSPRate = Math.round((globalNSPCount / globalTotalCount) * 100 * 10) / 10
          }

          // OPTIMIZED: Reduced logging
          // Calculate global median CORRECTLY: median of individual global scores
          let globalMedian = null

          // Group responses by session_id to calculate individual global scores
          const sessionGlobalScores = {} // { sessionId: { total: number, count: number } }

          serviceResponses.forEach(response => {
            const sessionId = response.session_id || 'unknown'
            const value = response.answer_value
            if (value !== 4) { // Exclude "Ne sais pas"
              if (!sessionGlobalScores[sessionId]) {
                sessionGlobalScores[sessionId] = { total: 0, count: 0 }
              }
              sessionGlobalScores[sessionId].total += value
              sessionGlobalScores[sessionId].count += 1
            }
          })

          // OPTIMIZED: Calculate individual global score for each respondent
          const individualGlobalScores = []
          Object.keys(sessionGlobalScores).forEach(sessionId => {
            const data = sessionGlobalScores[sessionId]
            if (data.count > 0) {
              const avgValue = data.total / data.count
              const score = (avgValue / 3) * 100
              const finalScore = Math.min(100, Math.max(0, score))
              individualGlobalScores.push(finalScore)
            }
          })

          // Calculate median of individual global scores
          if (individualGlobalScores.length > 0) {
            individualGlobalScores.sort((a, b) => a - b)
            let median
            if (individualGlobalScores.length % 2 === 0) {
              const mid1 = individualGlobalScores[Math.floor(individualGlobalScores.length / 2) - 1]
              const mid2 = individualGlobalScores[Math.floor(individualGlobalScores.length / 2)]
              median = (mid1 + mid2) / 2
            } else {
              median = individualGlobalScores[Math.floor(individualGlobalScores.length / 2)]
            }
            globalMedian = Math.min(100, Math.round(median))
          }

          // OPTIMIZED: Reduced logging

          // Add median to dimension scores
          // OPTIMIZED: Use Map for O(1) lookup instead of find() which is O(n)
          const medianMap = new Map(medianScores.map(m => [m.dimension, m.median]))
          const dimensionScoresWithMedian = serviceDimensionScores.map(score => {
            const median = medianMap.get(score.dimension) ?? null
            // IMPORTANT: Return score object WITHOUT multiplying by anything
            // score.score is already a percentage (0-100)
            return {
              ...score,
              median: median
            }
          })

          // Store service dimension scores for global calculation
          allServiceDimensionScores.push(dimensionScoresWithMedian)

          // Get saved recommendations for this service
          let serviceRecommendations = []
          let serviceLastModified = null
          const serviceRecs = db.prepare(`
            SELECT id, payload_json,
                (SELECT modified_at FROM recommendations_history 
                    WHERE recommendation_id = recommendations.id 
                    ORDER BY modified_at DESC LIMIT 1) as last_modified
            FROM recommendations
            WHERE mission_id = ? AND service_id = ?
                ORDER BY created_at DESC
            LIMIT 1
                `).get(missionId, service.id)

          if (serviceRecs) {
            try {
              serviceRecommendations = JSON.parse(serviceRecs.payload_json)
              serviceLastModified = serviceRecs.last_modified
            } catch (e) {
              console.error('Error parsing service recommendations:', e)
            }
          }

          // Generate service-specific recommendations if not saved
          // IMPORTANT: Recommendations are generated at SERVICE level only, not for individual respondents
          // Individual respondent scores are used to calculate service-level scores, but recommendations
          // are provided for the service as a whole, not per individual.
          if (serviceRecommendations.length === 0) {
            // OPTIMIZED: Don't auto-generate recommendations on GET.
            // This causes massive slowdowns. Return empty and let frontend trigger if needed.
            serviceRecommendations = generateStaticRecommendations(dimensionScoresWithMedian, mission.questionnaire_type)
            console.log(`[Results] Using static fallback for service ${service.name}(GET request)`)
          }


          services.push({
            id: service.id,
            name: service.name,
            code: service.code,
            globalScore,
            globalMedian,
            globalNSPRate, // Taux "Ne sais pas" global pour ce service
            dimensionScores: dimensionScoresWithMedian,
            recommendations: serviceRecommendations,
            status: 'draft',
            lastModified: serviceLastModified,
            subDimensions: dimensionScoresWithMedian.map(s => {
              // DEBUG: Log before mapping
              if (s.dimension === dimensionScoresWithMedian[0].dimension) {
                console.log(`[DEBUG subDimensions] ${s.dimension}: score = ${s.score}, type = ${typeof s.score}, maxScore = ${s.maxScore}, questionCount = ${s.questionCount} `)
              }
              // Le nspRate est déjà dans s car on fait ...score dans dimensionScoresWithMedian
              // qui vient de serviceDimensionScores qui contient nspRate
              return {
                dimension: s.dimension,
                score: Math.min(100, Math.max(0, s.score)), // Ensure score is between 0 and 100%
                median: s.median !== null && s.median !== undefined ? s.median : null, // Médiane peut être 0, mais null si non calculable
                nspRate: s.nspRate !== null && s.nspRate !== undefined ? s.nspRate : null // Taux NSP pour cette dimension (déjà dans s via ...score)
              }
            })
          })
        }
      }

      // Calculate GLOBAL dimension scores (the source for the Radar chart at Mission level)
      // Logic: Use ALL responses for this mission to calculate the dimension breakdown
      let globalDimensionScores = []
      if (missionId) {
        const allMissionResponses = db.prepare(`
          SELECT r.question_id, r.dimension, r.answer_value, r.session_id
          FROM responses r
          JOIN sessions s ON r.session_id = s.id
          WHERE s.mission_id = ?
        `).all(missionId)

        if (allMissionResponses.length > 0) {
          const organizationDimensionScores = calculateDimensionScores(allMissionResponses, mission.questionnaire_type)
          const organizationMedianScores = calculateMedianScores(allMissionResponses, mission.questionnaire_type)
          const orgMedianMap = new Map(organizationMedianScores.map(m => [m.dimension, m.median]))

          globalDimensionScores = organizationDimensionScores.map(score => ({
            ...score,
            median: orgMedianMap.get(score.dimension) ?? null
          }))
          console.log(`[Results] Generated true globalDimensionScores from ${allMissionResponses.length} total responses`)
        } else {
          console.log(`[Results] No responses found to generate globalDimensionScores`)
        }
      }

      // Calculate GLOBAL MEDIAN and GLOBAL AVERAGE for the entire organization (all respondents, all services)
      // This calculates the median and average across ALL respondents, not just per service
      let globalOrganizationMedian = null
      let globalOrganizationAverage = null
      let globalOrganizationNSPRate = null // Taux "Ne sais pas" global organisation
      if (missionId) {
        // Get ALL responses from ALL services for this mission
        const allOrganizationResponses = db.prepare(`
          SELECT r.question_id, r.dimension, r.answer_value, r.session_id
          FROM responses r
          JOIN sessions s ON r.session_id = s.id
          WHERE s.mission_id = ?
                `).all(missionId)

        if (allOrganizationResponses.length > 0) {
          // Calculate global average from RAW DATA (not from percentages)
          // CORRECT: Additionner toutes les valeurs brutes de toutes les réponses
          // OPTIMIZED: Reduced logging for performance
          // console.log(`\n[CALCUL GLOBAL ORGANISATION]`)
          let orgGlobalTotal = 0
          let orgGlobalCount = 0
          let orgGlobalNSPCount = 0 // Nombre de "Ne sais pas"
          let orgGlobalTotalCount = 0 // Nombre total de réponses

          // Sum all raw answer values (0-3) across all services and all dimensions
          allOrganizationResponses.forEach(response => {
            const value = response.answer_value
            orgGlobalTotalCount += 1 // Toutes les réponses comptent

            if (value === 4) {
              // "Ne sais pas" : compté séparément
              orgGlobalNSPCount += 1
            } else {
              // Score 0-3 : utilisé pour le calcul du score
              orgGlobalTotal += value
              orgGlobalCount += 1
            }
          })

          if (orgGlobalCount > 0) {
            const orgGlobalAverageValue = orgGlobalTotal / orgGlobalCount
            globalOrganizationAverage = Math.min(100, Math.round((orgGlobalAverageValue / 3) * 100))

            console.log(`  - Total valeurs brutes(0 - 3, tous services, toutes dimensions): ${orgGlobalTotal} `)
            console.log(`  - Nombre de réponses(0 - 3): ${orgGlobalCount} `)
            console.log(`  - Nombre "Ne sais pas"(4): ${orgGlobalNSPCount} `)
            console.log(`  - Nombre total de réponses: ${orgGlobalTotalCount} `)
            console.log(`  - Moyenne globale des valeurs(0 - 3): ${orgGlobalAverageValue.toFixed(2)} (sur max 3)`)
            console.log(`  - Score global organisation: (${orgGlobalAverageValue.toFixed(2)} / 3) * 100 = ${globalOrganizationAverage}% `)
          } else {
            globalOrganizationAverage = 0
            console.log(`  - Aucune réponse valide(0 - 3)`)
          }

          if (orgGlobalTotalCount > 0) {
            globalOrganizationNSPRate = Math.round((orgGlobalNSPCount / orgGlobalTotalCount) * 100 * 10) / 10
            console.log(`  - Taux "Ne sais pas" global organisation: (${orgGlobalNSPCount} / ${orgGlobalTotalCount}) * 100 = ${globalOrganizationNSPRate}% `)
          } else {
            globalOrganizationNSPRate = null
          }
          // OPTIMIZED: Reduced logging

          // Calculate dimension scores for the entire organization (for display)
          const organizationDimensionScores = calculateDimensionScores(allOrganizationResponses, mission.questionnaire_type)

          // Calculate median scores for the entire organization
          const organizationMedianScores = calculateMedianScores(allOrganizationResponses, mission.questionnaire_type)

          // Calculate global organization median CORRECTLY: median of individual global scores
          // OPTIMIZED: Reduced logging
          globalOrganizationMedian = null

          // Group responses by session_id to calculate individual global scores
          const orgSessionGlobalScores = {} // { sessionId: { total: number, count: number } }

          allOrganizationResponses.forEach(response => {
            const sessionId = response.session_id || 'unknown'
            const value = response.answer_value
            if (value !== 4) { // Exclude "Ne sais pas"
              if (!orgSessionGlobalScores[sessionId]) {
                orgSessionGlobalScores[sessionId] = { total: 0, count: 0 }
              }
              orgSessionGlobalScores[sessionId].total += value
              orgSessionGlobalScores[sessionId].count += 1
            }
          })

          // Calculate individual global score for each respondent
          const orgIndividualGlobalScores = []
          Object.keys(orgSessionGlobalScores).forEach(sessionId => {
            const data = orgSessionGlobalScores[sessionId]
            if (data.count > 0) {
              const avgValue = data.total / data.count
              const score = (avgValue / 3) * 100
              const finalScore = Math.min(100, Math.max(0, score))
              orgIndividualGlobalScores.push(finalScore)
            }
          })

          // Calculate median of individual global scores
          if (orgIndividualGlobalScores.length > 0) {
            orgIndividualGlobalScores.sort((a, b) => a - b)
            let median
            if (orgIndividualGlobalScores.length % 2 === 0) {
              const mid1 = orgIndividualGlobalScores[Math.floor(orgIndividualGlobalScores.length / 2) - 1]
              const mid2 = orgIndividualGlobalScores[Math.floor(orgIndividualGlobalScores.length / 2)]
              median = (mid1 + mid2) / 2
            } else {
              median = orgIndividualGlobalScores[Math.floor(orgIndividualGlobalScores.length / 2)]
            }
            globalOrganizationMedian = Math.min(100, Math.round(median))

            console.log(`  - Nombre de répondants(tous services): ${orgIndividualGlobalScores.length} `)
            console.log(`  - Scores individuels globaux: ${orgIndividualGlobalScores.slice(0, 5).map(s => s.toFixed(1)).join(', ')}${orgIndividualGlobalScores.length > 5 ? '...' : ''} `)
            console.log(`  - Médiane globale organisation(50e percentile): ${globalOrganizationMedian}% `)
          } else {
            console.log(`  - Aucune médiane calculable(pas de réponses valides)`)
          }
          // OPTIMIZED: Reduced logging

          // Résumé global organisation
          console.log(`[RÉSUMÉ ORGANISATION GLOBALE]: `)
          console.log(`  - Moyenne globale: ${globalOrganizationAverage}% `)
          console.log(`  - Médiane globale: ${globalOrganizationMedian !== null ? globalOrganizationMedian + '%' : 'null'} `)
          console.log(`  - Taux "Ne sais pas" global: ${globalOrganizationNSPRate !== null ? globalOrganizationNSPRate + '%' : 'null'} `)
          console.log(`[RÉSUMÉ ORGANISATION GLOBALE]FIN\n`)
        }
      }

      // Generate GLOBAL recommendations (for the entire organization, not individual services)
      // These are distinct from service-specific recommendations
      let globalRecommendations = []
      let globalRecommendationsSource = 'static'

      // Get saved global recommendations if they exist
      let savedGlobalRecommendations = []
      let lastModified = null
      let savedRecs = null
      if (missionId) {
        savedRecs = db.prepare(`
          SELECT id, payload_json, status, approved_at, created_at,
                (SELECT modified_at FROM recommendations_history 
                  WHERE recommendation_id = recommendations.id 
                  ORDER BY modified_at DESC LIMIT 1) as last_modified
          FROM recommendations
          WHERE mission_id = ? AND service_id IS NULL
          ORDER BY created_at DESC
          LIMIT 1
                `).get(missionId)
      }

      if (savedRecs) {
        try {
          savedGlobalRecommendations = JSON.parse(savedRecs.payload_json)
          // CRITICAL: Normalize dimensions from old data (may be in English or have quotes)
          if (Array.isArray(savedGlobalRecommendations)) {
            savedGlobalRecommendations = savedGlobalRecommendations.map(rec => {
              const normalizedDim = normalizeDimensionKey(rec.dimension)
              return {
                ...rec,
                dimension: normalizedDim || rec.dimension
              }
            })
            console.log('[Results] Normalized dimensions in saved recommendations:', savedGlobalRecommendations.map(r => r.dimension))
            console.log('[Results] Number of recommendations after normalization:', savedGlobalRecommendations.length)
          }
          lastModified = savedRecs.last_modified
        } catch (e) {
          console.error('Error parsing saved global recommendations:', e)
        }
      }

      // Generate GLOBAL recommendations if not saved (based on average of all services)
      // IMPORTANT: Recommendations are generated at two levels only:
      // 1. SERVICE level: Recommendations specific to each service/pole
      // 2. GLOBAL/ORGANIZATION level: Recommendations for the entire organization
      // Individual respondent recommendations are NOT generated - individual scores are used
      // only to calculate service-level and global-level scores.
      if (savedGlobalRecommendations.length === 0 && globalDimensionScores.length > 0) {
        try {
          if (isOpenAIConfigured()) {
            try {
              const aiGlobalRecs = await generateRecommendations(
                globalDimensionScores,
                mission.questionnaire_type,
                mission.organization_name
              )
              if (aiGlobalRecs && aiGlobalRecs.length > 0) {
                globalRecommendations = aiGlobalRecs
                globalRecommendationsSource = 'ai'
              }
            } catch (error) {
              console.error('[ERROR] Failed to generate AI global recommendations, falling back to static:', error)
              console.error('[ERROR] Error stack:', error.stack)
            }
          }

          if (globalRecommendations.length === 0) {
            globalRecommendations = generateStaticRecommendations(globalDimensionScores, mission.questionnaire_type)
          }
        } catch (error) {
          console.error('[ERROR] Error generating global recommendations:', error)
          console.error('[ERROR] Error stack:', error.stack)
          // Fallback to empty array if generation fails completely
          globalRecommendations = []
        }
      } else if (savedGlobalRecommendations.length > 0) {
        globalRecommendations = savedGlobalRecommendations
        globalRecommendationsSource = 'saved'
      }

      // For backward compatibility with session-based requests
      const dimensionScores = sessionId ? calculateDimensionScores(responses, mission.questionnaire_type) : globalDimensionScores

      // Calcul nb répondants anonymes
      let anonymousCount = 0
      if (missionId && !sessionId) {
        try {
          const row = db.prepare('SELECT COUNT(id) as count FROM sessions WHERE mission_id = ? AND completed_at IS NOT NULL AND is_anonymous = 1').get(missionId)
          anonymousCount = row ? row.count : 0
        } catch (e) {
          console.error('[Error] Counting anonymous:', e)
        }
      }

      // Build response object
      const responseData = {
        mission: {
          id: mission.id,
          organizationName: mission.organization_name,
          questionnaireType: mission.questionnaire_type
        },
        session: session ? {
          id: session.id,
          token: session.anonymous_token,
          completedAt: session.completed_at
        } : null,
        dimensionScores: missionId ? globalDimensionScores : dimensionScores, // Global scores for mission, session scores for session
        recommendations: missionId ? globalRecommendations : (savedGlobalRecommendations.length > 0 ? savedGlobalRecommendations : globalRecommendations), // Global recommendations for mission
        recommendationsSource: missionId ? globalRecommendationsSource : (savedGlobalRecommendations.length > 0 ? 'saved' : globalRecommendationsSource),
        totalResponses: sessionId ? responses.length : (missionId ? services.reduce((sum, s) => sum + (s.dimensionScores?.length || 0), 0) : 0),
        anonymousCount: anonymousCount,
        lastModified,
        services,
        // Expose OpenAI configuration status to the frontend so the UI can clearly
        // indicate when advanced regeneration options (langue, ton, etc.) are inactive.
        openaiConfigured: isOpenAIConfigured(),
        // Global organization metrics (all respondents, all services)
        globalOrganizationAverage: missionId ? globalOrganizationAverage : null,
        globalOrganizationMedian: missionId ? globalOrganizationMedian : null,
        globalOrganizationNSPRate: missionId ? globalOrganizationNSPRate : null // Taux "Ne sais pas" global organisation
      }

      // CACHE: Store results in cache for mission-level requests (not for individual sessions)
      if (missionId && !sessionId) {
        try {
          setCachedResults(db, parseInt(missionId), null, responseData)
          console.log('[Cache] ✅ Cached results for mission:', missionId)
        } catch (error) {
          console.error('[Cache] ❌ Error caching results:', error)
          // Don't fail the request if caching fails
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(responseData))
    } catch (error) {
      console.error('Error calculating results:', error)
      console.error('Error stack:', error.stack)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }))
    }
    return
  }


  // GET /api/results/history - Get recommendations history
  if (req.method === 'GET' && url.pathname === '/api/results/history') {
    const missionId = url.searchParams.get('missionId')
    const serviceId = url.searchParams.get('serviceId')

    if (!missionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'missionId required' }))
      return
    }

    try {
      // Get recommendation ID
      const rec = db.prepare(`
        SELECT id FROM recommendations
        WHERE mission_id = ? AND(service_id = ? OR(service_id IS NULL AND ? IS NULL))
        ORDER BY created_at DESC
        LIMIT 1
                `).get(missionId, serviceId || null, serviceId || null)

      if (!rec) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ history: [] }))
        return
      }

      // Get history
      const history = db.prepare(`
              SELECT
              rh.version_number as version,
                rh.payload_json,
                rh.change_description,
                rh.modified_at as modifiedAt,
                c.first_name || ' ' || c.last_name as modifiedBy
        FROM recommendations_history rh
        LEFT JOIN consultants c ON rh.modified_by = c.id
        WHERE rh.recommendation_id = ?
                ORDER BY rh.modified_at DESC
                  `).all(rec.id)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ history }))
    } catch (error) {
      console.error('Error loading history:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
}

