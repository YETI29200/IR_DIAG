<template>
  <div class="consolidated-view">
    <header class="header">
      <div class="container">
        <div class="header-left">
          <div class="header-title">
            <h1>Tableau de Bord Consolidé</h1>
            <p class="header-subtitle" v-if="consultant">{{ consultant.firstName }} {{ consultant.lastName }}</p>
          </div>
        </div>

        <div class="header-actions">
        <button class="pill-button-yellow" @click="exportCSV">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 10V13.3333C14 13.687 13.8595 14.0261 13.6095 14.2761C13.3594 14.5262 13.0203 14.6667 12.6667 14.6667H3.33333C2.97971 14.6667 2.64057 14.5262 2.39052 14.2761C2.14048 14.0261 2 13.3333 2 13.3333V10M11.3333 5.33333L8 2M8 2L4.66667 5.33333M8 2V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Exporter CSV
        </button>
        <router-link to="/admin/dashboard" class="pill-button-yellow">
          Dashboard
        </router-link>
        <router-link to="/admin/flash-analytics" class="pill-button-cyan">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 13L10 10M11.5 6.75C11.5 9.37335 9.37335 11.5 6.75 11.5C4.12665 11.5 2 9.37335 2 6.75C2 4.12665 4.12665 2 6.75 2C9.37335 2 11.5 4.12665 11.5 6.75Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Analytics Flash Diag
        </router-link>
        <router-link to="/admin/missions/new" class="pill-button-cyan">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2V14M2 8H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Nouvelle mission
        </router-link>
      </div>
      </div>
    </header>

    <main class="main">
      <div class="container">
        <!-- Métriques clés -->
        <div class="metrics-grid">
          <!-- Flash Diags metrics -->
          <div class="metric-card metric-card-flash">
            <div class="metric-header">
              <h3>⚡ Flash Diags</h3>
            </div>
            <p class="metric-value metric-flash">{{ totalFlashDiags }}</p>
          </div>
          <div class="metric-card metric-card-flash">
            <div class="metric-header">
              <h3>Score Moy. Flash</h3>
            </div>
            <p class="metric-value metric-flash">{{ avgFlashScore }}%</p>
          </div>
          <!-- Missions metrics -->
          <div class="metric-card">
            <div class="metric-header">
              <h3>Missions</h3>
            </div>
            <p class="metric-value">{{ totalMissions }}</p>
          </div>
          <div class="metric-card">
            <div class="metric-header">
              <h3>Missions Actives</h3>
            </div>
            <p class="metric-value metric-active">{{ activeMissions }}</p>
          </div>
          <div class="metric-card">
            <div class="metric-header">
              <h3>Missions Approuvées</h3>
            </div>
            <p class="metric-value metric-approved">{{ approvedMissions }}</p>
          </div>
        </div>

        <!-- Filtre période d'analyse et Source -->
        <div class="top-filters">
          <div class="filter-group">
            <label>Période d'analyse</label>
            <select v-model="analysisPeriod" class="form-select">
              <option value="all">Toutes les périodes</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
          </div>
          
          <div class="filter-group main-toggle">
            <label>Périmètre d'analyse</label>
            <div class="toggle-buttons">
              <button :class="{ active: dataSource === 'all' }" @click="dataSource = 'all'">Global</button>
              <button :class="{ active: dataSource === 'consultant' }" @click="dataSource = 'consultant'">Missions Consultant</button>
              <button :class="{ active: dataSource === 'public' }" @click="dataSource = 'public'">Flash Diags Publics</button>
            </div>
          </div>
        </div>

        <!-- Graphiques -->
        <div class="charts-grid">
          <div class="chart-card">
            <h3>Évolution des Missions Créées</h3>
            <p class="chart-subtitle">Nombre de missions créées par mois</p>
            <canvas ref="missionsChartRef"></canvas>
            <div class="chart-legend">
              <span class="legend-item">
                <span class="legend-color" style="background: #2563eb;"></span>
                Missions créées
              </span>
            </div>
          </div>
          <div class="chart-card">
            <h3>Répartition par Statut</h3>
            <p class="chart-subtitle">Distribution des statuts de missions par mois</p>
            <canvas ref="statusChartRef"></canvas>
            <div class="chart-legend">
              <span class="legend-item">
                <span class="legend-color" style="background: #2563eb;"></span>
                Actives
              </span>
              <span class="legend-item">
                <span class="legend-color" style="background: #94a3b8;"></span>
                Clôturées
              </span>
            </div>
          </div>
          <div class="chart-card">
            <h3>Taux de Complétion Moyen</h3>
            <p class="chart-subtitle">Évolution du taux moyen de complétion des questionnaires par mois</p>
            <canvas ref="completionChartRef"></canvas>
            <div class="chart-legend">
              <span class="legend-item">
                <span class="legend-color" style="background: #10b981;"></span>
                Taux moyen (%)
              </span>
            </div>
          </div>
          <div class="chart-card">
            <h3>Évolution des Scores</h3>
            <p class="chart-subtitle">Évolution du score moyen global (maturité) par mois</p>
            <canvas ref="scoreEvolutionChartRef"></canvas>
            <div class="chart-legend">
              <span class="legend-item">
                <span class="legend-color" style="background: #8b5cf6;"></span>
                Score moyen (%)
              </span>
            </div>
          </div>
          <div class="chart-card">
            <h3>Scores par Secteur</h3>
            <p class="chart-subtitle">Score moyen global par secteur d'activité</p>
            <canvas ref="scoreBySectorChartRef"></canvas>
            <div class="chart-legend">
              <span class="legend-item">
                <span class="legend-color" style="background: #f59e0b;"></span>
                Score (%)
              </span>
            </div>
          </div>
        </div>

        <!-- Filtres -->
        <div class="filters-section">
          <h3>Filtres</h3>
          <div class="filters-grid">
            <div class="form-group">
              <label>Statut de mission</label>
              <select v-model="missionStatusFilter" class="form-select">
                <option value="">Tous les statuts</option>
                <option value="preparation">En préparation</option>
                <option value="in_progress">En cours</option>
                <option value="suspended">Suspendue</option>
                <option value="closed">Clôturée</option>
              </select>
            </div>
            <div class="form-group">
              <label>Type de diagnostic</label>
              <select v-model="typeFilter" class="form-select">
                <option value="">Tous les types</option>
                <option value="flash">Flash Diag</option>
                <option value="complete">Maturité (Complet)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Secteur d'activité</label>
              <select v-model="sectorFilter" class="form-select">
                <option value="">Tous les secteurs</option>
                <option v-for="sector in availableSectors" :key="String(sector)" :value="sector">{{ sector }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Taille (EVP)</label>
              <select v-model="employeeFilter" class="form-select">
                <option value="">Toutes les tailles</option>
                <option v-for="size in availableEmployees" :key="String(size)" :value="size">{{ size }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Statut d'approbation</label>
              <select v-model="approvalStatusFilter" class="form-select">
                <option value="">Tous les statuts</option>
                <option value="approved">Approuvée</option>
                <option value="pending">En attente</option>
                <option value="rejected">Rejetée</option>
              </select>
            </div>
          </div>
        </div>

        <!-- ===================== TABLEAU FLASH DIAGS ===================== -->
        <div class="flash-diags-table-section">
          <div class="section-header">
            <div>
              <h2>⚡ Flash Diags ({{ flashDiags.length }})</h2>
              <p class="section-subtitle">Photo instantanée de la maturité IA — diagnostics réalisés à distance, sans suivi ni actions associées</p>
            </div>
          </div>
          <div class="table-container">
            <table class="missions-table">
              <thead>
                <tr>
                  <th>Organisation</th>
                  <th>Secteur</th>
                  <th>Taille (EVP)</th>
                  <th>Score Maturité</th>
                  <th>Date de réalisation</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="diag in flashDiags" :key="diag.id">
                  <td class="org-name">{{ diag.organizationName || '—' }}</td>
                  <td>{{ diag.sector || '—' }}</td>
                  <td>{{ diag.employees || '—' }}</td>
                  <td>
                    <div v-if="diag.maturityPercent !== null && diag.maturityPercent !== undefined" class="maturity-score-cell">
                      <div class="score-bar-container">
                        <div class="score-bar" :style="{ width: diag.maturityPercent + '%', background: getScoreColor(diag.maturityPercent) }"></div>
                      </div>
                      <span class="score-value">{{ diag.maturityPercent }}%</span>
                    </div>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td>{{ diag.createdAt ? new Date(diag.createdAt).toLocaleDateString('fr-FR') : '—' }}</td>
                </tr>
                <tr v-if="flashDiags.length === 0">
                  <td colspan="5" class="empty-state">Aucun flash diag trouvé pour cette sélection</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ===================== TABLEAU MISSIONS ===================== -->
        <div class="missions-table-section" style="margin-top: 2rem;">
          <div class="section-header">
            <div>
              <h2>Missions ({{ missionsList.length }})</h2>
              <p class="section-subtitle">Suivi complet des missions consultant — approbations, progressions et recommandations</p>
            </div>
          </div>
          <div class="table-container">
            <table class="missions-table">
              <thead>
                <tr>
                  <th>Organisation</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Services</th>
                  <th>Progression</th>
                  <th>Recommandations</th>
                  <th>Approbation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mission in missionsList" :key="mission.id">
                  <td class="org-name">{{ mission.organizationName }}</td>
                  <td>
                    <span class="badge badge-type">{{ mission.questionnaireType === 'flash' ? 'Flash' : 'Maturité' }}</span>
                  </td>
                  <td>
                    <span :class="['badge', 'badge-status', mission.status]">
                      {{ mission.status === 'in_progress' ? 'En cours' : mission.status === 'closed' ? 'Clôturée' : mission.status === 'suspended' ? 'Suspendue' : 'En préparation' }}
                    </span>
                  </td>
                  <td>
                    <div class="services-cell">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 3V13H13V3H3ZM5 5H11V11H5V5Z" stroke="currentColor" stroke-width="1.5"/>
                      </svg>
                      {{ (mission as any).servicesCount || 0 }}
                    </div>
                  </td>
                  <td>
                    <div class="progress-cell">
                      <div class="progress-bar-container">
                        <div class="progress-bar" :style="{ width: getProgressPercent(mission) + '%' }"></div>
                      </div>
                      <span class="progress-text">{{ getCompletedCount(mission) }}/{{ getTotalContacts(mission) }} ({{ getProgressPercent(mission) }}%)</span>
                    </div>
                  </td>
                  <td>
                    <span class="recommendations-count">{{ getRecommendationsCount(mission) }}/2</span>
                  </td>
                  <td>
                    <span class="badge badge-approval" :class="getApprovalStatus(mission)">
                      <svg v-if="getApprovalStatus(mission) === 'pending'" width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 2V4M8 12V14M14 8H12M4 8H2M12.364 3.636L10.95 5.05M5.05 10.95L3.636 12.364M12.364 12.364L10.95 10.95M5.05 5.05L3.636 3.636" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                      {{ getApprovalStatusLabel(mission) }}
                    </span>
                  </td>
                  <td>
                    <div class="actions-cell">
                      <button @click="viewMission(mission.id)" class="btn-icon-small" title="Voir">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 3C4.667 3 2 5.667 2 9C2 12.333 4.667 15 8 15C11.333 15 14 12.333 14 9C14 5.667 11.333 3 8 3ZM8 11.5C6.619 11.5 5.5 10.381 5.5 9C5.5 7.619 6.619 6.5 8 6.5C9.381 6.5 10.5 7.619 10.5 9C10.5 10.381 9.381 11.5 8 11.5Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button @click="editMission(mission.id)" class="btn-icon-small" title="Modifier">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.3333 2.00001C11.5084 1.8249 11.7163 1.68696 11.9447 1.59431C12.1731 1.50166 12.4173 1.45605 12.6637 1.46001C12.9101 1.46398 13.1529 1.51742 13.3779 1.61716C13.6029 1.7169 13.8055 1.86085 13.9733 2.04001C14.1412 2.21918 14.2708 2.43022 14.3547 2.66062C14.4386 2.89102 14.475 3.13614 14.4613 3.38068C14.4477 3.62522 14.3842 3.86419 14.2747 4.08334C14.1652 4.3025 14.012 4.49744 13.824 4.65601L6.15733 12.3227L2.66667 13.3333L3.67733 9.84268L11.344 2.17601L11.3333 2.00001Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="missionsList.length === 0">
                  <td colspan="8" class="empty-state">Aucune mission trouvée pour cette sélection</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, watch, nextTick } from 'vue'
import type { Mission } from '@shared/types'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps<{ params: any; query: any }>()
const router = inject('router') as any

const missions = ref<Mission[]>([])
const consultant = ref<any>(null)
const loading = ref(true)
const analysisPeriod = ref('all')
const dataSource = ref('all')
const missionStatusFilter = ref('')
const typeFilter = ref('')
const approvalStatusFilter = ref('')
const sectorFilter = ref('')
const employeeFilter = ref('')

const availableSectors = computed(() => {
  const sectors = new Set(missions.value.map(m => m.sector).filter(s => s && String(s).trim() !== ''))
  return Array.from(sectors).sort() as string[]
})

const availableEmployees = computed(() => {
  const sizes = new Set(missions.value.map(m => m.employees).filter(e => e !== null && e !== undefined && String(e).trim() !== ''))
  return Array.from(sizes).sort() as (string | number)[]
})

const missionsChartRef = ref<HTMLCanvasElement | null>(null)
const statusChartRef = ref<HTMLCanvasElement | null>(null)
const completionChartRef = ref<HTMLCanvasElement | null>(null)
const scoreEvolutionChartRef = ref<HTMLCanvasElement | null>(null)
const scoreBySectorChartRef = ref<HTMLCanvasElement | null>(null)

let missionsChart: Chart | null = null
let statusChart: Chart | null = null
let completionChart: Chart | null = null
let scoreEvolutionChart: Chart | null = null
let scoreBySectorChart: Chart | null = null

// Flash Diags = diagnostics publics (source: 'public')
const flashDiags = computed(() => filteredMissions.value.filter(m => (m as any).source === 'public'))
// Missions = missions consultant (source: 'consultant')
const missionsList = computed(() => filteredMissions.value.filter(m => (m as any).source === 'consultant'))

const totalFlashDiags = computed(() => flashDiags.value.length)
const avgFlashScore = computed(() => {
  const diags = flashDiags.value.filter(d => d.maturityPercent !== null && d.maturityPercent !== undefined)
  if (diags.length === 0) return 0
  return Math.round(diags.reduce((sum, d) => sum + (d.maturityPercent as number), 0) / diags.length)
})

const totalMissions = computed(() => missionsList.value.length)
const activeMissions = computed(() => missionsList.value.filter(m => m.status !== 'closed').length)
const approvedMissions = computed(() => missionsList.value.filter(m => (m as any).approvalStatus === 'approved').length)

const filteredMissions = computed(() => {
  let filtered = missions.value

  if (dataSource.value === 'consultant') {
    filtered = filtered.filter(m => (m as any).source === 'consultant')
  } else if (dataSource.value === 'public') {
    filtered = filtered.filter(m => (m as any).source === 'public')
  }

  if (missionStatusFilter.value) {
    filtered = filtered.filter(m => m.status === missionStatusFilter.value)
  }

  if (typeFilter.value) {
    filtered = filtered.filter(m => m.questionnaireType === typeFilter.value)
  }

  if (approvalStatusFilter.value) {
    filtered = filtered.filter(m => {
      const approvalStatus = (m as any).approvalStatus || 'pending'
      return approvalStatus === approvalStatusFilter.value
    })
  }

  if (sectorFilter.value) {
    filtered = filtered.filter(m => String(m.sector) === String(sectorFilter.value))
  }

  if (employeeFilter.value) {
    filtered = filtered.filter(m => String(m.employees) === String(employeeFilter.value))
  }

  return filtered
})

onMounted(async () => {
  const storedConsultant = localStorage.getItem('consultant')
  if (storedConsultant) {
    consultant.value = JSON.parse(storedConsultant)
  }

  await loadMissions()
  await nextTick()
  initCharts()
})

watch([analysisPeriod, dataSource, filteredMissions, missionStatusFilter, typeFilter, approvalStatusFilter, sectorFilter, employeeFilter], () => {
  updateCharts()
}, { deep: true })

async function loadMissions() {
  try {
    loading.value = true
    const token = localStorage.getItem('auth_token')
    const storedConsultant = localStorage.getItem('consultant')
    
    if (!token || !storedConsultant) {
      router.push('/auth')
      return
    }

    const consultantData = JSON.parse(storedConsultant)
    const consultantId = consultantData.id

    const response = await fetch(`/api/admin/consolidated-data?consultantId=${consultantId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des données consolidées')
    }

    const data = await response.json()
    // Combine both lists
    missions.value = [
      ...data.missions,
      ...data.flashPublic
    ]
  } catch (err: any) {
    console.error('Error loading missions:', err)
  } finally {
    loading.value = false
  }
}

function initCharts() {
  if (!missionsChartRef.value || !statusChartRef.value || !completionChartRef.value) return

  // Graphique évolution des missions créées
  missionsChart = new Chart(missionsChartRef.value, {
    type: 'line',
    data: {
      labels: getMonthLabels(),
      datasets: [{
        label: 'Missions créées',
        data: getMissionsByMonth(),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  })

  // Graphique répartition par statut
  statusChart = new Chart(statusChartRef.value, {
    type: 'bar',
    data: {
      labels: getMonthLabels(),
      datasets: [
        {
          label: 'Actives',
          data: getStatusByMonth('active'),
          backgroundColor: '#2563eb'
        },
        {
          label: 'Clôturées',
          data: getStatusByMonth('closed'),
          backgroundColor: '#94a3b8'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  })

  // Graphique taux de complétion
  completionChart = new Chart(completionChartRef.value, {
    type: 'line',
    data: {
      labels: getMonthLabels(),
      datasets: [{
        label: 'Taux moyen (%)',
        data: getCompletionRatesByMonth(),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 25
          }
        }
      }
    }
  })

  // Graphique évolution des scores
  if (scoreEvolutionChartRef.value) {
    scoreEvolutionChart = new Chart(scoreEvolutionChartRef.value, {
      type: 'line',
      data: {
        labels: getMonthLabels(),
        datasets: [{
          label: 'Score moyen (%)',
          data: getScoresByMonth(),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 100 } }
      }
    })
  }

  // Graphique scores par secteur
  if (scoreBySectorChartRef.value) {
    const sectorData = getScoresBySector()
    scoreBySectorChart = new Chart(scoreBySectorChartRef.value, {
      type: 'bar',
      data: {
        labels: sectorData.labels,
        datasets: [{
          label: 'Score moyen (%)',
          data: sectorData.scores,
          backgroundColor: '#f59e0b'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 100 } }
      }
    })
  }
}

function updateCharts() {
  if (!missionsChart || !statusChart || !completionChart) return

  missionsChart.data.labels = getMonthLabels()
  missionsChart.data.datasets[0].data = getMissionsByMonth()
  missionsChart.update()

  statusChart.data.labels = getMonthLabels()
  statusChart.data.datasets[0].data = getStatusByMonth('active')
  statusChart.data.datasets[1].data = getStatusByMonth('closed')
  statusChart.update()

  completionChart.data.labels = getMonthLabels()
  completionChart.data.datasets[0].data = getCompletionRatesByMonth()
  completionChart.update()

  if (scoreEvolutionChart) {
    scoreEvolutionChart.data.labels = getMonthLabels()
    scoreEvolutionChart.data.datasets[0].data = getScoresByMonth()
    scoreEvolutionChart.update()
  }

  if (scoreBySectorChart) {
    const sectorData = getScoresBySector()
    scoreBySectorChart.data.labels = sectorData.labels
    scoreBySectorChart.data.datasets[0].data = sectorData.scores
    scoreBySectorChart.update()
  }
}

function getMonthLabels(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
    months.push(monthName)
  }
  return months
}

function getMissionsByMonth(): number[] {
  const months = getMonthLabels()
  return months.map(month => {
    return filteredMissions.value.filter(m => {
      const missionDate = new Date(m.createdAt)
      const monthStr = missionDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
      return monthStr === month
    }).length
  })
}

function getStatusByMonth(status: string): number[] {
  const months = getMonthLabels()
  return months.map(month => {
    return filteredMissions.value.filter(m => {
      if (m.status !== status) return false
      const missionDate = new Date(m.createdAt)
      const monthStr = missionDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
      return monthStr === month
    }).length
  })
}

function getCompletionRatesByMonth(): number[] {
  const months = getMonthLabels()
  return months.map(month => {
    const monthMissions = filteredMissions.value.filter(m => {
      const missionDate = new Date(m.createdAt)
      const monthStr = missionDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
      return monthStr === month
    })

    if (monthMissions.length === 0) return 0

    const totalRate = monthMissions.reduce((sum, m) => {
      return sum + getProgressPercent(m)
    }, 0)

    return Math.round(totalRate / monthMissions.length)
  })
}

function getScoresByMonth(): number[] {
  const months = getMonthLabels()
  return months.map(month => {
    const monthMissions = filteredMissions.value.filter(m => {
      const missionDate = new Date(m.createdAt)
      const monthStr = missionDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
      const hasScore = (m.maturityPercent !== null && m.maturityPercent !== undefined) || getProgressPercent(m) > 0
      return monthStr === month && hasScore
    })

    if (monthMissions.length === 0) return 0

    const totalScore = monthMissions.reduce((sum, m) => {
      const score = m.maturityPercent ?? getProgressPercent(m)
      return sum + score
    }, 0)
    return Math.round(totalScore / monthMissions.length)
  })
}

function getScoresBySector(): { labels: string[], scores: number[] } {
  const validMissions = filteredMissions.value.filter(m => {
    const score = m.maturityPercent ?? getProgressPercent(m)
    return score !== null && 
      score !== undefined && 
      m.sector && 
      m.sector.trim() !== ''
  })
  
  if (validMissions.length === 0) return { labels: [], scores: [] }

  const sectorMap = new Map<string, { total: number, count: number }>()
  
  validMissions.forEach(m => {
    const sector = m.sector!
    const score = (m as any).maturityPercent ?? getProgressPercent(m)
    if (!sectorMap.has(sector)) {
      sectorMap.set(sector, { total: 0, count: 0 })
    }
    const current = sectorMap.get(sector)!
    current.total += score
    current.count += 1
  })
  
  const labels: string[] = []
  const scores: number[] = []
  
  const sortedSectors = Array.from(sectorMap.keys()).sort()
  
  sortedSectors.forEach(sector => {
    const data = sectorMap.get(sector)!
    labels.push(sector.length > 20 ? sector.substring(0, 20) + '...' : sector)
    scores.push(Math.round(data.total / data.count))
  })
  
  return { labels, scores }
}

function getCompletedCount(mission: Mission | any): number {
  if (mission.source === 'public') return 1
  return (mission as any).completedCount || 0
}

function getTotalContacts(mission: Mission | any): number {
  if (mission.source === 'public') return 1
  return (mission as any).contactsCount || 0
}

function getProgressPercent(mission: Mission | any): number {
  if (mission.source === 'public') return 100
  const total = getTotalContacts(mission)
  if (total === 0) return 0
  const completed = getCompletedCount(mission)
  return Math.round((completed / total) * 100)
}

function getRecommendationsCount(_mission: Mission | any): number {
  // TODO: Implémenter le comptage des recommandations
  return 0
}

function getApprovalStatus(mission: Mission | any): string {
  return (mission as any).approvalStatus || 'pending'
}

function getApprovalStatusLabel(mission: Mission | any): string {
  const status = getApprovalStatus(mission)
  if (status === 'approved') return 'Approuvée'
  if (status === 'rejected') return 'Rejetée'
  return 'En attente'
}

function viewMission(id: number) {
  router.push(`/admin/missions/${id}`)
}

function editMission(id: number) {
  router.push(`/admin/missions/${id}`)
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'linear-gradient(90deg, #10b981, #34d399)'
  if (score >= 50) return 'linear-gradient(90deg, #f59e0b, #fbbf24)'
  return 'linear-gradient(90deg, #ef4444, #f87171)'
}

// refreshMetrics removed

function exportCSV() {
  if (filteredMissions.value.length === 0) {
    alert('Aucune mission à exporter')
    return
  }

  // Header CSV
  const headers = [
    'Organisation', 
    'Secteur', 
    'Taille (EVP)', 
    'Type Diagnostic', 
    'Statut', 
    'Date de Création', 
    'Services', 
    'Contacts', 
    'Réponses Finalisées', 
    'Progression (%)', 
    'Maturité Globale (%)', 
    'Consultant Référent'
  ]
  
  // Lignes CSV
  const rows = filteredMissions.value.map(m => {
    const type = m.questionnaireType === 'flash' ? 'Flash' : 'Maturité'
    const status = m.status === 'in_progress' ? 'En cours' : m.status === 'closed' ? 'Clôturée' : m.status === 'suspended' ? 'Suspendue' : 'En préparation'
    const date = m.createdAt ? new Date(m.createdAt).toLocaleDateString('fr-FR') : 'N/A'
    const progression = getProgressPercent(m)
    const maturity = m.maturityPercent !== null && m.maturityPercent !== undefined ? `${m.maturityPercent}` : 'N/A'
    
    return [
      m.organizationName || 'Sans nom',
      m.sector || 'N/A',
      m.employees || 'N/A',
      type,
      status,
      date,
      (m as any).servicesCount || 0,
      (m as any).contactsCount || 0,
      (m as any).completedCount || 0,
      progression,
      maturity,
      (m as any).consultantName || 'N/A'
    ].map(val => {
      // Échappement des guillemets et encapsulation
      const stringVal = String(val).replace(/"/g, '""')
      return `"${stringVal}"`
    }).join(';') // Utilisation du point-virgule pour Excel FR
  })

  // Ajout du BOM UTF-8 pour que Excel reconnaisse les accents
  const csvContent = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n')
  
  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    const fileName = `Export_Diagnostic_IA_${new Date().toISOString().split('T')[0]}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    console.log(`[Export] Succès : ${fileName}`)
  } catch (error) {
    console.error('[Export] Erreur lors de la génération du CSV:', error)
    alert('Une erreur est survenue lors de l\'export CSV.')
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables';

.consolidated-view {
  min-height: 100vh;
  background: $gray-50;
}

.header {
  background: white;
  border-bottom: 1px solid $gray-200;
  padding: $spacing-lg 0;

  .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: $spacing-md;

    .logo-link {
      display: flex;
      align-items: center;

      .logo-img {
        height: 40px;
      }
    }

    .header-title {
      h1 {
        margin: 0;
        font-size: $font-size-2xl;
        font-weight: 700;
        color: $gray-900;
      }

      .header-subtitle {
        margin: 0;
        font-size: $font-size-sm;
        color: $gray-600;
      }
    }
  }

  .header-actions {
    display: flex;
    gap: $spacing-sm;
    align-items: center;
  }
}

.main {
  padding: $spacing-xl 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
  margin-bottom: $spacing-xl;
}

.metric-card {
  @include card;
  padding: $spacing-lg;

  .metric-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;

    h3 {
      margin: 0;
      font-size: $font-size-sm;
      font-weight: 500;
      color: $gray-600;
    }
  }

  .metric-value {
    font-size: $font-size-3xl;
    font-weight: 700;
    color: $gray-900;
    margin: 0;

    &.metric-active {
      color: $primary;
    }

    &.metric-approved {
      color: $success;
    }

    &.metric-pending {
      color: $warning;
    }
  }
}

.top-filters {
  @include card;
  padding: $spacing-lg;
  margin-bottom: $spacing-xl;
  display: flex;
  gap: $spacing-xl;
  align-items: flex-end;

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;

    label {
      font-size: $font-size-sm;
      font-weight: 600;
      color: $gray-700;
    }
  }

  .main-toggle {
    flex-grow: 1;
  }

  .toggle-buttons {
    display: flex;
    background: $gray-100;
    padding: 4px;
    border-radius: $radius-lg;
    gap: 4px;

    button {
      flex: 1;
      padding: $spacing-sm $spacing-md;
      border: none;
      background: transparent;
      border-radius: $radius-md;
      font-size: $font-size-sm;
      font-weight: 600;
      color: $gray-600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        color: $gray-900;
      }

      &.active {
        background: white;
        color: $primary;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }
    }
  }
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.chart-card {
  @include card;
  padding: $spacing-lg;

  h3 {
    margin: 0 0 $spacing-xs 0;
    font-size: $font-size-lg;
    font-weight: 600;
    color: $gray-900;
  }

  .chart-subtitle {
    margin: 0 0 $spacing-md 0;
    font-size: $font-size-sm;
    color: $gray-600;
  }

  canvas {
    max-height: 250px;
    margin-bottom: $spacing-md;
  }

  .chart-legend {
    display: flex;
    gap: $spacing-md;
    flex-wrap: wrap;

    .legend-item {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      font-size: $font-size-xs;
      color: $gray-600;

      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 2px;
      }
    }
  }
}

