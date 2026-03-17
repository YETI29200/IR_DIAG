<template>
  <div class="results">
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="header-left">
            <router-link :to="backToMissionUrl" class="btn-back">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Retour à la mission
            </router-link>
            <div class="page-title-section">
              <h1 class="page-title">Résultats de la mission</h1>
              <p class="mission-name" v-if="mission">{{ mission.organizationName }}</p>
            </div>
          </div>
          
          <div class="header-actions">
            <button class="btn-export" @click="exportToExcel">Exporter Excel</button>
          </div>
        </div>

        <div v-if="!isIndividualSession" class="tabs-container">
          <button 
            :class="['tab-btn', { active: activeView === 'comparison' }]"
            @click="activeView = 'comparison'"
          >
            GLOBAL
          </button>
          <button 
            :class="['tab-btn', { active: activeView === 'details' }]"
            @click="activeView = 'details'"
          >
            DÉTAILS PAR SERVICE
          </button>
        </div>
      </div>
    </header>

    <main class="main">
      <div class="container">
        <div v-if="loading" class="loading">Calcul des résultats...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        
        <!-- Vue Résultats Individuels (session) - Simple tableau, pas de recommandations -->
        <div v-if="isIndividualSession" class="individual-session-view">
          <div class="card">
            <h2>Résultats individuels</h2>
            <p class="card-subtitle" v-if="mission">{{ mission.organizationName }}</p>
            
            <div class="results-table-container">
              <table class="results-table">
                <thead>
                  <tr>
                    <th>Dimension</th>
                    <th>Score</th>
                    <th>Niveau</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="score in dimensionScores" :key="score.dimension">
                    <td class="dimension-name">{{ formatDimension(score.dimension) }}</td>
                    <td>
                      <span class="score-badge" :class="getScoreClass(normalizeScore(score.score))">
                        {{ normalizeScore(score.score) }}%
                      </span>
                    </td>
                    <td>
                      <span class="level-badge" :class="`level-${score.level}`">
                        {{ getLevelLabel(score.level) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
                <tfoot v-if="dimensionScores.length > 0">
                  <tr class="global-score-row">
                    <td><strong>Score Global</strong></td>
                    <td>
                      <span class="score-badge" :class="getScoreClass(normalizeScore(globalScore))">
                        {{ normalizeScore(globalScore) }}%
                      </span>
                    </td>
                    <td>
                      <span class="level-badge" :class="`level-${getLevelFromScore(globalScore)}`">
                        {{ getLevelLabel(getLevelFromScore(globalScore)) }}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div class="info-message" style="margin-top: 2rem;">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="#3b82f6" stroke-width="1.5"/>
                <path d="M10 6V10" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M10 14H10.01" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span>Les recommandations sont générées au niveau service et global, pas individuellement.</span>
            </div>
          </div>
        </div>
        
        <!-- Vue Comparaison -->
        <div v-else-if="activeView === 'comparison' && (missionData || globalOrganizationAverage !== null)" class="comparison-view">
          <!-- Résultats globaux -->
          <div class="card">
            <h2>Résultats globaux</h2>
            <p class="card-subtitle">Vue d'ensemble de la maturité IA de l'organisation</p>
            <div class="service-selector-section">
              <div class="status-badges">
                <span class="badge badge-purple">{{ validatedCount }}/{{ totalCount }} validé</span>
                <span class="badge badge-gray">{{ draftCount }} brouillon</span>
              </div>
              <div class="service-actions">
                <button class="btn-action" @click="openRegenerateModal('all')">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 1V15M1 8H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  Régénérer tout
                </button>
                <button class="btn-action" @click="openHistoryModal">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2Z" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M8 5V8L10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  Historique
                </button>
                <button class="btn-action" @click="openRegenerateModal('all')">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Régénérer le global
                </button>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="card">
            <h2>Actions</h2>
            <div class="actions-grid">
              <button class="btn-action-primary" @click="previewReport">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 9C1 13.4183 4.58172 17 9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9Z" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M9 5V9L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Prévisualiser
              </button>
              <button class="btn-action-success" @click="approveRecommendations">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5L7 13L3 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Approuver les recommandations
              </button>
              <button class="btn-action-secondary" @click="openRegenerateModal('all')">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 1V5M9 13V17M1 9H5M13 9H17M2.34315 2.34315L5.17157 5.17157M12.8284 12.8284L15.6569 15.6569M2.34315 15.6569L5.17157 12.8284M12.8284 5.17157L15.6569 2.34315" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Régénérer avec IA
              </button>

              <button 
                class="btn-action" 
                :disabled="!recommendationsApproved"
                @click="generateSyntheticReport"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 12V15C15 15.5304 14.7893 16.0391 14.4142 16.4142C14.0391 16.7893 13.5304 17 13 17H5C4.46957 17 3.96086 16.7893 3.58579 16.4142C3.21071 16.0391 3 15.5304 3 15V3C3 2.46957 3.21071 1.96086 3.58579 1.58579C3.96086 1.21071 4.46957 1 5 1H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 1V7H18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15 1L12 4L15 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Rapport Synthétique (PDF)
              </button>

              <button 
                class="btn-action" 
                :disabled="!recommendationsApproved"
                @click="generateDetailedReport"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 12V15C15 15.5304 14.7893 16.0391 14.4142 16.4142C14.0391 16.7893 13.5304 17 13 17H5C4.46957 17 3.96086 16.7893 3.58579 16.4142C3.21071 16.0391 3 15.5304 3 15V3C3 2.46957 3.21071 1.96086 3.58579 1.58579C3.96086 1.21071 4.46957 1 5 1H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 1V7H18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15 1L12 4L15 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Rapport Complet (PDF)
              </button>

              <button 
                class="btn-action" 
                :disabled="!recommendationsApproved"
                @click="generateWorkshopGuide"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 12V15C15 15.5304 14.7893 16.0391 14.4142 16.4142C14.0391 16.7893 13.5304 17 13 17H5C4.46957 17 3.96086 16.7893 3.58579 16.4142C3.21071 16.0391 3 15.5304 3 15V3C3 2.46957 3.21071 1.96086 3.58579 1.58579C3.96086 1.21071 4.46957 1 5 1H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 1V7H18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15 1L12 4L15 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Guide Atelier (PDF)
              </button>
            </div>
            <div class="info-message">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="#F59E0B" stroke-width="1.5"/>
                <path d="M10 6V10" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M10 14H10.01" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span>Approuver d'abord les recommandations pour générer les rapports PDF</span>
            </div>
          </div>

          <!-- Graphique radar organisation -->
          <div class="card">
            <h2>Vue d'ensemble de votre maturité IA</h2>
            <p class="card-subtitle">Maturité globale de l'organisation</p>
            
            <!-- Indicateurs globaux (Moyenne et Médiane) -->
            <div v-if="globalOrganizationAverage !== null || globalOrganizationMedian !== null" class="global-metrics">
              <div class="metric-card">
                <div class="metric-label">Score Global (Moyenne)</div>
                <div class="metric-value" :class="getScoreClass(normalizeScore(globalOrganizationAverage || 0))">
                  {{ normalizeScore(globalOrganizationAverage || 0) }}%
                </div>
                <div class="metric-description">Moyenne de tous les répondants</div>
              </div>
              <div v-if="globalOrganizationMedian !== null" class="metric-card">
                <div class="metric-label">Score Global (Médiane)</div>
                <div class="metric-value" :class="getMedianClass(normalizeScore(globalOrganizationMedian))">
                  {{ normalizeScore(globalOrganizationMedian) }}%
                </div>
                <div class="metric-description">Médiane de tous les répondants</div>
              </div>
              <div v-if="globalOrganizationNSPRate !== null && globalOrganizationNSPRate !== undefined" class="metric-card">
                <div class="metric-label">Taux "Ne sais pas"</div>
                <div class="metric-value nsp-value">
                  {{ globalOrganizationNSPRate }}%
                </div>
                <div class="metric-description">Taux de réponses "Ne sais pas"</div>
              </div>
              <div v-if="anonymousCount !== null && anonymousCount > 0" class="metric-card">
                <div class="metric-label">Répondants anonymes</div>
                <div class="metric-value" style="color: #6366f1;">
                  {{ anonymousCount }}
                </div>
                <div class="metric-description">Nombre d'interlocuteurs anonymes</div>
              </div>
            </div>
            
            <div class="radar-chart-container">
              <RadarChart :scores="organizationDimensionScores" />
            </div>

            <!-- Graphiques détaillés Global (Histogramme) -->
            <div class="sub-dimensions-chart" style="margin-top: 3rem;">
               <h3 style="margin-bottom: 1.5rem; text-align: center;">Détail par dimension (Global)</h3>
               <GroupedBarChart 
                  v-if="globalBarData.length > 0"
                  :groups="globalBarData"
                  :series="barSeries"
               >
                 <template #label="{ group }">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding-top: 8px;">
                      <DimensionIcons :dimension="String(group.id)" :size="20" />
                      <span style="font-size: 9px; text-align: center; line-height: 1.2; max-width: 70px; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">{{ group.label }}</span>
                    </div>
                 </template>
               </GroupedBarChart>
               <div v-else class="text-center text-gray-500 py-4">
                 Aucune donnée détaillée disponible au niveau global.
               </div>
            </div>
          </div>



          <!-- Tableau comparatif -->
          <div v-if="missionData && missionData.services && missionData.services.length > 0" class="card">
            <h2>Tableau comparatif détaillé</h2>
            <p class="card-subtitle">Scores par dimension pour chaque service</p>
            <div class="comparison-table-container">
              <table class="comparison-table">
                <thead>
                  <tr>
                    <th>Dimension</th>
                    <th v-for="service in missionData.services" :key="service.id">
                      {{ service.name }}
                    </th>
                    <th>Moyenne</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="dimension in allDimensions" :key="dimension">
                    <td class="dimension-name">{{ formatDimension(dimension) }}</td>
                    <td v-for="service in missionData.services" :key="service.id">
                      <span 
                        class="score-pill" 
                        :class="getScoreClass(getDimensionScore(service, dimension))"
                      >
                        {{ getDimensionScore(service, dimension) }}%
                      </span>
                    </td>
                    <td class="average-score">
                      {{ getAverageScore(dimension) }}%
                    </td>
                  </tr>
                  <tr class="global-score-row">
                    <td class="dimension-name"><strong>Score Global (Moyenne)</strong></td>
                    <td v-for="service in missionData.services" :key="service.id">
                      <span 
                        class="score-pill" 
                        :class="getScoreClass(normalizeScore(service.globalScore))"
                      >
                        {{ normalizeScore(service.globalScore) }}%
                      </span>
                    </td>
                    <td class="average-score">
                      <strong>{{ getGlobalAverage() }}%</strong>
                    </td>
                  </tr>
                  <tr v-if="missionData.services.some((s: any) => s.globalMedian !== undefined)" class="global-median-row">
                    <td class="dimension-name"><strong>Score Global (Médiane)</strong></td>
                    <td v-for="service in missionData.services" :key="service.id">
                      <span 
                        v-if="service.globalMedian !== undefined"
                        class="score-pill median-pill" 
                        :class="getMedianClass(normalizeScore(service.globalMedian))"
                      >
                        {{ normalizeScore(service.globalMedian) }}%
                      </span>
                      <span v-else class="score-pill">-</span>
                    </td>
                    <td class="average-score">
                      <strong>{{ getGlobalMedian() }}%</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Message si pas de services -->
          <div v-if="!missionData || !missionData.services || missionData.services.length === 0" class="card">
            <div class="info-message">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="#3b82f6" stroke-width="1.5"/>
                <path d="M10 6V10" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M10 14H10.01" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span>Aucun service avec des résultats consolidés pour le moment. Les résultats individuels sont disponibles, mais la consolidation par service nécessite des réponses de plusieurs répondants par service.</span>
            </div>
          </div>

          <!-- Recommandations personnalisées par thématique (Global) -->
          <div class="card">
            <h2>Recommandations personnalisées</h2>
            <div class="recommendations-list">
              <div 
                v-for="(dimensionScore, index) in organizationDimensionScores" 
                :key="dimensionScore.dimension"
                class="recommendation-card"
                :class="`theme-${index % 5}`"
              >
                <div class="recommendation-header">
                  <div class="recommendation-title-section">
                    <div class="theme-icon">
                      <DimensionIcons :dimension="dimensionScore.dimension" :size="24" />
                    </div>
                    <div>
                      <h3>{{ formatDimension(dimensionScore.dimension) }}</h3>
                      <span class="level-tag" :class="`level-${dimensionScore.level}`">{{ getLevelLabel(dimensionScore.level) }}</span>
                    </div>
                  </div>
                  <div class="recommendation-score-section">
                    <div class="score-display">
                      <span class="score-value">{{ normalizeScore(dimensionScore.score) }}%</span>
                      <span class="score-detail">{{ getProgressText(dimensionScore) }}</span>
                    </div>
                    <div class="edit-button-wrapper">
                      <div class="edit-buttons-group" v-if="editingRecommendation?.dimension === dimensionScore.dimension">
                        <button 
                          class="btn-save"
                          :class="{ 
                            'saved': savedInCurrentSession.has(dimensionScore.dimension)
                          }"
                          @click="saveEditing(dimensionScore.dimension)"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                          Sauvegarder
                        </button>
                        <button 
                          class="btn-cancel"
                          @click="cancelEditing(dimensionScore.dimension)"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                          Annuler
                        </button>
                      </div>
                      <button 
                        v-else
                        class="btn-edit"
                        :class="{ 
                          'modified': modifiedDimensions.has(dimensionScore.dimension) && (activeView === 'comparison' ? lastModified : selectedServiceData?.lastModified)
                        }"
                        @click="startEditing(dimensionScore.dimension)"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.3333 2.00001C11.5084 1.8249 11.7163 1.68696 11.9447 1.59431C12.1731 1.50166 12.4173 1.45605 12.6637 1.46001C12.9101 1.46398 13.1529 1.51742 13.3779 1.61716C13.6029 1.7169 13.8055 1.86085 13.9733 2.04001C14.1412 2.21918 14.2708 2.43022 14.3547 2.66062C14.4386 2.89102 14.475 3.13614 14.4613 3.38068C14.4477 3.62522 14.3842 3.86419 14.2747 4.08334C14.1652 4.3025 14.012 4.49744 13.824 4.65601L6.15733 12.3227L2.66667 13.3333L3.67733 9.84268L11.344 2.17601L11.3333 2.00001Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Modifier
                      </button>
                      <span 
                        v-if="modifiedDimensions.has(dimensionScore.dimension) && (activeView === 'comparison' ? lastModified : selectedServiceData?.lastModified)" 
                        class="modification-date"
                      >
                        Modifié le {{ formatDate(activeView === 'comparison' ? lastModified : selectedServiceData?.lastModified) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="recommendation-description-wrapper">
                  <!-- Synthèse (analyse de 5 lignes) -->
                  <div 
                    v-if="getRecommendationSynthesis(dimensionScore)"
                    class="recommendation-synthesis"
                  >
                    <h4 class="synthesis-title">Synthèse</h4>
                    <p class="synthesis-text">
                      {{ getRecommendationSynthesis(dimensionScore) }}
                    </p>
                  </div>
                  <!-- Description (recommandations) -->
                  <p 
                    v-if="(editingRecommendation?.dimension !== dimensionScore.dimension || editingRecommendation?.field !== 'description') && 
                          getRecommendationDescription(dimensionScore).trim() !== getRecommendationSynthesis(dimensionScore).trim() &&
                          !getRecommendationSynthesis(dimensionScore).includes(getRecommendationDescription(dimensionScore))"
                    class="recommendation-description"
                  >
                    {{ getRecommendationDescription(dimensionScore) }}
                  </p>
                  <textarea
                    v-else
                    v-model="editedRecommendations[dimensionScore.dimension].description"
                    class="recommendation-edit-textarea"
                    rows="3"
                  ></textarea>
                </div>
                <div class="recommendation-actions">
                  <div class="action-group">
                    <h4>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 1L11.5 6.5L17.5 7.5L13 11.5L14 17.5L9 14.5L4 17.5L5 11.5L0.5 7.5L6.5 6.5L9 1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      Actions recommandées
                      <button 
                        @click="addAction(dimensionScore.dimension)" 
                        class="btn-add-item"
                        title="Ajouter une action"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                      </button>
                    </h4>
                    <ul>
                      <li v-for="(action, idx) in getRecommendationActions(dimensionScore)" :key="idx" class="editable-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span 
                          v-if="editingRecommendation?.dimension !== dimensionScore.dimension || editingRecommendation?.field !== `actions-${idx}`"
                          @dblclick="startEditingField(dimensionScore.dimension, `actions-${idx}`)"
                          class="editable-text"
                        >
                          {{ action }}
                        </span>
                        <input
                          v-else
                          v-model="editedRecommendations[dimensionScore.dimension].actions[idx]"
                          class="recommendation-edit-input"
                          @keydown.escape.exact.prevent="cancelEditing(dimensionScore.dimension)"
                          autofocus
                        />
                        <button 
                          @click="removeAction(dimensionScore.dimension, idx)" 
                          class="btn-remove-item"
                          title="Supprimer cette action"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                          </svg>
                        </button>
                      </li>
                    </ul>
                  </div>
                  <div class="action-group">
                    <h4>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2L2 5V9C2 12.5 5 15.5 9 16.5C13 15.5 16 12.5 16 9V5L9 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M9 9L9 9.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                      Services & Formations suggérés
                      <button 
                        @click="addService(dimensionScore.dimension)" 
                        class="btn-add-item"
                        title="Ajouter un service"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                      </button>
                    </h4>
                    <ul>
                      <li v-for="(service, idx) in getRecommendationServices(dimensionScore)" :key="idx" class="editable-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span 
                          v-if="editingRecommendation?.dimension !== dimensionScore.dimension || editingRecommendation?.field !== `services-${idx}`"
                          @dblclick="startEditingField(dimensionScore.dimension, `services-${idx}`)"
                          class="editable-text"
                        >
                          {{ service }}
                        </span>
                        <input
                          v-else
                          v-model="editedRecommendations[dimensionScore.dimension].services[idx]"
                          class="recommendation-edit-input"
                          @keydown.escape.exact.prevent="cancelEditing(dimensionScore.dimension)"
                          autofocus
                        />
                        <button 
                          @click="removeService(dimensionScore.dimension, idx)" 
                          class="btn-remove-item"
                          title="Supprimer ce service"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                          </svg>
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Vue Détails par service -->
        <div v-else-if="activeView === 'details' && missionData" class="details-view">
          <!-- Résultats détaillés -->
          <div class="card">
            <h2>Résultats détaillés</h2>
            <div v-if="selectedServiceData" class="service-title-section">
              <h3 class="service-title-large">{{ selectedServiceData.name }}</h3>
              <p class="service-code">Code: {{ selectedServiceData.code }}</p>
            </div>
            <p v-else class="card-subtitle">Sélectionner un service pour voir les détails</p>
            <div class="service-selector-section">
              <div class="status-badges">
                <span class="badge badge-purple">{{ validatedCount }}/{{ totalCount }} validé</span>
                <span class="badge badge-gray">{{ draftCount }} brouillon</span>
              </div>
              <div class="service-selector">
                <div class="service-dot" :style="{ backgroundColor: getServiceColor(selectedServiceId) }"></div>
                <select v-model="selectedServiceId" class="service-select">
                  <option :value="null">Sélectionner un service</option>
                  <option 
                    v-for="service in missionData.services" 
                    :key="service.id"
                    :value="service.id"
                  >
                    {{ service.name }} ({{ service.code }})
                  </option>
                </select>
              </div>
              <div class="service-actions">
                <button class="btn-action" @click="openRegenerateModal('all')">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 1V15M1 8H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  Régénérer tout
                </button>
                <button class="btn-action" @click="openHistoryModal">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2Z" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M8 5V8L10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  Historique
                </button>
                <button class="btn-action" @click="openRegenerateModal('service')">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Régénérer ce service
                </button>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="card">
            <h2>Actions</h2>
            <div class="actions-grid">
              <button class="btn-action-primary" @click="previewReport">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 9C1 13.4183 4.58172 17 9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9Z" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M9 5V9L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Prévisualiser
              </button>
              <button class="btn-action-success" @click="approveRecommendations">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5L7 13L3 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Approuver les recommandations
              </button>
              <button 
                class="btn-action" 
                :disabled="!recommendationsApproved"
                @click="generateSyntheticReport"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 12V15C15 15.5304 14.7893 16.0391 14.4142 16.4142C14.0391 16.7893 13.5304 17 13 17H5C4.46957 17 3.96086 16.7893 3.58579 16.4142C3.21071 16.0391 3 15.5304 3 15V3C3 2.46957 3.21071 1.96086 3.58579 1.58579C3.96086 1.21071 4.46957 1 5 1H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 1V7H18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15 1L12 4L15 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Rapport Synthétique (PDF)
              </button>
              <button class="btn-action-secondary" @click="openRegenerateModal('service')">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 1V5M9 13V17M1 9H5M13 9H17M2.34315 2.34315L5.17157 5.17157M12.8284 12.8284L15.6569 15.6569M2.34315 15.6569L5.17157 12.8284M12.8284 5.17157L15.6569 2.34315" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Régénérer avec IA
              </button>

              <button 
                class="btn-action" 
                :disabled="!recommendationsApproved"
                @click="generateDetailedReport"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 12V15C15 15.5304 14.7893 16.0391 14.4142 16.4142C14.0391 16.7893 13.5304 17 13 17H5C4.46957 17 3.96086 16.7893 3.58579 16.4142C3.21071 16.0391 3 15.5304 3 15V3C3 2.46957 3.21071 1.96086 3.58579 1.58579C3.96086 1.21071 4.46957 1 5 1H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 1V7H18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15 1L12 4L15 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Rapport Détaillé (PDF)
              </button>
              <button 
                class="btn-action" 
                :disabled="!recommendationsApproved"
                @click="generateWorkshopGuide"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 12V15C15 15.5304 14.7893 16.0391 14.4142 16.4142C14.0391 16.7893 13.5304 17 13 17H5C4.46957 17 3.96086 16.7893 3.58579 16.4142C3.21071 16.0391 3 15.5304 3 15V3C3 2.46957 3.21071 1.96086 3.58579 1.58579C3.96086 1.21071 4.46957 1 5 1H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 1V7H18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15 1L12 4L15 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Guide Atelier (PDF)
              </button>
            </div>
            <div class="info-message">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="#F59E0B" stroke-width="1.5"/>
                <path d="M10 6V10" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M10 14H10.01" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span>Approuver d'abord les recommandations pour générer les rapports PDF</span>
            </div>
          </div>

          <!-- Vue d'ensemble maturité IA -->
          <div v-if="selectedServiceData" class="card">
            <h2>Vue d'ensemble de votre maturité IA</h2>
            
            <!-- Indicateurs globaux du service -->
            <div class="global-metrics">
              <div class="metric-card">
                <div class="metric-label">Score Global (Moyenne)</div>
                <div class="metric-value" :class="getScoreClass(normalizeScore(selectedServiceData.globalScore))">
                  {{ normalizeScore(selectedServiceData.globalScore) }}%
                </div>
                <div class="metric-description">Moyenne du service</div>
              </div>
              <div v-if="selectedServiceData.globalMedian !== undefined && selectedServiceData.globalMedian !== null" class="metric-card">
                <div class="metric-label">Score Global (Médiane)</div>
                <div class="metric-value" :class="getMedianClass(normalizeScore(selectedServiceData.globalMedian))">
                  {{ normalizeScore(selectedServiceData.globalMedian) }}%
                </div>
                <div class="metric-description">Médiane du service</div>
              </div>
              <div v-if="selectedServiceData.globalNSPRate !== undefined && selectedServiceData.globalNSPRate !== null" class="metric-card">
                <div class="metric-label">Taux "Ne sais pas"</div>
                <div class="metric-value nsp-value">
                  {{ selectedServiceData.globalNSPRate }}%
                </div>
                <div class="metric-description">Taux de réponses "Ne sais pas"</div>
              </div>
            </div>

            <div class="radar-chart-container">
              <RadarChart :scores="selectedServiceData.dimensionScores" />
            </div>

            <!-- Graphiques détaillés (Histogramme) -->
            <div class="sub-dimensions-chart" style="margin-top: 3rem;">
               <h3 style="margin-bottom: 1.5rem; text-align: center;">Détail par dimension</h3>
               <GroupedBarChart 
                  v-if="groupedBarData.length > 0"
                  :groups="groupedBarData"
                  :series="barSeries"
               >
                 <template #label="{ group }">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding-top: 8px;">
                      <DimensionIcons :dimension="String(group.id)" :size="20" />
                      <span style="font-size: 9px; text-align: center; line-height: 1.2; max-width: 70px; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">{{ group.label }}</span>
                    </div>
                 </template>
               </GroupedBarChart>
               <div v-else class="text-center text-gray-500 py-4">
                 Aucune donnée détaillée disponible pour ce service.
               </div>
            </div>
          </div>

          <!-- Recommandations personnalisées -->
          <div v-if="selectedServiceData" class="card">
            <h2>Recommandations personnalisées</h2>
            <div class="recommendations-list">
              <div 
                v-for="(dimensionScore, index) in selectedServiceData.dimensionScores" 
                :key="dimensionScore.dimension"
                class="recommendation-card"
                :class="`theme-${(index as number) % 5}`"
              >
                <div class="recommendation-header">
                  <div class="recommendation-title-section">
                    <div class="theme-icon">
                      <DimensionIcons :dimension="dimensionScore.dimension" :size="24" />
                    </div>
                    <div>
                      <h3>{{ formatDimension(dimensionScore.dimension) }}</h3>
                      <span class="level-tag" :class="`level-${dimensionScore.level}`">{{ getLevelLabel(dimensionScore.level) }}</span>
                    </div>
                  </div>
                  <div class="recommendation-score-section">
                    <div class="score-display">
                      <span class="score-value">{{ normalizeScore(dimensionScore.score) }}%</span>
                      <span class="score-detail">{{ getProgressText(dimensionScore) }}</span>
                    </div>
                    <div class="edit-button-wrapper">
                      <div class="edit-buttons-group" v-if="editingRecommendation?.dimension === dimensionScore.dimension">
                        <button 
                          class="btn-save"
                          :class="{ 
                            'saved': savedInCurrentSession.has(dimensionScore.dimension)
                          }"
                          @click="saveEditing(dimensionScore.dimension)"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                          Sauvegarder
                        </button>
                        <button 
                          class="btn-cancel"
                          @click="cancelEditing(dimensionScore.dimension)"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                          Annuler
                        </button>
                      </div>
                      <button 
                        v-else
                        class="btn-edit"
                        :class="{ 
                          'modified': modifiedDimensions.has(dimensionScore.dimension) && selectedServiceData?.lastModified
                        }"
                        @click="startEditing(dimensionScore.dimension)"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.3333 2.00001C11.5084 1.8249 11.7163 1.68696 11.9447 1.59431C12.1731 1.50166 12.4173 1.45605 12.6637 1.46001C12.9101 1.46398 13.1529 1.51742 13.3779 1.61716C13.6029 1.7169 13.8055 1.86085 13.9733 2.04001C14.1412 2.21918 14.2708 2.43022 14.3547 2.66062C14.4386 2.89102 14.475 3.13614 14.4613 3.38068C14.4477 3.62522 14.3842 3.86419 14.2747 4.08334C14.1652 4.3025 14.012 4.49744 13.824 4.65601L6.15733 12.3227L2.66667 13.3333L3.67733 9.84268L11.344 2.17601L11.3333 2.00001Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Modifier
                      </button>
                      <span 
                        v-if="modifiedDimensions.has(dimensionScore.dimension) && selectedServiceData?.lastModified" 
                        class="modification-date"
                      >
                        Modifié le {{ formatDate(selectedServiceData.lastModified) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="recommendation-description-wrapper">
                  <!-- Synthèse (analyse de 5 lignes) -->
                  <div 
                    v-if="getRecommendationSynthesis(dimensionScore)"
                    class="recommendation-synthesis"
                  >
                    <h4 class="synthesis-title">Synthèse</h4>
                    <p class="synthesis-text">
                      {{ getRecommendationSynthesis(dimensionScore) }}
                    </p>
                  </div>
                  <!-- Description (recommandations) -->
                  <p 
                    v-if="(editingRecommendation?.dimension !== dimensionScore.dimension || editingRecommendation?.field !== 'description') && 
                          getRecommendationDescription(dimensionScore).trim() !== getRecommendationSynthesis(dimensionScore).trim() &&
                          !getRecommendationSynthesis(dimensionScore).includes(getRecommendationDescription(dimensionScore))"
                    class="recommendation-description"
                  >
                    {{ getRecommendationDescription(dimensionScore) }}
                  </p>
                  <textarea
                    v-else
                    v-model="editedRecommendations[dimensionScore.dimension].description"
                    class="recommendation-edit-textarea"
                    rows="3"
                  ></textarea>
                </div>
                <div class="recommendation-actions">
                  <div class="action-group">
                    <h4>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 1L11.5 6.5L17.5 7.5L13 11.5L14 17.5L9 14.5L4 17.5L5 11.5L0.5 7.5L6.5 6.5L9 1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      Actions recommandées
                      <button 
                        @click="addAction(dimensionScore.dimension)" 
                        class="btn-add-item"
                        title="Ajouter une action"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                      </button>
                    </h4>
                    <ul>
                      <li v-for="(action, idx) in getRecommendationActions(dimensionScore)" :key="idx" class="editable-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span 
                          v-if="editingRecommendation?.dimension !== dimensionScore.dimension || editingRecommendation?.field !== `actions-${idx}`"
                          @dblclick="startEditingField(dimensionScore.dimension, `actions-${idx}`)"
                          class="editable-text"
                        >
                          {{ action }}
                        </span>
                        <input
                          v-else
                          v-model="editedRecommendations[dimensionScore.dimension].actions[idx]"
                          class="recommendation-edit-input"
                          @keydown.escape.exact.prevent="cancelEditing(dimensionScore.dimension)"
                          autofocus
                        />
                        <button 
                          @click="removeAction(dimensionScore.dimension, idx)" 
                          class="btn-remove-item"
                          title="Supprimer cette action"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                          </svg>
                        </button>
                      </li>
                    </ul>
                  </div>
                  <div class="action-group">
                    <h4>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2L2 5V9C2 12.5 5 15.5 9 16.5C13 15.5 16 12.5 16 9V5L9 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M9 9L9 9.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                      Services & Formations suggérés
                      <button 
                        @click="addService(dimensionScore.dimension)" 
                        class="btn-add-item"
                        title="Ajouter un service"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                      </button>
                    </h4>
                    <ul>
                      <li v-for="(service, idx) in getRecommendationServices(dimensionScore)" :key="idx" class="editable-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span 
                          v-if="editingRecommendation?.dimension !== dimensionScore.dimension || editingRecommendation?.field !== `services-${idx}`"
                          @dblclick="startEditingField(dimensionScore.dimension, `services-${idx}`)"
                          class="editable-text"
                        >
                          {{ service }}
                        </span>
                        <input
                          v-else
                          v-model="editedRecommendations[dimensionScore.dimension].services[idx]"
                          class="recommendation-edit-input"
                          @keydown.escape.exact.prevent="cancelEditing(dimensionScore.dimension)"
                          autofocus
                        />
                        <button 
                          @click="removeService(dimensionScore.dimension, idx)" 
                          class="btn-remove-item"
                          title="Supprimer ce service"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                          </svg>
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal Historique -->
    <div v-if="showHistoryModal" class="modal-overlay" @click.self="closeHistoryModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Historique des modifications</h2>
          <button class="modal-close" @click="closeHistoryModal">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="historyLoading" class="loading">Chargement de l'historique...</div>
          <div v-else-if="historyError" class="error">{{ historyError }}</div>
          <div v-else-if="historyData.length === 0" class="empty-state">
            Aucune modification enregistrée
          </div>
          <div v-else class="history-list">
            <div 
              v-for="(item, idx) in historyData" 
              :key="idx"
              class="history-item"
            >
              <div class="history-header">
                <span class="history-version">Version {{ item.version }}</span>
                <span class="history-date">{{ formatDate(item.modifiedAt) }}</span>
              </div>
              <p class="history-description">{{ item.changeDescription || 'Modification' }}</p>
              <div v-if="item.modifiedBy" class="history-author">
                Modifié par : {{ item.modifiedBy }}
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeHistoryModal">Fermer</button>
        </div>
      </div>
    </div>

    <!-- Modal Régénérer -->
    <div v-if="showRegenerateModal" class="modal-overlay" @click.self="closeRegenerateModal">
      <div class="modal-content regenerate-modal">
        <div class="modal-header">
          <h2>Régénérer les recommandations IA</h2>
          <p class="modal-subtitle">Personnalisez les paramètres pour obtenir des recommandations adaptées</p>
          <p 
            v-if="openaiConfigured === false" 
            class="modal-warning"
          >
            Claude (IA) n'est pas configuré côté serveur. Les paramètres de langue, ton et niveau de détail n'auront pas d'effet
            et les recommandations resteront générées en mode statique (principalement en français).
          </p>
          <button class="modal-close" @click="closeRegenerateModal">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Langue des recommandations</label>
            <select 
              v-model="regenerateParams.language" 
              class="form-select"
              :disabled="openaiConfigured === false"
            >
              <option value="fr">Français</option>
              <option value="en">Anglais</option>
              <option value="es">Espagnol</option>
              <option value="de">Allemand</option>
            </select>
          </div>

          <div class="form-group">
            <label>Ton des recommandations</label>
            <select 
              v-model="regenerateParams.tone" 
              class="form-select"
              :disabled="openaiConfigured === false"
            >
              <option value="professional">Professionnel et formel</option>
              <option value="friendly">Accessible et convivial</option>
              <option value="technical">Technique et détaillé</option>
              <option value="synthetic">Synthétique (direction)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Niveau de détail</label>
            <select v-model="regenerateParams.detailLevel" class="form-select">
              <option value="balanced">Équilibré (recommandé)</option>
              <option value="concise">Concis (actions essentielles)</option>
              <option value="detailed">Détaillé (avec exemples)</option>
              <option value="exhaustive">Exhaustif (plan complet)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Axe prioritaire</label>
            <select v-model="regenerateParams.priorityAxis" class="form-select">
              <option value="all">Toutes les dimensions</option>
              <option value="weakest">Dimensions les plus faibles</option>
              <option value="strategic">Dimensions stratégiques</option>
              <option value="quickwins">Quick wins (gains rapides)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Contexte additionnel (optionnel)</label>
            <textarea 
              v-model="regenerateParams.additionalContext"
              class="form-textarea"
              rows="4"
              placeholder="Ajoutez des informations spécifiques sur l'organisation, ses contraintes, ses objectifs..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeRegenerateModal" :disabled="regenerating">Annuler</button>

          <button class="btn-primary" @click="regenerateRecommendations" :disabled="regenerating">
            <svg v-if="!regenerating" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 1V5M9 13V17M1 9H5M13 9H17M2.34315 2.34315L5.17157 5.17157M12.8284 12.8284L15.6569 15.6569M2.34315 15.6569L5.17157 12.8284M12.8284 5.17157L15.6569 2.34315" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span v-if="regenerating">Génération en cours...</span>
            <span v-else>Régénérer</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Hidden container for PDF Generation -->
    <div id="report-template-container" style="position: absolute; left: -9999px; top: 0; width: 297mm;">
       <ReportTemplate 
         v-if="showReportTemplate" 
         :mission="mission"
         :mission-data="missionData"
         :global-scores="organizationDimensionScores || dimensionScores"
         :recommendations="recommendations"
         :global-median="globalOrganizationMedian"
         :global-nsp-rate="globalOrganizationNSPRate"
         :report-title="reportMode === 'detailed' ? 'Rapport Complet (Global + Services)' : 'Rapport Synthétique'"
         :services-data="servicesForPdf"
       />
    </div>

    <!-- PDF Generation Overlay -->
    <div v-if="generatingPDF" class="pdf-loading-overlay">
       <div class="loader-content">
          <div class="spinner"></div>
          <h2>Génération du rapport en cours...</h2>
          <p>Cela peut prendre quelques secondes.</p>
       </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

import RadarChart from '../components/RadarChart.vue'
import GroupedBarChart from '../components/charts/GroupedBarChart.vue'
import ReportTemplate from '../components/ReportTemplate.vue'
import DimensionIcons from '../components/DimensionIcons.vue'
import type { DimensionScore } from '@shared/types'

// const router = useRouter() // unused
const props = defineProps<{ params: any; query: any }>()
const query = props.query

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
const anonymousCount = ref<number>(0)

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

const regenerating = ref(false)

const generatingPDF = ref(false)
const showReportTemplate = ref(false)
const reportMode = ref<'synthetic' | 'detailed'>('synthetic')

const servicesForPdf = computed(() => {
  if (reportMode.value === 'detailed' && missionData.value?.services) {
    return missionData.value.services.map((s: any) => ({
      id: s.id,
      name: s.name,
      scores: s.dimensionScores || []
    }))
  }
  return []
})

const regenerateParams = ref({
  language: 'fr',
  tone: 'professional',
  detailLevel: 'balanced',
  priorityAxis: 'all',
  additionalContext: ''
})

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
  // Use the pre-aggregated results from the API as the primary source of truth
  // This handles orphan respondents and unassigned sessions correctly
  if (dimensionScores.value && dimensionScores.value.length > 0) {
    return dimensionScores.value
  }
  
  // Minimal fallback if everything else fails
  return []
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
  if (median > 50) return 'low'
  if (median <= 20) return 'high'
  return 'medium'
}

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
    anonymousCount.value = data.anonymousCount || 0
    
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

// getDimensionMedian removed as unused

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

/* getDimensionIconPath removed */

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
  // Check if we have edited version
  if (editedRecommendations.value[score.dimension]?.synthesis) {
    return editedRecommendations.value[score.dimension].synthesis
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
      
      if (rec?.synthesis) return rec.synthesis
      
      // If no synthesis, return empty string
      return ''
    }
  }
  
  // For SERVICE view, use service-specific recommendations
  if (activeView.value === 'details' && selectedServiceData.value?.recommendations) {
    const rec = selectedServiceData.value.recommendations.find((r: any) => 
      r.dimension === score.dimension
    )
    if (rec?.synthesis) return rec.synthesis
    
    // If no synthesis, return empty string
    return ''
  }
  
  return ''
}

