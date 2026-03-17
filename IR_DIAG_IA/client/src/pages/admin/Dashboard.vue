<template>
  <div class="dashboard">
    <!-- Header -->
    <header class="header">
      <div class="container">
        <div class="header-main">
          <div class="header-left">
            <router-link to="/" class="logo-section" style="text-decoration: none; color: inherit;">
              <img src="/logo.png" alt="Images & Réseaux" class="logo-img" />
              <div class="brand">
                <h1>IR-DIAG-IA</h1>
                <p class="header-subtitle">{{ isAdmin ? 'Administration' : 'Chef de projet' }} - {{ consultant?.firstName }} {{ consultant?.lastName }}</p>
              </div>
            </router-link>
          </div>
          <div class="header-actions">
            <button class="btn-icon" @click="handleConsolidatedView">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3V17H17V3H3ZM5 5H15V15H5V5Z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M7 8H13M7 11H13M7 14H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              Vue consolidée
            </button>
            <button class="btn-icon btn-danger" @click="logout">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="main">
      <div class="container">
        <!-- Stats -->
        <div class="stats">
          <div class="stat-card">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 7V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V7M3 7V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V7M3 7H21" />
              </svg>
            </div>
            <div class="stat-content">
              <h3>Missions actives</h3>
              <p class="stat-value">{{ activeMissionsCount }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20V10M18 20V4M6 20v-4" />
              </svg>
            </div>
            <div class="stat-content">
              <h3>Missions totales</h3>
              <p class="stat-value">{{ missions.length }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 2L3 11H9L10 18L17 9H11L10 2Z" />
              </svg>
            </div>
            <div class="stat-content">
              <h3>Flash Diags</h3>
              <p class="stat-value">{{ flashHistory.length }}</p>
            </div>
          </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="tabs-container">
          <div class="tabs-header">
            <button 
              @click="activeTab = 'missions'"
              :class="['tab-button', { active: activeTab === 'missions' }]"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4C3 3.44772 3.44772 3 4 3H16C16.5523 3 17 3.44772 17 4V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V4Z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              Missions
            </button>
            <button 
              v-if="isAdmin"
              @click="activeTab = 'consultants'"
              :class="['tab-button', { active: activeTab === 'consultants' }]"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M0 20C0 15.5817 4.47715 12 10 12C15.5228 12 20 15.5817 20 20" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              Chefs de projet
            </button>
            <button 
              @click="activeTab = 'flash'"
              :class="['tab-button', { active: activeTab === 'flash' }]"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2L3 11H9L10 18L17 9H11L10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Flash Diag
            </button>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          Chargement des données...
        </div>
        
        <div v-else-if="error" class="error-state">
          {{ error }}
        </div>

        <div v-else>
          <!-- Missions Table -->
          <div v-if="activeTab === 'missions'" class="content-section">
            <div class="section-header">
              <h2>{{ isAdmin ? 'Toutes les missions' : 'Mes missions' }}</h2>
              <router-link to="/admin/missions/new" class="btn-primary">
                Nouvelle mission
              </router-link>
            </div>

            <!-- Filters -->
            <div class="filters-bar">
              <div class="search-box">
                <input v-model="searchQuery" type="text" placeholder="Rechercher une organisation..." />
              </div>
              <select v-if="isAdmin" v-model="consultantFilter" class="filter-select">
                <option value="">Tous les chefs de projet</option>
                <option v-for="c in consultants" :key="c.id" :value="c.id">{{ c.firstName }} {{ c.lastName }}</option>
              </select>
              <select v-model="statusFilter" class="filter-select">
                <option value="">Tous les statuts</option>
                <option value="preparation">En préparation</option>
                <option value="in_progress">En cours</option>
                <option value="suspended">Suspendue</option>
                <option value="closed">Clôturée</option>
              </select>
            </div>

            <div class="table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Organisation</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th>Maturité</th>
                    <th>Chef de projet</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="mission in filteredMissions" :key="mission.id">
                    <td><strong>{{ mission.organizationName }}</strong></td>
                    <td>{{ formatDate(mission.createdAt) }}</td>
                    <td>
                      <span :class="['badge', mission.status]">
                        {{ mission.status === 'in_progress' ? 'En cours' : mission.status === 'closed' ? 'Clôturée' : mission.status === 'suspended' ? 'Suspendue' : 'En préparation' }}
                      </span>
                    </td>
                    <td>
                      <div v-if="mission.maturityPercent !== null" class="score-pill" :style="{ backgroundColor: getMaturityColor(mission.maturityPercent) }">
                        {{ mission.maturityPercent }}%
                      </div>
                      <span v-else class="text-muted">N/A</span>
                    </td>
                    <td>{{ (mission as any).consultantName || 'Auto-affecté' }}</td>
                    <td class="actions-cell">
                      <button @click="goToMission(mission.id)" class="btn-view">Voir</button>
                      <button v-if="isAdmin" @click="deleteMission(mission.id, mission.organizationName)" class="btn-delete">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Consultants Table -->
          <div v-if="isAdmin && activeTab === 'consultants'" class="content-section">
            <div class="section-header">
              <h2>Gestion des chefs de projet</h2>
              <button @click="createConsultant" class="btn-primary">Nouveau chef</button>
            </div>
            <div class="table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôles</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="c in consultants" :key="c.id">
                    <td>{{ c.firstName }} {{ c.lastName }}</td>
                    <td>{{ c.email }}</td>
                    <td>{{ c.roles.join(', ') }}</td>
                    <td>
                      <span :class="['badge', c.suspended ? 'suspended' : 'active']">
                        {{ c.suspended ? 'Suspendu' : 'Actif' }}
                      </span>
                    </td>
                    <td class="actions-cell">
                      <button @click="toggleSuspendConsultant(c.id, !c.suspended)" class="btn-view">
                        {{ c.suspended ? 'Réactiver' : 'Suspendre' }}
                      </button>
                      <button @click="deleteConsultant(c.id, c.firstName, c.lastName)" class="btn-delete">Supprimer</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Flash Diag Table -->
          <div v-if="activeTab === 'flash'" class="content-section">
            <div class="section-header">
              <h2>Historique Flash Diag</h2>
            </div>
            <div class="filters-bar">
              <div class="search-box">
                <input v-model="flashSearchQuery" type="text" placeholder="Rechercher..." />
              </div>
              <select v-model="flashRegionFilter" class="filter-select">
                <option value="">Toutes les régions</option>
                <option value="Bretagne">Bretagne</option>
                <option value="Pays de la Loire">Pays de la Loire</option>
              </select>
              <select v-model="flashMaturityFilter" class="filter-select">
                <option value="">Toutes les maturités</option>
                <option value="Expert">Expert</option>
                <option value="Avancé">Avancé</option>
                <option value="Initié">Initié</option>
                <option value="Débutant">Débutant</option>
              </select>
            </div>
            <div class="table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Organisation</th>
                    <th>Contact</th>
                    <th>Dept / Région</th>
                    <th>Score</th>
                    <th>Maturité</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in filteredFlashHistory" :key="item.id">
                    <td><strong>{{ item.organization_name }}</strong></td>
                    <td>{{ item.contact_name }}<br/><small>{{ item.contact_email }}</small></td>
                    <td>{{ item.department }} / {{ item.region }}</td>
                    <td>
                      <div class="score-pill" :style="{ backgroundColor: getMaturityColor(item.global_score) }">
                        {{ item.global_score }}%
                      </div>
                    </td>
                    <td>{{ item.maturity_level }}</td>
                    <td>{{ formatDate(item.created_at) }}</td>
                    <td class="actions-cell">
                      <button @click="downloadFlashPdf(item.id, item.organization_name)" class="btn-view">
                        {{ downloadingPdfId === item.id ? '...' : 'PDF' }}
                      </button>
                      <button v-if="isAdmin" @click="deleteFlashDiag(item.id, item.organization_name)" class="btn-delete">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Delete Modal -->
    <div v-if="showDeleteMissionModal" class="modal-overlay">
      <div class="modal-container">
        <h3>Confirmer la suppression</h3>
        <p>Tapez <strong>SUPPRIMER</strong> pour effacer "{{ missionToDelete?.name }}"</p>
        <input v-model="deleteConfirmationInput" type="text" class="form-input" />
        <div class="modal-footer">
          <button @click="cancelDeleteMission" class="btn-secondary">Annuler</button>
          <button @click="confirmDeleteMission" class="btn-danger" :disabled="deleteConfirmationInput !== 'SUPPRIMER'">
            Confirmer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import type { Mission } from '@shared/types'

const router = inject('router') as any

const missions = ref<Mission[]>([])
const consultants = ref<any[]>([])
const flashHistory = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const consultant = ref<any>(null)
const activeTab = ref<'missions' | 'consultants' | 'flash'>('missions')

// Filters
const searchQuery = ref('')
const statusFilter = ref('')
const consultantFilter = ref('')
const flashSearchQuery = ref('')
const flashRegionFilter = ref('')
const flashMaturityFilter = ref('')

// Mission actions
const showDeleteMissionModal = ref(false)
const missionToDelete = ref<{ id: number; name: string } | null>(null)
const deleteConfirmationInput = ref('')
const downloadingPdfId = ref<number | null>(null)

const isAdmin = computed(() => consultant.value?.roles?.includes('admin'))

const activeMissionsCount = computed(() => missions.value.filter(m => m.status !== 'closed').length)

const filteredMissions = computed(() => {
  let filtered = [...missions.value]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(m => m.organizationName.toLowerCase().includes(q))
  }
  if (consultantFilter.value) {
    const id = parseInt(consultantFilter.value)
    filtered = filtered.filter(m => m.consultantId === id)
  }
  if (statusFilter.value) {
    filtered = filtered.filter(m => m.status === statusFilter.value)
  }
  return filtered
})

const filteredFlashHistory = computed(() => {
  let filtered = [...flashHistory.value]
  if (flashSearchQuery.value) {
    const q = flashSearchQuery.value.toLowerCase()
    filtered = filtered.filter(f => f.organization_name.toLowerCase().includes(q) || f.contact_name.toLowerCase().includes(q))
  }
  if (flashRegionFilter.value) {
    filtered = filtered.filter(f => f.region === flashRegionFilter.value)
  }
  if (flashMaturityFilter.value) {
    filtered = filtered.filter(f => f.maturity_level === flashMaturityFilter.value)
  }
  return filtered
})

onMounted(async () => {
  const cStr = localStorage.getItem('consultant')
  if (cStr) consultant.value = JSON.parse(cStr)
  
  await loadMissions()
  await loadFlashHistory()
  if (isAdmin.value) {
    await loadConsultants()
  }
})

async function loadMissions() {
  loading.value = true
  try {
    const token = localStorage.getItem('auth_token')
    const consultantId = consultant.value?.id
    const response = await fetch(`/api/missions?consultantId=${consultantId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) missions.value = await response.json()
  } catch (err) {
    error.value = 'Failed to load missions'
  } finally {
    loading.value = false
  }
}

async function loadConsultants() {
  try {
    const token = localStorage.getItem('auth_token')
    const adminId = consultant.value?.id
    const response = await fetch(`/api/consultants?adminId=${adminId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) consultants.value = await response.json()
  } catch (err) {}
}

async function loadFlashHistory() {
  console.log('[Dashboard] Loading Flash history...')
  try {
    const token = localStorage.getItem('auth_token')
    const adminId = consultant.value?.id
    console.log(`[Dashboard] consultantId: ${adminId}`)
    if (!adminId) {
      console.warn('[Dashboard] No consultant ID found, skipping Flash history load')
      return
    }
    const response = await fetch(`/api/flash/history?consultantId=${adminId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    console.log(`[Dashboard] Flash history status: ${response.status}`)
    if (response.ok) {
      flashHistory.value = await response.json()
      console.log(`[Dashboard] Loaded ${flashHistory.value.length} flash history entries`)
    } else {
      const errorText = await response.text()
      console.error(`[Dashboard] Failed to load flash history: ${response.status} ${errorText}`)
    }
  } catch (err) {
    console.error('[Dashboard] Error loading flash history:', err)
  }
}

function handleConsolidatedView() { router.push('/admin/consolidated') }
function goToMission(id: number) { router.push(`/admin/missions/${id}`) }
function formatDate(d: string) { return new Date(d).toLocaleDateString('fr-FR') }

function getMaturityColor(p: number) {
  if (p < 25) return '#ef4444'
  if (p < 50) return '#f97316'
  return '#22c55e'
}

async function deleteFlashDiag(id: number, name: string) {
  if (!confirm(`Supprimer le diagnostic Flash de "${name}" ?`)) return
  try {
    const token = localStorage.getItem('auth_token')
    const adminId = consultant.value?.id
    const response = await fetch(`/api/flash/${id}?consultantId=${adminId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) {
      // Force reload from server to ensure UI is in sync
      await loadFlashHistory()
    } else {
      const errorText = await response.text()
      alert(`Erreur lors de la suppression : ${response.status} ${errorText}`)
    }
  } catch (err) {
    console.error('Delete error:', err)
    alert('Erreur réseau lors de la suppression')
  }
}

async function downloadFlashPdf(id: number, organizationName: string) {
  if (downloadingPdfId.value) return
  downloadingPdfId.value = id
  try {
    const token = localStorage.getItem('auth_token')
    const consultantId = consultant.value?.id
    const response = await fetch('/api/flash/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id, consultantId })
    })
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Rapport_Flash_${organizationName.replace(/\s+/g, '_')}.pdf`
      a.click()
    }
  } catch (err) {
    alert('Failed to download PDF')
  } finally {
    downloadingPdfId.value = null
  }
}

function deleteMission(id: number, name: string) {
  missionToDelete.value = { id, name }
  deleteConfirmationInput.value = ''
  showDeleteMissionModal.value = true
}

function cancelDeleteMission() {
  showDeleteMissionModal.value = false
  missionToDelete.value = null
}

async function confirmDeleteMission() {
  if (!missionToDelete.value) return
  const id = missionToDelete.value.id
  try {
    const token = localStorage.getItem('auth_token')
    const consultantId = consultant.value?.id
    const response = await fetch(`/api/missions/${id}?consultantId=${consultantId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) {
      missions.value = missions.value.filter(m => m.id !== id)
      cancelDeleteMission()
    }
  } catch (err) {}
}

async function toggleSuspendConsultant(id: number, suspended: boolean) {
  try {
    const token = localStorage.getItem('auth_token')
    const adminId = consultant.value?.id
    const response = await fetch(`/api/consultants/${id}/suspend?adminId=${adminId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ suspended })
    })
    if (response.ok) {
      const idx = consultants.value.findIndex(c => c.id === id)
      if (idx !== -1) consultants.value[idx].suspended = suspended
    }
  } catch (err) {}
}

async function deleteConsultant(id: number, firstName: string, lastName: string) {
  if (!confirm(`Supprimer ${firstName} ${lastName} ?`)) return
  try {
    const token = localStorage.getItem('auth_token')
    const adminId = consultant.value?.id
    const response = await fetch(`/api/consultants/${id}?adminId=${adminId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) {
      consultants.value = consultants.value.filter(c => c.id !== id)
      await loadMissions()
    }
  } catch (err) {}
}

async function createConsultant() {
  const email = prompt('Email :')
  if (!email) return
  const firstName = prompt('Prénom :')
  const lastName = prompt('Nom :')
  const password = prompt('Mot de passe :')
  
  try {
    const token = localStorage.getItem('auth_token')
    const adminId = consultant.value?.id
    const response = await fetch(`/api/consultants?adminId=${adminId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ email, firstName, lastName, password })
    })
    if (response.ok) {
       const newC = await response.json()
       consultants.value.push(newC)
    }
  } catch (err) {}
}

function logout() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('consultant')
  router.push('/admin/login')
}
</script>

<style lang="scss" scoped>
/* Simplified styles for restore */
.dashboard {
  min-height: 100vh;
  background: #f3f4f6;
  font-family: 'Inter', sans-serif;
}

.header {
  background: white;
  padding: 1rem 0;
  border-bottom: 2px solid #0066cc;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.logo-img {
  height: 40px;
}

.header-title h1 {
  font-size: 1.25rem;
  margin: 0;
  color: #111827;
}

.header-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.main {
  padding: 2rem 0;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: #eff6ff;
  color: #0066cc;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: #111827;
}

.tabs-container {
  margin-bottom: 2rem;
}

.tabs-header {
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.tab-button {
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 2px solid transparent;

  &.active {
    color: #0066cc;
    border-bottom-color: #0066cc;
  }
}

.content-section {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.btn-primary {
  background: #0066cc;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  text-decoration: none;
  font-weight: 600;
  border: none;
  cursor: pointer;

  &:hover {
    background: #0052a3;
  }
}

.btn-icon, .btn-secondary, .btn-view, .btn-delete {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;

  &:hover {
    background: #f9fafb;
  }
}

.btn-delete, .btn-danger {
  color: #dc2626;
  border-color: #fecaca;
  background: #fef2f2;

  &:hover {
    background: #fee2e2;
  }
}

.btn-danger {
  background: #dc2626 !important;
  color: white !important;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-box input, .filter-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
}

.search-box input { min-width: 250px; }

.table-container {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;

  th, td {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    font-weight: 600;
    color: #4b5563;
    font-size: 0.875rem;
  }
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;

  &.in_progress { background: #dcfce7; color: #166534; }
  &.closed { background: #f3f4f6; color: #4b5563; }
  &.suspended { background: #fef9c3; color: #854d0e; }
  &.preparation { background: #e5e7eb; color: #374151; }
}

.score-pill {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-container {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  max-width: 400px;
  width: 100%;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  margin-top: 1rem;
}
</style>