.filters-section {
  @include card;
  padding: $spacing-lg;
  margin-bottom: $spacing-xl;

  h3 {
    margin: 0 0 $spacing-md 0;
    font-size: $font-size-lg;
    font-weight: 600;
    color: $gray-900;
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: $spacing-md;
  }
}

.flash-diags-table-section,
.missions-table-section {
  @include card;
  padding: $spacing-lg;

  .section-header {
    margin-bottom: $spacing-lg;

    h2 {
      margin: 0 0 $spacing-xs 0;
      font-size: $font-size-xl;
      font-weight: 600;
      color: $gray-900;
    }

    .section-subtitle {
      margin: 0;
      font-size: $font-size-sm;
      color: $gray-600;
    }
  }
}

.flash-diags-table-section {
  border-top: 3px solid #6366f1;
}

.missions-table-section {
  border-top: 3px solid $primary;
}

.org-name {
  font-weight: 600;
  color: $gray-900;
}

.maturity-score-cell {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  min-width: 160px;

  .score-bar-container {
    flex: 1;
    height: 8px;
    background: $gray-200;
    border-radius: $radius-full;
    overflow: hidden;

    .score-bar {
      height: 100%;
      border-radius: $radius-full;
      transition: width 0.4s ease;
    }
  }

  .score-value {
    font-size: $font-size-sm;
    font-weight: 700;
    color: $gray-800;
    min-width: 36px;
    text-align: right;
  }
}

