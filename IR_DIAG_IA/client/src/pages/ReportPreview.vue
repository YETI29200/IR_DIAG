<template>
  <div class="report-preview">
    <div class="report-header">
      <BackButton :to="backUrl" label="Retour aux résultats" />
      <div class="header-content">
        <h1>Rapport de diagnostic</h1>
      </div>
      <div class="actions">
        <button @click="printReport" class="btn-primary">Imprimer / PDF</button>
      </div>
    </div>

    <div class="report-content" id="report-content">
      <div class="report-cover">
        <h1>Diagnostic IA & Data</h1>
        <h2 v-if="mission">{{ mission.organizationName }}</h2>
        <p class="date">{{ new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
      </div>

      <div class="report-section">
        <h2>Résumé exécutif</h2>
        <p>
          Ce rapport présente les résultats du diagnostic de maturité IA & Data
          réalisé pour {{ mission?.organizationName || 'l\'organisation' }}.
        </p>
      </div>

      <div class="report-section" v-if="dimensionScores && dimensionScores.length > 0">
        <h2>Scores par dimension</h2>
        <div class="scores-table">
          <table>
            <thead>
              <tr>
                <th>Dimension</th>
                <th>Score</th>
                <th>Niveau</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="score in dimensionScores" :key="score.dimension">
                <td>{{ formatDimension(score.dimension) }}</td>
                <td>{{ score.score.toFixed(1) }}%</td>
                <td>
                  <span :class="['level-badge', score.level]">{{ score.level }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="report-section" v-if="dimensionScores && dimensionScores.length > 0">
        <h2>Visualisation</h2>
        <div class="chart-container">
          <RadarChart :scores="dimensionScores" />
        </div>
      </div>

      <div class="report-section" v-if="recommendations.length > 0">
        <h2>Recommandations</h2>
        <div
          v-for="(rec, index) in recommendations"
          :key="index"
          class="recommendation"
        >
          <h3>{{ rec.title }}</h3>
          <p>{{ rec.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ params: any; query: any }>()
import { ref, computed, onMounted, inject } from 'vue'
import RadarChart from '../components/RadarChart.vue'
import BackButton from '../components/BackButton.vue'
import type { DimensionScore } from '@shared/types'

const router = inject('router') as any
const params = router.getParams()

const backUrl = computed(() => {
  const missionId = params.missionId
  return missionId ? `/results?mission=${missionId}` : '/admin/dashboard'
})

const mission = ref<any>(null)
const dimensionScores = ref<DimensionScore[]>([])
const recommendations = ref<any[]>([])

onMounted(async () => {
  await loadReportData()
})

async function loadReportData() {
  try {
    const token = localStorage.getItem('auth_token')
    
    // Load mission
    const missionResponse = await fetch(`/api/missions/${params.missionId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (missionResponse.ok) {
      mission.value = await missionResponse.json()
    }

    // Load results
    const resultsResponse = await fetch(`/api/results?mission=${params.missionId}`)
    if (resultsResponse.ok) {
      const data = await resultsResponse.json()
      dimensionScores.value = data.dimensionScores
      recommendations.value = data.recommendations || []
    }
  } catch (err) {
    console.error('Error loading report:', err)
  }
}

function printReport() {
  window.print()
}

function formatDimension(dimension: string): string {
  // Use dimensionTitle from score if available
  const score = dimensionScores.value.find(s => s.dimension === dimension)
  if (score && (score as any).dimensionTitle) {
    return (score as any).dimensionTitle
  }
  
  const map: Record<string, string> = {
    ambition: 'Ambition',
    pilotage: 'Pilotage',
    organisation: 'Organisation',
    culture: 'Culture',
    donnees: 'Données',
    cas_usage: 'Cas d\'usage',
    ecosysteme: 'Écosystème',
    expertise: 'Expertise',
    technologie: 'Technologie',
    mise_en_oeuvre: 'Mise en œuvre',
    strategy: 'Stratégie',
    governance: 'Gouvernance',
    skills: 'Compétences',
    usage: 'Usage',
    measurement: 'Mesure',
    data: 'Données',
    technology: 'Technologie',
    ethics: 'Éthique',
    innovation: 'Innovation'
  }
  return map[dimension] || dimension
}
</script>

<style lang="scss" scoped>
.report-preview {
  min-height: 100vh;
  background: white;
  padding: $spacing-xl;
}

.report-header {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  margin-bottom: $spacing-xl;
  padding-bottom: $spacing-lg;
  border-bottom: 2px solid $gray-200;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  @media print {
    display: none;
  }
}

.report-content {
  max-width: 800px;
  margin: 0 auto;
}

.report-cover {
  text-align: center;
  padding: $spacing-2xl 0;
  page-break-after: always;

  h1 {
    font-size: 2.5rem;
    margin-bottom: $spacing-lg;
  }

  h2 {
    font-size: 1.5rem;
    color: $gray-600;
    margin-bottom: $spacing-lg;
  }

  .date {
    color: $gray-500;
  }
}

.report-section {
  margin-bottom: $spacing-2xl;
  page-break-inside: avoid;

  h2 {
    color: $primary;
    border-bottom: 2px solid $primary;
    padding-bottom: $spacing-sm;
    margin-bottom: $spacing-lg;
  }
}

.scores-table {
  margin: $spacing-lg 0;

  table {
    width: 100%;
    border-collapse: collapse;

    th, td {
      padding: $spacing-md;
      text-align: left;
      border-bottom: 1px solid $gray-200;
    }

    th {
      background: $gray-100;
      font-weight: 600;
    }
  }
}

.chart-container {
  @include flex-center;
  margin: $spacing-xl 0;
}

.recommendation {
  margin-bottom: $spacing-lg;
  padding: $spacing-lg;
  background: $gray-50;
  border-left: 4px solid $primary;

  h3 {
    color: $primary;
    margin-bottom: $spacing-sm;
  }
}

.level-badge {
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-md;
  font-size: $font-size-xs;
  font-weight: 600;
  text-transform: uppercase;

  &.low {
    background: rgba(230, 0, 18, 0.1); // Rouge Images & Réseaux avec transparence
    color: $danger;
  }

  &.medium {
    background: rgba(245, 158, 11, 0.1);
    color: #92400e;
  }

  &.high {
    background: rgba(16, 185, 129, 0.1);
    color: #065f46;
  }
}

// Print styles
@media print {
  .report-preview {
    padding: 0;
  }

  .report-content {
    max-width: 100%;
  }

  @page {
    size: A4;
    margin: 2cm;
  }

  .report-section {
    page-break-inside: avoid;
  }

  .chart-container {
    page-break-inside: avoid;
  }
}

.btn-primary {
  @include button-primary;
}
</style>