function getRecommendationDescription(score: DimensionScore): string {
  const normalizedScoreDimension = normalizeDimensionKeyFrontend(score.dimension) || score.dimension

  // 1. Check if edited
  if (editedRecommendations.value[score.dimension]?.description) {
    return editedRecommendations.value[score.dimension].description
  }
  
  // 2. Find in recommendations
  const rec = recommendations.value.find((r: any) => {
    const normalizedRecDimension = normalizeDimensionKeyFrontend(r.dimension)
    return normalizedRecDimension === normalizedScoreDimension
  })
  
  return rec?.description || ''
}

function getRecommendationActions(score: DimensionScore): string[] {
  const normalizedScoreDimension = normalizeDimensionKeyFrontend(score.dimension) || score.dimension

  // 1. Check if edited
  if (editedRecommendations.value[score.dimension]?.actions) {
    return editedRecommendations.value[score.dimension].actions
  }
  
  // 2. Find in recommendations
  const rec = recommendations.value.find((r: any) => {
    const normalizedRecDimension = normalizeDimensionKeyFrontend(r.dimension)
    return normalizedRecDimension === normalizedScoreDimension
  })
  
  return Array.isArray(rec?.actions) ? rec.actions : []
}

function getRecommendationServices(score: DimensionScore): string[] {
  const normalizedScoreDimension = normalizeDimensionKeyFrontend(score.dimension) || score.dimension

  // 1. Check if edited
  if (editedRecommendations.value[score.dimension]?.services) {
    return editedRecommendations.value[score.dimension].services
  }
  
  // 2. Find in recommendations
  const rec = recommendations.value.find((r: any) => {
    const normalizedRecDimension = normalizeDimensionKeyFrontend(r.dimension)
    return normalizedRecDimension === normalizedScoreDimension
  })
  
  return Array.isArray(rec?.services) ? rec.services : []
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

async function generateDetailedReport() {
  if (regenerating.value || generatingPDF.value) return
  
  try {
    const missionId = mission.value?.id
    if (!missionId) {
      alert("Impossible de générer le rapport : ID de mission introuvable.")
      return
    }

    reportMode.value = 'detailed'
    regenerating.value = true
    generatingPDF.value = true
    
    // Call server-side Puppeteer generation
    const response = await fetch(`/api/export/pdf?mission=${missionId}&mode=detailed`)
    
    if (!response.ok) {
       const text = await response.text()
       let errorMsg = 'Erreur serveur'
       try {
         const json = JSON.parse(text)
         errorMsg = json.error || errorMsg
       } catch (e) { errorMsg = text }
       throw new Error(errorMsg)
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    const organizationName = mission.value?.organizationName || 'Organisation'
    a.download = `Rapport_Complet_${organizationName.replace(/[^a-z0-9]/gi, '_')}.pdf`
    
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Error generating report:', error)
    alert(`Une erreur est survenue lors de la génération du rapport PDF : ${(error as Error).message}`)
  } finally {
    showReportTemplate.value = false
    regenerating.value = false
    generatingPDF.value = false
  }
}

async function generateWorkshopGuide() {
   alert("Cette fonctionnalité sera bientôt disponible avec le nouveau format.")
}

async function generateSyntheticReport() {
    if (regenerating.value || generatingPDF.value) return
  
    try {
      const missionId = mission.value?.id
      if (!missionId) {
        alert("Impossible de générer le rapport : ID de mission introuvable.")
        return
      }

      reportMode.value = 'synthetic'
      regenerating.value = true
      generatingPDF.value = true
      
      const response = await fetch(`/api/export/pdf?mission=${missionId}&mode=synthetic`)
      
      if (!response.ok) {
         const text = await response.text()
         let errorMsg = 'Erreur serveur'
         try {
           const json = JSON.parse(text)
           errorMsg = json.error || errorMsg
         } catch (e) { errorMsg = text }
         throw new Error(errorMsg)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const organizationName = mission.value?.organizationName || 'Organisation'
      a.download = `Rapport_Synthetique_${organizationName.replace(/[^a-z0-9]/gi, '_')}.pdf`
      
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error(error); 
      alert(`Erreur génération rapport: ${(error as Error).message}`)
    } finally {
      regenerating.value = false; generatingPDF.value = false
    }
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
      
      // Message spécifique si l’erreur vient de Claude (clé/quotas/réponse invalide, etc.)
      if (error.openaiError) {
        alert(
          `Erreur Claude IA lors de la régénération des recommandations : ` +
          `${error.message || error.error || "Erreur inconnue avec l’API Claude."}`
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
        errorMessage = 'La requête a pris trop de temps. Le serveur peut être surchargé ou l\'appel à Claude IA est trop long. Veuillez réessayer.'
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
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.page-navigation {
  margin-top: 1rem;
  margin-bottom: 2rem;
  
  .nav-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
}

.page-title-section {
  margin-bottom: 2rem;
  
  .page-title {
    margin: 0;
    font-size: 2.5rem;
    color: #111827;
  }
  
  .mission-name {
    margin: 0.25rem 0 0 0;
    color: #4b5563;
    font-weight: 500;
  }
}

.tabs-container {
  display: flex;
  gap: 2rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
  margin-bottom: 2rem;
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.5rem 0;
  font-family: 'Oswald', sans-serif !important;
  font-weight: 700;
  color: #9ca3af;
  cursor: pointer;
  position: relative;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  &.active {
    color: #00B1E6;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -0.6rem;
      left: 0;
      right: 0;
      height: 3px;
      background-color: #00B1E6;
    }
  }
  
  &:hover:not(.active) {
    color: #4b5563;
  }
}
.results {
  min-height: 100vh;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  position: relative;
  
  // Decorative elements
  &::before {
    content: '';
    position: fixed;
    top: 10%;
    right: -80px;
    width: 250px;
    height: 250px;
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(236, 72, 153, 0.03) 100%);
    border-radius: 50%;
    z-index: 0;
    pointer-events: none;
  }
  
  &::after {
    content: '';
    position: fixed;
    bottom: 10%;
    left: -80px;
    width: 200px;
    height: 200px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%);
    border-radius: 50%;
    z-index: 0;
    pointer-events: none;
  }
}

.header {
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  padding: $spacing-lg 0;
  margin-bottom: $spacing-xl;
  position: relative;
  z-index: 1;
  border-bottom: 3px solid $primary;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 $spacing-lg;
  }

  .btn-back {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    color: $gray-600;
    text-decoration: none;
    font-size: $font-size-sm;
    margin-bottom: $spacing-md;
    
    &:hover {
      color: $primary;
    }
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $spacing-lg;

    h1 {
      margin: 0 0 $spacing-xs 0;
      font-size: $font-size-2xl;
    }

    .mission-subtitle {
      margin: 0;
      font-size: $font-size-base;
      color: $gray-600;
    }

    .btn-export {
      @include button-primary;
      display: flex;
      align-items: center;
      gap: $spacing-xs;
    }
  }

  .tabs {
    display: flex;
    gap: $spacing-sm;
    border-bottom: 2px solid $gray-200;

    .tab {
      padding: $spacing-md $spacing-lg;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: $gray-600;
      font-size: $font-size-base;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: -2px;

      &:hover {
        color: $primary;
      }

      &.active {
        color: $primary;
        border-bottom-color: $primary;
      }
    }
  }
}

.container {
  max-width: 1250px;
  margin: 0 auto;
  padding: 0 $spacing-xl;
  
  @media (min-width: 1400px) {
    max-width: 1350px;
    padding: 0 $spacing-2xl;
  }
}

// Vue résultats individuels (session)
.individual-session-view {
  .results-table-container {
    margin-top: $spacing-lg;
    overflow-x: auto;
  }

  .results-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: $radius-xl;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);

    thead {
      background: linear-gradient(135deg, $gray-100 0%, $gray-50 100%);
      
      th {
        padding: $spacing-md $spacing-lg;
        text-align: left;
        font-weight: 600;
        color: $gray-900;
        font-size: $font-size-sm;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 2px solid $gray-200;
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid $gray-200;
        transition: background 0.2s;

        &:hover {
          background: $gray-50;
        }

        &:last-child {
          border-bottom: none;
        }
      }

      td {
        padding: $spacing-md $spacing-lg;
        color: $gray-900;
      }

      .dimension-name {
        font-weight: 500;
      }
    }

    tfoot {
      background: $gray-50;
      border-top: 2px solid $gray-300;

      tr.global-score-row {
        td {
          padding: $spacing-md $spacing-lg;
          font-weight: 600;
        }
      }
    }
  }
}

