// ai-recommendations.js
// Now using Anthropic Claude API.
// Maintains backward compatibility with existing function signatures.


const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'

function log(...args) {
  if (IS_DEVELOPMENT) console.log(...args)
}
function logError(...args) {
  console.error(...args)
}

// Read environment variables dynamically
function getOpenAIApiKey() {
  return process.env.ANTHROPIC_API_KEY
}

function getOpenAIModel() {
  return process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'
}

// ---------- Canonical dimensions (IMPORTANT) ----------
const DIMENSIONS_COMPLETE = [
  'ambition',
  'pilotage',
  'organisation',
  'culture',
  'donnees',
  'cas_usage',
  'ecosysteme',
  'expertise',
  'technologie',
  'mise_en_oeuvre'
]

const DIMENSIONS_FLASH = [
  'ambition',
  'culture',
  'donnees',
  'cas_usage',
  'technologie'
]

// Display names
const DIMENSION_NAMES_FR = {
  ambition: 'Ambition',
  pilotage: 'Pilotage',
  organisation: 'Organisation',
  culture: 'Culture',
  donnees: 'Données',
  cas_usage: "Cas d'usage",
  ecosysteme: 'Écosystème',
  expertise: 'Expertise',
  technologie: 'Technologie',
  mise_en_oeuvre: 'Mise en œuvre'
}

const DIMENSION_NAMES_EN = {
  ambition: 'Ambition',
  pilotage: 'Steering',
  organisation: 'Organization',
  culture: 'Culture',
  donnees: 'Data',
  cas_usage: 'Use Cases',
  ecosysteme: 'Ecosystem',
  expertise: 'Skills & Expertise',
  technologie: 'Technology',
  mise_en_oeuvre: 'Implementation'
}

// ---------- Helpers ----------

