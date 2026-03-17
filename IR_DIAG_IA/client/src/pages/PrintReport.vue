<template>
  <div class="print-page-wrapper">
    <div v-if="loading" class="loading-state">
      Chargement des données du rapport...
    </div>
    <div v-else-if="error" class="error-state">
      {{ error }}
    </div>
    <div v-else id="report-content" class="report-content-container">
       <ReportTemplate 
          :mission="mission"
          :mission-data="missionData"
          :global-scores="organizationDimensionScores || dimensionScores" 
          :recommendations="recommendations"
          :global-median="globalOrganizationMedian"
          :global-nsp-rate="globalOrganizationNSPRate" 
          :report-title="reportTitle"
          :services-data="servicesForPdf"
       />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { router } from '../router'
import ReportTemplate from '../components/ReportTemplate.vue'
import { normalizeScore, normalizeDimensionScore, normalizeDimensionKeyFrontend } from '../utils/scoring'

// Extract query params manually since we are in a simple router setup
const query = router.getQuery()

const mission = ref<any>(null)
const missionData = ref<any>(null)
const dimensionScores = ref<any[]>([])
const recommendations = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const globalOrganizationAverage = ref<number | null>(null)
const globalOrganizationMedian = ref<number | null>(null)
const globalOrganizationNSPRate = ref<number | null>(null)

// Compute organization dimension scores
const organizationDimensionScores = computed(() => {
  if (!missionData.value?.services || missionData.value.services.length === 0) return dimensionScores.value
  
  const dimensionMap = new Map()
  
  missionData.value.services.forEach((service: any) => {
    if (service.dimensionScores) {
      service.dimensionScores.forEach((score: any) => {
        const dimKey = normalizeDimensionKeyFrontend(score.dimension)
        if (!dimensionMap.has(dimKey)) {
          dimensionMap.set(dimKey, { 
            sum: 0, 
            count: 0,
            medianSum: 0,
            nspSum: 0
          })
        }
        const entry = dimensionMap.get(dimKey)
        entry.sum += normalizeScore(score.score)
        if (score.median !== undefined) entry.medianSum += normalizeScore(score.median)
        if (score.nspRate !== undefined) entry.nspSum += score.nspRate
        entry.count += 1
      })
    }
  })
  
  const avgScores: any[] = []
  dimensionMap.forEach((value, dimension) => {
      const avgScore = value.sum / value.count
      avgScores.push({
        dimension,
        score: Math.round(normalizeScore(avgScore)),
        median: Math.round(value.medianSum / value.count),
        nspRate: Math.round(value.nspSum / value.count),
        level: getLevelFromScore(normalizeScore(avgScore)),
        maxScore: 100
      })
  })
  avgScores.sort((a, b) => b.score - a.score)
  return avgScores.length > 0 ? avgScores : dimensionScores.value
})

function getLevelFromScore(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

// Compute services for Detailed Report
const servicesForPdf = computed(() => {
  const mode = query.mode || 'synthetic'
  if (mode === 'detailed' && missionData.value?.services) {
    return missionData.value.services.map((s: any) => ({
      id: s.id,
      name: s.name,
      scores: s.dimensionScores || []
    }))
  }
  return []
})

const reportTitle = computed(() => {
   const mode = query.mode || 'synthetic'
   return mode === 'detailed' ? 'Rapport Complet (Global + Services)' : 'Rapport Synthétique'
})

onMounted(async () => {
  await loadResults()
})

async function loadResults() {
  loading.value = true
  error.value = ''

  try {
    const sessionId = query.session
    const missionId = query.mission
    
    let url = '/api/results?'
    const params: string[] = []
    if (sessionId) params.push(`session=${sessionId}`)
    if (missionId) params.push(`mission=${missionId}`)
    url += params.join('&')

    const response = await fetch(url)
    if (!response.ok) throw new Error('Erreur chargement données')

    const data = await response.json()
    
    mission.value = data.mission
    dimensionScores.value = (data.dimensionScores || []).map(normalizeDimensionScore)
    recommendations.value = data.recommendations || []
    
    globalOrganizationAverage.value = data.globalOrganizationAverage ? normalizeScore(data.globalOrganizationAverage) : null
    globalOrganizationMedian.value = data.globalOrganizationMedian ? normalizeScore(data.globalOrganizationMedian) : null
    globalOrganizationNSPRate.value = data.globalOrganizationNSPRate || null
    
    missionData.value = {
       services: (data.services || []).map((s: any) => ({
         ...s,
         dimensionScores: (s.dimensionScores || []).map(normalizeDimensionScore)
       }))
    }
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.print-page-wrapper {
  background: white;
  min-height: 100vh;
}
.loading-state, .error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5rem;
  font-family: sans-serif;
}

@page {
  size: A4 landscape;
  margin: 0;
}
</style>