.card {
  @include card;
  padding: $spacing-xl;
  margin-bottom: $spacing-xl;
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border-radius: $radius-xl;
  border-left: 4px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, rgba(0, 102, 204, 0.03) 0%, transparent 100%);
    border-radius: 0 0 0 100%;
    pointer-events: none;
  }
  
  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border-left-color: $primary;
  }

  h2 {
    margin: 0 0 $spacing-xs 0;
    font-size: $font-size-xl;
    font-weight: 700;
    color: $gray-900;
    position: relative;
    z-index: 1;
  }

  .card-subtitle {
    margin: 0 0 $spacing-lg 0;
    color: $gray-600;
    font-size: $font-size-sm;
    position: relative;
    z-index: 1;
  }
}

// Vue Comparaison
.services-overview {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.service-overview-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  padding: $spacing-xl;
  background: white;
  border-radius: $radius-xl;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border-left: 3px solid $primary;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateX(4px);
  }

  .service-name-section {
    text-align: center;
    
    h3 {
      margin: 0 0 $spacing-xs 0;
      font-size: $font-size-2xl;
      font-weight: 700;
      color: $primary;
      font-family: 'Calibri', 'Arial', sans-serif;
      letter-spacing: 0.5px;
    }

    .service-code {
      margin: 0;
      font-size: $font-size-sm;
      color: $gray-600;
      font-family: 'Calibri', 'Arial', sans-serif;
    }
  }

  .service-scores {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-md;
    width: 100%;
    max-width: 100%;

    .score-badge {
      padding: $spacing-sm $spacing-md;
      border-radius: 9999px;
      font-size: $font-size-base;
      font-weight: 600;
      color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      display: inline-block;
      min-width: 60px;
      text-align: center;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      &.high {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      }

      &.medium {
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      }

      &.low {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      }
    }

    .global-scores {
      display: flex;
      gap: $spacing-2xl;
      flex-wrap: wrap;
      justify-content: center;
      align-items: flex-start;
      width: 100%;
      padding: $spacing-lg 0;
      
      .score-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: $spacing-sm;
        min-width: 120px;
        padding: $spacing-md;
        background: rgba(249, 250, 251, 0.5);
        border-radius: $radius-lg;
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(249, 250, 251, 0.8);
          transform: translateY(-2px);
        }
        
        .score-label {
          font-size: $font-size-xs;
          font-weight: 700;
          color: $gray-700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: $spacing-xs;
        }
        
        .score-badge {
          font-size: $font-size-lg;
          padding: $spacing-md $spacing-lg;
          min-width: 85px;
          font-weight: 700;
        }
      }
    }

    .score-badge.median-badge {
      font-size: $font-size-sm;
      // La couleur sera définie par la classe getMedianClass (logique inversée pour médiane)
      // Médiane > 50% = ROUGE (divergence), 0-20% = VERT (convergence), 21-49% = ORANGE
      // Si aucune classe n'est appliquée, utiliser une couleur par défaut
      &:not(.high):not(.medium):not(.low) {
        background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
      }
    }

    .score-badge.nsp-badge {
      font-size: $font-size-sm;
      background: #6b7280; // Gris pour "Ne sais pas"
      color: white;
    }

    .sub-dimensions-chart {
      display: flex;
      flex-direction: column;
      gap: $spacing-lg;
      margin-top: $spacing-xl;
      padding-top: $spacing-xl;
      border-top: 2px solid $gray-200;
      width: 100%;

      .dimension-bar-chart {
        display: flex;
        flex-direction: column;
        gap: $spacing-md;
        padding: $spacing-lg;
        background: white;
        border-radius: $radius-lg;
        border-left: 4px solid $primary;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        
        .dimension-header {
          margin-bottom: $spacing-lg;
          padding-bottom: $spacing-md;
          border-bottom: 2px solid $gray-200;
          
          .dimension-name-wrapper {
            display: flex;
            align-items: center;
            gap: $spacing-md;
            
            .dimension-icon {
              flex-shrink: 0;
              width: 40px;
              height: 40px;
              padding: $spacing-xs;
              background: $gray-100;
              border-radius: $radius-md;
              color: $primary;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .dimension-name {
              font-size: $font-size-lg;
              font-weight: 700;
              color: $gray-900;
              text-transform: capitalize;
              margin: 0;
              letter-spacing: 0.3px;
              font-family: 'Calibri', 'Arial', sans-serif;
            }
          }
        }
        
        .bars-container {
          display: flex;
          flex-direction: column;
          gap: $spacing-md;
          
          .bar-item {
            display: flex;
            align-items: center;
            gap: $spacing-md;
            
            .bar-label {
              min-width: 100px;
              font-size: $font-size-sm;
              font-weight: 700;
              color: $gray-700;
              text-align: right;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .bar-wrapper {
              flex: 1;
              height: 36px;
              background: $gray-200;
              border-radius: $radius-md;
              position: relative;
              overflow: hidden;
              min-width: 0;
              
              .bar {
                height: 100%;
                border-radius: $radius-md;
                display: flex;
                align-items: center;
                justify-content: flex-end;
                padding-right: $spacing-sm;
                transition: width 0.5s ease;
                position: relative;
                min-width: 60px;
                
                .bar-value {
                  font-size: $font-size-sm;
                  font-weight: 700;
                  color: white;
                  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                  white-space: nowrap;
                }
                
                &.bar-average {
                  &.high {
                    background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
                  }
                  
                  &.medium {
                    background: linear-gradient(90deg, #f97316 0%, #ea580c 100%);
                  }
                  
                  &.low {
                    background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
                  }
                }
                
                &.bar-median {
                  &.high {
                    background: linear-gradient(90deg, rgba(34, 197, 94, 0.85) 0%, rgba(22, 163, 74, 0.85) 100%);
                  }
                  
                  &.medium {
                    background: linear-gradient(90deg, rgba(249, 115, 22, 0.85) 0%, rgba(234, 88, 12, 0.85) 100%);
                  }
                  
                  &.low {
                    background: linear-gradient(90deg, rgba(239, 68, 68, 0.85) 0%, rgba(220, 38, 38, 0.85) 100%);
                  }
                  
                  &:not(.high):not(.medium):not(.low) {
                    background: linear-gradient(90deg, #9333ea 0%, #7e22ce 100%);
                  }
                }
                
                &.bar-nsp {
                  background: linear-gradient(90deg, #6b7280 0%, #4b5563 100%);
                }
              }
            }
          }
        }
      }
    }
  }
}

.comparison-table-container {
  overflow-x: auto;
  margin-top: $spacing-lg;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: $radius-xl;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);

  thead {
    background: linear-gradient(135deg, $gray-100 0%, $gray-50 100%);

    th {
      padding: $spacing-md;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid $gray-200;
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid $gray-200;

      &:hover {
        background: $gray-50;
      }
    }

    td {
      padding: $spacing-md;
    }

    .dimension-name {
      font-weight: 500;
    }

    .score-pill {
      display: inline-block;
      padding: $spacing-xs $spacing-sm;
      border-radius: 9999px;
      font-size: $font-size-sm;
      font-weight: 600;

      &.median-pill {
        background: #9333ea;
        color: white;
      }
      color: white;

      &.high {
        background: #22c55e; // VERT
      }

      &.medium {
        background: #f97316; // ORANGE
      }

      &.low {
        background: #ef4444; // ROUGE
      }
    }

    .average-score {
      font-weight: 500;
      color: $gray-700;
    }

    .global-score-row {
      background: $gray-50;
      font-weight: 600;
    }
  }
}

// Vue Détails
.service-title-section {
  text-align: center;
  margin-bottom: $spacing-xl;
  padding-bottom: $spacing-lg;
  border-bottom: 2px solid $gray-200;
  
  .service-title-large {
    margin: 0 0 $spacing-xs 0;
    font-size: $font-size-3xl;
    font-weight: 700;
    color: $primary;
    font-family: 'Calibri', 'Arial', sans-serif;
    letter-spacing: 0.5px;
  }
  
  .service-code {
    margin: 0;
    font-size: $font-size-sm;
    color: $gray-600;
    font-family: 'Calibri', 'Arial', sans-serif;
  }
}

.service-selector-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  margin-top: $spacing-lg;
}

.status-badges {
  display: flex;
  gap: $spacing-sm;
}

.badge {
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-md;
  font-size: $font-size-xs;
  font-weight: 600;

  &.badge-purple {
    background: rgba(147, 51, 234, 0.1);
    color: #9333ea;
  }

  &.badge-gray {
    background: $gray-200;
    color: $gray-700;
  }
}

.service-selector {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .service-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .service-select {
    @include input;
    flex: 1;
    max-width: 400px;
  }
}

.service-actions {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.btn-action {
  @include button-secondary;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  font-size: $font-size-sm;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: $primary;
    color: white !important;
    border-color: $primary;
    transform: translateY(-1px);
    box-shadow: $shadow-md;
    
    svg {
      stroke: white !important;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    color: $gray-400 !important;
    
    svg {
      stroke: $gray-400 !important;
    }
  }
  
  svg {
    flex-shrink: 0;
  }
}

.btn-action-primary {
  @include button-primary;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  font-size: $font-size-sm;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: $shadow-md;
  }
  
  svg {
    flex-shrink: 0;
  }
}

.btn-action-success {
  background: #10b981;
  color: white;
  border: none;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-md;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-size-sm;
  transition: all 0.2s;
  
  &:hover {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: $shadow-md;
  }
  
  svg {
    flex-shrink: 0;
  }
}

.btn-action-secondary {
  background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
  color: white;
  border: none;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-md;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-size-sm;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
  
  &:hover {
    background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
  }
  
  svg {
    flex-shrink: 0;
    color: white;
  }
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.info-message {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md;
  background: rgba(245, 158, 11, 0.1);
  border-radius: $radius-md;
  color: #92400e;
  font-size: $font-size-sm;
}

.global-metrics {
  display: flex;
  gap: $spacing-2xl;
  margin-bottom: $spacing-xl;
  flex-wrap: wrap;
  justify-content: center;
  align-items: stretch;
  
  .metric-card {
    flex: 1;
    min-width: 220px;
    max-width: 280px;
    padding: $spacing-xl;
    background: white;
    border-radius: $radius-xl;
    border: 2px solid $gray-200;
    text-align: center;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    
    &:hover {
      border-color: $primary;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
    
    .metric-label {
      font-size: $font-size-sm;
      font-weight: 700;
      color: $gray-700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: $spacing-lg;
      padding-bottom: $spacing-sm;
      border-bottom: 2px solid $gray-200;
    }
    
    .metric-value {
      font-size: $font-size-3xl;
      font-weight: 700;
      margin: $spacing-lg 0;
      padding: $spacing-lg $spacing-xl;
      border-radius: $radius-lg;
      display: inline-block;
      min-width: 120px;

      &.nsp-value {
        color: white;
        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
      }
      
      color: white;
      
      &.high {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      }
      
      &.medium {
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      }
      
      &.low {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      }
    }
    
    .metric-description {
      font-size: $font-size-xs;
      color: $gray-600;
      font-style: italic;
      margin-top: $spacing-md;
    }
  }
}

.radar-chart-container {
  @include flex-center;
  padding: $spacing-xl 0;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  margin-top: $spacing-lg;
}

.recommendation-card {
  @include card;
  padding: $spacing-xl;
  border-left: 4px solid $primary;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }

  // Thèmes colorés harmonisés avec les niveaux
  // Les couleurs sont basées sur le niveau (high=VERT, medium=ORANGE, low=ROUGE)
  &.theme-0 {
    border-left-color: #22c55e; // VERT (high)
    .theme-icon {
      color: #22c55e;
    }
    .level-tag.level-high {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }
    .score-value {
      color: #22c55e;
    }
  }

  &.theme-1 {
    border-left-color: #f97316; // ORANGE (medium)
    .theme-icon {
      color: #f97316;
    }
    .level-tag.level-medium {
      background: rgba(249, 115, 22, 0.1);
      color: #f97316;
    }
    .score-value {
      color: #f97316;
    }
  }

  &.theme-2 {
    border-left-color: #22c55e; // VERT (high)
    .theme-icon {
      color: #22c55e;
    }
    .level-tag.level-high {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }
    .score-value {
      color: #22c55e;
    }
  }

  &.theme-3 {
    border-left-color: #f97316; // ORANGE (medium)
    .theme-icon {
      color: #f97316;
    }
    .level-tag.level-medium {
      background: rgba(249, 115, 22, 0.1);
      color: #f97316;
    }
    .score-value {
      color: #f97316;
    }
  }

  &.theme-4 {
    border-left-color: #ef4444; // ROUGE (low)
    .theme-icon {
      color: #ef4444;
    }
    .level-tag.level-low {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
    .score-value {
      color: #ef4444;
    }
  }
}

.recommendation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-md;
}

.recommendation-title-section {
  display: flex;
  align-items: flex-start;
  gap: $spacing-md;
  flex: 1;

  .theme-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(37, 99, 235, 0.1);
    border-radius: $radius-md;
    margin-top: 0;
  }

  h3 {
    margin: 0 0 $spacing-xs 0;
    font-size: $font-size-xl;
    font-weight: 600;
    color: $gray-900;
  }

  .level-tag {
    display: inline-block;
    padding: 4px $spacing-sm;
    background: $gray-200;
    color: $gray-700;
    border-radius: $radius-sm;
    font-size: $font-size-xs;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    
    &.level-high {
      background: rgba(34, 197, 94, 0.1); // VERT
      color: #22c55e;
    }
    
    &.level-medium {
      background: rgba(249, 115, 22, 0.1); // ORANGE
      color: #f97316;
    }
    
    &.level-low {
      background: rgba(239, 68, 68, 0.1); // ROUGE
      color: #ef4444;
    }
  }
}

.recommendation-score-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: $spacing-sm;

  .score-display {
    display: flex;
    flex-direction: column;
    align-items: flex-end;

    .score-value {
      font-size: $font-size-xl;
      font-weight: 600;
      color: $primary;
    }

    .score-detail {
      font-size: $font-size-xs;
      color: $gray-600;
    }
  }

  .edit-button-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: $spacing-xs;
  }

  .edit-buttons-group {
    display: flex;
    gap: $spacing-xs;
  }

  .btn-edit {
    @include button-secondary;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-sm;
    transition: all 0.2s;
    
    &:hover {
      background: $primary !important;
      color: white !important;
      border-color: $primary !important;
      transform: translateY(-1px);
      box-shadow: $shadow-sm;
      
      svg {
        color: white !important;
      }
    }
    
    &.modified {
      background: #10b981;
      color: white;
      border-color: #10b981;
      
      &:hover {
        background: #059669;
        border-color: #059669;
        color: white !important;
        
        svg {
          color: white !important;
        }
      }
    }
    
    svg {
      flex-shrink: 0;
      color: inherit;
    }
  }

  .btn-save {
    background: $primary;
    color: white;
    border: none;
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-md;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-sm;
    transition: all 0.2s;
    
    &:hover {
      background: $primary-dark;
      transform: translateY(-1px);
      box-shadow: $shadow-sm;
    }
    
    &.saved {
      background: #10b981;
      
      &:hover {
        background: #059669;
      }
    }
    
    svg {
      flex-shrink: 0;
    }
  }

  .btn-cancel {
    background: white;
    color: $gray-600;
    border: 1px solid $gray-300;
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-md;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-sm;
    transition: all 0.2s;
    
    &:hover {
      background: $gray-50;
      border-color: $gray-400;
    }
    
    svg {
      flex-shrink: 0;
    }
  }
  
  .modification-date {
    font-size: $font-size-xs;
    color: #10b981;
    font-weight: 500;
  }
}

