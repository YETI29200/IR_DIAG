<template>
  <div class="flash-dashboard">
    <header class="header">
      <div class="container">
        <div class="header-left">
          <div class="header-title">
            <h1>Analytics Flash Diag</h1>
            <p class="header-subtitle">Analyse spécifique des diagnostics rapides</p>
          </div>
        </div>

        <div class="header-actions">
          <router-link to="/admin/consolidated" class="pill-button-yellow">
            Tableau de Bord Global
          </router-link>
          <router-link to="/admin/dashboard" class="pill-button-yellow">
            Dashboard Missions
          </router-link>
        </div>
      </div>
    </header>

    <main class="main" v-if="!loading">
      <div class="container">
        <!-- Métriques dédiées Flash -->
        <div class="flash-metrics">
          <div class="metric-card">
            <span class="metric-label">Missions Flash</span>
            <span class="metric-value">{{ flashMissions.length }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Sociétés Diagnostiquées</span>
            <span class="metric-value">{{ uniqueOrganizations }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Progression Moyenne</span>
            <span class="metric-value">{{ avgProgression }}%</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Maturité Moyenne</span>
            <span class="metric-value">{{ avgMaturity }}%</span>
          </div>
        </div>

        <!-- Section Graphiques Analytics -->
        <div class="analytics-grid">
          <!-- Graphique 1: Volume de Flash Diags par mois -->
          <div class="chart-container card">
            <h3>Activité Flash Diag</h3>
            <p class="chart-desc">Nombre de diagnostics initiés par mois</p>
            <div class="chart-wrapper">
              <canvas ref="volumeChartRef"></canvas>
            </div>
          </div>

          <!-- Graphique 2: Répartition par Secteur (Volume) -->
          <div class="chart-container card">
            <h3>Pénétration par Secteur</h3>
            <p class="chart-desc">Nombre de Flash Diags par secteur d'activité</p>
            <div class="chart-wrapper">
              <canvas ref="sectorVolumeChartRef"></canvas>
            </div>
          </div>

          <!-- Graphique 3: Score de Maturité par Secteur -->
          <div class="chart-container card">
            <h3>Maturité Flash par Secteur</h3>
            <p class="chart-desc">Score moyen de maturité (%) identifié par secteur</p>
            <div class="chart-wrapper">
              <canvas ref="sectorMaturityChartRef"></canvas>
            </div>
          </div>

          <!-- Graphique 4: Distribution de la taille des entreprises -->
          <div class="chart-container card">
            <h3>Profil des Entreprises</h3>
            <p class="chart-desc">Répartition par tranches d'EVP</p>
            <div class="chart-wrapper">
              <canvas ref="sizeChartRef"></canvas>
            </div>
          </div>
        </div>

        <!-- Liste des missions Flash -->
        <div class="flash-list-section card">
          <div class="section-header">
            <h2>Détail des Missions Flash</h2>
            <div class="filters">
              <select v-model="sectorFilter" class="form-select">
                <option value="">Tous les secteurs</option>
                <option v-for="s in sectors" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
          </div>
          
          <table class="flash-table">
            <thead>
              <tr>
                <th>Organisation</th>
                <th>Secteur</th>
                <th>Taille</th>
                <th>Progression</th>
                <th>Maturité</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in filteredFlashMissions" :key="m.id" @click="goToMission(m.id)" class="clickable-row">
                <td><strong>{{ m.organizationName }}</strong></td>
                <td>{{ m.sector || '-' }}</td>
                <td>{{ m.employees || '-' }}</td>
                <td>
                  <div class="progress-mini">
                    <div class="bar" :style="{ width: getProgress(m) + '%' }"></div>
                    <span>{{ getProgress(m) }}%</span>
                  </div>
                </td>
                <td>
                  <span class="score-badge" :style="{ background: getScoreColor(getMaturity(m)) }">
                    {{ getMaturity(m) }}%
                  </span>
                </td>
                <td>{{ formatDate(m.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
    <div v-else class="loading-state">
      Chargement de l'analyse...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, inject } from 'vue'
import { Chart, registerables } from 'chart.js'
import type { Mission } from '@shared/types'

Chart.register(...registerables)
const router = inject('router') as any

const missions = ref<Mission[]>([])
const loading = ref(true)
const sectorFilter = ref('')

const volumeChartRef = ref<HTMLCanvasElement | null>(null)
const sectorVolumeChartRef = ref<HTMLCanvasElement | null>(null)
const sectorMaturityChartRef = ref<HTMLCanvasElement | null>(null)
const sizeChartRef = ref<HTMLCanvasElement | null>(null)

// Filtrer uniquement les Flash Diags
const flashMissions = computed(() => {
  return missions.value.filter(m => m.questionnaireType === 'flash')
})

const uniqueOrganizations = computed(() => {
  return new Set(flashMissions.value.map(m => m.organizationName)).size
})

const avgProgression = computed(() => {
  if (flashMissions.value.length === 0) return 0
  const total = flashMissions.value.reduce((sum, m) => sum + getProgress(m), 0)
  return Math.round(total / flashMissions.value.length)
})

const avgMaturity = computed(() => {
  const valid = flashMissions.value.filter(m => getMaturity(m) > 0)
  if (valid.length === 0) return 0
  const total = valid.reduce((sum, m) => sum + getMaturity(m), 0)
  return Math.round(total / valid.length)
})

const sectors = computed(() => {
  const s = new Set(flashMissions.value.map(m => m.sector).filter(v => !!v))
  return Array.from(s).sort() as string[]
})

const filteredFlashMissions = computed(() => {
  if (!sectorFilter.value) return flashMissions.value
  return flashMissions.value.filter(m => m.sector === sectorFilter.value)
})

onMounted(async () => {
  await loadData()
  await nextTick()
  renderCharts()
})

async function loadData() {
  try {
    loading.value = true
    const token = localStorage.getItem('auth_token')
    const consultant = JSON.parse(localStorage.getItem('consultant') || '{}')
    
    const res = await fetch(`/api/missions?consultantId=${consultant.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      missions.value = await res.json()
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function renderCharts() {
  if (!volumeChartRef.value) return

  // 1. Volume mensuel
  const monthLabels = getPastMonths(6)
  new Chart(volumeChartRef.value, {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [{
        label: 'Flash Diags',
        data: monthLabels.map(l => countMissionsInMonth(flashMissions.value, l)),
        borderColor: '#2563eb',
        tension: 0.3,
        fill: true,
        backgroundColor: 'rgba(37, 99, 235, 0.1)'
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  })

  // 2. Volume par Secteur
  const sectorCounts = sectors.value.map(s => {
    return flashMissions.value.filter(m => m.sector === s).length
  })
  new Chart(sectorVolumeChartRef.value!, {
    type: 'bar',
    data: {
      labels: sectors.value,
      datasets: [{
        label: 'Nb Missions',
        data: sectorCounts,
        backgroundColor: '#3b82f6'
      }]
    },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
  })

  // 3. Maturité par Secteur
  const sectorScores = sectors.value.map(s => {
    const list = flashMissions.value.filter(m => m.sector === s)
    const sum = list.reduce((acc, m) => acc + getMaturity(m), 0)
    return Math.round(sum / list.length)
  })
  new Chart(sectorMaturityChartRef.value!, {
    type: 'bar',
    data: {
      labels: sectors.value,
      datasets: [{
        label: 'Score Moyen (%)',
        data: sectorScores,
        backgroundColor: '#10b981'
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  })

  // 4. Tailles d'entreprises
  const sizes = ['PME', 'ETI', 'GE', 'TPE']
  const sizeCounts = sizes.map(sz => flashMissions.value.filter(m => String(m.employees || '').includes(sz)).length)
  new Chart(sizeChartRef.value!, {
    type: 'doughnut',
    data: {
      labels: sizes,
      datasets: [{
        data: sizeCounts,
        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444']
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  })
}

// Helpers
function getProgress(m: any) {
  if (!m.contactsCount) return 0
  return Math.round((m.completedCount / m.contactsCount) * 100)
}

function getMaturity(m: any) {
  return m.maturityPercent || getProgress(m) // Fallback sur progression pour les flashs
}

function getScoreColor(score: number) {
  if (score < 30) return '#fee2e2'
  if (score < 60) return '#fef3c7'
  return '#dcfce7'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR')
}

function getPastMonths(n: number) {
  const labels = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push(d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }))
  }
  return labels
}

function countMissionsInMonth(list: any[], monthLabel: string) {
  return list.filter(m => {
    const d = new Date(m.createdAt)
    return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) === monthLabel
  }).length
}

function goToMission(id: number) {
  router.push(`/admin/missions/${id}`)
}
</script>

<style scoped lang="scss">
.flash-dashboard {
  background: #f8fafc;
  min-height: 100vh;
}

.header {
  background: white;
  padding: $spacing-lg 0;
  border-bottom: 1px solid $gray-200;
  margin-bottom: $spacing-xl;

  .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h1 { font-size: $font-size-2xl; color: $gray-900; margin: 0; }
  .header-subtitle { color: $gray-500; margin: 0; }
}

.header-actions {
  display: flex;
  gap: $spacing-md;
}

.pill-button-yellow {
  background: #fef08a;
  color: #854d0e;
  padding: $spacing-sm $spacing-lg;
  border-radius: $radius-full;
  font-weight: 600;
  text-decoration: none;
  font-size: $font-size-sm;
  transition: transform 0.2s;
  &:hover { transform: translateY(-2px); }
}

.main .container {
  max-width: 1200px;
  margin: 0 auto;
}

.flash-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.metric-card {
  background: white;
  padding: $spacing-lg;
  border-radius: $radius-lg;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;

  .metric-label { font-size: $font-size-sm; color: $gray-500; margin-bottom: 4px; }
  .metric-value { font-size: $font-size-3xl; font-weight: 800; color: $gray-900; }
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.card {
  background: white;
  padding: $spacing-xl;
  border-radius: $radius-xl;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}

.chart-container {
  h3 { margin: 0; font-size: $font-size-lg; }
  .chart-desc { font-size: $font-size-xs; color: $gray-400; margin-bottom: $spacing-lg; }
  .chart-wrapper { height: 300px; position: relative; }
}

.flash-list-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-lg;
    h2 { margin: 0; }
  }
}

.flash-table {
  width: 100%;
  border-collapse: collapse;
  th { text-align: left; padding: $spacing-md; color: $gray-500; border-bottom: 2px solid $gray-100; }
  td { padding: $spacing-md; border-bottom: 1px solid $gray-50; }
}

.clickable-row {
  cursor: pointer;
  &:hover { background: #f1f5f9; }
}

.progress-mini {
  display: flex;
  align-items: center;
  gap: 8px;
  .bar { height: 6px; background: #3b82f6; border-radius: 3px; }
  span { font-size: $font-size-xs; color: $gray-600; }
}

.score-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 700;
  font-size: $font-size-xs;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 100px;
  font-weight: 600;
  color: $gray-400;
}
</style>