.text-muted {
  color: $gray-400;
}

.empty-state {
  text-align: center;
  color: $gray-400;
  font-style: italic;
  padding: $spacing-xl !important;
}

.metric-card-flash {
  border-top: 3px solid #6366f1;

  .metric-flash {
    color: #6366f1;
  }
}

.table-container {
  overflow-x: auto;
}

.missions-table {
  width: 100%;
  border-collapse: collapse;

  thead {
    background: $gray-50;
    border-bottom: 2px solid $gray-200;

    th {
      padding: $spacing-md;
      text-align: left;
      font-size: $font-size-sm;
      font-weight: 600;
      color: $gray-700;
      white-space: nowrap;
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid $gray-200;
      transition: background 0.2s;

      &:hover {
        background: $gray-50;
      }

      td {
        padding: $spacing-md;
        font-size: $font-size-sm;
        color: $gray-900;
      }
    }
  }
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-full;
  font-size: $font-size-xs;
  font-weight: 600;
  white-space: nowrap;

  &.badge-type {
    background: $gray-100;
    color: $gray-700;
  }

  &.badge-status {
    &.in_progress {
      background: rgba($primary, 0.1);
      color: $primary;
    }

    &.closed {
      background: $gray-100;
      color: $gray-700;
    }

    &.suspended {
      background: rgba($warning, 0.1);
      color: $warning;
    }

    &.preparation {
      background: $gray-200;
      color: $gray-600;
    }
  }

  &.badge-approval {
    &.pending {
      background: rgba($warning, 0.1);
      color: $warning;
    }

    &.approved {
      background: rgba($success, 0.1);
      color: $success;
    }

    &.rejected {
      background: rgba($danger, 0.1);
      color: $danger;
    }
  }
}

.services-cell {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  color: $gray-700;
}

.progress-cell {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  min-width: 150px;

  .progress-bar-container {
    height: 8px;
    background: $gray-200;
    border-radius: $radius-full;
    overflow: hidden;

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #9333ea 0%, #f59e0b 100%);
      transition: width 0.3s ease;
    }
  }

  .progress-text {
    font-size: $font-size-xs;
    color: $gray-600;
  }
}

.recommendations-count {
  font-weight: 600;
  color: $gray-700;
}

.actions-cell {
  display: flex;
  gap: $spacing-xs;
}

.btn-icon-small {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid $gray-300;
  border-radius: $radius-md;
  background: white;
  color: $gray-700;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: $gray-50;
    border-color: $primary;
    color: $primary;
  }
}
</style>