// Modal styles
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $spacing-lg;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: $radius-lg;
  box-shadow: $shadow-xl;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.regenerate-modal {
    max-width: 700px;
  }
}

.modal-header {
  padding: $spacing-xl;
  border-bottom: 1px solid $gray-200;
  position: relative;

  h2 {
    margin: 0 0 $spacing-xs 0;
    font-size: $font-size-xl;
    font-weight: 600;
    color: $gray-900;
  }

  .modal-subtitle {
    margin: 0;
    font-size: $font-size-sm;
    color: $gray-600;
  }

  .modal-close {
    position: absolute;
    top: $spacing-lg;
    right: $spacing-xl;
    background: none;
    border: none;
    cursor: pointer;
    padding: $spacing-xs;
    color: $gray-400;
    transition: color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: $gray-600;
    }
  }
}

.modal-body {
  padding: $spacing-xl;
  overflow-y: auto;
  flex: 1;

  .form-group {
    margin-bottom: $spacing-lg;

    label {
      display: block;
      margin-bottom: $spacing-xs;
      font-weight: 500;
      color: $gray-900;
      font-size: $font-size-sm;
    }

    .form-select {
      width: 100%;
      padding: $spacing-sm $spacing-md;
      border: 1px solid $gray-300;
      border-radius: $radius-md;
      font-size: $font-size-base;
      font-family: inherit;
      background: white;
      cursor: pointer;
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: $primary;
        box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
      }

      &:hover {
        border-color: $gray-400;
      }
    }

    .form-textarea {
      width: 100%;
      padding: $spacing-md;
      border: 1px solid $gray-300;
      border-radius: $radius-md;
      font-size: $font-size-base;
      font-family: inherit;
      resize: vertical;
      min-height: 100px;
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: $primary;
        box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
      }

      &::placeholder {
        color: $gray-400;
      }
    }
  }

  .loading {
    text-align: center;
    padding: $spacing-xl;
    color: $gray-600;
  }

  .error {
    text-align: center;
    padding: $spacing-xl;
    color: $danger;
    background: rgba(239, 68, 68, 0.1);
    border-radius: $radius-md;
  }

  .empty-state {
    text-align: center;
    padding: $spacing-xl;
    color: $gray-500;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  .history-item {
    padding: $spacing-md;
    background: $gray-50;
    border-radius: $radius-md;
    border-left: 3px solid $primary;

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-xs;
    }

    .history-version {
      font-weight: 600;
      color: $primary;
      font-size: $font-size-sm;
    }

    .history-date {
      font-size: $font-size-xs;
      color: $gray-600;
    }

    .history-description {
      margin: $spacing-xs 0;
      color: $gray-700;
      font-size: $font-size-sm;
    }

    .history-author {
      font-size: $font-size-xs;
      color: $gray-500;
      margin-top: $spacing-xs;
    }
  }
}

