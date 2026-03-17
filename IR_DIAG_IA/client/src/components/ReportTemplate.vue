<template>
  <div class="report-container" id="report-content">
    <!-- PAGE 1: COVER -->
    <div class="report-page cover-page">
      <div class="hex-background"></div>
      <div class="content wrapper">
        <div class="logos-top-right">
          <img src="/logo.png" class="logo-ir" alt="Images & Réseaux" />
        </div>
        
        <div class="center-hex">
          <h1>Rapport d'analyse<br>{{ mission?.organizationName || 'Organisation' }}</h1>
          <h2>{{ reportTitle || 'Votre maturité IA - Rapport d\'analyse global' }}</h2>
        </div>

        <div class="footer-block">
          <h3>Le Pôle de Compétitivité<br><span>NUMÉRIQUE</span><br>du Grand Ouest</h3>
        </div>
      </div>
      <div class="report-footer">
        <div class="footer-strip">
          <span>{{ todayDate }}</span>
          <span class="brand">IMAGES & RÉSEAUX</span>
          <span class="confidential">CONFIDENTIEL</span>
        </div>
      </div>
    </div>

    <!-- PAGE 2: DIMENSIONS REMINDER -->
    <div class="report-page intro-page">
      <div class="header">
        <div class="hex-icon">
          <span>IA</span>
        </div>
        <h2>RAPPEL DES 10 DIMENSIONS STRATÉGIQUES</h2>
      </div>

      <div class="dimensions-grid">
        <div v-for="dim in allDimensions" :key="dim" class="dim-item">
          <div class="icon-circle">
            <div class="flat-icon" v-html="getIconSVG(dim, 40, 'white')"></div>
          </div>
          <span class="dim-label-btn">{{ formatDimension(dim).toUpperCase() }}</span>
        </div>
      </div>

      <div class="quote-block">
        <div class="quote-content">
          <h4>PERSPECTIVE STRUCTURELLE</h4>
          <div class="quote-flex">
            <span class="quote-mark-mini">“</span>
            <p>L'IA est plus qu'une simple technologie, elle nécessite une approche globale adressant tous les domaines importants</p>
          </div>
        </div>
      </div>
      <div class="report-footer">
        <div class="footer-strip">
          <span>{{ todayDate }}</span>
          <span class="brand">IMAGES & RÉSEAUX</span>
          <span class="confidential">CONFIDENTIEL</span>
        </div>
      </div>
    </div>

    <!-- PAGE 3: GLOBAL RESULTS (Numbers & Radar) -->
    <div class="report-page global-page">
      <div class="header">
        <div class="hex-icon"><span>IA</span></div>
        <h2>RÉSULTATS GLOBAUX</h2>
      </div>

      <p class="intro-text">
        Les résultats sont présentés en pourcentage, sur la base de l'échelle de réponse choisie par le répondant.
        Plus le pourcentage est élevé, plus il reflète un niveau de maturité important sur la thématique évaluée.
      </p>

      <div class="global-content">
        <div class="left-col score-focus">
          <div class="big-score-hero">
            <span class="value">{{ globalScore }}%</span>
            <div class="sub-stats">
              <div class="stat-item">Médiane: {{ globalMedian }}%</div>
              <div class="stat-item">NSP: {{ globalNspRate }}%</div>
            </div>
          </div>
          <div class="score-label-top" style="margin-top: 1rem;">MOYENNE GLOBALE</div>
        </div>
        
        <div class="center-col-wide">
          <div class="chart-title">MOYENNE PAR THÉMATIQUES</div>
          <div class="chart-container-large">
            <RadarChart :scores="globalScores" />
          </div>
        </div>
      </div>
      
      <div class="report-footer">
        <div class="footer-strip">
          <span>{{ todayDate }}</span>
          <span class="brand">IMAGES & RÉSEAUX</span>
          <span class="confidential">CONFIDENTIEL</span>
          <span class="page-num">PAGE 3</span>
        </div>
      </div>
    </div>

    <!-- PAGE 4: GLOBAL SYNTHESIS -->
    <div class="report-page synthesis-page">
      <div class="header">
        <div class="hex-icon"><span>IA</span></div>
        <h2>SYNTHÈSE GLOBALE</h2>
      </div>

      <div class="synthesis-blocks-container">
        <div class="synthesis-hero-box">
          <div class="purple-gradient-box">
            <div v-if="globalSynthesisPoints.length > 0" class="synthesis-text-wrapper">
              <p v-for="(point, idx) in globalSynthesisPoints" :key="idx" class="synthesis-paragraph">
                {{ point }}
              </p>
            </div>
            <div v-else class="empty-synthesis">
              <p>Analyse globale en cours de rédaction...</p>
            </div>
          </div>
        </div>
      </div>

      <div class="report-footer">
        <div class="footer-strip">
          <span>{{ todayDate }}</span>
          <span class="brand">IMAGES & RÉSEAUX</span>
          <span class="confidential">CONFIDENTIEL</span>
          <span class="page-num">PAGE 4</span>
        </div>
      </div>
    </div>

    <!-- PAGE 5: BILAN PAR DIMENSION -->
    <div class="report-page summary-chart-page">
      <div class="header">
        <div class="hex-icon"><span>IA</span></div>
        <h2>DÉTAIL PAR DIMENSION</h2>
      </div>

      <div class="global-bar-chart-container">
        <GroupedBarChart 
          :groups="globalComparisonData"
          :series="comparisonSeries"
          :height="400"
        >
          <template #label="{ group }">
            <div class="custom-group-label">
              <div class="dim-mini-icon" v-html="getIconSVG(String(group.id), 24, '#6B21A8')"></div>
              <span class="dim-mini-label">{{ group.label }}</span>
            </div>
          </template>
        </GroupedBarChart>
      </div>
      <div class="report-footer">
        <div class="footer-strip">
          <span>{{ todayDate }}</span>
          <span class="brand">IMAGES & RÉSEAUX</span>
          <span class="confidential">CONFIDENTIEL</span>
          <span class="page-num">PAGE 5</span>
        </div>
      </div>
    </div>

    <!-- DETAIL PER DIMENSION loops start at PAGE 6 -->
    <template v-for="(dimScore, index) in globalScores" :key="dimScore.dimension">
      
      <!-- PAGE 1: Metrics (Left) & Chart (Right) -->
      <div class="report-page dimension-page metrics-page">
        <div class="header">
          <div class="hex-icon" v-html="getIconSVG(dimScore.dimension, 30, '#333')"></div>
          <h2 class="dim-title-h2">{{ formatDimension(dimScore.dimension).toUpperCase() }} (1/2)</h2>
        </div>

        <div class="metrics-grid-side">
           <!-- Left Column: KPIs -->
           <div class="metrics-left-panel">
              <div class="score-card-xl">
                 <div class="val">{{ Math.round(dimScore.score) }}%</div>
                 <div class="label">Moyenne</div>
              </div>
              <div class="stats-stack-xl">
                 <div class="stat-row-xl">
                   <span>Médiane</span>
                   <strong>{{ Math.round(dimScore.median || 0) }}%</strong>
                 </div>
                 <div class="stat-row-xl">
                   <span>NSP</span>
                   <strong>{{ Math.round(dimScore.nspRate || 0) }}%</strong>
                 </div>
              </div>
           </div>

           <!-- Right Column: Chart -->
           <div class="metrics-right-panel">
               <h3 class="mini-title" style="text-align: center; font-size: 1rem; margin-bottom: 2rem;">MOYENNE PAR CIBLE</h3>
               <GroupedBarChart 
                 :groups="getDimensionServiceData(dimScore.dimension)"
                 :series="serviceSeries" 
                 :height="350"
               />
               <p class="chart-legend-mini" style="text-align: center; margin-top: 1rem;">*Moy. cible affichée</p>
           </div>
        </div>

        <div class="report-footer">
          <div class="footer-strip">
            <span>{{ todayDate }}</span>
            <span class="brand">IMAGES & RÉSEAUX</span>
            <span class="confidential">CONFIDENTIEL</span>
            <span class="page-num">PAGE {{ 6 + (index * 2) }}</span>
          </div>
        </div>
      </div>

      <!-- PAGE 2: Analysis & Recommendations -->
      <div class="report-page dimension-page analysis-page">
        <div class="header">
          <div class="hex-icon" v-html="getIconSVG(dimScore.dimension, 30, '#333')"></div>
          <h2 class="dim-title-h2">{{ formatDimension(dimScore.dimension).toUpperCase() }} (2/2)</h2>
        </div>

        <div class="analysis-grid">
           <!-- Col 1: Observations -->
           <div class="analysis-col">
              <div class="box-compact purple-top">
                 <h3 class="compact-h3">SYNTHÈSE</h3>
                 <div class="text-content-large">
                    {{ getRecommendationSynthesis(dimScore) || 'Aucune observation.' }}
                 </div>
              </div>
              <div class="box-compact yellow-top" v-if="getRecommendationDescription(dimScore)">
                 <h3 class="compact-h3">DESCRIPTION</h3>
                 <div class="text-content-large">
                    {{ getRecommendationDescription(dimScore) }}
                 </div>
              </div>
           </div>

           <!-- Col 2: Action Plan -->
           <div class="analysis-col">
              <div class="section-block" v-if="getRecommendationActions(dimScore).length > 0">
                 <h3 class="section-title text-blue">☆ ACTIONS RECOMMANDÉES</h3>
                 <ul class="check-list-large text-blue">
                    <li v-for="(action, i) in getRecommendationActions(dimScore)" :key="i">
                       <span class="check-icon">✓</span> {{ action }}
                    </li>
                 </ul>
              </div>
              <div class="section-block" v-if="getRecommendationServices(dimScore).length > 0">
                 <h3 class="section-title text-dark">⬡ SERVICES & FORMATIONS</h3>
                 <ul class="check-list-large text-dark">
                    <li v-for="(service, i) in getRecommendationServices(dimScore)" :key="i">
                       <span class="check-icon">✓</span> {{ service }}
                    </li>
                 </ul>
              </div>
           </div>
        </div>

        <div class="report-footer">
          <div class="footer-strip">
            <span>{{ todayDate }}</span>
            <span class="brand">IMAGES & RÉSEAUX</span>
            <span class="confidential">CONFIDENTIEL</span>
            <span class="page-num">PAGE {{ 7 + (index * 2) }}</span>
          </div>
        </div>
      </div>

    </template>

    <!-- SERVICES DETAILED SECTION -->
    <template v-if="servicesData && servicesData.length > 0">
      <template v-for="(service, sIndex) in servicesData" :key="service.id">
        
        <!-- Service Divider/Intro Page -->
        <div class="report-page intro-page" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
             <div class="circles-bg"></div>
             <h1 class="main-title" style="font-size: 3rem; margin-bottom: 2rem;">FOCUS SERVICE</h1>
             <h2 class="sub-title" style="font-size: 4rem; color: #6B21A8;">{{ service.name.toUpperCase() }}</h2>
             <div class="report-footer">
              <div class="footer-strip">
                <span>{{ todayDate }}</span>
                <span class="brand">IMAGES & RÉSEAUX</span>
                <span class="confidential">CONFIDENTIEL</span>
                <span class="page-num">PAGE {{ getPageNumber(Number(sIndex), 0, 'intro') }}</span>
              </div>
            </div>
        </div>

        <!-- Service Dimensions Loop -->
        <template v-for="(dimScore, dIndex) in service.scores" :key="dimScore.dimension">
          
          <!-- PAGE 1: Metrics (Left) & Chart (Right) -->
          <div class="report-page dimension-page metrics-page">
            <div class="header">
              <div class="hex-icon" v-html="getIconSVG(dimScore.dimension, 30, '#333')"></div>
              <h2 class="dim-title-h2">{{ formatDimension(dimScore.dimension).toUpperCase() }} - {{ service.name }} (1/2)</h2>
            </div>

            <div class="metrics-grid-side">
               <!-- Left Column: KPIs -->
               <div class="metrics-left-panel">
                  <div class="score-card-xl">
                     <div class="val">{{ Math.round(dimScore.score) }}%</div>
                     <div class="label">Moyenne</div>
                  </div>
                  <div class="stats-stack-xl">
                     <div class="stat-row-xl">
                       <span>Médiane</span>
                       <strong>{{ Math.round(dimScore.median || 0) }}%</strong>
                     </div>
                     <div class="stat-row-xl">
                       <span>NSP</span>
                       <strong>{{ Math.round(dimScore.nspRate || 0) }}%</strong>
                     </div>
                  </div>
               </div>

               <!-- Right Column: Chart -->
               <div class="metrics-right-panel">
                   <h3 class="mini-title" style="text-align: center; font-size: 1rem; margin-bottom: 2rem;">MOYENNE PAR CIBLE (Contexte Global)</h3>
                   <GroupedBarChart 
                     :groups="getDimensionServiceData(dimScore.dimension)"
                     :series="serviceSeries" 
                     :height="350"
                   />
                   <p class="chart-legend-mini" style="text-align: center; margin-top: 1rem;">*Moy. cible affichée</p>
               </div>
            </div>

            <div class="report-footer">
              <div class="footer-strip">
                <span>{{ todayDate }}</span>
                <span class="brand">IMAGES & RÉSEAUX</span>
                <span class="confidential">CONFIDENTIEL</span>
                <span class="page-num">PAGE {{ getPageNumber(Number(sIndex), Number(dIndex), 'metrics') }}</span>
              </div>
            </div>
          </div>

          <!-- PAGE 2: Analysis & Recommendations -->
          <div class="report-page dimension-page analysis-page">
            <div class="header">
              <div class="hex-icon" v-html="getIconSVG(dimScore.dimension, 30, '#333')"></div>
              <h2 class="dim-title-h2">{{ formatDimension(dimScore.dimension).toUpperCase() }} - {{ service.name }} (2/2)</h2>
            </div>

            <div class="analysis-grid">
               <!-- Col 1: Observations -->
               <div class="analysis-col">
                  <div class="box-compact purple-top">
                     <h3 class="compact-h3">SYNTHÈSE</h3>
                     <div class="text-content-large">
                        {{ getRecommendationSynthesis(dimScore) || 'Aucune observation.' }}
                     </div>
                  </div>
                  <div class="box-compact yellow-top" v-if="getRecommendationDescription(dimScore)">
                     <h3 class="compact-h3">DESCRIPTION</h3>
                     <div class="text-content-large">
                        {{ getRecommendationDescription(dimScore) }}
                     </div>
                  </div>
               </div>

               <!-- Col 2: Action Plan -->
               <div class="analysis-col">
                  <div class="section-block" v-if="getRecommendationActions(dimScore).length > 0">
                     <h3 class="section-title text-blue">☆ ACTIONS RECOMMANDÉES</h3>
                     <ul class="check-list-large text-blue">
                        <li v-for="(action, i) in getRecommendationActions(dimScore)" :key="i">
                           <span class="check-icon">✓</span> {{ action }}
                        </li>
                     </ul>
                  </div>
                  <div class="section-block" v-if="getRecommendationServices(dimScore).length > 0">
                     <h3 class="section-title text-dark">⬡ SERVICES & FORMATIONS</h3>
                     <ul class="check-list-large text-dark">
                        <li v-for="(serviceRec, i) in getRecommendationServices(dimScore)" :key="i">
                           <span class="check-icon">✓</span> {{ serviceRec }}
                        </li>
                     </ul>
                  </div>
               </div>
            </div>

            <div class="report-footer">
              <div class="footer-strip">
                <span>{{ todayDate }}</span>
                <span class="brand">IMAGES & RÉSEAUX</span>
                <span class="confidential">CONFIDENTIEL</span>
                <span class="page-num">PAGE {{ getPageNumber(Number(sIndex), Number(dIndex), 'analysis') }}</span>
              </div>
            </div>
          </div>

        </template>
      </template>
    </template>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RadarChart from './RadarChart.vue'
