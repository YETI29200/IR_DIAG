
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RadarChart from '../components/RadarChart.vue'
import GroupedBarChart from '../components/charts/GroupedBarChart.vue'
import ReportTemplate from '../components/ReportTemplate.vue'
import DimensionIcons from '../components/DimensionIcons.vue'
import type { DimensionScore } from '@shared/types'

const router = useRouter()
const route = useRoute()
const query = route.query

const backToMissionUrl = computed(() => {
  const missionId = query.mission
  return missionId ? `/admin/missions/${missionId}` : '/admin/dashboard'
})

const mission = ref<any>(null)
const missionData = ref<any>(null)
const dimensionScores = ref<DimensionScore[]>([])
const recommendations = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const activeView = ref<'comparison' | 'details'>('comparison')
const selectedServiceId = ref<number | null>(null)
const globalOrganizationAverage = ref<number | null>(null)
const globalOrganizationMedian = ref<number | null>(null)
const globalOrganizationNSPRate = ref<number | null>(null)

// Détecter si on affiche une session individuelle
// Une session individuelle = on a un sessionId mais pas de missionId
const isIndividualSession = computed(() => {
  const sessionId = query.session
  const missionId = query.mission
  return !!sessionId && !missionId
})

// Calculer le score global pour une session individuelle
const globalScore = computed(() => {
  if (dimensionScores.value.length === 0) return 0
  const sum = dimensionScores.value.reduce((acc, s) => acc + normalizeScore(s.score), 0)
  return Math.min(100, Math.round(sum / dimensionScores.value.length))
})
const editingRecommendation = ref<{ dimension: string, field: string } | null>(null)
const editedRecommendations = ref<Record<string, any>>({})
const recommendationsApproved = ref(false)
const lastModified = ref<string | null>(null)
const modifiedDimensions = ref<Set<string>>(new Set())
const savedInCurrentSession = ref<Set<string>>(new Set())
const showHistoryModal = ref(false)
const showRegenerateModal = ref(false)
const openaiConfigured = ref<boolean | null>(null)
const regenerateScope = ref<'all' | 'service'>('all')
const historyLoading = ref(false)
const historyError = ref('')
const historyData = ref<any[]>([])
const regenerating = ref(false)
const regenerateParams = ref({
  language: 'fr',
  tone: 'professional',
  detailLevel: 'balanced',
  priorityAxis: 'all',
  additionalContext: ''
})

const showReportTemplate = ref(false)

const selectedServiceData = computed(() => {
  if (!missionData.value || !selectedServiceId.value) return null
  return missionData.value.services.find((s: any) => s.id === selectedServiceId.value)
})



const groupedBarData = computed(() => {
  if (!selectedServiceData.value?.subDimensions) return []
  
  return selectedServiceData.value.subDimensions.map((subDim: any) => ({
    id: subDim.dimension,
    label: formatDimension(subDim.dimension),
    values: [
      Math.round(subDim.score || 0),
      Math.round(subDim.median || 0),
      Math.round(subDim.nspRate || 0)
    ]
  }))
})



const barSeries = [
  { label: 'Moyenne', color: '#3B82F6' }, // Blue-500
  { label: 'Médiane', color: '#10B981' }, // Emerald-500
  { label: 'NSP', color: '#94A3B8' }      // Slate-400
]

const allDimensions = computed(() => {
  if (!missionData.value || !missionData.value.services || missionData.value.services.length === 0) return []
  const firstService = missionData.value.services[0]
  const dimensions = firstService.dimensionScores?.map((s: DimensionScore) => s.dimension) || []
  
  // Sort dimensions by average score (highest first)
  return dimensions.sort((a: string, b: string) => {
    const scoreA = getAverageScore(a)
    const scoreB = getAverageScore(b)
    return scoreB - scoreA
  })
})

const validatedCount = computed(() => {
  if (!missionData.value) return 0
  return missionData.value.services?.filter((s: any) => s.status === 'validated').length || 0
})

const draftCount = computed(() => {
  if (!missionData.value) return 0
  return missionData.value.services?.filter((s: any) => s.status === 'draft').length || 0
})

const totalCount = computed(() => {
  if (!missionData.value) return 0
  return missionData.value.services?.length || 0
})

const organizationDimensionScores = computed(() => {
  if (!missionData.value || !missionData.value.services || missionData.value.services.length === 0) {
    return dimensionScores.value
  }
  
  // Calculate average scores across all services for each dimension
  const dimensionMap = new Map<string, { sum: number, avgSum: number, medianSum: number, nspSum: number, count: number }>()
  
  missionData.value.services.forEach((service: any) => {
    if (service.dimensionScores) {
      service.dimensionScores.forEach((score: DimensionScore) => {
        if (!dimensionMap.has(score.dimension)) {
          dimensionMap.set(score.dimension, { sum: 0, avgSum: 0, medianSum: 0, nspSum: 0, count: 0 })
        }
        const entry = dimensionMap.get(score.dimension)!
        entry.sum += normalizeScore(score.score)
        entry.avgSum += normalizeScore(score.score)
        
        // Sum medians and NSPs if available
        if ((score as any).median !== undefined && (score as any).median !== null) {
          entry.medianSum += normalizeScore((score as any).median)
        }
        if ((score as any).nspRate !== undefined && (score as any).nspRate !== null) {
          entry.nspSum += (score as any).nspRate
        }
        
        entry.count += 1
      })
    }
  })
  
  // Convert to DimensionScore array
  const avgScores: any[] = []
  dimensionMap.forEach((value, dimension) => {
    const avgScore = value.sum / value.count
    const avgMedian = value.medianSum / value.count
    const avgNsp = value.nspSum / value.count
    
    const normalizedScore = normalizeScore(avgScore)
    
    avgScores.push({
      dimension,
      score: Math.round(normalizedScore),
      median: Math.round(avgMedian),
      nspRate: Math.round(avgNsp),
      level: getLevelFromScore(normalizedScore),
      maxScore: 100 // Percentage-based, so max is 100
    })
  })
  
  // Sort by score descending (highest first)
  avgScores.sort((a, b) => b.score - a.score)
  
  return avgScores.length > 0 ? avgScores : dimensionScores.value
})

const globalBarData = computed(() => {
  // Use organizationDimensionScores which now includes computed Medians and NSPs
  if (!organizationDimensionScores.value || organizationDimensionScores.value.length === 0) return []
  
  return organizationDimensionScores.value.map((dim: any) => ({
    id: dim.dimension,
    label: formatDimension(dim.dimension),
    values: [
      Math.round(dim.score || 0),
      Math.round(dim.median || 0),
      Math.round(dim.nspRate || 0)
    ]
  }))
})