.modal-footer {
  padding: $spacing-xl;
  border-top: 1px solid $gray-200;
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;

  .btn-secondary {
    @include button-secondary;
  }

  .btn-primary {
    @include button-primary;
    display: flex;
    align-items: center;
    gap: $spacing-xs;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    svg {
      flex-shrink: 0;
    }
  }
}

.recommendation-description-wrapper {
  margin: 0 0 $spacing-lg 0;
}

.recommendation-synthesis {
  margin-bottom: $spacing-md;
  padding: $spacing-md;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%);
  border-left: 4px solid $primary;
  border-radius: $radius-md;
  
  .synthesis-title {
    margin: 0 0 $spacing-sm 0;
    font-size: $font-size-sm;
    font-weight: 600;
    color: $primary;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .synthesis-text {
    margin: 0;
    color: $gray-800;
    line-height: 1.8;
    font-size: $font-size-base;
    white-space: pre-line;
  }
}

.recommendation-description {
  padding: $spacing-md;
  background: $gray-50;
  border-radius: $radius-md;
  color: $gray-700;
  line-height: 1.7;
  font-size: $font-size-base;
}

.recommendation-edit-textarea {
  width: 100%;
  padding: $spacing-md;
  border: 2px solid $primary;
  border-radius: $radius-md;
  font-size: $font-size-base;
  line-height: 1.7;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: $primary-dark;
    box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
  }
}

