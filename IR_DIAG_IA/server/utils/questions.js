// Load questions from JSON file
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const QUESTIONS_FILE = join(__dirname, '../../data/questionnaire_maturite_IA.json')

let questionsCache = null

function loadQuestions() {
  if (questionsCache) {
    return questionsCache
  }

  try {
    const fileContent = readFileSync(QUESTIONS_FILE, 'utf-8')
    const data = JSON.parse(fileContent)
    questionsCache = data.questionnaire
    return questionsCache
  } catch (error) {
    console.error('Error loading questions from JSON:', error)
    return null
  }
}

// Get questions for full questionnaire (all 10 dimensions)
export function getFullQuestions() {
  const questionnaire = loadQuestions()
  if (!questionnaire) {
    return []
  }

  const questions = []
  let questionIndex = 1

  questionnaire.dimensions.forEach((dimension) => {
    dimension.questions.forEach((questionText) => {
      questions.push({
        id: `q${questionIndex}`,
        text: questionText,
        dimension: dimension.id,
        dimensionTitle: dimension.title,
        type: 'full'
      })
      questionIndex++
    })
  })

  return questions
}

// Get questions for flash questionnaire (one question per dimension)
export function getFlashQuestions() {
  const questionnaire = loadQuestions()
  if (!questionnaire) {
    return []
  }

  const questions = []
  let questionIndex = 1

  // Select first question from each of the first 5 dimensions
  const flashDimensions = questionnaire.dimensions.slice(0, 5)
  
  flashDimensions.forEach((dimension) => {
    if (dimension.questions.length > 0) {
      questions.push({
        id: `q${questionIndex}`,
        text: dimension.questions[0],
        dimension: dimension.id,
        dimensionTitle: dimension.title,
        type: 'flash'
      })
      questionIndex++
    }
  })

  return questions
}

// Get scale labels
export function getScaleLabels() {
  const questionnaire = loadQuestions()
  if (!questionnaire || !questionnaire.scale) {
    return [
      'Pas du tout d\'accord',
      'Plutôt pas d\'accord',
      'Plutôt d\'accord',
      'Tout à fait d\'accord',
      'Ne sais pas'
    ]
  }
  return questionnaire.scale
}

// Map dimension IDs to display names
export function getDimensionName(dimensionId) {
  const questionnaire = loadQuestions()
  if (!questionnaire) {
    return dimensionId
  }

  const dimension = questionnaire.dimensions.find(d => d.id === dimensionId)
  return dimension ? dimension.title : dimensionId
}

// Get all dimensions
export function getAllDimensions() {
  const questionnaire = loadQuestions()
  if (!questionnaire) {
    return []
  }
  return questionnaire.dimensions.map(d => ({
    id: d.id,
    title: d.title
  }))
}