// Normalizes dimension keys to canonical FR keys
export function normalizeDimensionKey(value) {
  if (value == null) return null
  let s = String(value).trim()

  while ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim()
  }
  s = s.replace(/^["']+|["']+$/g, '').trim()

  s = s.toLowerCase()
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  s = s.replace(/\s+/g, '_')

  const map = {
    // Données
    data: 'donnees',
    donnees: 'donnees',
    donnees_data: 'donnees',
    data_strategy: 'donnees',
    data_management: 'donnees',

    // Écosystème
    ecosystem: 'ecosysteme',
    ecosysteme: 'ecosysteme',
    ecosystem_partners: 'ecosysteme',
    ecosystem_network: 'ecosysteme',

    // Technologie
    technology: 'technologie',
    technologie: 'technologie',
    tech: 'technologie',
    tech_stack: 'technologie',
    technology_stack: 'technologie',
    technical_infrastructure: 'technologie',

    // Cas d'usage
    use_cases: 'cas_usage',
    use_case: 'cas_usage',
    usecase: 'cas_usage',
    usage: 'cas_usage',
    cas_usage: 'cas_usage',
    cas_dusage: 'cas_usage',
    usages_de_lia: 'cas_usage',

    // Mise en œuvre
    implementation: 'mise_en_oeuvre',
    mise_en_oeuvre: 'mise_en_oeuvre',
    deployment: 'mise_en_oeuvre',
    execution: 'mise_en_oeuvre',

    // Organisation
    organization: 'organisation',
    organisation: 'organisation',

    // Pilotage
    governance: 'pilotage',
    steering: 'pilotage',
    pilotage: 'pilotage',

    // Culture
    ethics: 'culture',
    innovation: 'culture',
    culture: 'culture',
    competences_culture: 'culture',

    // Expertise
    skills: 'expertise',
    competencies: 'expertise',
    expertise: 'expertise',

    // Ambition
    vision: 'ambition',
    ambition: 'ambition',
    strategie_vision: 'ambition',

    // Infrastructure
    infrastructure: 'technologie'
  }

  return map[s] || s
}

function ensureExpectedDimensionScores(dimensionScores, questionnaireType) {
  const required = questionnaireType === 'flash' ? DIMENSIONS_FLASH : DIMENSIONS_COMPLETE

  const normalizedInput = Array.isArray(dimensionScores) ? dimensionScores : []
  const byDim = new Map()

  for (const s of normalizedInput) {
    const dim = normalizeDimensionKey(s?.dimension)
    if (!dim) continue
    byDim.set(dim, {
      dimension: dim,
      score: typeof s.score === 'number' ? s.score : 0,
      median: typeof s.median === 'number' ? s.median : undefined,
      level: s.level || 'unknown',
      ...s,
      dimension: dim
    })
  }

  const output = required.map((dim) => {
    if (byDim.has(dim)) return byDim.get(dim)
    return {
      dimension: dim,
      score: 0,
      median: undefined,
      level: 'missing_data'
    }
  })

  const inputDims = Array.from(byDim.keys())
  const missing = required.filter((d) => !byDim.has(d))
  if (missing.length > 0) {
    logError(
      `[OpenAI] ⚠️ DimensionScores incomplet pour questionnaire="${questionnaireType}". ` +
      `Reçues=${inputDims.length}, attendues=${required.length}. Manquantes=${missing.join(', ')}`
    )
  } else {
    log(`[OpenAI] ✅ DimensionScores OK: ${output.length}/${required.length}`)
  }

  return { required, scores: output, missing }
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length)
  let idx = 0

  async function worker() {
    while (idx < items.length) {
      const current = idx++
      results[current] = await mapper(items[current], current)
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker())
  await Promise.all(workers)
  return results
}

async function withRetry(fn, { retries = 2, baseDelayMs = 500 } = {}) {
  let lastErr
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      const delay = baseDelayMs * Math.pow(2, i)
      logError(`[OpenAI] ⚠️ Retry ${i + 1}/${retries + 1} after error: ${e?.message || e}`)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastErr
}

// ---------- Core Gemini call: generate recommendations for ONE dimension ----------
async function generateForSingleDimension({
  organizationName,
  questionnaireType,
  detectedLanguage,
  tone,
  detailLevel,
  priorityAxis,
  additionalContext,
  previousModifications,
  dimensionScore,
  requiredDimensions
}) {
  const apiKey = getOpenAIApiKey()
  if (!apiKey) return null

  const dimKey = dimensionScore.dimension
  const dimLabelFR = DIMENSION_NAMES_FR[dimKey] || dimKey
  const dimLabelEN = DIMENSION_NAMES_EN[dimKey] || dimKey
  const language = detectedLanguage || 'fr'

  log(`[OpenAI] generateForSingleDimension: dimension="${dimKey}", language="${language}"`)

  const minRecs = detailLevel === 'concise' ? 2 : 3
  const maxRecs = detailLevel === 'exhaustive' ? 6 : detailLevel === 'detailed' ? 5 : detailLevel === 'concise' ? 3 : 4
  const validDimensions = requiredDimensions.join(', ')

  const languageNames = {
    'fr': 'Français',
    'en': 'English',
    'es': 'Espagnol',
    'de': 'Allemand',
    'it': 'Italien'
  }
  const targetLanguageName = languageNames[language] || language

  // Gemini System instruction
  // Force clearer instruction if language is english
  const isEnglish = language === 'en'

  const systemInstruction = `You are an expert consultant in Digital Transformation and AI Maturity.
Your task is to generate strategic recommendations.

CRITICAL RULES:
1. LANGUAGE: You MUST answer EXCLUSIVELY in ${targetLanguageName} (${language}).
2. If target is English, EVERYTHING in the JSON values (titles, descriptions, actions) MUST be in English.
3. If target is French, EVERYTHING MUST be in French.
4. Do not mix languages.`

  const userPrompt = `=== CRITICAL INSTRUCTIONS ===
TARGET LANGUAGE: ${targetLanguageName} (${language}).
OUTPUT FORMAT: JSONStrict.

CONTEXT:
- Type: ${questionnaireType === 'flash' ? 'Flash (5 dimensions)' : 'Complet (10 dimensions)'}
- Tone: ${tone}
- Detail Level: ${detailLevel}
- Priority Axis: ${priorityAxis}
- Additional Context: ${additionalContext || 'N/A'}

DIMENSION RESULT:
Dimension: "${dimKey}" (${dimLabelEN})
Score: ${dimensionScore.score}% (${dimensionScore.level})
${dimensionScore.median != null ? `Median: ${dimensionScore.median}%` : ''}

=== TASK ===
Generate a JSON object containing:
1. "dimension_synthesis": A 5-line analysis in ${targetLanguageName}.
2. "recommendations": A list of ${minRecs} to ${maxRecs} recommendations.

EXPECTED JSON FORMAT:
{
  "dimension_synthesis": "Analysis text in ${targetLanguageName}...",
  "recommendations": [
    {
      "dimension": "${dimKey}",
      "title": "Title in ${targetLanguageName}",
      "level": "${dimensionScore.level}",
      "score": ${dimensionScore.score},
      "description": "Description in ${targetLanguageName}...",
      "actions": ["Action 1 in ${targetLanguageName}", "..."],
      "services": ["Service suggestion in ${targetLanguageName}", "..."]
    }
  ]
}

Authorized Dimension Keys: ${validDimensions}
`

  // Anthropic API Call
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: getOpenAIModel(),
      max_tokens: 4096,
      system: systemInstruction,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  let responseText = data.content[0].text;

  // Extract JSON from potential markdown code blocks
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) responseText = jsonMatch[1].trim()

  log(`[Claude Debug] RAW CONTENT for ${dimKey}:`, responseText)

  let parsed
  try {
    parsed = JSON.parse(responseText)
  } catch (e) {
    console.error(`[Claude Debug] JSON parsing failed for ${dimKey}:`, e)
    throw new Error('Invalid JSON response from Claude')
  }

  let synthesis = parsed?.dimension_synthesis || ''
  const cleanupRegex = /^(\*\*|__)?(synthèse|constat|analyse|synthesis|situation|summary|recommandation|constatations)(\s*:|\s*-|\s*\|)?(\*\*|__)?\s*/i
  synthesis = synthesis.replace(cleanupRegex, '').trim()

  if (synthesis.length > 0) {
    synthesis = synthesis.charAt(0).toUpperCase() + synthesis.slice(1)
  }

  // Safety checks
  if (!synthesis || synthesis.length < 20) {
    synthesis = `L'analyse de la maturité pour la dimension ${dimLabelFR} montre un score de ${dimensionScore.score}%. Cette thématique est jugée comme ${dimensionScore.level === 'low' ? 'prioritaire' : dimensionScore.level === 'medium' ? 'importante' : 'satisfaisante'} pour l'évolution de l'organisation.`
  }

  const recs = Array.isArray(parsed?.recommendations) ? parsed.recommendations : []

  const fixed = recs
    .map((r) => {
      let desc = String(r.description || '').trim()
      desc = desc.replace(cleanupRegex, '').trim()

      const isRedundant = !desc ||
        desc.length < 15 ||
        desc === synthesis ||
        desc.toLowerCase().includes(synthesis.toLowerCase().substring(0, Math.min(30, synthesis.length))) ||
        synthesis.toLowerCase().includes(desc.toLowerCase().substring(0, Math.min(30, desc.length)))

      return {
        ...r,
        dimension: dimKey,
        synthesis: synthesis,
        description: isRedundant ? synthesis : desc
      }
    })
    .filter((r) => r.dimension === dimKey)

  return fixed
}