.recommendation-edit-input {
  flex: 1;
  padding: $spacing-xs $spacing-sm;
  border: 2px solid $primary;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  font-family: inherit;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: $primary-dark;
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
  }
}

.btn-remove-item {
  background: transparent;
  border: none;
  color: $danger;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  transition: all 0.2s;
  opacity: 0.6;
  flex-shrink: 0;
  
  &:hover {
    opacity: 1;
    background: rgba(239, 68, 68, 0.1);
    transform: scale(1.1);
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
}

.recommendation-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-xl;
  margin-top: $spacing-lg;
  padding-top: $spacing-lg;
  border-top: 1px solid $gray-200;

  .action-group {
    h4 {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      margin: 0 0 $spacing-md 0;
      font-size: $font-size-base;
      font-weight: 600;
      color: $gray-900;
      position: relative;

      svg {
        color: $primary;
      }
      
      .btn-add-item {
        margin-left: auto;
        background: $primary;
        color: white;
        border: none;
        border-radius: $radius-sm;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        transition: all 0.2s;
        
        &:hover {
          background: $primary-dark;
          transform: scale(1.1);
        }
        
        svg {
          width: 14px;
          height: 14px;
          color: white;
        }
      }
    }

    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      color: $gray-700;

      li {
        display: flex;
        align-items: flex-start;
        gap: $spacing-sm;
        margin-bottom: $spacing-sm;
        line-height: 1.6;
        padding: $spacing-xs 0;

        svg {
          flex-shrink: 0;
          margin-top: 4px;
          color: $primary;
        }
        
        &.editable-item {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          
          .editable-text {
            flex: 1;
            cursor: text;
            padding: 2px 4px;
            border-radius: $radius-sm;
            transition: background 0.2s;
            
            &:hover {
              background: $gray-100;
            }
          }
        }
      }
    }
  }
}

.loading, .error {
  text-align: center;
  padding: $spacing-2xl;
  color: $gray-600;
}

.error {
  color: $danger;
}

.pdf-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;

  .loader-content {
    background: white;
    padding: 3rem;
    border-radius: 20px;
    color: #333;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);

    h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #6B21A8;
      margin: 0;
    }

    p {
      color: #6B7280;
      margin: 0;
    }
  }

  .spinner {
    width: 60px;
    height: 60px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #FFD700;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

</style>