function getLevelFromScore(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

// Get level for median: inverted logic (high median = low level = red)
// Médiane > 50% = ROUGE (divergence importante, difficulté de transformation)
// Médiane 0-20% = VERT (convergence, facilité de transformation)
// Médiane 21-49% = ORANGE (divergence modérée)
function getLevelFromMedian(median: number): 'low' | 'medium' | 'high' {
  if (median > 50) return 'low' // ROUGE - divergence importante
  if (median <= 20) return 'high' // VERT - convergence
  return 'medium' // ORANGE - divergence modérée
}

// Normalize score to ensure it's between 0 and 100%
function normalizeScore(score: number): number {
  return Math.min(100, Math.max(0, score))
}

// Normalize a DimensionScore object
function normalizeDimensionScore(score: DimensionScore): DimensionScore {
  const normalized = {
    ...score,
    score: normalizeScore(score.score)
  }
  // Preserve median if it exists
  if ((score as any).median !== undefined) {
    (normalized as any).median = normalizeScore((score as any).median)
  }
  return normalized
}

onMounted(async () => {
  await loadResults()
  // Auto-select first service if available and no service specified in URL
  if (missionData.value?.services?.length > 0 && !selectedServiceId.value) {
    selectedServiceId.value = missionData.value.services[0].id
  }
})

async function loadResults() {
  loading.value = true
  error.value = ''

  try {
    const sessionId = query.session
    const missionId = query.mission

    // Si on a un sessionId, c'est une vue individuelle - pas besoin de charger les services
    // Si on a un missionId, c'est une vue mission - on charge les services
    let url = '/api/results?'
    const params: string[] = []
    if (sessionId) {
      params.push(`session=${sessionId}`)
    }
    if (missionId) {
      params.push(`mission=${missionId}`)
    }
    url += params.join('&')

    const response = await fetch(url)

    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = 'Erreur lors du chargement'
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
        console.error('[ERROR] API Error:', errorData)
        if (errorData.stack) {
          console.error('[ERROR] Stack:', errorData.stack)
        }
      } catch (e) {
        console.error('[ERROR] Could not parse error response:', e)
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    
    // DEBUG: Log raw data from API
    console.log('[DEBUG] Raw API data:', {
      servicesCount: data.services?.length,
      recommendationsCount: data.recommendations?.length,
      recommendationsStructure: data.recommendations?.slice(0, 1),
      firstService: data.services?.[0] ? {
        name: data.services[0].name,
        globalScore: data.services[0].globalScore,
        globalScoreType: typeof data.services[0].globalScore,
        firstDimension: data.services[0].dimensionScores?.[0] ? {
          dimension: data.services[0].dimensionScores[0].dimension,
          score: data.services[0].dimensionScores[0].score,
          scoreType: typeof data.services[0].dimensionScores[0].score
        } : null
      } : null
    })
    
    mission.value = data.mission
    // OpenAI status (allows the UI to clearly warn when advanced IA regeneration
    // options like language/tone are not actually active)
    openaiConfigured.value = (data as any).openaiConfigured ?? null
    // Normalize dimension scores to ensure they don't exceed 100%
    dimensionScores.value = (data.dimensionScores || []).map(normalizeDimensionScore)
    recommendations.value = data.recommendations || []
    console.log('[Frontend] Loaded recommendations:', {
      count: recommendations.value.length,
      dimensions: recommendations.value.map((r: any) => r.dimension),
      firstRec: recommendations.value[0] ? {
        dimension: recommendations.value[0].dimension,
        title: recommendations.value[0].title,
        hasDescription: !!recommendations.value[0].description,
        descriptionPreview: recommendations.value[0].description?.substring(0, 100)
      } : null
    })
    console.log('[Frontend] Recommendation dimensions received (EXACT VALUES):', recommendations.value.map((r: any) => `"${r.dimension}"`))
    console.log('[Frontend] Available dimension scores:', dimensionScores.value.map((s: any) => s.dimension))
    lastModified.value = data.lastModified || null
    
    // Store global organization metrics
    globalOrganizationAverage.value = data.globalOrganizationAverage !== undefined && data.globalOrganizationAverage !== null 
      ? normalizeScore(data.globalOrganizationAverage) 
      : null
    globalOrganizationMedian.value = data.globalOrganizationMedian !== undefined && data.globalOrganizationMedian !== null 
      ? normalizeScore(data.globalOrganizationMedian) 
      : null
    globalOrganizationNSPRate.value = data.globalOrganizationNSPRate !== undefined && data.globalOrganizationNSPRate !== null 
      ? data.globalOrganizationNSPRate 
      : null
    
    console.log('[DEBUG Frontend] Données reçues:', {
      services: data.services?.length,
      globalOrganizationAverage: globalOrganizationAverage.value,
      globalOrganizationMedian: globalOrganizationMedian.value,
      firstService: data.services?.[0] ? {
        name: data.services[0].name,
        globalScore: data.services[0].globalScore,
        globalMedian: data.services[0].globalMedian,
        dimensionScores: data.services[0].dimensionScores?.map((s: any) => ({
          dimension: s.dimension,
          score: s.score,
          median: s.median
        }))
      } : null
    })
    
    // Debug: Vérifier les scores bruts avant normalisation
    if (data.services && data.services.length > 0) {
      console.log('[DEBUG Frontend] Scores bruts du premier service:', {
        name: data.services[0].name,
        globalScoreRaw: data.services[0].globalScore,
        dimensionScoresRaw: data.services[0].dimensionScores?.map((s: any) => ({
          dimension: s.dimension,
          scoreRaw: s.score,
          scoreType: typeof s.score
        }))
      })
    }
    
    // Initialize edited recommendations with saved data if available
    // Note: We don't mark dimensions as modified here - they should only be marked
    // when the user actually modifies them in the current session
    if (data.recommendations && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
      data.recommendations.forEach((rec: any) => {
        if (rec.dimension) {
          editedRecommendations.value[rec.dimension] = {
            synthesis: rec.synthesis || '',
            description: rec.description || '',
            actions: rec.actions || [],
            services: rec.services || []
          }
          // Don't mark as modified here - only mark when user actually saves modifications
        }
      })
    }
    
    // Transform data for comparison view
    // IMPORTANT: Si c'est une session individuelle (query.session), on ne charge pas les services
    // On affiche seulement un tableau simple des résultats (pas de recommandations)
    console.log('[DEBUG Frontend] Condition pour missionData:', {
      hasServices: !!data.services,
      servicesLength: data.services?.length,
      hasSessionQuery: !!query.session,
      hasMissionQuery: !!query.mission,
      isIndividualSession: isIndividualSession.value,
      willLoadServices: !!(data.services && !query.session)
    })
    
    if (data.services && !query.session) {
      console.log('[DEBUG Frontend] Chargement des services dans missionData:', data.services.length)
      missionData.value = {
        services: data.services.map((service: any) => {
          const normalizedService = {
            id: service.id,
            name: service.name,
            code: service.code,
            globalScore: normalizeScore(service.globalScore || 0),
            // Always include globalMedian if it exists (even if 0)
            globalMedian: service.hasOwnProperty('globalMedian') ? normalizeScore(service.globalMedian || 0) : undefined,
            globalNSPRate: service.hasOwnProperty('globalNSPRate') ? service.globalNSPRate : undefined,
            dimensionScores: (service.dimensionScores || []).map(normalizeDimensionScore),
            recommendations: service.recommendations || [],
            status: service.status || 'draft',
            subDimensions: (service.subDimensions || []).map((sub: any) => ({
              ...sub,
              score: normalizeScore(sub.score || 0),
              // La médiane peut être 0 (si toutes les réponses sont à 0), mais null si non calculable
              median: (sub.median !== undefined && sub.median !== null) ? normalizeScore(sub.median) : null,
              nspRate: (sub.nspRate !== undefined && sub.nspRate !== null) ? sub.nspRate : null
            })),
            lastModified: service.lastModified || null
          }
          console.log(`[DEBUG Frontend] Service ${normalizedService.name}:`, {
            globalScoreRaw: service.globalScore,
            globalScoreNormalized: normalizedService.globalScore,
            globalScoreType: typeof service.globalScore,
            globalMedian: normalizedService.globalMedian,
            dimensionScores: normalizedService.dimensionScores.map((s: any) => {
              const rawScore = service.dimensionScores?.find((ds: any) => ds.dimension === s.dimension)?.score
              return {
                dimension: s.dimension,
                scoreRaw: rawScore,
                scoreRawType: typeof rawScore,
                scoreNormalized: s.score,
                median: (s as any).median
              }
            })
          })
          return normalizedService
        })
      }
      
      console.log('[DEBUG Frontend] missionData.value après transformation:', {
        servicesCount: missionData.value?.services?.length,
        firstService: missionData.value?.services?.[0] ? {
          name: missionData.value.services[0].name,
          globalScore: missionData.value.services[0].globalScore,
          dimensionScoresCount: missionData.value.services[0].dimensionScores?.length
        } : null
      })
      
      // Set selected service from query parameter if provided
      const serviceIdFromQuery = query.service
      if (serviceIdFromQuery && missionData.value) {
        const serviceId = parseInt(serviceIdFromQuery)
        const serviceExists = missionData.value.services.some((s: any) => s.id === serviceId)
        if (serviceExists) {
          selectedServiceId.value = serviceId
          activeView.value = 'details' // Switch to details view when service is specified
        }
      }
    } else if (!isIndividualSession.value && !data.services) {
      // Single service view - transform to array format
      // Only if we don't have services from API
      console.log('[DEBUG Frontend] Pas de services dans la réponse API, création d\'un service par défaut')
      missionData.value = {
        services: [{
          id: 1,
          name: mission.value?.organizationName || 'Service',
          code: 'SVC1',
          globalScore: calculateGlobalScore(dimensionScores.value),
          dimensionScores: dimensionScores.value,
          recommendations: recommendations.value,
          status: 'validated',
          subDimensions: []
        }]
      }
      selectedServiceId.value = 1
    } else if (!isIndividualSession.value && data.services && data.services.length === 0) {
      // Mission has no services yet
      console.log('[DEBUG Frontend] Mission sans services - tableau vide')
      missionData.value = {
        services: []
      }
    }
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function calculateGlobalScore(scores: DimensionScore[]): number {
  if (!scores || scores.length === 0) return 0
  const sum = scores.reduce((acc, s) => acc + normalizeScore(s.score), 0)
  return Math.min(100, Math.round(sum / scores.length)) // Ensure score doesn't exceed 100%
}

function getDimensionScore(service: any, dimension: string): number {
  const score = service.dimensionScores?.find((s: DimensionScore) => s.dimension === dimension)
  if (!score) return 0
  const rawScore = score.score
  const normalized = normalizeScore(rawScore)
  /* DEBUG block removed for diagnosis */
  return Math.round(normalized)
}

function getGlobalMedian(): number {
  if (!missionData.value || !missionData.value.services) return 0
  const servicesWithMedian = missionData.value.services.filter((s: any) => s.globalMedian !== undefined)
  if (servicesWithMedian.length === 0) return 0
  const sum = servicesWithMedian.reduce((acc: number, s: any) => acc + normalizeScore(s.globalMedian), 0)
  return Math.min(100, Math.round(sum / servicesWithMedian.length)) // Ensure score doesn't exceed 100%
}

function getDimensionMedian(service: any, dimension: string): number {
  const score = service.dimensionScores?.find((s: DimensionScore) => s.dimension === dimension)
  return score && (score as any).median !== undefined ? Math.round(normalizeScore((score as any).median)) : 0
}

function getAverageScore(dimension: string): number {
  if (!missionData.value?.services) return 0
  const scores = missionData.value.services.map((s: any) => getDimensionScore(s, dimension))
  const sum = scores.reduce((acc: number, s: number) => acc + s, 0)
  return Math.min(100, Math.round(sum / scores.length)) // Ensure score doesn't exceed 100%
}

function getGlobalAverage(): number {
  if (!missionData.value?.services) return 0
  const sum = missionData.value.services.reduce((acc: number, s: any) => acc + normalizeScore(s.globalScore), 0)
  return Math.min(100, Math.round(sum / missionData.value.services.length)) // Ensure score doesn't exceed 100%
}

function getScoreClass(score: number): string {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

// Get CSS class for median: uses inverted logic
function getMedianClass(median: number): string {
  return getLevelFromMedian(median)
}

function getServiceColor(serviceId: number | null): string {
  if (!serviceId) return '#9333ea'
  const colors = ['#9333ea', '#2563eb', '#10b981', '#f59e0b', '#ef4444']
  return colors[(serviceId - 1) % colors.length]
}

function exportToExcel() {
  // TODO: Implement Excel export
  alert('Export Excel à implémenter')
}

function getDimensionIconPath(dimension: string): string[] {
  const iconPaths: Record<string, string[]> = {
    ambition: ['M12 2L2 7L12 12L22 7L12 2Z', 'M2 17L12 22L22 17', 'M2 12L12 17L22 12'],
    pilotage: ['M3 3H21V21H3V3Z', 'M9 9H15V15H9V9Z', 'M3 9H21', 'M9 3V21'],
    organisation: ['M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21', 'M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z', 'M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13', 'M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88'],
    culture: ['M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z', 'M12 6V18', 'M6 12H18'],
    donnees: ['M12 5C16.9706 5 21 6.34315 21 8C21 9.65685 16.9706 11 12 11C7.02944 11 3 9.65685 3 8C3 6.34315 7.02944 5 12 5Z', 'M3 12C3 13.6569 7.02944 15 12 15C16.9706 15 21 13.6569 21 12', 'M3 5V19C3 20.6569 7.02944 22 12 22C16.9706 22 21 20.6569 21 19V5'],
    cas_usage: ['M9 11L12 14L22 4', 'M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16'],
    ecosysteme: ['M12 2L2 7L12 12L22 7L12 2Z', 'M2 17L12 22L22 17', 'M2 12L12 17L22 12'],
    expertise: ['M12 14L9 11L12 8L15 11L12 14Z', 'M12 2L2 7L12 12L22 7L12 2Z', 'M2 17L12 22L22 17', 'M2 12L12 17L22 12'],
    technologie: ['M2 3H22V17H2V3Z', 'M8 21H16', 'M12 17V21'],
    mise_en_oeuvre: ['M13 2L3 14H12L11 22L21 10H12L13 2Z']
  }
  return iconPaths[dimension] || iconPaths.ambition
}

function formatDimension(dimension: string): string {
  const map: Record<string, string> = {
    ambition: 'Ambition',
    pilotage: 'Pilotage',
    organisation: 'Organisation',
    organization: 'Organisation',
    culture: 'Culture',
    donnees: 'Données',
    cas_usage: 'Cas d\'usage',
    ecosysteme: 'Écosystème',
    expertise: 'Expertise',
    technologie: 'Technologie',
    technology: 'Technologie',
    mise_en_oeuvre: 'Mise en œuvre',
    strategy: 'Stratégie',
    governance: 'Gouvernance',
    skills: 'Compétences',
    usage: 'Usage',
    measurement: 'Mesure',
    data: 'Données',
    ethics: 'Éthique',
    innovation: 'Innovation'
  }
  return map[dimension] || dimension
}

function getLevelLabel(level: string): string {
  const map: Record<string, string> = {
    low: 'Niveau Faible',
    medium: 'Niveau Moyen',
    high: 'Niveau Élevé'
  }
  return map[level] || level
}

function getProgressText(score: DimensionScore): string {
  // Calculate progress based on score (assuming max is 100)
  const maxScore = 100
  const current = Math.round(normalizeScore(score.score))
  return `${current}/${maxScore}`
}

// Normalize dimension key (same logic as backend)
function normalizeDimensionKeyFrontend(value: string | null | undefined): string | null {
  if (value == null) return null
  let s = String(value).trim()
  
  // Remove surrounding quotes (handle both single and double quotes, and nested quotes)
  while ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim()
  }
  s = s.replace(/^["']+|["']+$/g, '').trim()
  
  // Normalize: lowercase, remove accents, replace spaces with underscores
  s = s.toLowerCase().trim()
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  s = s.replace(/\s+/g, '_').trim() // Replace all whitespace with underscore and trim again
  
  const map: Record<string, string> = {
    data: 'donnees',
    donnees: 'donnees',
    'data_management': 'donnees',
    'data_strategy': 'donnees',
    ecosystem: 'ecosysteme',
    ecosysteme: 'ecosysteme',
    'ecosystem_partners': 'ecosysteme',
    'ecosystem_network': 'ecosysteme',
    technology: 'technologie',
    technologie: 'technologie',
    tech: 'technologie',
    'tech_stack': 'technologie',
    'technology_stack': 'technologie',
    'technical_infrastructure': 'technologie',
    'use_cases': 'cas_usage',
    'use cases': 'cas_usage',
    'usecase': 'cas_usage',
    'cas_usage': 'cas_usage',
    'use_case': 'cas_usage',
    'use_cases_list': 'cas_usage',
    usage: 'cas_usage',
    'use case': 'cas_usage',
    implementation: 'mise_en_oeuvre',
    'mise_en_oeuvre': 'mise_en_oeuvre',
    'mise en oeuvre': 'mise_en_oeuvre',
    'deployment': 'mise_en_oeuvre',
    'execution': 'mise_en_oeuvre',
    'project_execution': 'mise_en_oeuvre',
    culture: 'culture',
    'organizational_culture': 'culture',
    'company_culture': 'culture',
    ambition: 'ambition',
    'strategic_ambition': 'ambition',
    'vision': 'ambition',
    'strategic_vision': 'ambition',
    organisation: 'organisation',
    organization: 'organisation',
    'organizational_structure': 'organisation',
    'org_structure': 'organisation',
    pilotage: 'pilotage',
    'governance': 'pilotage',
    'management': 'pilotage',
    'project_management': 'pilotage',
    'steering': 'pilotage',
    expertise: 'expertise',
    skills: 'expertise',
    'competencies': 'expertise',
    'capabilities': 'expertise',
    'talent': 'expertise'
  }
  const result = map[s] || s
  return result ? result.trim() : null // Final trim to ensure no trailing spaces
}

function getRecommendationSynthesis(score: DimensionScore): string {
  // Placeholder to fix syntax error
  return '';
}

function getRecommendationDescription(score: DimensionScore): string {
  // Check if we have edited version
  if (editedRecommendations.value[score.dimension]?.description) {
    return editedRecommendations.value[score.dimension].description
  }
  
  // Normalize the score dimension
  const normalizedScoreDimension = normalizeDimensionKeyFrontend(score.dimension) || score.dimension
  
  // For GLOBAL view, use GLOBAL recommendations (distinct from service recommendations)
  if (activeView.value === 'comparison') {
    // Use global recommendations from API (these are for the entire organization)
    if (recommendations.value && Array.isArray(recommendations.value)) {
      console.log('[Frontend] getRecommendationDescription - Looking for dimension:', score.dimension, '(normalized:', normalizedScoreDimension, ')')
      console.log('[Frontend] Available recommendations:', recommendations.value.map((r: any) => ({ 
        dimension: r.dimension, 
        normalized: normalizeDimensionKeyFrontend(r.dimension),
        hasDescription: !!r.description 
      })))
      
      // Try exact match first
      let rec = recommendations.value.find((r: any) => 
        r.dimension === score.dimension
      )
      
      // If not found, try normalized match
      if (!rec) {
        rec = recommendations.value.find((r: any) => {
          const normalizedRecDimension = normalizeDimensionKeyFrontend(r.dimension)
          return normalizedRecDimension === normalizedScoreDimension
        })
      }
      
      console.log('[Frontend] Found recommendation:', rec ? { 
        dimension: rec.dimension, 
        normalized: normalizeDimensionKeyFrontend(rec.dimension),
        hasDescription: !!rec.description, 
        descriptionPreview: rec.description?.substring(0, 50) 
      } : 'NOT FOUND')
      
      if (rec?.description) return rec.description
      
      // If recommendation exists but no description, return empty string (not undefined)
      return ''
    }
  }
  
  // For SERVICE view, use service-specific recommendations
  if (activeView.value === 'details' && selectedServiceData.value?.recommendations) {
    const rec = selectedServiceData.value.recommendations.find((r: any) => 
      r.dimension === score.dimension
    )
    if (rec?.description) return rec.description
    
    // If recommendation exists but no description, return empty string
    return ''
  }
  
  // Default descriptions by dimension
  const descriptions: Record<string, string> = {
    pilotage: 'Pour un pilotage avancé, il est nécessaire de structurer la gestion des projets et de s\'assurer de l\'alignement avec les objectifs d\'affaires.',
    organisation: 'Une organisation efficace nécessite une structuration claire des rôles et responsabilités autour des projets IA.',
    culture: 'Développer une culture d\'innovation et d\'adoption de l\'IA nécessite un engagement fort de la direction et des équipes.',
    ambition: 'Définir une vision claire et partagée de l\'IA comme levier stratégique pour votre organisation.',
    donnees: 'Mettre en place une stratégie de gestion et de valorisation des données pour alimenter vos projets IA.',
    cas_usage: 'Identifier et prioriser des cas d\'usage IA concrets et à forte valeur ajoutée pour votre organisation.',
    ecosysteme: 'Construire un réseau de partenaires et d\'acteurs pour accompagner vos projets IA.',
    expertise: 'Investir dans la formation et le développement des compétences IA de vos équipes.',
    technologie: 'Évaluer et moderniser votre infrastructure technologique pour supporter efficacement l\'IA.',
    mise_en_oeuvre: 'Mettre en place des processus et méthodes pour conduire efficacement les projets IA de la conception à la production.'
  }
  
  return descriptions[score.dimension] || `Recommandations pour améliorer la dimension ${formatDimension(score.dimension)}.`
}

function getRecommendationActions(score: DimensionScore): string[] {
  // Check if we have edited version
  if (editedRecommendations.value[score.dimension]?.actions) {
    return editedRecommendations.value[score.dimension].actions
  }
  
  // Normalize the score dimension
  const normalizedScoreDimension = normalizeDimensionKeyFrontend(score.dimension) || score.dimension
  
  // For GLOBAL view, use GLOBAL recommendations (distinct from service recommendations)
  if (activeView.value === 'comparison') {
    // Use global recommendations from API (these are for the entire organization)
    if (recommendations.value && Array.isArray(recommendations.value)) {
      // Try exact match first
      let rec = recommendations.value.find((r: any) => 
        r.dimension === score.dimension
      )
      
      // If not found, try normalized match
      if (!rec) {
        rec = recommendations.value.find((r: any) => {
          const normalizedRecDimension = normalizeDimensionKeyFrontend(r.dimension)
          return normalizedRecDimension === normalizedScoreDimension
        })
      }
      
      if (rec?.actions && Array.isArray(rec.actions)) return rec.actions
    }
  }
  
  // For SERVICE view, use service-specific recommendations
  if (activeView.value === 'details' && selectedServiceData.value?.recommendations) {
    const rec = selectedServiceData.value.recommendations.find((r: any) => 
      r.dimension === score.dimension
    )
    if (rec?.actions && Array.isArray(rec.actions)) return rec.actions
  }
  
  // Default actions by dimension
  const actionsMap: Record<string, string[]> = {
    pilotage: [
      'Optimiser la gestion de portefeuille de projets IA',
      'Aligner les projets sur les priorités stratégiques',
      'Mettre en place un tableau de bord de suivi'
    ],
    organisation: [
      'Définir les rôles et responsabilités autour de l\'IA',
      'Créer des équipes dédiées aux projets IA',
      'Mettre en place des processus de coordination'
    ],
    culture: [
      'Organiser des sessions de sensibilisation à l\'IA',
      'Créer des espaces d\'échange et de partage',
      'Valoriser les initiatives et succès IA'
    ],
    ambition: [
      'Définir une vision stratégique de l\'IA',
      'Communiquer la vision à tous les niveaux',
      'Intégrer l\'IA dans la stratégie d\'entreprise'
    ],
    donnees: [
      'Cartographier les données disponibles',
      'Mettre en place une gouvernance des données',
      'Améliorer la qualité et l\'accessibilité des données'
    ],
    cas_usage: [
      'Identifier les processus à fort potentiel',
      'Prioriser les cas d\'usage par valeur',
      'Lancer des projets pilotes'
    ],
    ecosysteme: [
      'Identifier les partenaires stratégiques',
      'Participer à des réseaux et événements IA',
      'Développer des partenariats technologiques'
    ],
    expertise: [
      'Évaluer les compétences actuelles',
      'Définir un plan de formation',
      'Recruter ou développer des experts IA'
    ],
    technologie: [
      'Auditer l\'infrastructure existante',
      'Planifier la modernisation technologique',
      'Choisir les outils et plateformes adaptés'
    ],
    mise_en_oeuvre: [
      'Définir une méthodologie de projet IA',
      'Mettre en place des processus de validation',
      'Assurer le suivi et la maintenance'
    ]
  }
  
  return actionsMap[score.dimension] || [
    `Améliorer la dimension ${formatDimension(score.dimension)}`,
    'Mettre en place des actions concrètes',
    'Mesurer les progrès régulièrement'
  ]
}

function getRecommendationServices(score: DimensionScore): string[] {
  // Check if we have edited version
  if (editedRecommendations.value[score.dimension]?.services) {
    return editedRecommendations.value[score.dimension].services
  }
  
  // Normalize the score dimension
  const normalizedScoreDimension = normalizeDimensionKeyFrontend(score.dimension) || score.dimension
  
  // For GLOBAL view, use GLOBAL recommendations (distinct from service recommendations)
  if (activeView.value === 'comparison') {
    // Use global recommendations from API (these are for the entire organization)
    if (recommendations.value && Array.isArray(recommendations.value)) {
      // Try exact match first
      let rec = recommendations.value.find((r: any) => 
        r.dimension === score.dimension
      )
      
      // If not found, try normalized match
      if (!rec) {
        rec = recommendations.value.find((r: any) => {
          const normalizedRecDimension = normalizeDimensionKeyFrontend(r.dimension)
          return normalizedRecDimension === normalizedScoreDimension
        })
      }
      
      if (rec?.services && Array.isArray(rec.services)) return rec.services
    }
  }
  
  // For SERVICE view, use service-specific recommendations
  if (activeView.value === 'details' && selectedServiceData.value?.recommendations) {
    const rec = selectedServiceData.value.recommendations.find((r: any) => 
      r.dimension === score.dimension
    )
    if (rec?.services && Array.isArray(rec.services)) return rec.services
  }
  
  // Default services by dimension
  const servicesMap: Record<string, string[]> = {
    pilotage: [
      'Cours avancés en gestion de portefeuille de projets',
      'Webinars sur l\'alignement stratégique et l\'IA'
    ],
    organisation: [
      'Formation à la structuration organisationnelle',
      'Ateliers sur les rôles et responsabilités'
    ],
    culture: [
      'Sessions de sensibilisation à l\'IA',
      'Formation à la culture d\'innovation'
    ],
    ambition: [
      'Stratégie et vision d\'entreprise',
      'Formation au leadership IA'
    ],
    donnees: [
      'Formation à la gouvernance des données',
      'Cours sur la qualité et la valorisation des données'
    ],
    cas_usage: [
      'Ateliers d\'identification de cas d\'usage',
      'Formation à la priorisation de projets'
    ],
    ecosysteme: [
      'Networking et événements IA',
      'Formation au partenariat technologique'
    ],
    expertise: [
      'Formations techniques IA',
      'Certifications et parcours de compétences'
    ],
    technologie: [
      'Formation aux technologies IA',
      'Ateliers sur l\'infrastructure et les outils'
    ],
    mise_en_oeuvre: [
      'Formation aux méthodologies de projet IA',
      'Cours sur le déploiement et la maintenance'
    ]
  }
  
  return servicesMap[score.dimension] || [
    'Formations générales sur l\'IA',
    'Accompagnement personnalisé'
  ]
}


function startEditing(dimension: string) {
  if (editingRecommendation.value?.dimension === dimension) {
    // Cancel editing - restore original values
    editingRecommendation.value = null
    // Don't delete, just close editing mode
    // delete editedRecommendations.value[dimension]
  } else {
    // Start editing
    editingRecommendation.value = { dimension, field: 'description' }
    
    // Initialize edited data if not already present
    if (!editedRecommendations.value[dimension]) {
      const score = activeView.value === 'comparison' 
        ? organizationDimensionScores.value.find(s => s.dimension === dimension)
        : selectedServiceData.value?.dimensionScores.find((s: DimensionScore) => s.dimension === dimension)
      
      if (score) {
        editedRecommendations.value[dimension] = {
          synthesis: getRecommendationSynthesis(score),
          description: getRecommendationDescription(score),
          actions: [...getRecommendationActions(score)],
          services: [...getRecommendationServices(score)]
        }
      }
    }
  }
}

function startEditingField(dimension: string, field: string) {
  if (editingRecommendation.value?.dimension !== dimension) {
    startEditing(dimension)
  }
  editingRecommendation.value = { dimension, field }
}

function cancelEditing(dimension: string) {
  editingRecommendation.value = null
  // Remove from saved in current session if canceling
  savedInCurrentSession.value.delete(dimension)
  // Restore original values
  const score = activeView.value === 'comparison' 
    ? organizationDimensionScores.value.find(s => s.dimension === dimension)
    : selectedServiceData.value?.dimensionScores.find((s: DimensionScore) => s.dimension === dimension)
  
  if (score) {
    editedRecommendations.value[dimension] = {
      description: getRecommendationDescription(score),
      actions: [...getRecommendationActions(score)],
      services: [...getRecommendationServices(score)]
    }
  } else {
    delete editedRecommendations.value[dimension]
  }
}

function addAction(dimension: string) {
  if (!editedRecommendations.value[dimension]) {
    const score = activeView.value === 'comparison' 
      ? organizationDimensionScores.value.find(s => s.dimension === dimension)
      : selectedServiceData.value?.dimensionScores.find((s: DimensionScore) => s.dimension === dimension)
    if (score) {
      editedRecommendations.value[dimension] = {
        description: getRecommendationDescription(score),
        actions: [...getRecommendationActions(score)],
        services: [...getRecommendationServices(score)]
      }
    } else {
      editedRecommendations.value[dimension] = {
        synthesis: '',
        description: '',
        actions: [],
        services: []
      }
    }
  }
  if (!editedRecommendations.value[dimension].actions) {
    editedRecommendations.value[dimension].actions = []
  }
  editedRecommendations.value[dimension].actions.push('Nouvelle action')
  // Mark dimension as modified
  modifiedDimensions.value.add(dimension)
  // Start editing the new action
  const newIndex = editedRecommendations.value[dimension].actions.length - 1
  startEditingField(dimension, `actions-${newIndex}`)
}

function removeAction(dimension: string, index: number) {
  if (editedRecommendations.value[dimension]?.actions) {
    editedRecommendations.value[dimension].actions.splice(index, 1)
    // Mark dimension as modified
    modifiedDimensions.value.add(dimension)
    // Cancel editing if we were editing this field
    if (editingRecommendation.value?.dimension === dimension && editingRecommendation.value?.field === `actions-${index}`) {
      editingRecommendation.value = null
    }
  }
}

function addService(dimension: string) {
  if (!editedRecommendations.value[dimension]) {
    const score = activeView.value === 'comparison' 
      ? organizationDimensionScores.value.find(s => s.dimension === dimension)
      : selectedServiceData.value?.dimensionScores.find((s: DimensionScore) => s.dimension === dimension)
    if (score) {
      editedRecommendations.value[dimension] = {
        description: getRecommendationDescription(score),
        actions: [...getRecommendationActions(score)],
        services: [...getRecommendationServices(score)]
      }
    } else {
      editedRecommendations.value[dimension] = {
        synthesis: '',
        description: '',
        actions: [],
        services: []
      }
    }
  }
  if (!editedRecommendations.value[dimension].services) {
    editedRecommendations.value[dimension].services = []
  }
  editedRecommendations.value[dimension].services.push('Nouveau service')
  // Mark dimension as modified
  modifiedDimensions.value.add(dimension)
  // Start editing the new service
  const newIndex = editedRecommendations.value[dimension].services.length - 1
  startEditingField(dimension, `services-${newIndex}`)
}

function removeService(dimension: string, index: number) {
  if (editedRecommendations.value[dimension]?.services) {
    editedRecommendations.value[dimension].services.splice(index, 1)
    // Mark dimension as modified
    modifiedDimensions.value.add(dimension)
    // Cancel editing if we were editing this field
    if (editingRecommendation.value?.dimension === dimension && editingRecommendation.value?.field === `services-${index}`) {
      editingRecommendation.value = null
    }
  }
}

async function saveEditing(dimension: string) {
  // Determine which scores to use based on view
  const scoresToUse = activeView.value === 'comparison' 
    ? organizationDimensionScores.value
    : selectedServiceData.value?.dimensionScores || []
  
  if (scoresToUse.length === 0) {
    console.error('Aucun score disponible pour sauvegarder')
    alert('Erreur : Aucun score disponible pour sauvegarder')
    return
  }
  
  // Save to API
  try {
    const recommendationsToSave = scoresToUse.map((score: DimensionScore) => {
      const edited = editedRecommendations.value[score.dimension]
      if (edited) {
        return {
          dimension: score.dimension,
          score: score.score,
          level: score.level,
          synthesis: edited.synthesis !== undefined ? edited.synthesis : getRecommendationSynthesis(score),
          description: edited.description !== undefined ? edited.description : getRecommendationDescription(score),
          actions: edited.actions !== undefined ? edited.actions : getRecommendationActions(score),
          services: edited.services !== undefined ? edited.services : getRecommendationServices(score)
        }
      }
      return {
        dimension: score.dimension,
        score: score.score,
        level: score.level,
        synthesis: getRecommendationSynthesis(score),
        description: getRecommendationDescription(score),
        actions: getRecommendationActions(score),
        services: getRecommendationServices(score)
      }
    })
    
    const missionId = query.mission
    if (!missionId) {
      console.error('Mission ID manquant')
      alert('Erreur : Mission ID manquant')
      return
    }
    
    const payload = {
      missionId: parseInt(missionId as string),
      serviceId: activeView.value === 'details' && selectedServiceId.value ? parseInt(selectedServiceId.value.toString()) : null,
      recommendations: recommendationsToSave
    }
    
    console.log('Saving recommendations:', payload)
    
    const response = await fetch('/api/results/recommendations', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
      console.error('Erreur lors de la sauvegarde:', errorData)
      alert(`Erreur lors de la sauvegarde des recommandations: ${errorData.error || errorData.message || 'Erreur inconnue'}`)
      return
    }
    
    const successData = await response.json()
    const modifiedAt = successData.modifiedAt
    
    // Only mark as modified and close editing AFTER successful save
    modifiedDimensions.value.add(dimension)
    savedInCurrentSession.value.add(dimension)
    editingRecommendation.value = null
    
    if (activeView.value === 'comparison') {
      lastModified.value = modifiedAt
    } else if (selectedServiceData.value) {
      // Update service lastModified
      const service = missionData.value?.services.find((s: any) => s.id === selectedServiceId.value)
      if (service) {
        service.lastModified = modifiedAt
      }
    }
    
    // Show success feedback
    console.log('Recommandations sauvegardées avec succès')
  } catch (error: any) {
    console.error('Error saving recommendations:', error)
    alert(`Erreur lors de la sauvegarde des recommandations: ${error.message || 'Erreur de connexion'}`)
  }
}

async function approveRecommendations() {
  try {
    // Update service status to validated
    if (activeView.value === 'details' && selectedServiceId.value && missionData.value) {
      const service = missionData.value.services.find((s: any) => s.id === selectedServiceId.value)
      if (service) {
        service.status = 'validated'
        
        // Send update to API
        const missionId = query.mission
        if (missionId) {
          const response = await fetch(`/api/missions/${missionId}/services/${selectedServiceId.value}/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          })
          
          if (!response.ok) {
            console.warn('Could not update service status on server')
          }
        }
      }
    } else if (activeView.value === 'comparison' && missionData.value) {
      // Validate all services
      if (missionData.value.services) {
        missionData.value.services.forEach((service: any) => {
          service.status = 'validated'
        })
        
        // Send update to API for all services
        const missionId = query.mission
        if (missionId) {
          const serviceIds = missionData.value.services.map((s: any) => s.id)
          for (const serviceId of serviceIds) {
            try {
              await fetch(`/api/missions/${missionId}/services/${serviceId}/validate`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
              })
            } catch (err) {
              console.warn(`Could not validate service ${serviceId}:`, err)
            }
          }
        }
      }
    }
    
    recommendationsApproved.value = true
    alert('Recommandations approuvées. Vous pouvez maintenant générer les rapports PDF.')
  } catch (error: any) {
    console.error('Error approving recommendations:', error)
    alert('Erreur lors de l\'approbation des recommandations. Les recommandations sont approuvées localement mais le statut n\'a pas pu être sauvegardé.')
    recommendationsApproved.value = true // Still allow PDF generation
  }
}

function previewReport() {
  // Open preview in new window
  const url = `/report/${query.mission}`
  window.open(url, '_blank')
}

async function generateSyntheticReport() {
  if (!missionData.value || !mission.value) return
  
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  

async function generateDetailedReport() {
  if (regenerating.value) return
  
  try {
    regenerating.value = true
    // 1. Show the report template off-screen
    showReportTemplate.value = true
    
    // 2. Wait for Vue to render and charts to animate/settle
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const reportContainer = document.querySelector('#report-content') as HTMLElement
    if (!reportContainer) {
      throw new Error('Report template container not found')
    }
    
    const pages = reportContainer.querySelectorAll('.report-page')
    if (!pages || pages.length === 0) {
      throw new Error('No report pages found')
    }
    
    // 3. Initialize PDF
    const { jsPDF } = await import('jspdf')
    // A4 Landscape: 297mm x 210mm
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })
    
    const html2canvas = (await import('html2canvas')).default
    
    // 4. Capture each page
    for (let i = 0; i < pages.length; i++) {
      if (i > 0) doc.addPage()
      
      const page = pages[i] as HTMLElement
      
      const canvas = await html2canvas(page, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1500 // Ensure layout matches expected width
      })
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      doc.addImage(imgData, 'JPEG', 0, 0, 297, 210)
    }
    
    // 5. Save
    const organizationName = mission.value?.organizationName || 'Organisation'
    const fileName = `Rapport_Resultats_${organizationName.replace(/[^a-z0-9]/gi, '_')}.pdf`
    doc.save(fileName)
    
  } catch (error) {
    console.error('Error generating report:', error)
    alert('Une erreur est survenue lors de la génération du rapport PDF.')
  } finally {
    showReportTemplate.value = false
    regenerating.value = false
  }
}

async function generateWorkshopGuide() {
   alert("Cette fonctionnalité sera bientôt disponible avec le nouveau format.")
}

async function generateSyntheticReport() {
    // Reuse the new detailed report logic for now as it covers global results
    await generateDetailedReport()
}


// Legacy functions removed



// Legacy functions (generateCoverPage, loadImage) removed


// Add subtle decorative elements inspired by Images & Réseaux design
// Positioned in corners and edges to avoid covering text

// More legacy functions removed


// Legacy PDF generation functions removed
function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function openHistoryModal() {
  showHistoryModal.value = true
  loadHistory()
}

function closeHistoryModal() {
  showHistoryModal.value = false
  historyData.value = []
  historyError.value = ''
}

async function loadHistory() {
  historyLoading.value = true
  historyError.value = ''
  
  try {
    const missionId = query.mission
    const serviceId = activeView.value === 'details' && selectedServiceId.value ? selectedServiceId.value : null
    
    let url = `/api/results/history?missionId=${missionId}`
    if (serviceId) {
      url += `&serviceId=${serviceId}`
    }
    
    const response = await fetch(url)
    
    if (response.ok) {
      const data = await response.json()
      historyData.value = data.history || []
    } else {
      const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
      historyError.value = error.error || 'Erreur lors du chargement de l\'historique'
    }
  } catch (error: any) {
    historyError.value = error.message || 'Erreur de connexion'
  } finally {
    historyLoading.value = false
  }
}

function openRegenerateModal(scope: 'all' | 'service') {
  regenerateScope.value = scope
  showRegenerateModal.value = true
  // Reset params
  regenerateParams.value = {
    language: 'fr',
    tone: 'professional',
    detailLevel: 'balanced',
    priorityAxis: 'all',
    additionalContext: ''
  }
}

function closeRegenerateModal() {
  showRegenerateModal.value = false
  regenerating.value = false
}

async function regenerateRecommendations() {
  regenerating.value = true
  
  try {
    const missionId = query.mission
    const serviceId = regenerateScope.value === 'service' && selectedServiceId.value ? selectedServiceId.value : null
    
    const requestBody = {
      missionId: parseInt(missionId as string),
      serviceId: serviceId ? parseInt(serviceId.toString()) : null,
      language: regenerateParams.value.language,
      tone: regenerateParams.value.tone,
      detailLevel: regenerateParams.value.detailLevel,
      priorityAxis: regenerateParams.value.priorityAxis,
      additionalContext: regenerateParams.value.additionalContext
    }
    
    console.log('[Frontend] Regenerating recommendations with params:', requestBody)
    console.log('[Frontend] Additional context:', regenerateParams.value.additionalContext)
    console.log('[Frontend] Additional context length:', regenerateParams.value.additionalContext?.length || 0)
    
    console.log('[Frontend] Sending request to /api/results/regenerate')
    console.log('[Frontend] Request body:', JSON.stringify(requestBody, null, 2))
    
    let response
    try {
      response = await fetch('/api/results/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(180000) // 3 minutes timeout (aligned with server timeout)
      })
    } catch (error: any) {
      console.error('[Frontend] Fetch error:', error)
      // Better error messages based on error type
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        throw new Error('La requête a pris trop de temps. Le serveur peut être surchargé. Veuillez réessayer.')
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez que le serveur backend est démarré sur le port 3000.')
      } else {
        throw new Error(`Erreur de connexion: ${error.message || 'Erreur inconnue'}`)
      }
    }
    
    if (response.ok) {
      console.log('[Frontend] ✅ Regeneration successful, closing modal and reloading results')
      closeRegenerateModal()
      
      await response.json()
      
      // Reload results
      await loadResults()
      alert('Recommandations régénérées avec succès')
    } else {

      const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
      
      // Message spécifique si l'erreur vient d'OpenAI (clé/quotas/réponse invalide, etc.)
      if (error.openaiError) {
        alert(
          `Erreur OpenAI lors de la régénération des recommandations : ` +
          `${error.message || error.error || 'Erreur inconnue avec l’API OpenAI.'}`
        )
      } else {
        alert(`Erreur lors de la régénération: ${error.error || error.message || 'Erreur inconnue'}`)
      }
    }
    } catch (error: any) {
      console.error('[Frontend] ❌ Error regenerating recommendations:', error)
      console.error('[Frontend] Error name:', error.name)
      console.error('[Frontend] Error message:', error.message)
      
      // Provide user-friendly error messages
      let errorMessage = error.message || 'Erreur de connexion'
      let showDetailedHelp = false
      
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        errorMessage = 'La requête a pris trop de temps. Le serveur peut être surchargé ou l\'appel à OpenAI est trop long. Veuillez réessayer.'
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        errorMessage = 'Impossible de se connecter au serveur backend.\n\nLe serveur backend (port 3000) n\'est probablement pas démarré.\n\nVérifiez que:\n1. Le serveur backend est démarré (cd server && node index.js)\n2. Le serveur écoute bien sur le port 3000\n3. Aucun firewall ne bloque la connexion'
        showDetailedHelp = true
      } else if (error.message?.includes('connexion')) {
        errorMessage = error.message
      }
      
      if (showDetailedHelp) {
        alert(`Erreur lors de la régénération:\n\n${errorMessage}\n\n💡 Solution rapide:\n- Ouvrez un terminal dans le dossier "server"\n- Exécutez: node index.js\n- Vérifiez que vous voyez: "✅ Server running on http://localhost:3000"`)
      } else {
        alert(`Erreur lors de la régénération: ${errorMessage}`)
      }
    } finally {
      regenerating.value = false
    }
}