function detectLanguage(params = {}) {
  const { language = null, additionalContext = '' } = params
  if (language && typeof language === 'string' && language.length >= 2 && language.length <= 3) {
    return language.toLowerCase()
  }
  const s = String(additionalContext || '').toLowerCase()
  if (/(en anglais|in english|english)/.test(s)) return 'en'
  return 'fr'
}

// ---------- Public API ----------

// Replaces isOpenAIConfigured but keeps the name for backward compat
export function isOpenAIConfigured() {
  return !!getOpenAIApiKey()
}

export async function generateRecommendationsWithParams(
  dimensionScores,
  questionnaireType,
  organizationName,
  params = {}
) {
  const apiKey = getOpenAIApiKey()
  if (!apiKey) return null

  const expected = questionnaireType === 'flash' ? 5 : 10
  if (!Array.isArray(dimensionScores) || dimensionScores.length !== expected) {
    throw new Error(`dimensionScores.length=${dimensionScores?.length} (expected ${expected})`)
  }

  const { required, scores, missing } = ensureExpectedDimensionScores(dimensionScores, questionnaireType)

  log(`[OpenAI] ===== DÉBUT GÉNÉRATION RECOMMANDATIONS =====`)
  log(`[OpenAI] Model: ${getOpenAIModel()}`)

  const {
    language: explicitLanguage = null,
    tone = 'professional',
    detailLevel = 'balanced',
    priorityAxis = 'all',
    additionalContext = '',
    previousModifications = []
  } = params

  const detectedLanguage = (explicitLanguage && ['fr', 'en', 'es', 'de'].includes(String(explicitLanguage).trim()))
    ? String(explicitLanguage).trim()
    : detectLanguage({ language: null, additionalContext })

  // Concurrent generation
  log(`[OpenAI] Generating recommendations for ${scores.length} dimensions with concurrency 3`)

  const results = await mapWithConcurrency(scores, 3, async (dimScore) => {
    const dimKey = dimScore.dimension
    const dimLabel = detectedLanguage === 'en'
      ? (DIMENSION_NAMES_EN[dimKey] || dimKey)
      : (DIMENSION_NAMES_FR[dimKey] || dimKey)

    try {
      const recs = await withRetry(
        async () => {
          return await generateForSingleDimension({
            organizationName,
            questionnaireType,
            detectedLanguage,
            tone,
            detailLevel,
            priorityAxis,
            additionalContext,
            previousModifications,
            dimensionScore: dimScore,
            requiredDimensions: required
          })
        },
        { retries: 2, baseDelayMs: 600 }
      )

      if (Array.isArray(recs) && recs.length > 0) {
        return recs.map(r => ({
          ...r,
          dimension: dimKey,
          level: r.level || dimScore.level,
          score: Number.isFinite(r.score) ? r.score : dimScore.score,
          title: String(r.title || '').trim(),
          synthesis: String(r.synthesis || '').trim(),
          description: String(r.description || '').trim(),
          actions: Array.isArray(r.actions) ? r.actions : [],
          services: Array.isArray(r.services) ? r.services : []
        }))
      } else {
        throw new Error('No recommendations returned from AI')
      }
    } catch (error) {
      logError(`[OpenAI] ❌ Fallback for dimension "${dimKey}":`, error.message)
      return [{
        dimension: dimKey,
        title: detectedLanguage === 'en'
          ? `Action plan for ${dimLabel}`
          : `Plan d'action – ${dimLabel}`,
        level: dimScore.level || 'low',
        score: Number.isFinite(dimScore.score) ? dimScore.score : 0,
        synthesis: detectedLanguage === 'en'
          ? `Analysis of ${dimLabel}: Score ${dimScore.score}%. This dimension requires in-depth analysis and an action plan.`
          : `Analyse de la dimension ${dimLabel} : Score ${dimScore.score}%. Cette dimension nécessite une analyse approfondie et un plan d'action.`,
        description: detectedLanguage === 'en'
          ? `Fallback recommendation following AI generation failure (${error.message}).`
          : `Recommandation de secours suite à un échec de génération IA (${error.message}).`,
        actions: detectedLanguage === 'en'
          ? ['Appoint a leader', 'Define a 30-day plan', 'Measure baseline KPIs']
          : ['Nommer un responsable', 'Définir un plan à 30 jours', 'Mesurer des KPI de référence'],
        services: detectedLanguage === 'en'
          ? ['Workshop (2h)', 'Coaching (1/2 day)']
          : ['Atelier (2h)', 'Coaching (1/2 journée)']
      }]
    }
  })

  // Flatten results
  const all = results.flat()

  log(`[OpenAI] Total recommandations générées: ${all.length}`)
  return all
}