import GroupedBarChart from './charts/GroupedBarChart.vue'

const props = defineProps<{
  mission: any
  missionData: any
  globalScores: any[]
  recommendations: any[]
  globalMedian?: number | null
  globalNspRate?: number | null
  openaiConfigured?: boolean | null
  reportTitle?: string
  servicesData?: any[] // New prop for detailed report
}>()

const todayDate = computed(() => {
  return new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

const allDimensions = [
  'ambition', 'pilotage', 'organisation', 'culture', 'technologie', 
  'mise_en_oeuvre', 'expertise', 'donnees', 'ecosysteme', 'cas_usage'
]

const comparisonSeries = [
  { label: 'Moyenne', color: '#3b82f6' }, // Blue
  { label: 'Médiane', color: '#10b981' }, // Green
  { label: 'NSP', color: '#9ca3af' }     // Grey
]

const serviceSeries = [
  { label: 'Moyenne', color: '#FFC107' }
]

const globalComparisonData = computed(() => {
  if (!props.globalScores) return []
  return props.globalScores.map(score => ({
    id: score.dimension,
    label: formatDimension(score.dimension),
    values: [
      Math.round(score.score || 0),
      Math.round(score.median || 0),
      Math.round(score.nspRate || 0)
    ]
  }))
})

// Icons flattened mapping
const getIconSVG = (dimension: string, size = 24, color = 'currentColor') => {
  const icons: Record<string, string> = {
    ambition: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    pilotage: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3H21V21H3V3Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 9H15V15H9V9Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 9H21" stroke="${color}" stroke-width="2" stroke-linecap="round"/><path d="M9 3V21" stroke="${color}" stroke-width="2" stroke-linecap="round"/></svg>`,
    organisation: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    culture: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 6V18" stroke="${color}" stroke-width="2" stroke-linecap="round"/><path d="M6 12H18" stroke="${color}" stroke-width="2" stroke-linecap="round"/></svg>`,
    donnees: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="12" cy="5" rx="9" ry="3" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12C21 13.6569 16.9706 15 12 15C7.02944 15 3 13.6569 3 12" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 5V19C3 20.6569 7.02944 22 12 22C16.9706 22 21 20.6569 21 19V5" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    cas_usage: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 11L12 14L22 4" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    ecosysteme: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    expertise: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 14L9 11L12 8L15 11L12 14Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    technologie: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="3" width="20" height="14" rx="2" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 21H16" stroke="${color}" stroke-width="2" stroke-linecap="round"/><path d="M12 17V21" stroke="${color}" stroke-width="2" stroke-linecap="round"/></svg>`,
    mise_en_oeuvre: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  }
  return icons[dimension] || icons.ambition
}

// Utilities
const formatDimension = (dim: string) => {
  if (!dim) return ''
  const map: Record<string, string> = {
    ambition: 'Ambition',
    pilotage: 'Pilotage',
    organisation: 'Organisation',
    organization: 'Organisation',
    culture: 'Culture',
    donnees: 'Données',
    cas_usage: 'Cas d\'usage de l\'IA',
    ecosysteme: 'Écosystème',
    expertise: 'Expertise',
    technologie: 'Technologie',
    mise_en_oeuvre: 'Mise en œuvre'
  }
  return map[dim] || dim.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const globalScore = computed(() => {
  if (!props.globalScores || !props.globalScores.length) return 0
  const sum = props.globalScores.reduce((acc, curr) => acc + curr.score, 0)
  return Math.round(sum / props.globalScores.length)
})

const globalSynthesisPoints = computed(() => {
  return props.recommendations
    .filter(r => r.synthesis)
    .slice(0, 4)
    .map(r => r.synthesis)
})

const getDimensionServiceData = (dimension: string) => {
  if (!props.missionData?.services) return []

  return props.missionData.services.map((service: any) => {
    const dScore = service.dimensionScores?.find((s: any) => s.dimension === dimension)
    return {
      id: service.id,
      label: service.name,
      values: [dScore ? Math.round(dScore.score) : 0]
    }
  })
}

const getRecommendationSynthesis = (dimScore: any) => {
  const rec = props.recommendations.find(r => r.dimension === dimScore.dimension)
  return rec?.synthesis || ''
}

const getRecommendationDescription = (dimScore: any) => {
  const rec = props.recommendations.find(r => r.dimension === dimScore.dimension)
  return rec?.description || ''
}

const getRecommendationActions = (dimScore: any) => {
  const rec = props.recommendations.find(r => r.dimension === dimScore.dimension)
  return rec?.actions || []
}

const getRecommendationServices = (dimScore: any) => {
  const rec = props.recommendations.find(r => r.dimension === dimScore.dimension)
  return rec?.services || []
}

const getPageNumber = (sIndex: number, dIndex: number, pageType: 'intro' | 'metrics' | 'analysis') => {
  const globalCount = props.globalScores ? props.globalScores.length : 10
  const pagesPerService = 1 + (globalCount * 2)
  const basePage = 6 + (globalCount * 2) + (sIndex * pagesPerService)

  if (pageType === 'intro') return basePage
  if (pageType === 'metrics') return basePage + 1 + (dIndex * 2)
  if (pageType === 'analysis') return basePage + 2 + (dIndex * 2)
  return 0
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap');

.report-container {
  width: 297mm;
  background: #fff;
  font-family: 'Montserrat', sans-serif;
  color: #333;
  font-size: 10px;
}

.report-page {
  width: 297mm;
  height: 210mm;
  position: relative;
  overflow: hidden;
  page-break-after: always;
  background: white;
  padding: 15mm; /* Increased padding slightly */
  box-sizing: border-box;
}

.report-page::before, .report-page::after {
  content: '';
  position: absolute;
  background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M100 0 L186.6 50 L186.6 150 L100 200 L13.4 150 L13.4 50 Z' fill='%23FFD700' opacity='0.2'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  z-index: 0;
}

/* --- COVER PAGE --- */
.cover-page {
  background-image: url('/report-cover.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-page .hex-background {
  display: none;
}

.cover-page .content {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.logo-ir {
  max-width: 150px;
  height: auto;
}

.cover-page .center-hex {
  background: white;
  width: 140mm;
  height: 100mm;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 2rem;
  border: 4px solid #6B21A8;
  margin: 1rem 0;
}

.cover-page .center-hex h1 {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.cover-page .center-hex h2 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.cover-page .footer-block {
  text-align: center;
  margin-top: 1rem;
}

.cover-page .footer-block h3 {
  font-size: 1rem;
  color: #333;
  text-shadow: none;
}

.cover-page .footer-block h3 span {
  font-size: 1.6rem;
  font-weight: 900;
  display: block;
}

/* --- GENERAL HEADER --- */
.header {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin-bottom: 2rem;
}

.header .hex-icon {
  width: 44px;
  height: 52px;
  background: white;
  border: 2px solid #333;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1rem;
  line-height: 1;
}

.header h2 {
  font-size: 1.8rem;
  font-weight: 800;
  text-transform: uppercase;
  margin: 0;
  color: #111;
}

/* --- INTRO PAGE (DIMENSIONS) --- */
.intro-page {
  display: flex;
  flex-direction: column;
}

.dimensions-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 3rem 1.5rem;
  margin: 4rem 1rem 3rem;
  justify-items: center;
}

.dim-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  width: 100%;
}

.icon-circle {
  width: 70px;
  height: 70px;
  background-color: #6B21A8;
  border-radius: 50%;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(107, 33, 168, 0.25);
  margin-bottom: 0.5rem;
}

.dim-label-btn {
  background-color: #FFD700;
  color: #000;
  font-weight: 800;
  font-size: 0.85rem;
  padding: 0.7rem 1.2rem;
  border-radius: 50px;
  text-transform: uppercase;
  text-align: center;
  min-width: 140px;
  max-width: 180px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
}

.quote-block {
  margin-top: auto;
  margin-bottom: 5rem;
  display: flex;
  justify-content: center;
  padding: 0 2rem;
}

.quote-content {
  max-width: 750px;
  text-align: center;
}

.quote-content h4 {
  font-size: 0.9rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  margin-bottom: 1.5rem;
  color: #111;
  text-transform: uppercase;
  text-align: center;
}

.quote-flex {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 1.5rem;
}

.quote-mark-mini {
  font-family: serif;
  font-size: 5rem;
  line-height: 0.6;
  color: #6B21A8;
  opacity: 0.8;
  margin-top: 0.5rem;
}

.quote-content p {
  font-size: 1.15rem;
  font-weight: 700;
  font-style: italic;
  color: #1f2937;
  text-align: left;
  line-height: 1.5;
  margin: 0;
}

/* --- DIMENSION COMPACT PAGE (v2) --- */
.dimension-page-combined .dim-grid-layout {
  display: grid;
  grid-template-columns: 22% 37% 37%;
  gap: 1.5rem;
  margin-top: 1rem;
  align-content: start;
}

.dim-col-left {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-right: 1rem;
  border-right: 1px solid #f3f4f6;
}

.score-card-compact {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
}
.score-card-compact .val { font-size: 3rem; font-weight: 900; color: #333; line-height: 1; }
.score-card-compact .label { font-size: 0.8rem; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-top: 0.5rem; }

.stats-row-compact {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #6b7280;
}
.stats-row-compact strong { color: #333; font-size: 1rem; }

.chart-compact { margin-top: 1rem; }
.mini-title { font-size: 0.8rem; font-weight: 800; text-transform: uppercase; margin-bottom: 0.5rem; }
.chart-legend-mini { font-size: 0.7rem; color: #9ca3af; font-style: italic; margin-top: 0.5rem; }

.dim-col-mid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dim-col-right {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Increased padding for boxes */
.box-compact {
  background: #fff;
  border-radius: 12px;
  padding: 2.5rem 2.5rem; /* Increased padding */
  position: relative;
  border: 1px solid #e5e7eb;
}

.box-compact.purple-top { border-top: 4px solid #6B21A8; }
.box-compact.yellow-top { border-top: 4px solid #FFD700; }
.box-compact.no-bg { border: none; padding: 0.5rem 0; background: transparent; }

.compact-h3 {
  font-size: 1.1rem; /* Slightly larger title */
  font-weight: 800;
  margin-bottom: 1.5rem; /* Increased margin */
  color: #374151;
}

.text-content {
  line-height: 1.6;
  color: #4b5563;
  white-space: pre-line;
  text-align: justify;
  font-size: 10px; /* Slightly larger text */
}

.section-title {
  font-size: 1.1rem; /* Larger section title */
  font-weight: 800;
  margin-bottom: 1.5rem; /* Increased margin */
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.text-blue { color: #2563eb; }
.text-dark { color: #374151; }

.check-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.check-list li {
  font-size: 9px;
  line-height: 1.5;
  padding-left: 1.5rem;
  position: relative;
  font-weight: 600;
}

.check-icon {
  position: absolute;
  left: 0;
  top: 0;
  font-weight: 800;
  font-size: 1rem;
  line-height: 1;
}

/* --- SPLIT DIMENSION PAGES (v4) --- */
.metrics-grid-side {
  display: grid;
  grid-template-columns: 35% 60%;
  gap: 5%;
  margin-top: 3rem;
  align-items: center;
}

.metrics-left-panel {
  display: flex;
  flex-direction: column;
  gap: 4rem;
  align-items: center;
}

.score-card-xl {
  text-align: center;
  padding: 1.5rem 2rem 2rem;
  background: #f9fafb;
  border-radius: 30px;
  width: 100%;
}
.score-card-xl .val { font-size: 6rem; font-weight: 900; color: #333; line-height: 1; }
.score-card-xl .label { font-size: 1.2rem; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-top: 1rem; }

.stats-stack-xl {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 80%;
}
.stat-row-xl {
  font-size: 1.5rem;
  color: #6b7280;
  display: flex;
  justify-content: space-between;
}
.stat-row-xl strong { color: #333; font-weight: 800; }

.metrics-right-panel {
  width: 100%;
}

.analysis-page .analysis-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem; /* Increased gap */
  margin-top: 6rem; /* Much larger top margin to push content down */
  align-items: start;
}

.analysis-col {
  display: flex;
  flex-direction: column;
  gap: 4rem; /* Increased vertical gap between boxes */
}

/* Increased fonts for analysis page */
.text-content-large {
  line-height: 1.6;
  color: #4b5563;
  white-space: pre-line;
  text-align: justify;
  font-size: 11px;
}

.check-list-large {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.check-list-large li {
  font-size: 11px;
  line-height: 1.5;
  padding-left: 1.5rem;
  position: relative;
  font-weight: 600;
}

/* --- GLOBAL RESULTS PAGE --- */
.intro-text {
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 2.5rem;
  color: #4b5563;
}

.global-content {
  display: flex;
  gap: 3rem;
  align-items: center;
  justify-content: space-between;
}

.score-focus {
  flex: 0 0 30%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.score-label-top {
  font-size: 0.9rem;
  font-weight: 800;
  color: #6B21A8;
  letter-spacing: 1px;
}

.big-score-hero {
  display: flex;
  flex-direction: column;
}

.big-score-hero .value {
  font-size: 6rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -2px;
  color: #333;
}

.sub-stats {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.sub-stats .stat-item {
  font-size: 1rem;
  font-weight: 600;
  color: #6b7280;
}

.center-col-wide {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chart-title {
  font-size: 0.9rem;
  font-weight: 800;
  margin-bottom: 2rem;
  letter-spacing: 1px;
}

.chart-container-large {
  width: 100%;
  max-width: 450px;
}

/* --- SYNTHESIS PAGE --- */
.synthesis-page {
  background: white;
}

.synthesis-hero-box {
  width: 100%;
}

.purple-gradient-box {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border-radius: 24px;
  padding: 3rem;
  border: 1px solid #ddd6fe;
  box-shadow: 0 4px 20px rgba(107, 33, 168, 0.05);
}

.synthesis-paragraph {
  font-size: 0.85rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  color: #374151;
  text-align: justify;
}

.empty-synthesis {
  text-align: center;
  color: #9ca3af;
  padding: 4rem 0;
  font-style: italic;
}

/* --- SUMMARY CHART PAGE --- */
.global-bar-chart-container {
  height: 140mm;
}

/* --- DIMENSION DETAIL PAGES --- */
.dim-title-h2 {
  font-size: 1.6rem !important;
}

.dimension-content-v2 {
  display: flex;
  gap: 3rem;
  margin-top: 1rem;
}

.sidebar-scores {
  flex: 0 0 25%;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  justify-content: center;
}

.mini-score-group .label {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.mini-score-group .val-big {
  font-size: 3.5rem;
  font-weight: 800;
  color: #333;
}

.mini-score-row {
  display: flex;
  gap: 1.5rem;
}

.mini-box {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.mini-box span {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  font-weight: 700;
}

.mini-box strong {
  font-size: 1.2rem;
  color: #333;
}

.main-chart-area {
  flex: 1;
}

.chart-header-title {
  font-size: 0.9rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  color: #111;
}

.bar-chart-wrapper-v2 {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 16px;
}

.chart-legend-bottom {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #9ca3af;
  font-style: italic;
}

.split-boxes-v2 {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.box-v2 {
  background: #fff;
  border-radius: 20px;
  padding: 2.5rem;
  position: relative;
  overflow: hidden;
  border: 1px solid #f3f4f6;
}

.box-header-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
}

.box-header-accent.purple { background: #6B21A8; }
.box-header-accent.yellow { background: #FFD700; }

.box-v2 h3 {
  font-weight: 800;
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
  color: #374151;
}

.box-content-v2 {
  font-size: 1.1rem;
  line-height: 1.7;
  color: #4b5563;
  white-space: pre-line;
}

/* --- FOOTER --- */
.report-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8mm 15mm;
  z-index: 10;
}

.footer-strip {
  background: #FFD700;
  padding: 0.5rem 2rem;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 9px;
  font-weight: 700;
  color: #333;
  text-transform: uppercase;
}

.footer-strip .brand { font-weight: 800; }
.footer-strip .confidential { color: #6B21A8; }
.footer-strip .page-num { font-weight: 800; background: rgba(0,0,0,0.1); padding: 2px 8px; border-radius: 4px; }

.shadow-sm { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
</style>