export async function generateRecommendations(dimensionScores, questionnaireType, organizationName) {
  return await generateRecommendationsWithParams(dimensionScores, questionnaireType, organizationName, {
    language: 'fr',
    tone: 'professional',
    detailLevel: 'balanced',
    priorityAxis: 'all',
    additionalContext: '',
    previousModifications: []
  })
}

export async function generateMissionSummary(
  organizationName,
  dimensionScores,
  maturityPercent,
  respondentsPercent,
  satisfactionStars,
  questionnaireType,
  params = {}
) {
  const apiKey = getOpenAIApiKey()
  if (!apiKey) {
    return `Synthèse de la mission ${organizationName}: Maturité IA & Data de ${maturityPercent}%, ${respondentsPercent}% de répondants. Satisfaction globale: ${satisfactionStars}/5 étoiles.`
  }

  try {
    const { language = 'fr', maxLength = 500 } = params

    const prompt = language === 'en'
      ? `Generate a summary for mission "${organizationName}". Maturity: ${maturityPercent}%, Respondents rate: ${respondentsPercent}%, Satisfaction: ${satisfactionStars}/5 stars. Type: ${questionnaireType}.`
      : `Génère une synthèse pour la mission "${organizationName}". Maturité: ${maturityPercent}%, Taux de réponse: ${respondentsPercent}%, Satisfaction: ${satisfactionStars}/5 étoiles. Type: ${questionnaireType}.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: getOpenAIModel(),
        max_tokens: 1024,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    return data.content[0].text

  } catch (error) {
    logError(`[OpenAI] Error generating summary:`, error)
    return params.language === 'en'
      ? `Summary not available (AI Error: ${error.message})`
      : `Synthèse non disponible (Erreur IA: ${error.message})`
  }
}
